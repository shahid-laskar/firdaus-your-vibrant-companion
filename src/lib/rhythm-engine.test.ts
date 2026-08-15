import { test } from "node:test";
import assert from "node:assert/strict";
import {
  timeToMinutes,
  minutesToTime,
  formatDuration,
  determineRhythmBlock,
  resolveRelativeAnchorToBlock,
  inferBlockForItem,
  buildDayRhythm,
  buildDayRhythmFromSurfaceData,
  RHYTHM_BLOCK_DEFINITIONS,
  PRAYER_IDS,
  RHYTHM_BLOCK_IDS,
  type PrayerTimeMap,
} from "./rhythm-engine";
import type { DailySurfaceData } from "./daily-surface";

const standardPrayers: PrayerTimeMap = {
  fajr: timeToMinutes("05:15"), // 315
  dhuhr: timeToMinutes("12:30"), // 750
  asr: timeToMinutes("15:45"), // 945
  maghrib: timeToMinutes("18:25"), // 1105
  isha: timeToMinutes("19:45"), // 1185
};

const prayerList = [
  { id: "fajr", name: "Fajr", time: "05:15" },
  { id: "dhuhr", name: "Dhuhr", time: "12:30" },
  { id: "asr", name: "Asr", time: "15:45" },
  { id: "maghrib", name: "Maghrib", time: "18:25" },
  { id: "isha", name: "Isha", time: "19:45" },
];

test("Rhythm Engine — Time Utilities", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("05:15"), 315);
  assert.equal(timeToMinutes("12:30"), 750);
  assert.equal(timeToMinutes("23:59"), 1439);
  assert.equal(timeToMinutes(""), 0);

  assert.equal(minutesToTime(0), "00:00");
  assert.equal(minutesToTime(315), "05:15");
  assert.equal(minutesToTime(750), "12:30");
  assert.equal(minutesToTime(1439), "23:59");
  assert.equal(minutesToTime(1440), "00:00"); // wrap around

  assert.equal(formatDuration(45), "45m");
  assert.equal(formatDuration(120), "2h");
  assert.equal(formatDuration(135), "2h 15m");
});

test("Rhythm Engine — Block Definitions & Coverage", () => {
  assert.equal(PRAYER_IDS.length, 5);
  assert.equal(RHYTHM_BLOCK_IDS.length, 5);

  assert.equal(RHYTHM_BLOCK_DEFINITIONS.morning.startAnchor, "fajr");
  assert.equal(RHYTHM_BLOCK_DEFINITIONS.morning.endAnchor, "dhuhr");

  assert.equal(RHYTHM_BLOCK_DEFINITIONS.afternoon.startAnchor, "dhuhr");
  assert.equal(RHYTHM_BLOCK_DEFINITIONS.afternoon.endAnchor, "asr");

  assert.equal(RHYTHM_BLOCK_DEFINITIONS.lateAfternoon.startAnchor, "asr");
  assert.equal(RHYTHM_BLOCK_DEFINITIONS.lateAfternoon.endAnchor, "maghrib");

  assert.equal(RHYTHM_BLOCK_DEFINITIONS.evening.startAnchor, "maghrib");
  assert.equal(RHYTHM_BLOCK_DEFINITIONS.evening.endAnchor, "isha");

  assert.equal(RHYTHM_BLOCK_DEFINITIONS.night.startAnchor, "isha");
  assert.equal(RHYTHM_BLOCK_DEFINITIONS.night.endAnchor, "fajr");
});

test("Rhythm Engine — Block Resolution Across the 24-Hour Cycle", () => {
  // 1. Pre-Fajr Night phase (00:00 to 05:14)
  assert.equal(determineRhythmBlock("00:00", standardPrayers), "night");
  assert.equal(determineRhythmBlock("03:30", standardPrayers), "night");
  assert.equal(determineRhythmBlock("05:14", standardPrayers), "night");

  // 2. Morning block [Fajr, Dhuhr) (05:15 to 12:29)
  assert.equal(determineRhythmBlock("05:15", standardPrayers), "morning");
  assert.equal(determineRhythmBlock("08:30", standardPrayers), "morning");
  assert.equal(determineRhythmBlock("12:29", standardPrayers), "morning");

  // 3. Afternoon block [Dhuhr, Asr) (12:30 to 15:44)
  assert.equal(determineRhythmBlock("12:30", standardPrayers), "afternoon");
  assert.equal(determineRhythmBlock("14:00", standardPrayers), "afternoon");
  assert.equal(determineRhythmBlock("15:44", standardPrayers), "afternoon");

  // 4. Late Afternoon block [Asr, Maghrib) (15:45 to 18:24)
  assert.equal(determineRhythmBlock("15:45", standardPrayers), "lateAfternoon");
  assert.equal(determineRhythmBlock("17:00", standardPrayers), "lateAfternoon");
  assert.equal(determineRhythmBlock("18:24", standardPrayers), "lateAfternoon");

  // 5. Evening block [Maghrib, Isha) (18:25 to 19:44)
  assert.equal(determineRhythmBlock("18:25", standardPrayers), "evening");
  assert.equal(determineRhythmBlock("19:00", standardPrayers), "evening");
  assert.equal(determineRhythmBlock("19:44", standardPrayers), "evening");

  // 6. Post-Isha Night phase [Isha, 24:00) (19:45 to 23:59)
  assert.equal(determineRhythmBlock("19:45", standardPrayers), "night");
  assert.equal(determineRhythmBlock("21:30", standardPrayers), "night");
  assert.equal(determineRhythmBlock("23:59", standardPrayers), "night");
});

test("Rhythm Engine — Relative Prayer Anchor Resolution", () => {
  assert.equal(resolveRelativeAnchorToBlock("fajr", "after"), "morning");
  assert.equal(resolveRelativeAnchorToBlock("fajr", "before"), "night");
  assert.equal(resolveRelativeAnchorToBlock("dhuhr", "before"), "morning");
  assert.equal(resolveRelativeAnchorToBlock("dhuhr", "after"), "afternoon");
  assert.equal(resolveRelativeAnchorToBlock("asr", "before"), "afternoon");
  assert.equal(resolveRelativeAnchorToBlock("asr", "after"), "lateAfternoon");
  assert.equal(resolveRelativeAnchorToBlock("maghrib", "before"), "lateAfternoon");
  assert.equal(resolveRelativeAnchorToBlock("maghrib", "after"), "evening");
  assert.equal(resolveRelativeAnchorToBlock("isha", "before"), "evening");
  assert.equal(resolveRelativeAnchorToBlock("isha", "after"), "night");
});

test("Rhythm Engine — Smart Item Inference", () => {
  // Explicit relative anchor takes highest precedence
  assert.equal(
    inferBlockForItem(
      {
        title: "Grocery run",
        relativeAnchor: { prayer: "maghrib", relation: "after" },
      },
      standardPrayers
    ),
    "evening"
  );

  // Explicit time
  assert.equal(
    inferBlockForItem({ title: "Doctor appointment", time: "16:30" }, standardPrayers),
    "lateAfternoon"
  );

  // Title heuristics with prayer names
  assert.equal(
    inferBlockForItem({ title: "Walk after Maghrib" }, standardPrayers),
    "evening"
  );
  assert.equal(
    inferBlockForItem({ title: "No phone after Isha" }, standardPrayers),
    "night"
  );
  assert.equal(
    inferBlockForItem({ title: "Morning Duha prayer & Adhkar" }, standardPrayers),
    "morning"
  );
  assert.equal(
    inferBlockForItem({ title: "Qaylulah power nap" }, standardPrayers),
    "afternoon"
  );
  assert.equal(
    inferBlockForItem({ title: "Suhur & Tahajjud" }, standardPrayers),
    "night"
  );

  // Category defaults
  assert.equal(
    inferBlockForItem({ title: "Puttu & Kadala", category: "meal" }, standardPrayers),
    "morning"
  );
  assert.equal(
    inferBlockForItem({ title: "Kozhi curry & rice", category: "meal" }, standardPrayers),
    "morning" // default meal fallback if title doesn't specify lunch/dinner
  );
  assert.equal(
    inferBlockForItem({ title: "Family dinner", category: "meal" }, standardPrayers),
    "evening"
  );
  assert.equal(
    inferBlockForItem({ title: "Surah Al-Mulk revision", category: "hifz" }, standardPrayers),
    "morning"
  );
});

test("Rhythm Engine — DayRhythm Full Build & Temporal Invariants", () => {
  // Test building at 09:30 AM (Morning block)
  const mockNow = new Date("2026-08-15T09:30:00");
  const rhythm = buildDayRhythm({
    now: mockNow,
    date: "2026-08-15",
    prayers: prayerList,
    salahLog: {
      "2026-08-15": { fajr: "ontime" },
    },
    tasks: [
      { id: "t1", title: "Review pull request", time: "10:00", done: false },
      { id: "t2", title: "Pick up dry cleaning", time: "16:00", done: false },
      { id: "t3", title: "Walk after Maghrib", done: false },
    ],
    events: [
      { id: "e1", title: "Staff meeting", date: "2026-08-15", time: "11:00" },
      { id: "e2", title: "Evening Quran study", date: "2026-08-15", time: "19:00" },
    ],
    meals: {
      "Sat-Breakfast": "Thattu dosa",
      "Sat-Dinner": "Grilled fish",
    },
    habits: [
      { id: "h1", name: "Read 10 pages", days: ["2026-08-15"] },
      { id: "h2", name: "No phone after Isha", days: [] },
    ],
  });

  // Current block should be "morning"
  assert.equal(rhythm.currentBlockId, "morning");
  assert.equal(rhythm.currentMinutes, 9 * 60 + 30);

  // Next anchor should be Dhuhr at 12:30
  assert.equal(rhythm.nextAnchor.id, "dhuhr");
  assert.equal(rhythm.nextAnchor.name, "Dhuhr");
  assert.equal(rhythm.nextAnchor.time, "12:30");
  assert.equal(rhythm.nextAnchor.minutesRemaining, 180); // 3h remaining
  assert.equal(rhythm.nextAnchor.hours, 3);
  assert.equal(rhythm.nextAnchor.mins, 0);
  assert.equal(rhythm.nextAnchor.isImminent, false);

  // Anchors: 5 anchors with Salah is temporal anchor principle
  assert.equal(rhythm.anchors.length, 5);
  const fajrAnchor = rhythm.anchors.find((a) => a.id === "fajr")!;
  assert.equal(fajrAnchor.status, "ontime");
  assert.equal(fajrAnchor.isPast, true);

  const dhuhrAnchor = rhythm.anchors.find((a) => a.id === "dhuhr")!;
  assert.equal(dhuhrAnchor.status, "upcoming");
  assert.equal(dhuhrAnchor.isNext, true);

  // Blocks: 5 blocks
  assert.equal(rhythm.blocks.length, 5);

  // Check duration partition invariance: Total minutes of all 5 blocks must equal exactly 1440 min (24 hours)
  const totalDuration = rhythm.blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  assert.equal(totalDuration, 1440, "Sum of all 5 block durations must equal exactly 24 hours (1440 min)");

  // Morning block verification
  const morningBlock = rhythm.blocks.find((b) => b.id === "morning")!;
  assert.equal(morningBlock.isCurrent, true);
  assert.equal(morningBlock.isPast, false);
  assert.equal(morningBlock.isUpcoming, false);
  assert.ok(morningBlock.progressPct > 0 && morningBlock.progressPct < 100);

  // Check items distributed into morning
  const morningTitles = morningBlock.items.map((i) => i.title);
  assert.ok(morningTitles.includes("Review pull request"));
  assert.ok(morningTitles.includes("Staff meeting"));
  assert.ok(morningTitles.includes("Breakfast: Thattu dosa"));

  // Check items in lateAfternoon
  const lateAfternoonBlock = rhythm.blocks.find((b) => b.id === "lateAfternoon")!;
  const lateAfternoonTitles = lateAfternoonBlock.items.map((i) => i.title);
  assert.ok(lateAfternoonTitles.includes("Pick up dry cleaning"));

  // Check items in evening
  const eveningBlock = rhythm.blocks.find((b) => b.id === "evening")!;
  const eveningTitles = eveningBlock.items.map((i) => i.title);
  assert.ok(eveningTitles.includes("Evening Quran study"));
  assert.ok(eveningTitles.includes("Walk after Maghrib"));
  assert.ok(eveningTitles.includes("Dinner: Grilled fish"));

  // Check items in night
  const nightBlock = rhythm.blocks.find((b) => b.id === "night")!;
  const nightTitles = nightBlock.items.map((i) => i.title);
  assert.ok(nightTitles.includes("No phone after Isha"));

  // Timeline: 10 segments alternating Anchor -> Block
  assert.equal(rhythm.timeline.length, 10);
  assert.equal(rhythm.timeline[0]?.type, "anchor");
  assert.equal(rhythm.timeline[1]?.type, "block");
  assert.equal(rhythm.timeline[2]?.type, "anchor");
  assert.equal(rhythm.timeline[3]?.type, "block");
  assert.equal(rhythm.timeline[4]?.type, "anchor");
  assert.equal(rhythm.timeline[5]?.type, "block");
  assert.equal(rhythm.timeline[6]?.type, "anchor");
  assert.equal(rhythm.timeline[7]?.type, "block");
  assert.equal(rhythm.timeline[8]?.type, "anchor");
  assert.equal(rhythm.timeline[9]?.type, "block");

  // Stats verification
  assert.equal(rhythm.stats.totalPrayers, 5);
  assert.equal(rhythm.stats.prayersLogged, 1);
  assert.equal(rhythm.stats.onTimePrayers, 1);
  assert.ok(rhythm.stats.totalItems > 0);
});

test("Rhythm Engine — Ramadan Context Integration", () => {
  const mockNow = new Date("2026-08-15T04:30:00"); // 04:30 AM before Fajr (05:15)
  const rhythm = buildDayRhythm({
    now: mockNow,
    date: "2026-08-15",
    prayers: prayerList,
    isRamadan: true,
    ramadanDay: 14,
  });

  assert.equal(rhythm.currentBlockId, "night");
  assert.equal(rhythm.nextAnchor.id, "fajr");
  assert.equal(rhythm.nextAnchor.minutesRemaining, 45); // 45m to Fajr

  const nightBlock = rhythm.blocks.find((b) => b.id === "night")!;
  const nightItems = nightBlock.items.map((i) => i.title);
  assert.ok(nightItems.some((t) => t.includes("Suhur")));
  assert.ok(nightItems.some((t) => t.includes("Taraweeh")));

  const eveningBlock = rhythm.blocks.find((b) => b.id === "evening")!;
  const eveningItems = eveningBlock.items.map((i) => i.title);
  assert.ok(eveningItems.some((t) => t.includes("Iftar")));
});

test("Rhythm Engine — Adapter with DailySurfaceData", () => {
  const surfaceData: DailySurfaceData = {
    now: new Date("2026-08-15T16:00:00"), // 16:00 (lateAfternoon)
    profile: { name: "Shahid", city: "Kozhikode" },
    prayers: prayerList,
    nextPrayer: { next: { name: "Maghrib", time: "18:25" }, hours: 2, mins: 25 },
    salahLog: { "2026-08-15": { fajr: "ontime", dhuhr: "ontime", asr: "ontime" } },
    hifzItems: [
      {
        id: "h1",
        surah: "Al-Mulk",
        surahNumber: 67,
        range: "1-30",
        pct: 100,
        due: true,
        repetitions: 2,
        intervalDays: 4,
        easeFactor: 2.5,
        lastRevised: "2026-08-10",
      },
    ],
    isRamadan: false,
    ramadanDay: null,
    tasks: [
      { id: "t1", title: "Submit project report", done: false, time: "16:30" },
    ],
    events: [],
    meals: { "Sat-Dinner": "Lentil soup" },
    grocery: [{ id: "g1", name: "Dates", got: false }],
    habits: [{ id: "h1", name: "Walk after Maghrib", days: [] }],
    health: { "2026-08-15": { water: 5 } },
    checkins: { "2026-08-15": "good" },
    expenses: [],
    limits: { Groceries: 5000 },
  };

  const rhythm = buildDayRhythmFromSurfaceData(surfaceData);

  assert.equal(rhythm.currentBlockId, "lateAfternoon");
  assert.equal(rhythm.nextAnchor.id, "maghrib");
  assert.equal(rhythm.stats.prayersLogged, 3);
  assert.equal(rhythm.stats.onTimePrayers, 3);

  // Hifz should be in morning block
  const morningBlock = rhythm.blocks.find((b) => b.id === "morning")!;
  assert.ok(morningBlock.items.some((i) => i.category === "hifz"));

  // Task at 16:30 in lateAfternoon
  const lateBlock = rhythm.blocks.find((b) => b.id === "lateAfternoon")!;
  assert.ok(lateBlock.items.some((i) => i.title === "Submit project report"));
});
