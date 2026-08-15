/**
 * FIRDAUS RHYTHM ENGINE (Wave 1.1)
 *
 * Organizes the user's day as a sequence of prayer-centered time blocks.
 *
 * Core Principle:
 * Salah is a temporal anchor, not a task category.
 *
 * Timeline structure:
 * Fajr (Anchor) -> Morning Block -> Dhuhr (Anchor) -> Afternoon Block ->
 * Asr (Anchor) -> Late-Afternoon Block -> Maghrib (Anchor) -> Evening Block ->
 * Isha (Anchor) -> Night Block -> (Fajr next day)
 */

import { isoDate } from "./intelligence";
import { isRepeating, occursOn } from "./recurrence";
import type { HifzItem } from "./hifz-scheduler";
import type { ReminderSignal } from "./reminder-engine";
import type { DailySurfaceData, TaskRecord, CalEventRecord } from "./daily-surface";

// -----------------------------------------------------------------------------
// TYPES & DEFINITIONS
// -----------------------------------------------------------------------------

export type PrayerId = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_IDS: readonly PrayerId[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export type RhythmBlockId =
  | "morning"
  | "afternoon"
  | "lateAfternoon"
  | "evening"
  | "night";

export const RHYTHM_BLOCK_IDS: readonly RhythmBlockId[] = [
  "morning",
  "afternoon",
  "lateAfternoon",
  "evening",
  "night",
] as const;

export interface RhythmBlockDefinition {
  id: RhythmBlockId;
  name: string;
  arabicName: string;
  description: string;
  startAnchor: PrayerId;
  endAnchor: PrayerId;
  spiritualFocus: string;
}

export const RHYTHM_BLOCK_DEFINITIONS: Record<RhythmBlockId, RhythmBlockDefinition> = {
  morning: {
    id: "morning",
    name: "Morning",
    arabicName: "الصباح",
    description: "Between Fajr and Dhuhr",
    startAnchor: "fajr",
    endAnchor: "dhuhr",
    spiritualFocus: "Adhkar, Quran recitation, Duha, deep focus, household start",
  },
  afternoon: {
    id: "afternoon",
    name: "Afternoon",
    arabicName: "الظهيرة",
    description: "Between Dhuhr and Asr",
    startAnchor: "dhuhr",
    endAnchor: "asr",
    spiritualFocus: "Midday prayer, nourishment, Qaylulah (rest), focused momentum",
  },
  lateAfternoon: {
    id: "lateAfternoon",
    name: "Late Afternoon",
    arabicName: "العصر",
    description: "Between Asr and Maghrib",
    startAnchor: "asr",
    endAnchor: "maghrib",
    spiritualFocus: "Wrap-up, outdoor activity, evening Adhkar, mindful closing",
  },
  evening: {
    id: "evening",
    name: "Evening",
    arabicName: "المساء",
    description: "Between Maghrib and Isha",
    startAnchor: "maghrib",
    endAnchor: "isha",
    spiritualFocus: "Sunset prayer, family meal, gratitude, connection, Muraja'ah",
  },
  night: {
    id: "night",
    name: "Night",
    arabicName: "الليل",
    description: "Between Isha and Fajr",
    startAnchor: "isha",
    endAnchor: "fajr",
    spiritualFocus: "Night prayer, peaceful winding down, rest, Qiyam al-Layl, Suhur",
  },
};

export type PrayerAnchorStatus = "ontime" | "late" | "missed" | "pending" | "upcoming";

export interface PrayerAnchor {
  id: PrayerId;
  name: string;
  time: string; // "HH:mm"
  minutes: number; // 0..1439
  status: PrayerAnchorStatus;
  isNext: boolean;
  isPast: boolean;
  isCurrentWindow: boolean; // within active prayer window (+/- 20 mins of prayer start)
  formattedTime: string;
}

export type RhythmItemCategory =
  | "task"
  | "event"
  | "habit"
  | "meal"
  | "hifz"
  | "family"
  | "reminder"
  | "ramadan"
  | "wellbeing";

export interface RhythmItem {
  id: string;
  category: RhythmItemCategory;
  title: string;
  detail?: string | undefined;
  time?: string | undefined; // "HH:mm" if scheduled at specific clock time
  relativeAnchor?: {
    prayer: PrayerId;
    relation: "before" | "after" | "at";
    offsetMinutes?: number | undefined;
  } | undefined;
  blockId: RhythmBlockId;
  done?: boolean | undefined;
  priority?: number | undefined; // 1 (urgent) to 10 (ambient)
  to?: string | undefined; // navigation target e.g. "/deen", "/me", "/"
  sourceId?: string | undefined;
}

export interface RhythmBlock {
  id: RhythmBlockId;
  name: string;
  arabicName: string;
  description: string;
  startAnchor: PrayerId;
  endAnchor: PrayerId;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  isCurrent: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  progressPct: number; // 0..100 for current block
  items: RhythmItem[];
}

export type RhythmTimelineSegment =
  | { type: "anchor"; anchor: PrayerAnchor }
  | { type: "block"; block: RhythmBlock };

export interface DayRhythm {
  date: string; // YYYY-MM-DD
  currentTime: Date;
  currentMinutes: number;
  currentBlockId: RhythmBlockId;
  currentAnchorId?: PrayerId | undefined;
  nextAnchor: {
    id: PrayerId;
    name: string;
    time: string;
    minutesRemaining: number;
    hours: number;
    mins: number;
    isImminent: boolean; // <= 30 mins
  };
  anchors: PrayerAnchor[];
  blocks: RhythmBlock[];
  timeline: RhythmTimelineSegment[];
  stats: {
    totalItems: number;
    completedItems: number;
    remainingItems: number;
    prayersLogged: number;
    totalPrayers: number;
    onTimePrayers: number;
  };
}

export interface DayRhythmInput {
  date?: string | undefined; // ISO string "YYYY-MM-DD"
  now?: Date | undefined;
  prayers: { id: string; name: string; time: string }[];
  salahLog?: Record<string, Record<string, "ontime" | "late">> | undefined;
  tasks?: TaskRecord[] | undefined;
  events?: CalEventRecord[] | undefined;
  meals?: Record<string, string> | undefined;
  grocery?: { id: string; got: boolean; name?: string | undefined }[] | undefined;
  habits?: { id: string; name: string; days: string[] }[] | undefined;
  health?: Record<string, { water: number; sleep?: string | undefined }> | undefined;
  checkins?: Record<string, string> | undefined;
  hifzItems?: HifzItem[] | undefined;
  isRamadan?: boolean | undefined;
  ramadanDay?: number | null | undefined;
  activeReminders?: ReminderSignal[] | undefined;
}

// -----------------------------------------------------------------------------
// TIME UTILITIES
// -----------------------------------------------------------------------------

/** Converts "HH:mm" 24h string to minutes from midnight (0..1439) */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const validH = isNaN(h) ? 0 : h;
  const validM = isNaN(m) ? 0 : m;
  return ((validH % 24) * 60 + (validM % 60) + 1440) % 1440;
}

/** Converts minutes from midnight to "HH:mm" 24h string */
export function minutesToTime(totalMinutes: number): string {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Formats duration into user-friendly string e.g. "4h 15m" or "45m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// -----------------------------------------------------------------------------
// BLOCK RESOLUTION ENGINE
// -----------------------------------------------------------------------------

export interface PrayerTimeMap {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

/**
 * Extracts and normalizes prayer times in minutes from prayer array.
 * Falls back to canonical standards if not provided.
 */
export function extractPrayerTimeMap(
  prayers: { id: string; time: string }[]
): PrayerTimeMap {
  const defaults: Record<PrayerId, string> = {
    fajr: "05:15",
    dhuhr: "12:30",
    asr: "15:45",
    maghrib: "18:25",
    isha: "19:45",
  };

  const getMin = (id: PrayerId) => {
    const found = prayers.find((p) => p.id.toLowerCase() === id);
    return timeToMinutes(found?.time ?? defaults[id]);
  };

  return {
    fajr: getMin("fajr"),
    dhuhr: getMin("dhuhr"),
    asr: getMin("asr"),
    maghrib: getMin("maghrib"),
    isha: getMin("isha"),
  };
}

/**
 * Determines which prayer-centered rhythm block a given minute of the day falls into.
 *
 * Partition rules:
 * - [fajr, dhuhr) -> morning
 * - [dhuhr, asr) -> afternoon
 * - [asr, maghrib) -> lateAfternoon
 * - [maghrib, isha) -> evening
 * - [isha, 1440) U [0, fajr) -> night
 */
export function determineRhythmBlock(
  timeOrMinutes: string | number,
  prayers: PrayerTimeMap | { id: string; time: string }[]
): RhythmBlockId {
  const mins =
    typeof timeOrMinutes === "number" ? timeOrMinutes : timeToMinutes(timeOrMinutes);
  const map: PrayerTimeMap = Array.isArray(prayers)
    ? extractPrayerTimeMap(prayers)
    : prayers;

  if (mins >= map.fajr && mins < map.dhuhr) {
    return "morning";
  }
  if (mins >= map.dhuhr && mins < map.asr) {
    return "afternoon";
  }
  if (mins >= map.asr && mins < map.maghrib) {
    return "lateAfternoon";
  }
  if (mins >= map.maghrib && mins < map.isha) {
    return "evening";
  }
  return "night";
}

/**
 * Resolves a relative prayer anchor relation into a concrete rhythm block.
 *
 * Examples:
 * - after Fajr -> morning
 * - before Dhuhr -> morning
 * - after Dhuhr -> afternoon
 * - before Asr -> afternoon
 * - after Asr -> lateAfternoon
 * - before Maghrib -> lateAfternoon
 * - after Maghrib -> evening
 * - before Isha -> evening
 * - after Isha -> night
 * - before Fajr -> night
 */
export function resolveRelativeAnchorToBlock(
  prayer: PrayerId,
  relation: "before" | "after" | "at"
): RhythmBlockId {
  if (relation === "at") {
    switch (prayer) {
      case "fajr":
        return "morning";
      case "dhuhr":
        return "afternoon";
      case "asr":
        return "lateAfternoon";
      case "maghrib":
        return "evening";
      case "isha":
        return "night";
    }
  }

  if (relation === "after") {
    switch (prayer) {
      case "fajr":
        return "morning";
      case "dhuhr":
        return "afternoon";
      case "asr":
        return "lateAfternoon";
      case "maghrib":
        return "evening";
      case "isha":
        return "night";
    }
  }

  // relation === "before"
  switch (prayer) {
    case "fajr":
      return "night";
    case "dhuhr":
      return "morning";
    case "asr":
      return "afternoon";
    case "maghrib":
      return "lateAfternoon";
    case "isha":
      return "evening";
  }
}

/**
 * Smart inference for placing items into appropriate rhythm blocks.
 *
 * Priority order:
 * 1. Explicit relative anchor (e.g. relation: "after", prayer: "maghrib")
 * 2. Explicit clock time (e.g. "16:30" falls into lateAfternoon)
 * 3. Domain category defaults and text heuristics
 */
export function inferBlockForItem(
  item: {
    title?: string | undefined;
    time?: string | undefined;
    category?: string | undefined;
    relativeAnchor?: { prayer: PrayerId; relation: "before" | "after" | "at" } | undefined;
  },
  prayers: PrayerTimeMap | { id: string; time: string }[]
): RhythmBlockId {
  // 1. Explicit relative anchor
  if (item.relativeAnchor) {
    return resolveRelativeAnchorToBlock(
      item.relativeAnchor.prayer,
      item.relativeAnchor.relation
    );
  }

  // 2. Explicit time
  if (item.time && item.time.includes(":")) {
    return determineRhythmBlock(item.time, prayers);
  }

  const titleLower = (item.title ?? "").toLowerCase();

  // 3. Text heuristics with prayer names
  if (titleLower.includes("fajr") || titleLower.includes("duha") || titleLower.includes("morning")) {
    if (titleLower.includes("before fajr") || titleLower.includes("tahajjud") || titleLower.includes("suhur")) {
      return "night";
    }
    return "morning";
  }
  if (titleLower.includes("dhuhr") || titleLower.includes("noon") || titleLower.includes("qaylulah") || titleLower.includes("lunch")) {
    if (titleLower.includes("before dhuhr")) return "morning";
    return "afternoon";
  }
  if (titleLower.includes("asr")) {
    if (titleLower.includes("before asr")) return "afternoon";
    return "lateAfternoon";
  }
  if (titleLower.includes("maghrib") || titleLower.includes("sunset") || titleLower.includes("iftar") || titleLower.includes("dinner")) {
    if (titleLower.includes("before maghrib")) return "lateAfternoon";
    return "evening";
  }
  if (titleLower.includes("isha") || titleLower.includes("night") || titleLower.includes("sleep") || titleLower.includes("bed") || titleLower.includes("taraweeh")) {
    if (titleLower.includes("before isha")) return "evening";
    return "night";
  }

  // 4. Category defaults
  if (item.category === "meal") {
    if (titleLower.includes("breakfast")) return "morning";
    if (titleLower.includes("lunch")) return "afternoon";
    if (titleLower.includes("dinner")) return "evening";
  }
  if (item.category === "hifz") {
    return "morning"; // Prime time for memorisation
  }
  if (item.category === "wellbeing") {
    return "night";
  }

  // Fallback to morning block
  return "morning";
}

// -----------------------------------------------------------------------------
// CORE RHYTHM ENGINE BUILDER
// -----------------------------------------------------------------------------

/**
 * Builds the complete DayRhythm representation for Firdaus.
 * Pure, deterministic, and immutable.
 */
export function buildDayRhythm(input: DayRhythmInput): DayRhythm {
  const now = input.now ?? new Date();
  const dateStr = input.date ?? isoDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerMap = extractPrayerTimeMap(input.prayers);
  const salahLogForDay = (input.salahLog ?? {})[dateStr] ?? {};

  // Build 5 Prayer Anchors
  const prayerNames: Record<PrayerId, string> = {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  };

  const anchors: PrayerAnchor[] = PRAYER_IDS.map((id) => {
    const mins = prayerMap[id];
    const rawTime = minutesToTime(mins);
    const loggedStatus = salahLogForDay[id];

    let status: PrayerAnchorStatus;
    if (loggedStatus === "ontime") {
      status = "ontime";
    } else if (loggedStatus === "late") {
      status = "late";
    } else if (currentMinutes > mins + 45) {
      status = "missed";
    } else if (currentMinutes >= mins) {
      status = "pending";
    } else {
      status = "upcoming";
    }

    const isPast = currentMinutes >= mins;
    // Active prayer window: within 20 mins around prayer time
    const isCurrentWindow = Math.abs(currentMinutes - mins) <= 20;

    return {
      id,
      name: prayerNames[id],
      time: rawTime,
      minutes: mins,
      status,
      isNext: false, // will calculate below
      isPast,
      isCurrentWindow,
      formattedTime: rawTime,
    };
  });

  // Determine current active anchor window (if any)
  const activeAnchor = anchors.find((a) => a.isCurrentWindow);
  const currentAnchorId = activeAnchor?.id;

  // Determine current rhythm block
  const currentBlockId = determineRhythmBlock(currentMinutes, prayerMap);

  // Determine next upcoming prayer anchor
  const nextAnchorObj = anchors.find((a) => a.minutes > currentMinutes) ?? anchors[0]!;
  anchors.forEach((a) => {
    a.isNext = a.id === nextAnchorObj.id;
  });

  let minsUntilNext = nextAnchorObj.minutes - currentMinutes;
  if (minsUntilNext < 0) {
    minsUntilNext += 1440;
  }
  const hoursUntilNext = Math.floor(minsUntilNext / 60);
  const remainingMinsUntilNext = minsUntilNext % 60;
  const isNextImminent = minsUntilNext <= 30;

  // Compute Block Timing Intervals & Durations
  const blockTiming: Record<
    RhythmBlockId,
    { startMinutes: number; endMinutes: number; durationMinutes: number; startTime: string; endTime: string }
  > = {
    morning: {
      startMinutes: prayerMap.fajr,
      endMinutes: prayerMap.dhuhr,
      durationMinutes: prayerMap.dhuhr - prayerMap.fajr,
      startTime: minutesToTime(prayerMap.fajr),
      endTime: minutesToTime(prayerMap.dhuhr),
    },
    afternoon: {
      startMinutes: prayerMap.dhuhr,
      endMinutes: prayerMap.asr,
      durationMinutes: prayerMap.asr - prayerMap.dhuhr,
      startTime: minutesToTime(prayerMap.dhuhr),
      endTime: minutesToTime(prayerMap.asr),
    },
    lateAfternoon: {
      startMinutes: prayerMap.asr,
      endMinutes: prayerMap.maghrib,
      durationMinutes: prayerMap.maghrib - prayerMap.asr,
      startTime: minutesToTime(prayerMap.asr),
      endTime: minutesToTime(prayerMap.maghrib),
    },
    evening: {
      startMinutes: prayerMap.maghrib,
      endMinutes: prayerMap.isha,
      durationMinutes: prayerMap.isha - prayerMap.maghrib,
      startTime: minutesToTime(prayerMap.maghrib),
      endTime: minutesToTime(prayerMap.isha),
    },
    night: {
      startMinutes: prayerMap.isha,
      endMinutes: prayerMap.fajr,
      durationMinutes: 1440 - prayerMap.isha + prayerMap.fajr,
      startTime: minutesToTime(prayerMap.isha),
      endTime: minutesToTime(prayerMap.fajr),
    },
  };

  // Build items list categorized by block
  const blockItemsMap: Record<RhythmBlockId, RhythmItem[]> = {
    morning: [],
    afternoon: [],
    lateAfternoon: [],
    evening: [],
    night: [],
  };

  // 1. Ramadan items (if active)
  if (input.isRamadan) {
    // Suhur item in night block
    blockItemsMap.night.push({
      id: "ramadan-suhur",
      category: "ramadan",
      title: input.ramadanDay ? `Ramadan Day ${input.ramadanDay} — Suhur` : "Suhur",
      detail: `Fajr cutoff: ${minutesToTime(prayerMap.fajr)}`,
      time: minutesToTime(prayerMap.fajr - 40),
      relativeAnchor: { prayer: "fajr", relation: "before", offsetMinutes: 40 },
      blockId: "night",
      priority: currentBlockId === "night" ? 1 : 3,
      to: "/deen",
    });

    // Iftar item in evening block
    blockItemsMap.evening.push({
      id: "ramadan-iftar",
      category: "ramadan",
      title: "Iftar & Maghrib",
      detail: `Maghrib at ${minutesToTime(prayerMap.maghrib)}`,
      time: minutesToTime(prayerMap.maghrib),
      relativeAnchor: { prayer: "maghrib", relation: "at" },
      blockId: "evening",
      priority: currentBlockId === "lateAfternoon" || currentBlockId === "evening" ? 2 : 4,
      to: "/deen",
    });

    // Taraweeh item in night block
    blockItemsMap.night.push({
      id: "ramadan-taraweeh",
      category: "ramadan",
      title: "Taraweeh & Night Deeds",
      detail: `After Isha (${minutesToTime(prayerMap.isha)})`,
      relativeAnchor: { prayer: "isha", relation: "after" },
      blockId: "night",
      priority: 5,
      to: "/deen",
    });
  }

  // 2. Active reminders
  if (input.activeReminders && input.activeReminders.length > 0) {
    for (const rem of input.activeReminders) {
      const bId = rem.category === "prayer" ? currentBlockId : currentBlockId;
      blockItemsMap[bId].push({
        id: `reminder-${rem.id}`,
        category: "reminder",
        title: rem.message,
        detail: "Active reminder",
        blockId: bId,
        priority: rem.priority === "high" ? 2 : 4,
        to: rem.actionTarget || "/",
      });
    }
  }

  // 3. Hifz portions due today
  if (input.hifzItems && input.hifzItems.length > 0) {
    const dueCount = input.hifzItems.filter((h) => h.due).length;
    if (dueCount > 0) {
      const firstDue = input.hifzItems.find((h) => h.due);
      blockItemsMap.morning.push({
        id: "hifz-revision",
        category: "hifz",
        title: `Muraja'ah (${dueCount} due)`,
        detail: firstDue ? `Portion: ${firstDue.surah}` : undefined,
        relativeAnchor: { prayer: "fajr", relation: "after" },
        blockId: "morning",
        priority: 4,
        to: "/deen",
      });
    }
  }

  // 4. Calendar events
  if (input.events) {
    const todayEvents = input.events.filter((e) => e.date === dateStr || occursOn(e.recur, dateStr));
    for (const ev of todayEvents) {
      const bId = inferBlockForItem({ title: ev.title, time: ev.time, category: "event" }, prayerMap);
      blockItemsMap[bId].push({
        id: `event-${ev.id}`,
        category: "event",
        title: ev.title,
        detail: ev.time ? `At ${ev.time}` : undefined,
        time: ev.time,
        blockId: bId,
        priority: 5,
        to: "/",
        sourceId: ev.id,
      });
    }
  }

  // 5. Tasks due today
  if (input.tasks) {
    const dueTasks = input.tasks.filter((t) =>
      isRepeating(t.recur) ? occursOn(t.recur, dateStr) : t.date === dateStr || !t.done
    );

    for (const t of dueTasks) {
      const done = Boolean(t.done);
      const bId = inferBlockForItem({ title: t.title, time: t.time, category: "task" }, prayerMap);

      blockItemsMap[bId].push({
        id: `task-${t.id}`,
        category: "task",
        title: t.title,
        detail: t.time ? `Due ${t.time}` : undefined,
        time: t.time,
        done,
        blockId: bId,
        priority: done ? 9 : 6,
        to: "/",
        sourceId: t.id,
      });
    }
  }

  // 6. Planned Meals
  if (input.meals) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = dayNames[now.getDay()] ?? "Mon";

    const breakfast = input.meals[`${dayName}-Breakfast`];
    if (breakfast && !input.isRamadan) {
      blockItemsMap.morning.push({
        id: "meal-breakfast",
        category: "meal",
        title: `Breakfast: ${breakfast}`,
        detail: "Morning nourishment",
        blockId: "morning",
        priority: 6,
        to: "/",
      });
    }

    const lunch = input.meals[`${dayName}-Lunch`];
    if (lunch && !input.isRamadan) {
      blockItemsMap.afternoon.push({
        id: "meal-lunch",
        category: "meal",
        title: `Lunch: ${lunch}`,
        detail: "Midday nourishment",
        blockId: "afternoon",
        priority: 6,
        to: "/",
      });
    }

    const dinner = input.meals[`${dayName}-Dinner`];
    if (dinner && !input.isRamadan) {
      blockItemsMap.evening.push({
        id: "meal-dinner",
        category: "meal",
        title: `Dinner: ${dinner}`,
        detail: "Family dinner",
        blockId: "evening",
        priority: currentMinutes >= prayerMap.asr ? 4 : 7,
        to: "/",
      });
    }
  }

  // 7. Habits
  if (input.habits) {
    for (const h of input.habits) {
      const kept = h.days.includes(dateStr);
      const bId = inferBlockForItem({ title: h.name, category: "habit" }, prayerMap);

      blockItemsMap[bId].push({
        id: `habit-${h.id}`,
        category: "habit",
        title: h.name,
        detail: kept ? "Kept today" : "Habit",
        done: kept,
        blockId: bId,
        priority: kept ? 9 : 7,
        to: "/me",
        sourceId: h.id,
      });
    }
  }

  // 8. Wellbeing checkin & water
  if (input.health && input.health[dateStr]) {
    const water = input.health[dateStr]?.water ?? 0;
    if (water < 8) {
      blockItemsMap.afternoon.push({
        id: "wellbeing-water",
        category: "wellbeing",
        title: `Water (${water}/8 glasses)`,
        detail: "Stay hydrated",
        blockId: "afternoon",
        priority: 8,
        to: "/me",
      });
    }
  }

  // Build the 5 RhythmBlock objects
  const blockOrder: RhythmBlockId[] = ["morning", "afternoon", "lateAfternoon", "evening", "night"];
  const currentBlockIndex = blockOrder.indexOf(currentBlockId);

  const blocks: RhythmBlock[] = blockOrder.map((bId, idx) => {
    const def = RHYTHM_BLOCK_DEFINITIONS[bId];
    const timing = blockTiming[bId];
    const isCurrent = bId === currentBlockId;
    const isPast = idx < currentBlockIndex;
    const isUpcoming = idx > currentBlockIndex;

    let progressPct = 0;
    if (isCurrent) {
      let elapsed = 0;
      if (bId === "night") {
        if (currentMinutes >= prayerMap.isha) {
          elapsed = currentMinutes - prayerMap.isha;
        } else {
          elapsed = 1440 - prayerMap.isha + currentMinutes;
        }
      } else {
        elapsed = currentMinutes - timing.startMinutes;
      }
      progressPct = Math.min(100, Math.max(0, Math.round((elapsed / timing.durationMinutes) * 100)));
    } else if (isPast) {
      progressPct = 100;
    }

    // Sort block items by priority, then done status
    const items = [...blockItemsMap[bId]].sort((a, b) => {
      if (Boolean(a.done) !== Boolean(b.done)) {
        return a.done ? 1 : -1;
      }
      return (a.priority ?? 5) - (b.priority ?? 5);
    });

    return {
      id: bId,
      name: def.name,
      arabicName: def.arabicName,
      description: def.description,
      startAnchor: def.startAnchor,
      endAnchor: def.endAnchor,
      startTime: timing.startTime,
      endTime: timing.endTime,
      startMinutes: timing.startMinutes,
      endMinutes: timing.endMinutes,
      durationMinutes: timing.durationMinutes,
      isCurrent,
      isPast,
      isUpcoming,
      progressPct,
      items,
    };
  });

  // Construct the unified prayer-anchored timeline:
  // Fajr -> Morning -> Dhuhr -> Afternoon -> Asr -> LateAfternoon -> Maghrib -> Evening -> Isha -> Night
  const anchorMapById = new Map<PrayerId, PrayerAnchor>(anchors.map((a) => [a.id, a]));
  const blockMapById = new Map<RhythmBlockId, RhythmBlock>(blocks.map((b) => [b.id, b]));

  const timeline: RhythmTimelineSegment[] = [
    { type: "anchor", anchor: anchorMapById.get("fajr")! },
    { type: "block", block: blockMapById.get("morning")! },
    { type: "anchor", anchor: anchorMapById.get("dhuhr")! },
    { type: "block", block: blockMapById.get("afternoon")! },
    { type: "anchor", anchor: anchorMapById.get("asr")! },
    { type: "block", block: blockMapById.get("lateAfternoon")! },
    { type: "anchor", anchor: anchorMapById.get("maghrib")! },
    { type: "block", block: blockMapById.get("evening")! },
    { type: "anchor", anchor: anchorMapById.get("isha")! },
    { type: "block", block: blockMapById.get("night")! },
  ];

  // Compute aggregate statistics
  let totalItems = 0;
  let completedItems = 0;
  for (const blk of blocks) {
    for (const item of blk.items) {
      totalItems++;
      if (item.done) completedItems++;
    }
  }

  const prayersLogged = Object.keys(salahLogForDay).length;
  const onTimePrayers = Object.values(salahLogForDay).filter((s) => s === "ontime").length;

  return {
    date: dateStr,
    currentTime: now,
    currentMinutes,
    currentBlockId,
    currentAnchorId,
    nextAnchor: {
      id: nextAnchorObj.id,
      name: nextAnchorObj.name,
      time: nextAnchorObj.time,
      minutesRemaining: minsUntilNext,
      hours: hoursUntilNext,
      mins: remainingMinsUntilNext,
      isImminent: isNextImminent,
    },
    anchors,
    blocks,
    timeline,
    stats: {
      totalItems,
      completedItems,
      remainingItems: totalItems - completedItems,
      prayersLogged,
      totalPrayers: 5,
      onTimePrayers,
    },
  };
}

/**
 * Adapter that converts a standard DailySurfaceData instance into a DayRhythm representation.
 */
export function buildDayRhythmFromSurfaceData(data: DailySurfaceData): DayRhythm {
  return buildDayRhythm({
    now: data.now,
    date: isoDate(data.now),
    prayers: data.prayers,
    salahLog: data.salahLog,
    tasks: data.tasks,
    events: data.events,
    meals: data.meals,
    grocery: data.grocery,
    habits: data.habits,
    health: data.health,
    checkins: data.checkins,
    hifzItems: data.hifzItems,
    isRamadan: data.isRamadan,
    ramadanDay: data.ramadanDay,
    activeReminders: data.activeReminders,
  });
}
