/**
 * Hifz Revision Scheduler — Spaced-repetition revision engine for Quran memorisation.
 *
 * Implements a transparent, explainable spaced-repetition scheduler (SM-2 variant tailored for Hifz)
 * that tracks retention decay, schedules Muraja'ah (revision) queues, and maintains full backwards
 * compatibility with legacy Hifz data records.
 */

import { ALL_SURAHS, getSurahMeta, searchSurahs } from "./quran-data";
import { isoDate, isoOffset, type DailySignal } from "./intelligence";
import { uid } from "./store";

export type HifzRating = "hard" | "fair" | "good" | "strong";

export const HIFZ_RATING_CONFIG: Record<
  HifzRating,
  { label: string; description: string; score: number; glyph: string }
> = {
  hard: {
    label: "Needs Work",
    description: "Frequent stops, needed Mushaf assistance",
    score: 1,
    glyph: "△",
  },
  fair: {
    label: "Fair",
    description: "Remembered with minor hesitation or mutashabihat stops",
    score: 2,
    glyph: "◬",
  },
  good: {
    label: "Good",
    description: "Solid recitation with standard fluency",
    score: 3,
    glyph: "▲",
  },
  strong: {
    label: "Fluent",
    description: "Flawless, effortless recall from heart",
    score: 4,
    glyph: "★",
  },
};

export interface HifzRevisionLog {
  id: string;
  date: string; // YYYY-MM-DD
  rating: HifzRating;
  notes?: string | undefined;
}

export interface HifzItem {
  id: string;
  surah: string; // e.g. "Al-Mulk" or "Surah 67"
  surahNumber?: number | undefined;
  range?: string | undefined; // optional e.g. "Ayahs 1-30" or "Juz 29"
  pct: number; // 0 to 100% memorization progress
  due?: boolean | undefined; // computed at runtime by the revision queue

  // Spaced repetition fields (optional on disk, defaulted at runtime)
  lastRevised?: string | undefined; // YYYY-MM-DD
  nextDue?: string | undefined; // YYYY-MM-DD
  intervalDays?: number | undefined; // current interval in days
  repetitions?: number | undefined; // consecutive successful revisions
  easeFactor?: number | undefined; // multiplier (1.3 to 3.0, default 2.5)
  revisionHistory?: HifzRevisionLog[] | undefined;
  status?: "memorizing" | "revising" | "mastered" | undefined;
}

/** Normalize any raw or legacy Hifz record into a fully-typed HifzItem */
export function normalizeHifzItem(raw: Partial<HifzItem> & { id: string; surah: string }): HifzItem {
  const pct = typeof raw.pct === "number" ? Math.max(0, Math.min(100, raw.pct)) : 0;
  const isMastered = pct === 100;

  // Attempt to resolve surah number from catalog
  let surahNumber = raw.surahNumber;
  if (!surahNumber && raw.surah) {
    const matches = searchSurahs(raw.surah);
    if (matches.length > 0) {
      surahNumber = matches[0]?.n;
    }
  }

  const intervalDays = raw.intervalDays ?? (isMastered ? 3 : 1);
  const repetitions = raw.repetitions ?? (raw.revisionHistory ? raw.revisionHistory.length : 0);
  const easeFactor = raw.easeFactor ?? 2.5;
  const lastRevised = raw.lastRevised;
  const nextDue = raw.nextDue ?? (lastRevised ? isoOffset(lastRevised, intervalDays) : isoDate());

  return {
    id: raw.id,
    surah: raw.surah.trim(),
    surahNumber,
    range: raw.range,
    pct,
    lastRevised,
    nextDue,
    intervalDays,
    repetitions,
    easeFactor,
    revisionHistory: raw.revisionHistory ?? [],
    status: raw.status ?? (isMastered ? "revising" : "memorizing"),
  };
}

/**
 * Calculate the next revision interval and ease factor based on the revision quality rating.
 *
 * Algorithm parameters:
 * - Hard (1): Resets repetitions to 0; interval = 1 day; decreases EF.
 * - Fair (2): Repetitions maintained; interval = 2 days; slight EF decrease.
 * - Good (3): Standard progression; interval = prevInterval * EF; EF maintained.
 * - Fluent/Strong (4): Accelerated progression; interval = prevInterval * (EF * 1.2); increases EF.
 */
export function calculateNextSchedule(
  item: HifzItem,
  rating: HifzRating,
  revisionDate = isoDate()
): { nextDue: string; intervalDays: number; repetitions: number; easeFactor: number } {
  const currentEF = item.easeFactor ?? 2.5;
  const currentReps = item.repetitions ?? 0;
  const currentInterval = item.intervalDays ?? 1;
  const config = HIFZ_RATING_CONFIG[rating];

  // SuperMemo-2 style Ease Factor adjustment
  // EF' = EF + (0.1 - (4 - score) * (0.08 + (4 - score) * 0.02))
  const score = config.score;
  const deltaEF = 0.1 - (4 - score) * (0.08 + (4 - score) * 0.02);
  const newEF = Math.max(1.3, Math.min(3.0, Number((currentEF + deltaEF).toFixed(2))));

  let newReps = currentReps;
  let newInterval = 1;

  switch (rating) {
    case "hard":
      newReps = 0;
      newInterval = 1;
      break;

    case "fair":
      newReps = Math.max(1, currentReps);
      newInterval = 2;
      break;

    case "good":
      newReps = currentReps + 1;
      if (newReps === 1) {
        newInterval = 1;
      } else if (newReps === 2) {
        newInterval = 4;
      } else {
        newInterval = Math.max(1, Math.round(currentInterval * newEF));
      }
      break;

    case "strong":
      newReps = currentReps + 1;
      if (newReps === 1) {
        newInterval = 2;
      } else if (newReps === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.max(1, Math.round(currentInterval * newEF * 1.2));
      }
      break;
  }

  const nextDue = isoOffset(revisionDate, newInterval);

  return {
    nextDue,
    intervalDays: newInterval,
    repetitions: newReps,
    easeFactor: newEF,
  };
}

/** Calculate retention decay and status for a given Hifz item */
export function getRetentionScore(
  item: HifzItem,
  asOfDate = isoDate()
): {
  retentionPct: number;
  daysSince: number | null;
  daysOverdue: number;
  isDue: boolean;
  status: "due" | "upcoming" | "fresh" | "new";
} {
  const norm = normalizeHifzItem(item);

  if (!norm.lastRevised) {
    return {
      retentionPct: norm.pct > 0 ? 80 : 50,
      daysSince: null,
      daysOverdue: 0,
      isDue: true,
      status: "new",
    };
  }

  const lastDate = new Date(`${norm.lastRevised}T00:00:00`).getTime();
  const currentDate = new Date(`${asOfDate}T00:00:00`).getTime();
  const daysSince = Math.max(0, Math.floor((currentDate - lastDate) / 86_400_000));

  const targetInterval = norm.intervalDays ?? 1;
  const dueDate = norm.nextDue ?? norm.lastRevised;
  const isDue = asOfDate >= dueDate;

  const dueDateTime = new Date(`${dueDate}T00:00:00`).getTime();
  const daysOverdue = Math.max(0, Math.floor((currentDate - dueDateTime) / 86_400_000));

  // Exponential retention decay: R = e^(-daysSince / (interval * 1.5))
  const decayFactor = targetInterval * 1.5;
  const rawRetention = Math.exp(-daysSince / Math.max(1, decayFactor));
  const retentionPct = Math.max(10, Math.min(100, Math.round(rawRetention * 100)));

  let status: "due" | "upcoming" | "fresh" | "new" = "upcoming";
  if (isDue) {
    status = "due";
  } else if (daysSince <= 1) {
    status = "fresh";
  }

  return {
    retentionPct,
    daysSince,
    daysOverdue,
    isDue,
    status,
  };
}

export interface RevisionQueueResult {
  dueToday: HifzItem[];
  upcoming: HifzItem[];
  completedToday: HifzItem[];
  allNormalized: HifzItem[];
  summary: {
    totalPortions: number;
    masteredCount: number;
    inProgressCount: number;
    dueCount: number;
    averageRetention: number;
  };
}

/** Generate daily Muraja'ah (revision) queue prioritized by urgency and retention decay */
export function generateHifzRevisionQueue(items: HifzItem[], asOfDate = isoDate()): RevisionQueueResult {
  const normalized = items.map(normalizeHifzItem);

  const dueToday: HifzItem[] = [];
  const upcoming: HifzItem[] = [];
  const completedToday: HifzItem[] = [];

  let totalRetentionSum = 0;
  let masteredCount = 0;
  let inProgressCount = 0;

  for (const item of normalized) {
    const { retentionPct, isDue } = getRetentionScore(item, asOfDate);
    totalRetentionSum += retentionPct;

    if (item.pct === 100) masteredCount++;
    else inProgressCount++;

    if (item.lastRevised === asOfDate) {
      completedToday.push(item);
    } else if (isDue) {
      dueToday.push(item);
    } else {
      upcoming.push(item);
    }
  }

  // Sort dueToday: most overdue & lowest retention first
  dueToday.sort((a, b) => {
    const scoreA = getRetentionScore(a, asOfDate);
    const scoreB = getRetentionScore(b, asOfDate);
    if (scoreB.daysOverdue !== scoreA.daysOverdue) {
      return scoreB.daysOverdue - scoreA.daysOverdue;
    }
    return scoreA.retentionPct - scoreB.retentionPct;
  });

  // Sort upcoming: closest due date first
  upcoming.sort((a, b) => (a.nextDue ?? "").localeCompare(b.nextDue ?? ""));

  const totalPortions = normalized.length;
  const averageRetention = totalPortions > 0 ? Math.round(totalRetentionSum / totalPortions) : 100;

  return {
    dueToday,
    upcoming,
    completedToday,
    allNormalized: normalized,
    summary: {
      totalPortions,
      masteredCount,
      inProgressCount,
      dueCount: dueToday.length,
      averageRetention,
    },
  };
}

/** Record a revision session and return the updated HifzItems list */
export function recordHifzRevision(
  items: HifzItem[],
  itemId: string,
  rating: HifzRating,
  notes?: string | undefined,
  revisionDate = isoDate()
): HifzItem[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;

    const norm = normalizeHifzItem(item);
    const schedule = calculateNextSchedule(norm, rating, revisionDate);

    const logEntry: HifzRevisionLog = {
      id: uid(),
      date: revisionDate,
      rating,
      notes: notes?.trim() || undefined,
    };

    const updatedHistory = [logEntry, ...(norm.revisionHistory ?? [])];

    return {
      ...norm,
      lastRevised: revisionDate,
      nextDue: schedule.nextDue,
      intervalDays: schedule.intervalDays,
      repetitions: schedule.repetitions,
      easeFactor: schedule.easeFactor,
      revisionHistory: updatedHistory,
    };
  });
}

/** Generate daily deen signals for the Daily Operating Surface (Phase 4.5) */
export function generateHifzSignals(items: HifzItem[], asOfDate = isoDate()): DailySignal[] {
  const queue = generateHifzRevisionQueue(items, asOfDate);
  const signals: DailySignal[] = [];

  if (queue.dueToday.length > 0) {
    const firstDue = queue.dueToday[0]!;
    signals.push({
      id: `hifz-due-${asOfDate}`,
      category: "deen",
      priority: queue.dueToday.length >= 3 ? "high" : "medium",
      reason:
        queue.dueToday.length === 1
          ? `Hifz revision due today: ${firstDue.surah}`
          : `${queue.dueToday.length} Hifz revisions due today (${firstDue.surah} and more)`,
      action: {
        label: "Revise now",
        href: "/deen?tab=hifz",
      },
      source: "hifz-scheduler",
    });
  }

  return signals;
}
