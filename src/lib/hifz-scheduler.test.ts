import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextSchedule,
  generateHifzRevisionQueue,
  generateHifzSignals,
  getRetentionScore,
  normalizeHifzItem,
  recordHifzRevision,
  type HifzItem,
} from "./hifz-scheduler";

describe("Hifz Revision Scheduler", () => {
  test("normalizeHifzItem supports legacy items and populates defaults safely", () => {
    const legacyItem = { id: "legacy-1", surah: "Al-Mulk", pct: 70 };
    const normalized = normalizeHifzItem(legacyItem);

    assert.equal(normalized.id, "legacy-1");
    assert.equal(normalized.surah, "Al-Mulk");
    assert.equal(normalized.surahNumber, 67, "Should resolve Surah 67 for Al-Mulk");
    assert.equal(normalized.pct, 70);
    assert.equal(normalized.intervalDays, 1);
    assert.equal(normalized.repetitions, 0);
    assert.equal(normalized.easeFactor, 2.5);
    assert.equal(normalized.status, "memorizing");
    assert.deepEqual(normalized.revisionHistory, []);

    const masteredLegacy = { id: "legacy-2", surah: "Al-Ikhlas", pct: 100 };
    const masteredNorm = normalizeHifzItem(masteredLegacy);
    assert.equal(masteredNorm.status, "revising");
    assert.equal(masteredNorm.intervalDays, 3);
  });

  test("calculateNextSchedule handles hard rating (reset to 1 day)", () => {
    const item: HifzItem = {
      id: "test-1",
      surah: "Al-Kahf",
      pct: 100,
      intervalDays: 14,
      repetitions: 4,
      easeFactor: 2.5,
    };

    const schedule = calculateNextSchedule(item, "hard", "2026-08-15");
    assert.equal(schedule.intervalDays, 1);
    assert.equal(schedule.repetitions, 0);
    assert.equal(schedule.nextDue, "2026-08-16");
    assert.ok(schedule.easeFactor < 2.5, "EF should decrease on hard rating");
  });

  test("calculateNextSchedule handles good rating (spaced progression)", () => {
    const baseItem: HifzItem = {
      id: "test-2",
      surah: "Al-Mulk",
      pct: 100,
      intervalDays: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    // First repetition -> 1 day
    const r1 = calculateNextSchedule(baseItem, "good", "2026-08-15");
    assert.equal(r1.repetitions, 1);
    assert.equal(r1.intervalDays, 1);
    assert.equal(r1.nextDue, "2026-08-16");

    // Second repetition -> 4 days
    const item2: HifzItem = { ...baseItem, repetitions: 1, intervalDays: 1 };
    const r2 = calculateNextSchedule(item2, "good", "2026-08-15");
    assert.equal(r2.repetitions, 2);
    assert.equal(r2.intervalDays, 4);
    assert.equal(r2.nextDue, "2026-08-19");

    // Third repetition -> 4 * 2.5 = 10 days
    const item3: HifzItem = { ...baseItem, repetitions: 2, intervalDays: 4 };
    const r3 = calculateNextSchedule(item3, "good", "2026-08-15");
    assert.equal(r3.repetitions, 3);
    assert.equal(r3.intervalDays, 10);
    assert.equal(r3.nextDue, "2026-08-25");
  });

  test("calculateNextSchedule handles strong rating (accelerated intervals)", () => {
    const baseItem: HifzItem = {
      id: "test-3",
      surah: "Ya-Sin",
      pct: 100,
      intervalDays: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    // First rep on strong -> 2 days
    const r1 = calculateNextSchedule(baseItem, "strong", "2026-08-15");
    assert.equal(r1.repetitions, 1);
    assert.equal(r1.intervalDays, 2);
    assert.equal(r1.nextDue, "2026-08-17");
    assert.ok(r1.easeFactor >= 2.5);

    // Second rep on strong -> 6 days
    const item2: HifzItem = { ...baseItem, repetitions: 1, intervalDays: 2 };
    const r2 = calculateNextSchedule(item2, "strong", "2026-08-15");
    assert.equal(r2.repetitions, 2);
    assert.equal(r2.intervalDays, 6);
    assert.equal(r2.nextDue, "2026-08-21");
  });

  test("getRetentionScore calculates decay and due status accurately", () => {
    const freshItem: HifzItem = {
      id: "test-4",
      surah: "Ar-Rahman",
      pct: 100,
      lastRevised: "2026-08-15",
      nextDue: "2026-08-20",
      intervalDays: 5,
    };

    const freshScore = getRetentionScore(freshItem, "2026-08-15");
    assert.equal(freshScore.retentionPct, 100);
    assert.equal(freshScore.isDue, false);
    assert.equal(freshScore.status, "fresh");

    // After 5 days (on due date)
    const dueScore = getRetentionScore(freshItem, "2026-08-20");
    assert.equal(dueScore.isDue, true);
    assert.equal(dueScore.status, "due");
    assert.ok(dueScore.retentionPct < 100);

    // Overdue by 4 days
    const overdueScore = getRetentionScore(freshItem, "2026-08-24");
    assert.equal(overdueScore.isDue, true);
    assert.equal(overdueScore.daysOverdue, 4);
    assert.ok(overdueScore.retentionPct < dueScore.retentionPct);
  });

  test("generateHifzRevisionQueue partitions items into due, upcoming, and completed", () => {
    const items: HifzItem[] = [
      {
        id: "1",
        surah: "Al-Mulk",
        pct: 100,
        lastRevised: "2026-08-10",
        nextDue: "2026-08-14", // overdue
        intervalDays: 4,
      },
      {
        id: "2",
        surah: "Al-Waqi'ah",
        pct: 100,
        lastRevised: "2026-08-15", // revised today
        nextDue: "2026-08-21",
        intervalDays: 6,
      },
      {
        id: "3",
        surah: "Ya-Sin",
        pct: 50,
        lastRevised: "2026-08-14",
        nextDue: "2026-08-17", // upcoming
        intervalDays: 3,
      },
    ];

    const queue = generateHifzRevisionQueue(items, "2026-08-15");
    assert.equal(queue.dueToday.length, 1);
    assert.equal(queue.dueToday[0]?.id, "1");

    assert.equal(queue.completedToday.length, 1);
    assert.equal(queue.completedToday[0]?.id, "2");

    assert.equal(queue.upcoming.length, 1);
    assert.equal(queue.upcoming[0]?.id, "3");

    assert.equal(queue.summary.totalPortions, 3);
    assert.equal(queue.summary.masteredCount, 2);
    assert.equal(queue.summary.inProgressCount, 1);
    assert.equal(queue.summary.dueCount, 1);
    assert.ok(queue.summary.averageRetention > 0);
  });

  test("recordHifzRevision appends log and updates item scheduling immutably", () => {
    const items: HifzItem[] = [
      {
        id: "item-10",
        surah: "Al-Kahf",
        pct: 100,
        intervalDays: 2,
        repetitions: 1,
        easeFactor: 2.5,
      },
    ];

    const updated = recordHifzRevision(items, "item-10", "strong", "Fluently recited", "2026-08-15");

    assert.equal(updated.length, 1);
    const item = updated[0]!;
    assert.equal(item.lastRevised, "2026-08-15");
    assert.equal(item.repetitions, 2);
    assert.equal(item.intervalDays, 6);
    assert.equal(item.nextDue, "2026-08-21");
    assert.equal(item.revisionHistory?.length, 1);
    assert.equal(item.revisionHistory?.[0]?.rating, "strong");
    assert.equal(item.revisionHistory?.[0]?.notes, "Fluently recited");

    // Original array remains untouched
    assert.equal(items[0]?.repetitions, 1);
  });

  test("generateHifzSignals generates operational signal when revisions are due", () => {
    const items: HifzItem[] = [
      {
        id: "1",
        surah: "Al-Mulk",
        pct: 100,
        nextDue: "2026-08-15",
      },
    ];

    const signals = generateHifzSignals(items, "2026-08-15");
    assert.equal(signals.length, 1);
    assert.equal(signals[0]?.category, "deen");
    assert.ok(signals[0]?.reason.includes("Al-Mulk"));
    assert.equal(signals[0]?.action?.href, "/deen?tab=hifz");
  });
});
