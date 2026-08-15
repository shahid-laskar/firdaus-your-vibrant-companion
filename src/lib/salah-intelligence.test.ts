import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSalahAnalytics,
  compareSalahPeriods,
  generateSalahInsights,
  type SalahData,
} from "./salah-intelligence";
import { getWeekRange } from "./intelligence";

describe("Salah Intelligence", () => {
  const mockData: SalahData = {
    "2026-08-01": {
      fajr: "ontime",
      dhuhr: "ontime",
      asr: "late",
      maghrib: "ontime",
      isha: "ontime",
    },
    "2026-08-02": { fajr: "late", dhuhr: "ontime" }, // Partial day
    "2026-08-03": {}, // Empty day
    // Missing days are completely missing from the object
  };

  test("calculateSalahAnalytics - basic calculation and partial days", () => {
    const dates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"];
    const analytics = calculateSalahAnalytics(mockData, dates);

    // total = 5 + 2 = 7
    assert.equal(analytics.totalLogged, 7);

    // ontime = 4 + 1 = 5
    assert.equal(analytics.onTimeCount, 5);

    // late = 1 + 1 = 2
    assert.equal(analytics.lateCount, 2);

    // pct = 5/7 * 100
    assert.equal(Math.round(analytics.onTimePercentage), 71);
  });

  test("calculateSalahAnalytics - per prayer consistency", () => {
    const dates = ["2026-08-01", "2026-08-02"];
    const analytics = calculateSalahAnalytics(mockData, dates);

    const fajr = analytics.perPrayerConsistency["fajr"];
    assert.equal(fajr?.logged, 2);
    assert.equal(fajr?.onTime, 1);
    assert.equal(fajr?.percentage, 50);

    const dhuhr = analytics.perPrayerConsistency["dhuhr"];
    assert.equal(dhuhr?.logged, 2);
    assert.equal(dhuhr?.onTime, 2);
    assert.equal(dhuhr?.percentage, 100);

    const asr = analytics.perPrayerConsistency["asr"];
    assert.equal(asr?.logged, 1);
    assert.equal(asr?.onTime, 0);
    assert.equal(asr?.percentage, 0);
  });

  test("calculateSalahAnalytics - empty data safely handled", () => {
    const dates = ["2026-09-01", "2026-09-02"];
    const analytics = calculateSalahAnalytics(mockData, dates);
    assert.equal(analytics.totalLogged, 0);
    assert.equal(analytics.onTimePercentage, 0);
    assert.equal(analytics.perPrayerConsistency["fajr"]?.percentage, 0);
  });

  test("compareSalahPeriods", () => {
    const current = ["2026-08-01"]; // 4 onTime, 1 late (80%)
    const previous = ["2026-08-02"]; // 1 onTime, 1 late (50%)

    const comparison = compareSalahPeriods(mockData, current, previous);
    assert.equal(comparison.current.onTimePercentage, 80);
    assert.equal(comparison.previous.onTimePercentage, 50);
    assert.equal(comparison.trend.delta, 30);
  });

  test("generateSalahInsights - improvement", () => {
    const current = ["2026-08-01"]; // 80%
    const previous = ["2026-08-02"]; // 50%
    const comparison = compareSalahPeriods(mockData, current, previous);

    const insights = generateSalahInsights(comparison);
    const trendUp = insights.find((i) => i.id === "salah-trend-up");
    assert.ok(trendUp);
    assert.equal(trendUp?.severity, "success");

    // Strongest/weakest tests
    const strongest = insights.find((i) => i.id === "salah-strongest");
    // Not triggered because nothing has logged >= 2 in current period
    assert.equal(strongest, undefined);
  });

  test("generateSalahInsights - strongest/weakest", () => {
    // Faking data to trigger strongest/weakest
    // requires totalLogged >= 5 and at least one prayer logged >= 2 times
    const data = {
      d1: { fajr: "ontime", isha: "late" },
      d2: { fajr: "ontime", isha: "late" },
      d3: { fajr: "ontime", isha: "late" },
    } as SalahData;

    const comparison = compareSalahPeriods(data, ["d1", "d2", "d3"], []);
    const insights = generateSalahInsights(comparison);

    const strongest = insights.find((i) => i.id === "salah-strongest");
    assert.ok(strongest);
    assert.ok(strongest?.title.includes("Fajr"));

    const weakest = insights.find((i) => i.id === "salah-weakest");
    assert.ok(weakest);
    assert.ok(weakest?.title.includes("Isha"));
  });
});
