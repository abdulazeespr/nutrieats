import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { calculateHealthScore, isHealthy } from "../lib/healthScore";

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.number().positive(),
  imageUrl: z.string().default(""),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  cookingMethod: z.string().default(""),
  ingredients: z.array(z.any()).default([]),
  allergens: z.array(z.string()).default([]),
  discount: z.number().min(0).max(100).default(0),
});

async function getOwnRestaurant(userId: string) {
  return prisma.restaurant.findUnique({ where: { ownerId: userId } });
}

export async function getDashboard(req: AuthRequest, res: Response) {
  const restaurant = await getOwnRestaurant(req.userId!);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found. Create one first." });
    return;
  }

  const [itemCount, todayOrders] = await Promise.all([
    prisma.menuItem.count({ where: { restaurantId: restaurant.id, isAvailable: true } }),
    prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: { totalPrice: true, status: true },
    }),
  ]);

  const revenue = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  res.json({
    restaurant,
    stats: {
      activeItems: itemCount,
      todayOrderCount: todayOrders.length,
      todayRevenue: revenue,
    },
  });
}

export async function createMenuItem(req: AuthRequest, res: Response) {
  const restaurant = await getOwnRestaurant(req.userId!);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const parse = menuItemSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const healthScore = calculateHealthScore(data);

  const item = await prisma.menuItem.create({
    data: {
      ...data,
      restaurantId: restaurant.id,
      healthScore,
      isHealthy: isHealthy(healthScore),
    },
  });

  // Recalculate restaurant average health score
  const avg = await prisma.menuItem.aggregate({
    where: { restaurantId: restaurant.id },
    _avg: { healthScore: true },
  });
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { healthScore: avg._avg.healthScore ?? 5 },
  });

  res.status(201).json(item);
}

export async function updateMenuItem(req: AuthRequest, res: Response) {
  const restaurant = await getOwnRestaurant(req.userId!);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: restaurant.id },
  });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const parse = menuItemSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const merged = { ...item, ...data };
  const healthScore = calculateHealthScore(merged);

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { ...data, healthScore, isHealthy: isHealthy(healthScore) },
  });

  res.json(updated);
}

export async function toggleItemAvailability(req: AuthRequest, res: Response) {
  const restaurant = await getOwnRestaurant(req.userId!);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: restaurant.id },
  });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { isAvailable: !item.isAvailable },
  });

  res.json(updated);
}

export async function getRestaurant(req: AuthRequest, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: req.userId! },
    include: {
      menuItems: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json(restaurant);
}

export async function upsertRestaurant(req: AuthRequest, res: Response) {
  const schema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    cuisineTags: z.array(z.string()).default([]),
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: req.userId! },
    create: { ownerId: req.userId!, ...parse.data },
    update: parse.data,
  });

  res.json(restaurant);
}

export async function getMerchantOrders(req: AuthRequest, res: Response) {
  const restaurant = await getOwnRestaurant(req.userId!);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(orders);
}
