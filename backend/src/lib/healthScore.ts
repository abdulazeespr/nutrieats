/**
 * Calculates a health score from 0–10 for a menu item.
 * Score >= 6 → Healthy (green), < 6 → Indulgent (orange)
 */
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
