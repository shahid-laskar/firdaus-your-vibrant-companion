import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getPreviousMonthPrefix,
  calculateBudgetAnalytics,
  generateBudgetInsights,
  type ExpenseRecord,
} from "./budget-intelligence";

describe("Budget Intelligence", () => {
  test("getPreviousMonthPrefix", () => {
    assert.equal(getPreviousMonthPrefix("2026-08"), "2026-07");
    assert.equal(getPreviousMonthPrefix("2026-01"), "2025-12");
  });

  const expenses: ExpenseRecord[] = [
    { id: "1", category: "Groceries", amount: 2000, date: "2026-08-05" },
    { id: "2", category: "Groceries", amount: 1500, date: "2026-08-10" },
    { id: "3", category: "Transport", amount: 500, date: "2026-08-01" },
    { id: "4", category: "Groceries", amount: 1000, date: "2026-07-20" },
    { id: "5", category: "Health", amount: 3000, date: "2026-07-15" },
  ];

  test("calculateBudgetAnalytics - current vs previous month", () => {
    const analytics = calculateBudgetAnalytics(expenses, "2026-08", 10);
    assert.equal(analytics.currentMonthTotal, 4000);
    assert.equal(analytics.previousMonthTotal, 4000);
    assert.deepEqual(analytics.delta, { delta: 0, percentage: 0 });
    assert.equal(analytics.dailyAverage, 400);
  });

  test("calculateBudgetAnalytics - category totals", () => {
    const analytics = calculateBudgetAnalytics(expenses, "2026-08", 10);
    assert.equal(analytics.categoryTotals["Groceries"], 3500);
    assert.equal(analytics.categoryTotals["Transport"], 500);
    assert.equal(analytics.categoryTotals["Health"], undefined); // no spend in current month
    assert.equal(analytics.previousCategoryTotals["Groceries"], 1000);
    assert.equal(analytics.previousCategoryTotals["Health"], 3000);
  });

  test("calculateBudgetAnalytics - category trend", () => {
    const analytics = calculateBudgetAnalytics(expenses, "2026-08", 10);
    const groceriesTrend = analytics.categoryTrends["Groceries"];
    assert.deepEqual(groceriesTrend, { delta: 2500, percentage: 250 });

    const transportTrend = analytics.categoryTrends["Transport"]; // 0 to 500
    assert.deepEqual(transportTrend, { delta: 500, percentage: 100 });

    const healthTrend = analytics.categoryTrends["Health"]; // 3000 to 0
    assert.deepEqual(healthTrend, { delta: -3000, percentage: -100 });
  });

  test("calculateBudgetAnalytics - empty previous month", () => {
    const expensesWithNoPrev: ExpenseRecord[] = [
      { id: "1", category: "Groceries", amount: 2000, date: "2026-08-05" },
    ];
    const analytics = calculateBudgetAnalytics(expensesWithNoPrev, "2026-08", 10);
    assert.equal(analytics.previousMonthTotal, 0);
    assert.deepEqual(analytics.delta, { delta: 2000, percentage: 100 });
  });

  test("calculateBudgetAnalytics - zero-spend cases", () => {
    const analytics = calculateBudgetAnalytics([], "2026-08", 10);
    assert.equal(analytics.currentMonthTotal, 0);
    assert.equal(analytics.previousMonthTotal, 0);
    assert.deepEqual(analytics.delta, { delta: 0, percentage: 0 });
    assert.equal(analytics.dailyAverage, 0);
    assert.deepEqual(analytics.categoryTotals, {});
    assert.deepEqual(analytics.categoryTrends, {});
  });

  test("generateBudgetInsights - category limit / overspend detection", () => {
    const analytics = calculateBudgetAnalytics(expenses, "2026-08", 10);
    const insights = generateBudgetInsights(analytics, { Groceries: 3000 });
    const overspend = insights.find((i) => i.id === "budget-over-Groceries");
    assert.ok(overspend);
    assert.equal(overspend?.title, "Groceries limit reached");
    assert.equal(overspend?.severity, "warning");
  });

  test("generateBudgetInsights - positive/negative trend", () => {
    const insightsDown = generateBudgetInsights(
      calculateBudgetAnalytics(
        [...expenses, { id: "9", amount: 10000, category: "Other", date: "2026-07-01" }],
        "2026-08",
        10,
      ),
      {},
    );
    const trendDown = insightsDown.find((i) => i.id === "budget-trend-down");
    assert.ok(trendDown);
    assert.equal(trendDown?.severity, "success");

    const insightsUp = generateBudgetInsights(
      calculateBudgetAnalytics(
        [...expenses, { id: "10", amount: 10000, category: "Other", date: "2026-08-01" }],
        "2026-08",
        10,
      ),
      {},
    );
    const trendUp = insightsUp.find((i) => i.id === "budget-trend-up");
    assert.ok(trendUp);
    assert.equal(trendUp?.severity, "info"); // not a warning, just info
  });
});
