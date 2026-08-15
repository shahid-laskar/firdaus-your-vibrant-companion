import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  categorizeMood,
  calculateMoodAnalytics,
  generateMoodInsights,
  type DailyActivityData,
} from "./mood-intelligence";

describe("Mood Intelligence", () => {
  test("categorizeMood safely categorizes", () => {
    assert.equal(categorizeMood("bright"), "positive");
    assert.equal(categorizeMood("Grateful "), "positive");
    assert.equal(categorizeMood("tired"), "negative");
    assert.equal(categorizeMood("heavy"), "negative");
    assert.equal(categorizeMood("steady"), "neutral");
    assert.equal(categorizeMood("unknown-mood"), "neutral");
  });

  const baseData: DailyActivityData[] = [
    {
      date: "1",
      mood: "bright",
      sleepHours: 8,
      waterGlasses: 7,
      workedOut: true,
      salahOnTimePct: 100,
      habitsCompleted: 4,
    },
    {
      date: "2",
      mood: "bright",
      sleepHours: 7,
      waterGlasses: 6,
      workedOut: true,
      salahOnTimePct: 80,
      habitsCompleted: 3,
    },
    {
      date: "3",
      mood: "steady",
      sleepHours: 7.5,
      waterGlasses: 5,
      workedOut: false,
      salahOnTimePct: 100,
      habitsCompleted: 2,
    },
    {
      date: "4",
      mood: "grateful",
      sleepHours: 6,
      waterGlasses: 8,
      workedOut: true,
      salahOnTimePct: 100,
      habitsCompleted: 5,
    },
    {
      date: "5",
      mood: "tired",
      sleepHours: 5,
      waterGlasses: 3,
      workedOut: false,
      salahOnTimePct: 40,
      habitsCompleted: 1,
    },
    {
      date: "6",
      mood: "heavy",
      sleepHours: 6,
      waterGlasses: 2,
      workedOut: false,
      salahOnTimePct: 60,
      habitsCompleted: 1,
    },
    {
      date: "7",
      mood: "bright",
      sleepHours: 7,
      waterGlasses: 6,
      workedOut: true,
      salahOnTimePct: 100,
      habitsCompleted: 4,
    },
  ];

  test("calculateMoodAnalytics - basic distributions", () => {
    const analytics = calculateMoodAnalytics(baseData);
    assert.equal(analytics.totalLoggedDays, 7);
    assert.equal(analytics.positiveDays, 4); // bright, bright, grateful, bright
    assert.equal(analytics.neutralDays, 1); // steady
    assert.equal(analytics.negativeDays, 2); // tired, heavy
  });

  test("calculateMoodAnalytics - correlations", () => {
    const analytics = calculateMoodAnalytics(baseData);

    // Sleep: 4 days with 7+ hours (d1, d2, d3, d7)
    // d1: bright(pos), d2: bright(pos), d3: steady(neu), d7: bright(pos) -> 3/4 = 75%
    // but sample size is 4, which is < 5 (MIN_SAMPLE_SIZE), so undefined
    assert.equal(analytics.sleepCorrelation, undefined);

    // Let's add more data to hit the 5 threshold
    const expandedData = [
      ...baseData,
      { date: "8", mood: "bright", sleepHours: 7.5, workedOut: true },
      { date: "9", mood: "bright", sleepHours: 8, workedOut: true },
    ];

    const a2 = calculateMoodAnalytics(expandedData);

    assert.ok(a2.sleepCorrelation);
    assert.equal(a2.sleepCorrelation?.sampleSize, 6); // d1, d2, d3, d7, d8, d9
    // pos = d1, d2, d7, d8, d9 (5). neu = d3 (1). 5/6 = 83.33%
    assert.ok(a2.sleepCorrelation!.percentagePositive > 80);

    assert.ok(a2.workoutCorrelation);
    assert.equal(a2.workoutCorrelation?.sampleSize, 6); // d1, d2, d4, d7, d8, d9
    // pos = d1, d2, d4, d7, d8, d9 (6/6 = 100%)
    assert.equal(a2.workoutCorrelation!.percentagePositive, 100);
  });

  test("calculateMoodAnalytics - handles missing fields safely", () => {
    // some missing moods, some missing sleep
    const data: DailyActivityData[] = [
      { date: "1", sleepHours: 8 }, // ignored, no mood
      { date: "2", mood: "bright" }, // ignored for sleep, counted for mood
      { date: "3", mood: "bright", sleepHours: 7 },
      { date: "4", mood: "bright", sleepHours: 7 },
      { date: "5", mood: "bright", sleepHours: 7 },
      { date: "6", mood: "bright", sleepHours: 7 },
      { date: "7", mood: "bright", sleepHours: 7 },
    ];

    const a = calculateMoodAnalytics(data);
    assert.equal(a.totalLoggedDays, 6);
    assert.equal(a.sleepCorrelation?.sampleSize, 5);
    assert.equal(a.sleepCorrelation?.percentagePositive, 100);
  });

  test("generateMoodInsights - insufficient data", () => {
    const data: DailyActivityData[] = [{ date: "1", mood: "bright" }];
    const analytics = calculateMoodAnalytics(data);
    const insights = generateMoodInsights(analytics);

    assert.equal(insights.length, 1);
    assert.equal(insights[0]?.id, "mood-insufficient");
  });

  test("generateMoodInsights - patterns forming", () => {
    // Need >= 5 days of mood, but none reach correlation threshold of 5
    const data: DailyActivityData[] = [
      { date: "1", mood: "steady" },
      { date: "2", mood: "steady" },
      { date: "3", mood: "steady" },
      { date: "4", mood: "steady" },
      { date: "5", mood: "steady" },
    ];
    const analytics = calculateMoodAnalytics(data);
    const insights = generateMoodInsights(analytics);

    assert.equal(insights.length, 1);
    assert.equal(insights[0]?.id, "mood-baseline");
  });

  test("generateMoodInsights - positive patterns", () => {
    const data: DailyActivityData[] = [
      { date: "1", mood: "bright", sleepHours: 8 },
      { date: "2", mood: "bright", sleepHours: 8 },
      { date: "3", mood: "bright", sleepHours: 8 },
      { date: "4", mood: "bright", sleepHours: 8 },
      { date: "5", mood: "bright", sleepHours: 8 },
    ];
    const analytics = calculateMoodAnalytics(data);
    const insights = generateMoodInsights(analytics);

    assert.ok(insights.find((i) => i.id === "mood-corr-sleep"));
    assert.equal(insights.find((i) => i.id === "mood-corr-sleep")?.title, "A positive pattern");
  });
});
