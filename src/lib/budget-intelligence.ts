import { sum, trendDelta, type Insight } from "./intelligence";

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
}

export interface BudgetAnalytics {
  currentMonthTotal: number;
  previousMonthTotal: number;
  delta: { delta: number; percentage: number };
  dailyAverage: number;
  categoryTotals: Record<string, number>;
  previousCategoryTotals: Record<string, number>;
  categoryTrends: Record<string, { delta: number; percentage: number }>;
}

/**
 * Given a YYYY-MM string, returns the previous month's YYYY-MM string.
 */
export function getPreviousMonthPrefix(monthPrefix: string): string {
  const [yearStr, monthStr] = monthPrefix.split("-");
  let year = parseInt(yearStr ?? "0", 10);
  let month = parseInt(monthStr ?? "0", 10);

  if (month === 1) {
    year -= 1;
    month = 12;
  } else {
    month -= 1;
  }

  return `${year}-${month.toString().padStart(2, "0")}`;
}

/**
 * Calculates deterministic budget analytics based on expenses and month prefixes.
 * @param expenses The list of expenses to analyze
 * @param currentMonthPrefix The prefix for the current month, e.g. '2026-08'
 * @param daysElapsed The number of days elapsed in the current month (for daily average)
 */
export function calculateBudgetAnalytics(
  expenses: ExpenseRecord[],
  currentMonthPrefix: string,
  daysElapsed: number = new Date().getDate(),
): BudgetAnalytics {
  const previousMonthPrefix = getPreviousMonthPrefix(currentMonthPrefix);

  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const previousMonthExpenses = expenses.filter((e) => e.date.startsWith(previousMonthPrefix));

  const currentMonthTotal = sum(currentMonthExpenses.map((e) => e.amount));
  const previousMonthTotal = sum(previousMonthExpenses.map((e) => e.amount));

  const categoryTotals: Record<string, number> = {};
  for (const e of currentMonthExpenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  }

  const previousCategoryTotals: Record<string, number> = {};
  for (const e of previousMonthExpenses) {
    previousCategoryTotals[e.category] = (previousCategoryTotals[e.category] ?? 0) + e.amount;
  }

  const categoryTrends: Record<string, { delta: number; percentage: number }> = {};
  const allCategories = new Set([
    ...Object.keys(categoryTotals),
    ...Object.keys(previousCategoryTotals),
  ]);
  for (const cat of allCategories) {
    categoryTrends[cat] = trendDelta(categoryTotals[cat] ?? 0, previousCategoryTotals[cat] ?? 0);
  }

  return {
    currentMonthTotal,
    previousMonthTotal,
    delta: trendDelta(currentMonthTotal, previousMonthTotal),
    dailyAverage: daysElapsed > 0 ? currentMonthTotal / daysElapsed : 0,
    categoryTotals,
    previousCategoryTotals,
    categoryTrends,
  };
}

/**
 * Generates actionable, non-judgmental insights based on analytics and limits.
 */
export function generateBudgetInsights(
  analytics: BudgetAnalytics,
  limits: Record<string, number>,
): Insight[] {
  const insights: Insight[] = [];

  // 1. Overall Trend
  if (analytics.previousMonthTotal > 0) {
    if (analytics.delta.percentage > 10) {
      insights.push({
        id: "budget-trend-up",
        title: "Spending is up",
        explanation: `Total spending is ${Math.round(analytics.delta.percentage)}% higher than last month.`,
        severity: "info",
        trend: "up",
        value: analytics.delta.delta,
        source: "budget",
      });
    } else if (analytics.delta.percentage < -10) {
      insights.push({
        id: "budget-trend-down",
        title: "Spending is down",
        explanation: `Total spending is ${Math.abs(Math.round(analytics.delta.percentage))}% lower than last month.`,
        severity: "success",
        trend: "down",
        value: analytics.delta.delta,
        source: "budget",
      });
    }
  }

  // 2. Overspend Warnings
  for (const [cat, limit] of Object.entries(limits)) {
    const total = analytics.categoryTotals[cat] ?? 0;
    if (limit > 0 && total > limit) {
      insights.push({
        id: `budget-over-${cat}`,
        title: `${cat} limit reached`,
        explanation: `${cat} spending is ₹${total - limit} over the set limit of ₹${limit}.`,
        severity: "warning",
        trend: "up",
        value: total,
        source: "budget",
      });
    }
  }

  // 3. Category Trend Exceptions
  for (const [cat, trend] of Object.entries(analytics.categoryTrends)) {
    // Only report significant category jumps if the base was meaningful (e.g. over 500)
    const prev = analytics.previousCategoryTotals[cat] ?? 0;
    if (prev > 500 && trend.percentage > 20) {
      insights.push({
        id: `budget-spike-${cat}`,
        title: `${cat} spending rose`,
        explanation: `${cat} is ${Math.round(trend.percentage)}% higher than last month.`,
        severity: "info",
        trend: "up",
        value: trend.delta,
        source: "budget",
      });
    }
  }

  return insights;
}
