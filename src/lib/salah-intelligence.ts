import { trendDelta, type Insight } from "./intelligence";

export type PrayerStatus = "ontime" | "late";
// The data shape from the store: Record<YYYY-MM-DD, Record<PrayerName, PrayerStatus>>
export type SalahData = Record<string, Record<string, PrayerStatus>>;

export interface PrayerConsistency {
  logged: number;
  onTime: number;
  percentage: number;
}

export interface SalahAnalytics {
  totalLogged: number;
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: number;
  perPrayerConsistency: Record<string, PrayerConsistency>;
}

export interface SalahPeriodComparison {
  current: SalahAnalytics;
  previous: SalahAnalytics;
  trend: { delta: number; percentage: number }; // trend compares onTimePercentage
}

/**
 * Calculates analytics for a specific array of dates to allow arbitrary ranges
 * (e.g., current month, previous week, etc.)
 */
export function calculateSalahAnalytics(data: SalahData, dates: string[]): SalahAnalytics {
  let totalLogged = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  const prayerStats: Record<string, { logged: number; onTime: number }> = {
    fajr: { logged: 0, onTime: 0 },
    dhuhr: { logged: 0, onTime: 0 },
    asr: { logged: 0, onTime: 0 },
    maghrib: { logged: 0, onTime: 0 },
    isha: { logged: 0, onTime: 0 },
  };

  for (const date of dates) {
    const dayData = data[date] || {};
    for (const [prayer, status] of Object.entries(dayData)) {
      totalLogged++;
      if (status === "ontime") {
        onTimeCount++;
      } else {
        lateCount++;
      }

      if (!prayerStats[prayer]) {
        prayerStats[prayer] = { logged: 0, onTime: 0 };
      }
      prayerStats[prayer].logged++;
      if (status === "ontime") {
        prayerStats[prayer].onTime++;
      }
    }
  }

  const perPrayerConsistency: Record<string, PrayerConsistency> = {};
  for (const [prayer, stat] of Object.entries(prayerStats)) {
    perPrayerConsistency[prayer] = {
      ...stat,
      percentage: stat.logged > 0 ? (stat.onTime / stat.logged) * 100 : 0,
    };
  }

  return {
    totalLogged,
    onTimeCount,
    lateCount,
    onTimePercentage: totalLogged > 0 ? (onTimeCount / totalLogged) * 100 : 0,
    perPrayerConsistency,
  };
}

/**
 * Compares two arbitrary date ranges for period-over-period insights.
 */
export function compareSalahPeriods(
  data: SalahData,
  currentDates: string[],
  previousDates: string[],
): SalahPeriodComparison {
  const current = calculateSalahAnalytics(data, currentDates);
  const previous = calculateSalahAnalytics(data, previousDates);

  return {
    current,
    previous,
    // Using simple subtraction for percentage point difference
    trend: {
      delta: current.onTimePercentage - previous.onTimePercentage,
      // Traditional percentage change of the percentage
      percentage:
        previous.onTimePercentage > 0
          ? ((current.onTimePercentage - previous.onTimePercentage) / previous.onTimePercentage) *
            100
          : current.onTimePercentage > 0
            ? 100
            : 0,
    },
  };
}

/**
 * Generates reflective, non-judgmental insights based on comparison.
 */
export function generateSalahInsights(comparison: SalahPeriodComparison): Insight[] {
  const insights: Insight[] = [];
  const { current, previous, trend } = comparison;

  if (current.totalLogged === 0) return insights;

  // 1. Overall consistency trend
  if (previous.totalLogged > 0) {
    if (trend.delta >= 5) {
      insights.push({
        id: "salah-trend-up",
        title: "Salah consistency improved",
        explanation: `Your on-time consistency improved by ${Math.round(trend.delta)}% compared with the previous period.`,
        severity: "success",
        trend: "up",
        value: current.onTimePercentage,
        source: "salah",
      });
    } else if (trend.delta <= -10) {
      insights.push({
        id: "salah-trend-down",
        title: "Salah consistency dipped",
        explanation: `Your on-time consistency is ${Math.abs(Math.round(trend.delta))}% lower than the previous period.`,
        severity: "info", // Kept non-judgmental as requested
        trend: "down",
        value: current.onTimePercentage,
        source: "salah",
      });
    }
  }

  // 2. Identify strongest and weakest prayers
  if (current.totalLogged >= 5) {
    let strongest = { name: "", pct: -1 };
    let weakest = { name: "", pct: 101 };

    for (const [prayer, stat] of Object.entries(current.perPrayerConsistency)) {
      if (stat.logged >= 2) {
        if (stat.percentage > strongest.pct) {
          strongest = { name: prayer, pct: stat.percentage };
        }
        if (stat.percentage < weakest.pct) {
          weakest = { name: prayer, pct: stat.percentage };
        }
      }
    }

    if (strongest.name && strongest.pct === 100) {
      const formatted = strongest.name.charAt(0).toUpperCase() + strongest.name.slice(1);
      insights.push({
        id: "salah-strongest",
        title: `Steady with ${formatted}`,
        explanation: `You've been consistently on-time for ${formatted}.`,
        severity: "success",
        trend: "flat",
        source: "salah",
      });
    }

    if (weakest.name && weakest.pct < 50 && strongest.name !== weakest.name) {
      const formatted = weakest.name.charAt(0).toUpperCase() + weakest.name.slice(1);
      insights.push({
        id: "salah-weakest",
        title: `Focus on ${formatted}`,
        explanation: `${formatted} was often logged as late. Worth keeping an eye on.`,
        severity: "info",
        trend: "flat",
        source: "salah",
      });
    }
  }

  return insights;
}
