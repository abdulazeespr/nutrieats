import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

export async function getPendingAssignments(req: AuthRequest, res: Response) {
  // Orders that are confirmed and not yet assigned
  const orders = await prisma.order.findMany({
    where: { status: "CONFIRMED", assignment: null },
    include: {
      restaurant: { select: { name: true, address: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  res.json(orders);
}

export async function acceptAssignment(req: AuthRequest, res: Response) {
  const { orderId } = req.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "CONFIRMED", assignment: null },
  });

  if (!order) {
    res.status(404).json({ error: "Order not available for assignment" });
    return;
  }

  const assignment = await prisma.deliveryAssignment.create({
    data: { orderId, riderId: req.userId!, status: "ASSIGNED" },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "OUT_FOR_DELIVERY" },
  });

  res.status(201).json(assignment);
}

export async function updateDeliveryStatus(req: AuthRequest, res: Response) {
  const schema = z.object({
    status: z.enum(["PICKED_UP", "ON_THE_WAY", "DELIVERED"]),
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: req.params.id, riderId: req.userId! },
  });

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const updateData: Record<string, unknown> = { status: parse.data.status };
  if (parse.data.status === "PICKED_UP") updateData.pickedUpAt = new Date();
  if (parse.data.status === "DELIVERED") {
    updateData.deliveredAt = new Date();
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: "DELIVERED" },
    });
  }

  const updated = await prisma.deliveryAssignment.update({
    where: { id: assignment.id },
    data: updateData,
  });

  res.json(updated);
}

export async function getActiveDelivery(req: AuthRequest, res: Response) {
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: {
      riderId: req.userId!,
      status: { in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"] },
    },
    include: {
      order: {
        include: {
          restaurant: { select: { name: true, address: true } },
          customer: { select: { name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      },
    },
  });

  res.json(assignment ?? null);
}
