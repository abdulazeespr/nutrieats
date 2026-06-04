import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getFlashOffers(req: Request, res: Response) {
  const now = new Date();

  const offers = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      flashDealUntil: { gt: now },
      discount: { gt: 0 },
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: { discount: "desc" },
    take: 10,
  });

  res.json(offers);
}
