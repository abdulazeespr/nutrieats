import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const createOrderSchema = z.object({
  restaurantId: z.string(),
  deliveryAddress: z.string().min(1),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function createOrder(req: AuthRequest, res: Response) {
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { restaurantId, deliveryAddress, items } = parse.data;

  // Fetch all menu items to validate and get price/calorie snapshots
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
  });

  if (menuItems.length !== menuItemIds.length) {
    res.status(400).json({ error: "One or more items are unavailable" });
    return;
  }

  const itemMap = new Map(menuItems.map((m) => [m.id, m]));

  let totalPrice = 0;
  let totalCalories = 0;
  const orderItems = items.map((i) => {
    const m = itemMap.get(i.menuItemId)!;
    const discountedPrice = m.price * (1 - m.discount / 100);
    totalPrice += discountedPrice * i.quantity;
    totalCalories += m.calories * i.quantity;
    return {
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      priceSnapshot: discountedPrice,
      caloriesSnapshot: m.calories,
    };
  });

  const order = await prisma.order.create({
    data: {
      customerId: req.userId!,
      restaurantId,
      deliveryAddress,
      totalPrice,
      totalCalories,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  // Update today's daily log
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nutritionTotals = items.reduce(
    (acc, i) => {
      const m = itemMap.get(i.menuItemId)!;
      acc.protein += m.protein * i.quantity;
      acc.carbs += m.carbs * i.quantity;
      acc.fat += m.fat * i.quantity;
      acc.fiber += m.fiber * i.quantity;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: req.userId!, date: today } },
    create: {
      userId: req.userId!,
      date: today,
      caloriesConsumed: totalCalories,
      proteinConsumed: nutritionTotals.protein,
      carbsConsumed: nutritionTotals.carbs,
      fatConsumed: nutritionTotals.fat,
      fiberConsumed: nutritionTotals.fiber,
    },
    update: {
      caloriesConsumed: { increment: totalCalories },
      proteinConsumed: { increment: nutritionTotals.protein },
      carbsConsumed: { increment: nutritionTotals.carbs },
      fatConsumed: { increment: nutritionTotals.fat },
      fiberConsumed: { increment: nutritionTotals.fiber },
    },
  });

  res.status(201).json(order);
}

export async function getOrder(req: AuthRequest, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: req.userId! },
    include: {
      items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
      restaurant: { select: { name: true, address: true } },
      assignment: { include: { rider: { select: { name: true, phone: true } } } },
    },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
}

export async function getMyOrders(req: AuthRequest, res: Response) {
  const orders = await prisma.order.findMany({
    where: { customerId: req.userId! },
    include: {
      restaurant: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  const schema = z.object({
    status: z.enum(["CONFIRMED", "PREPARING", "CANCELLED"]),
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Allow: customer cancelling their own PLACED order, or merchant updating their restaurant's order
  const isCustomerCancelling =
    req.userRole === "CUSTOMER" &&
    order.customerId === req.userId &&
    parse.data.status === "CANCELLED" &&
    order.status === "PLACED";

  const isMerchant = req.userRole === "MERCHANT";

  if (!isCustomerCancelling && !isMerchant) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: parse.data.status },
  });

  res.json(updated);
}
