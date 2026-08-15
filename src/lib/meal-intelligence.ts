export interface Recipe {
  id: string;
  name: string;
  items: string;
}

export interface RecipeScore {
  recipe: Recipe;
  lastUsedWeek?: string;
  weeksSinceUsed: number;
  historicalCount: number;
  score: number;
}

/**
 * Very basic approximation of weeks for distance sorting.
 * Assumes 52 weeks a year, which is occasionally 53, but it's
 * perfectly sufficient for monotonic scoring distances.
 */
export function weekToAbsolute(weekKey: string): number {
  if (!weekKey || !weekKey.includes("-W")) return 0;
  const [yearStr, weekStr] = weekKey.split("-W");
  return parseInt(yearStr ?? "0", 10) * 52 + parseInt(weekStr ?? "0", 10);
}

/**
 * Deterministically ranks a user's recipes based on:
 * - Frequency: How often it has been used historically (staple identification)
 * - Recency: How long it has been since it was last used (variety)
 * - Anti-fatigue: Heavy penalty for meals eaten this week or last week.
 */
export function rankRecipes(
  recipes: Recipe[],
  history: Record<string, Record<string, string>>,
  currentWeekKey: string,
): RecipeScore[] {
  if (recipes.length === 0) return [];

  const usageStats = new Map<string, { count: number; lastWeekStr: string | null }>();

  for (const r of recipes) {
    usageStats.set(r.name.trim().toLowerCase(), { count: 0, lastWeekStr: null });
  }

  // Iterate over history in chronological order
  const allWeeks = Object.keys(history).sort();
  for (const week of allWeeks) {
    const plan = history[week];
    for (const mealName of Object.values(plan ?? {})) {
      if (!mealName) continue;

      const normalized = mealName.trim().toLowerCase();
      // If the meal name matches a known recipe, track its stats
      if (usageStats.has(normalized)) {
        const stats = usageStats.get(normalized)!;
        stats.count += 1;
        // Due to sorting, this will end up as the most recent week seen
        stats.lastWeekStr = week;
      }
    }
  }

  const currentAbs = weekToAbsolute(currentWeekKey);

  const scores = recipes.map((recipe) => {
    const stats = usageStats.get(recipe.name.trim().toLowerCase())!;

    // Default high recency value for completely unused recipes to encourage discovery
    let weeksSinceUsed = 12;
    if (stats.lastWeekStr) {
      weeksSinceUsed = Math.max(0, currentAbs - weekToAbsolute(stats.lastWeekStr));
    }

    // Scoring weights:
    // +2 points for every historical use (rewards family staples)
    // +1.5 points for every week since last use (rewards variety/cycling)
    let score = stats.count * 2 + weeksSinceUsed * 1.5;

    // Anti-fatigue: heavily penalize if used this week (0) or last week (1)
    if (stats.lastWeekStr && weeksSinceUsed <= 1) {
      score -= 50;
    }

    const result: RecipeScore = {
      recipe,
      weeksSinceUsed,
      historicalCount: stats.count,
      score,
    };
    if (stats.lastWeekStr) {
      result.lastUsedWeek = stats.lastWeekStr;
    }
    return result;
  });

  // Sort by score descending, then deterministically by name
  return scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.recipe.name.localeCompare(b.recipe.name);
  });
}
