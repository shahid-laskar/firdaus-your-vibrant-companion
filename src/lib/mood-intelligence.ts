import { type Insight } from "./intelligence";

export type MoodCategory = "positive" | "neutral" | "negative";

export function categorizeMood(mood: string): MoodCategory {
  const m = mood.toLowerCase().trim();
  if (["bright", "grateful", "happy", "great", "good"].includes(m)) return "positive";
  if (["tired", "heavy", "sad", "stressed", "bad", "low"].includes(m)) return "negative";
  return "neutral"; // steady, okay, fine, etc.
}

export interface DailyActivityData {
  date: string;
  mood?: string;
  sleepHours?: number;
  waterGlasses?: number;
  workedOut?: boolean;
  salahOnTimePct?: number;
  habitsCompleted?: number;
}

export interface CorrelationResult {
  condition: string;
  percentagePositive: number;
  sampleSize: number;
}

export interface MoodAnalytics {
  totalLoggedDays: number;
  positiveDays: number;
  neutralDays: number;
  negativeDays: number;

  sleepCorrelation?: CorrelationResult;
  waterCorrelation?: CorrelationResult;
  workoutCorrelation?: CorrelationResult;
  salahCorrelation?: CorrelationResult;
  habitCorrelation?: CorrelationResult;
}

const MIN_SAMPLE_SIZE = 5;

/**
 * Calculates descriptive conditional distributions for mood vs. activities.
 * This is strictly observational (e.g., finding the % of positive days given a condition).
 */
export function calculateMoodAnalytics(data: DailyActivityData[]): MoodAnalytics {
  const withMood = data.filter((d) => !!d.mood);
  const total = withMood.length;

  const positive = withMood.filter((d) => categorizeMood(d.mood!) === "positive").length;
  const neutral = withMood.filter((d) => categorizeMood(d.mood!) === "neutral").length;
  const negative = withMood.filter((d) => categorizeMood(d.mood!) === "negative").length;

  const analytics: MoodAnalytics = {
    totalLoggedDays: total,
    positiveDays: positive,
    neutralDays: neutral,
    negativeDays: negative,
  };

  const calculateCorrelation = (
    conditionName: string,
    filterFn: (d: DailyActivityData) => boolean,
  ): CorrelationResult | undefined => {
    const matchingDays = withMood.filter(filterFn);
    if (matchingDays.length >= MIN_SAMPLE_SIZE) {
      const pos = matchingDays.filter((d) => categorizeMood(d.mood!) === "positive").length;
      return {
        condition: conditionName,
        percentagePositive: (pos / matchingDays.length) * 100,
        sampleSize: matchingDays.length,
      };
    }
    return undefined;
  };

  const sleepCorr = calculateCorrelation(
    "7+ hours of sleep",
    (d) => d.sleepHours !== undefined && d.sleepHours >= 7,
  );
  if (sleepCorr) analytics.sleepCorrelation = sleepCorr;

  const waterCorr = calculateCorrelation(
    "6+ glasses of water",
    (d) => d.waterGlasses !== undefined && d.waterGlasses >= 6,
  );
  if (waterCorr) analytics.waterCorrelation = waterCorr;

  const workoutCorr = calculateCorrelation("a workout", (d) => !!d.workedOut);
  if (workoutCorr) analytics.workoutCorrelation = workoutCorr;

  const salahCorr = calculateCorrelation(
    "mostly on-time Salah",
    (d) => d.salahOnTimePct !== undefined && d.salahOnTimePct >= 80,
  );
  if (salahCorr) analytics.salahCorrelation = salahCorr;

  const habitCorr = calculateCorrelation(
    "completing multiple habits",
    (d) => d.habitsCompleted !== undefined && d.habitsCompleted >= 3,
  );
  if (habitCorr) analytics.habitCorrelation = habitCorr;

  return analytics;
}

/**
 * Generates safe, non-judgmental, observational insights based on mood patterns.
 */
export function generateMoodInsights(analytics: MoodAnalytics): Insight[] {
  const insights: Insight[] = [];

  if (analytics.totalLoggedDays < MIN_SAMPLE_SIZE) {
    insights.push({
      id: "mood-insufficient",
      title: "Keep checking in",
      explanation:
        "There is not enough mood data yet to identify reliable patterns. Keep logging to build the picture.",
      severity: "info",
      source: "mood",
    });
    return insights;
  }

  const checkAndAdd = (corr: CorrelationResult | undefined, id: string) => {
    if (corr && corr.percentagePositive >= 50) {
      insights.push({
        id: `mood-corr-${id}`,
        title: "A positive pattern",
        explanation: `On days with ${corr.condition}, your logged mood was more often positive.`,
        severity: "success",
        trend: "flat",
        source: "mood",
      });
    }
  };

  checkAndAdd(analytics.sleepCorrelation, "sleep");
  checkAndAdd(analytics.waterCorrelation, "water");
  checkAndAdd(analytics.workoutCorrelation, "workout");
  checkAndAdd(analytics.salahCorrelation, "salah");
  checkAndAdd(analytics.habitCorrelation, "habits");

  if (insights.length === 0) {
    insights.push({
      id: "mood-baseline",
      title: "Patterns forming",
      explanation:
        "You've built a solid baseline, but no strong activity patterns have emerged just yet.",
      severity: "info",
      source: "mood",
    });
  }

  return insights;
}
