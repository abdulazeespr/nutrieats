export function calculateHealthScore(item: {
  calories: number;
  fat: number;
  fiber: number;
  protein: number;
  cookingMethod: string;
}): number {
  let score = 10;
  if (item.calories > 600) score -= 2;
  if (item.fat > 20) score -= 2;
  if (/deep.?fri/i.test(item.cookingMethod)) score -= 2;
  if (item.fiber > 5) score += 1;
  if (item.protein > 20) score += 1;
  return Math.min(10, Math.max(0, score));
}

export function isHealthy(score: number): boolean {
  return score >= 6;
}

export function healthLabel(score: number): "Healthy" | "Indulgent" {
  return score >= 6 ? "Healthy" : "Indulgent";
}

export function healthColor(score: number): string {
  return score >= 6 ? "#22c55e" : "#f97316";
}
