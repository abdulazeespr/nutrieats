import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

export async function listRestaurants(req: Request, res: Response) {
  const restaurants = await prisma.restaurant.findMany({
    where: { isOpen: true },
    include: {
      menuItems: {
        where: { isAvailable: true, discount: { gt: 0 } },
        select: { id: true, name: true, price: true, discount: true, imageUrl: true },
        take: 3,
        orderBy: { discount: "desc" },
      },
    },
    orderBy: { healthScore: "desc" },
  });

  res.json(restaurants);
}

export async function getRestaurant(req: Request, res: Response) {
  const { id } = req.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: { healthScore: "desc" },
      },
    },
  });

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  res.json(restaurant);
}

export async function getMenuItem(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as AuthRequest).userId;

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { restaurant: { select: { name: true, address: true } } },
  });

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  let allergenWarning = false;
  if (userId) {
    const userAllergens = await prisma.allergy.findMany({
      where: { userId },
      select: { allergenName: true },
    });
    const names = userAllergens.map((a) => a.allergenName.toLowerCase());
    allergenWarning = item.allergens.some((a) =>
      names.includes(a.toLowerCase())
    );
  }

  res.json({ ...item, allergenWarning });
}

export async function listDeals(req: Request, res: Response) {
  const deals = await prisma.menuItem.findMany({
    where: { discount: { gt: 0 }, isAvailable: true },
    include: { restaurant: { select: { id: true, name: true, address: true } } },
    orderBy: { discount: "desc" },
    take: 20,
  });

  res.json(deals);
}
