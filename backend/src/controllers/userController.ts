import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import {
  calculateBMR,
  calculateTDEE,
  calculateRDA,
  ActivityLevel,
} from "../lib/bmr";

const bodyStatsSchema = z.object({
  age: z.number().int().min(10).max(120),
  weightKg: z.number().min(20).max(300),
  heightCm: z.number().min(50).max(250),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
  ]),
});

export async function upsertBodyStats(req: AuthRequest, res: Response) {
  const parse = bodyStatsSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { age, weightKg, heightCm, gender, activityLevel } = parse.data;
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel as ActivityLevel);
  const rda = calculateRDA(weightKg, tdee);

  const stats = await prisma.bodyStats.upsert({
    where: { userId: req.userId! },
    create: {
      userId: req.userId!,
      age,
      weightKg,
      heightCm,
      gender,
      activityLevel,
      bmr,
      ...rda,
    },
    update: { age, weightKg, heightCm, gender, activityLevel, bmr, ...rda },
  });

  res.json(stats);
}

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      bodyStats: true,
      allergies: true,
      notifPrefs: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
}

export async function upsertAllergies(req: AuthRequest, res: Response) {
  const schema = z.object({ allergens: z.array(z.string().min(1)) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  // Replace existing allergies
  await prisma.allergy.deleteMany({ where: { userId: req.userId! } });

  const created = await prisma.allergy.createMany({
    data: parse.data.allergens.map((allergenName) => ({
      userId: req.userId!,
      allergenName,
    })),
    skipDuplicates: true,
  });

  res.json({ count: created.count });
}

export async function updateNotifPrefs(req: AuthRequest, res: Response) {
  const schema = z.object({
    lowCaloriesAlert: z.boolean().optional(),
    lowProteinAlert: z.boolean().optional(),
    lowCarbsAlert: z.boolean().optional(),
    lowFatAlert: z.boolean().optional(),
    lowFiberAlert: z.boolean().optional(),
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const prefs = await prisma.notifPrefs.update({
    where: { userId: req.userId! },
    data: parse.data,
  });

  res.json(prefs);
}

export async function getRda(req: AuthRequest, res: Response) {
  const bodyStats = await prisma.bodyStats.findUnique({
    where: { userId: req.userId! },
    select: {
      bmr: true,
      rdaCalories: true,
      rdaProtein: true,
      rdaCarbs: true,
      rdaFat: true,
      rdaFiber: true,
    },
  });

  if (!bodyStats) {
    res.status(404).json({ error: "Body stats not set up yet" });
    return;
  }

  res.json(bodyStats);
}

const rdaOverrideSchema = z.object({
  rdaCalories: z.number().positive().optional(),
  rdaProtein: z.number().positive().optional(),
  rdaCarbs: z.number().positive().optional(),
  rdaFat: z.number().positive().optional(),
  rdaFiber: z.number().positive().optional(),
});

export async function updateRda(req: AuthRequest, res: Response) {
  const parse = rdaOverrideSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  if (Object.keys(parse.data).length === 0) {
    res.status(400).json({ error: "No fields provided" });
    return;
  }

  const existing = await prisma.bodyStats.findUnique({
    where: { userId: req.userId! },
  });
  if (!existing) {
    res.status(404).json({ error: "Body stats not set up yet" });
    return;
  }

  const updated = await prisma.bodyStats.update({
    where: { userId: req.userId! },
    data: parse.data,
  });

  res.json({
    bmr: updated.bmr,
    rdaCalories: updated.rdaCalories,
    rdaProtein: updated.rdaProtein,
    rdaCarbs: updated.rdaCarbs,
    rdaFat: updated.rdaFat,
    rdaFiber: updated.rdaFiber,
  });
}

export async function getDailyLog(req: AuthRequest, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: req.userId!, date: today } },
  });

  const bodyStats = await prisma.bodyStats.findUnique({
    where: { userId: req.userId! },
  });

  if (!bodyStats) {
    res.status(404).json({ error: "Body stats not set up yet" });
    return;
  }

  const consumed = log ?? {
    caloriesConsumed: 0,
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatConsumed: 0,
    fiberConsumed: 0,
  };

  // Determine which nutrients are low (< 50% of RDA by end of day proxy)
  const alerts: string[] = [];
  const notifPrefs = await prisma.notifPrefs.findUnique({
    where: { userId: req.userId! },
  });

  if (notifPrefs?.lowCaloriesAlert && consumed.caloriesConsumed < bodyStats.rdaCalories * 0.4)
    alerts.push("calories");
  if (notifPrefs?.lowProteinAlert && consumed.proteinConsumed < bodyStats.rdaProtein * 0.4)
    alerts.push("protein");
  if (notifPrefs?.lowCarbsAlert && consumed.carbsConsumed < bodyStats.rdaCarbs * 0.4)
    alerts.push("carbs");
  if (notifPrefs?.lowFatAlert && consumed.fatConsumed < bodyStats.rdaFat * 0.4)
    alerts.push("fat");
  if (notifPrefs?.lowFiberAlert && consumed.fiberConsumed < bodyStats.rdaFiber * 0.4)
    alerts.push("fiber");

  res.json({
    consumed,
    rda: {
      calories: bodyStats.rdaCalories,
      protein: bodyStats.rdaProtein,
      carbs: bodyStats.rdaCarbs,
      fat: bodyStats.rdaFat,
      fiber: bodyStats.rdaFiber,
    },
    lowAlerts: alerts,
  });
}
