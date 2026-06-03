export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE";

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
  if (gender === "FEMALE") return base - 161;
  return base + 5; // MALE and OTHER default to male formula
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateRDA(weightKg: number, tdee: number) {
  return {
    rdaCalories: Math.round(tdee),
    rdaProtein: Math.round(0.8 * weightKg),       // 0.8g per kg body weight
    rdaCarbs: Math.round((tdee * 0.5) / 4),       // 50% of calories from carbs
    rdaFat: Math.round((tdee * 0.3) / 9),         // 30% of calories from fat
    rdaFiber: 25,                                  // standard daily recommendation
  };
}
