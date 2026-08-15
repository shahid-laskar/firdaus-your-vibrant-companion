export function isoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isoOffset(date: string | Date, offsetDays: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);
  return isoDate(d);
}

export function getWeekRange(endDate: string | Date): string[] {
  return [...Array(7)].map((_, i) => isoOffset(endDate, -(6 - i)));
}

export function getMonthRange(endDate: string | Date): string[] {
  return [...Array(30)].map((_, i) => isoOffset(endDate, -(29 - i)));
}

export function fillMissingData(
  range: string[],
  data: Record<string, number>,
  fallback = 0,
): number[] {
  return range.map((date) => data[date] ?? fallback);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

export function distribution<T extends string | number>(items: T[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

export function trendDelta(
  current: number,
  previous: number,
): { delta: number; percentage: number } {
  if (previous === 0) return { delta: current, percentage: current > 0 ? 100 : 0 };
  const delta = current - previous;
  const percentage = (delta / previous) * 100;
  return { delta, percentage };
}

export function checkThreshold(
  value: number,
  threshold: number,
  condition: "gt" | "gte" | "lt" | "lte",
): boolean {
  switch (condition) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
  }
}

export type InsightSeverity = "info" | "success" | "warning" | "critical";
export type InsightTrend = "up" | "down" | "flat" | "none";

export interface Insight {
  id: string;
  title: string;
  explanation: string;
  severity: InsightSeverity;
  value?: string | number;
  trend?: InsightTrend;
  source: string;
}

export type SignalCategory = "deen" | "household" | "family" | "health" | "finance";
export type SignalPriority = "low" | "medium" | "high";

export interface DailySignal {
  id: string;
  category: SignalCategory;
  priority: SignalPriority;
  reason: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  source: string;
}
