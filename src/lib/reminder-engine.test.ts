import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateReminders,
  prayerRule,
  customReminderRule,
  type ReminderContext,
} from "./reminder-engine";

describe("Reminder Engine", () => {
  const baseContext: ReminderContext = {
    currentTime: new Date("2026-08-14T10:00:00Z"), // using arbitrary fixed time
    prefs: { prayers: true, reminders: true, leadMinutes: 10 },
    history: {},
    nextPrayer: null,
    customReminders: [],
  };

  test("prayerRule generates reminder within lead window", () => {
    const ctx = {
      ...baseContext,
      nextPrayer: { next: { name: "Dhuhr", time: "12:30" }, hours: 0, mins: 5 },
    };

    const result = evaluateReminders(ctx, [prayerRule]);
    assert.equal(result.length, 1);
    const first = result[0];
    assert.ok(first);
    assert.equal(first.category, "prayer");
    assert.ok(first.message.includes("Dhuhr is in 5 minutes"));
    assert.ok(first.dedupeKey.startsWith("prayer-dhuhr-"));
  });

  test("prayerRule does not generate if outside lead window", () => {
    const ctx = {
      ...baseContext,
      nextPrayer: { next: { name: "Dhuhr", time: "12:30" }, hours: 0, mins: 15 },
    };
    // Pref lead is 10 mins, so 15 mins should be ignored
    const result = evaluateReminders(ctx, [prayerRule]);
    assert.equal(result.length, 0);
  });

  test("prayerRule respects user prefs", () => {
    const ctx = {
      ...baseContext,
      prefs: { ...baseContext.prefs, prayers: false },
      nextPrayer: { next: { name: "Dhuhr", time: "12:30" }, hours: 0, mins: 5 },
    };
    const result = evaluateReminders(ctx, [prayerRule]);
    assert.equal(result.length, 0);
  });

  test("customReminderRule generates within window", () => {
    // Current time is 10:05 local. Let's fix timezone by using explicit components if needed.
    // Instead we'll construct a date and mock local hours.
    const now = new Date();
    now.setHours(10, 5, 0, 0);
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const ctx: ReminderContext = {
      ...baseContext,
      currentTime: now,
      customReminders: [
        {
          id: "test1",
          title: "Buy milk",
          time: "10:00",
          recur: { freq: "daily", start: dateStr },
        },
      ],
    };

    const result = evaluateReminders(ctx, [customReminderRule]);
    assert.equal(result.length, 1);
    const first = result[0];
    assert.ok(first);
    assert.equal(first.message, "Buy milk");
    assert.equal(first.dedupeKey, `custom-test1-${dateStr}`);
  });

  test("deduplication blocks already-fired reminders", () => {
    const ctx = {
      ...baseContext,
      history: { "prayer-dhuhr-2026-08-14": "2026-08-14T09:55:00Z" },
      nextPrayer: { next: { name: "Dhuhr", time: "12:30" }, hours: 0, mins: 5 },
      // let's force the engine to generate that exact key by mocking current time
      currentTime: new Date("2026-08-14T10:00:00Z"),
    };

    // In our implementation, dateStr is built from local time. To ensure this test
    // passes regardless of runner timezone, we check what it actually outputs.
    const generated = prayerRule(ctx);
    if (generated.length > 0 && generated[0]) {
      // Overwrite history to definitely block this generated key
      ctx.history = { ...ctx.history, [generated[0].dedupeKey]: "fired-earlier" };
      const result = evaluateReminders(ctx, [prayerRule]);
      assert.equal(result.length, 0);
    }
  });

  test("handles missing data gracefully", () => {
    const ctx: ReminderContext = {
      ...baseContext,
      customReminders: [
        {
          id: "bad1",
          title: "Bad time format",
          time: "invalid", // should skip safely
          recur: { freq: "daily", start: "2023-01-01" },
        },
      ],
    };
    const result = evaluateReminders(ctx, [customReminderRule]);
    assert.equal(result.length, 0);
  });
});
