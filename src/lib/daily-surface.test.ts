import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyThread, type DailySurfaceData } from "./daily-surface";

describe("Daily Operating Surface Engine", () => {
  const baseMockData: DailySurfaceData = {
    now: new Date("2026-08-15T10:00:00"),
    profile: { name: "Ameen", city: "Kozhikode" },
    prayers: [
      { id: "fajr", name: "Fajr", time: "05:00" },
      { id: "dhuhr", name: "Dhuhr", time: "12:30" },
      { id: "asr", name: "Asr", time: "15:45" },
      { id: "maghrib", name: "Maghrib", time: "18:30" },
      { id: "isha", name: "Isha", time: "19:45" },
    ],
    nextPrayer: {
      next: { name: "Dhuhr", time: "12:30" },
      hours: 2,
      mins: 30,
    },
    salahLog: {
      "2026-08-15": { fajr: true },
    },
    hifzItems: [],
    isRamadan: false,
    ramadanDay: null,
    tasks: [
      { id: "t1", title: "Review household list", done: false, time: "11:00" },
    ],
    events: [
      { id: "e1", title: "Family tea", time: "16:00", date: "2026-08-15" },
    ],
    meals: {
      "Sat-Dinner": "Kerala Fish Curry with Matta Rice",
    },
    grocery: [
      { id: "g1", got: false },
      { id: "g2", got: true },
    ],
    habits: [
      { id: "h1", name: "Morning Adhkar", days: ["2026-08-15"] },
      { id: "h2", name: "Evening Adhkar", days: [] },
    ],
    health: {
      "2026-08-15": { water: 4 },
    },
    checkins: {},
    expenses: [
      { id: "ex1", amount: 2500, category: "Groceries", date: "2026-08-10" },
    ],
    limits: { Groceries: 5000 },
    activeReminders: [],
  };

  test("generates calm, prioritized thread with prayer, tasks, and meals", () => {
    const thread = buildDailyThread(baseMockData, "2026-08-15");

    assert.ok(thread.length > 0);
    // Prayer countdown present
    const prayerItem = thread.find((i) => i.id === "prayer-countdown");
    assert.ok(prayerItem);
    assert.equal(prayerItem.label, "Next prayer");
    assert.ok(prayerItem.value.includes("Dhuhr"));

    // Task present
    const taskItem = thread.find((i) => i.id === "task-t1");
    assert.ok(taskItem);
    assert.equal(taskItem.value, "Review household list");

    // Dinner present
    const mealItem = thread.find((i) => i.id === "meal-dinner");
    assert.ok(mealItem);
    assert.equal(mealItem.value, "Kerala Fish Curry with Matta Rice");

    // Grocery present
    const groceryItem = thread.find((i) => i.id === "grocery-remaining");
    assert.ok(groceryItem);
    assert.equal(groceryItem.value, "1 item still to pick up");
  });

  test("surges Ramadan Suhur/Iftar context when Ramadan mode is active", () => {
    const ramadanData: DailySurfaceData = {
      ...baseMockData,
      isRamadan: true,
      ramadanDay: 14,
      now: new Date("2026-03-10T17:45:00"), // 45m before Maghrib
      prayers: [
        { id: "fajr", name: "Fajr", time: "05:00" },
        { id: "maghrib", name: "Maghrib", time: "18:30" },
      ],
    };

    const thread = buildDailyThread(ramadanData, "2026-03-10");
    const ramadanItem = thread.find((i) => i.category === "ramadan");
    assert.ok(ramadanItem);
    assert.equal(ramadanItem.active, true);
    assert.ok(ramadanItem.value.includes("Iftar in 45m"));
  });

  test("injects Hifz revision queue when portions are due", () => {
    const hifzData: DailySurfaceData = {
      ...baseMockData,
      hifzItems: [
        {
          id: "h1",
          surah: "Al-Mulk",
          pct: 100,
          lastRevised: "2026-08-10",
          nextDue: "2026-08-14", // overdue
        },
      ],
    };

    const thread = buildDailyThread(hifzData, "2026-08-15");
    const hifzItem = thread.find((i) => i.id === "hifz-due");
    assert.ok(hifzItem);
    assert.equal(hifzItem.label, "Muraja'ah");
    assert.ok(hifzItem.value.includes("Al-Mulk"));
  });

  test("injects active smart reminders with high priority", () => {
    const reminderData: DailySurfaceData = {
      ...baseMockData,
      activeReminders: [
        {
          id: "rem-1",
          category: "custom",
          priority: "high",
          message: "Medicine after breakfast",
          source: "reminders",
          timestamp: "2026-08-15T10:00:00Z",
          dedupeKey: "rem-1-key",
        },
      ],
    };

    const thread = buildDailyThread(reminderData, "2026-08-15");
    const remItem = thread.find((i) => i.id === "reminder-rem-1");
    assert.ok(remItem);
    assert.equal(remItem.value, "Medicine after breakfast");
    assert.equal(remItem.active, true);
  });

  test("surges budget alert when spending exceeds 80% limit", () => {
    const budgetData: DailySurfaceData = {
      ...baseMockData,
      expenses: [
        { id: "e1", amount: 4500, category: "Groceries", date: "2026-08-12" },
      ],
      limits: { Groceries: 5000 },
    };

    const thread = buildDailyThread(budgetData, "2026-08-15");
    const budgetItem = thread.find((i) => i.id === "budget-alert");
    assert.ok(budgetItem);
    assert.ok(budgetItem.value.includes("90%"));
  });
});
