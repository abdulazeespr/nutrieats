export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentary (office job, no exercise)",
  LIGHTLY_ACTIVE: "Lightly Active (1–3 days/week)",
  MODERATELY_ACTIVE: "Moderately Active (3–5 days/week)",
  VERY_ACTIVE: "Very Active (6–7 days/week)",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
};

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "MALE" | "FEMALE" | "OTHER"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "FEMALE" ? base - 161 : base + 5;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateRDA(weightKg: number, tdee: number) {
  return {
    rdaCalories: Math.round(tdee),
    rdaProtein: Math.round(0.8 * weightKg),
    rdaCarbs: Math.round((tdee * 0.5) / 4),
    rdaFat: Math.round((tdee * 0.3) / 9),
    rdaFiber: 25,
  };
}

export { ACTIVITY_LABELS };
