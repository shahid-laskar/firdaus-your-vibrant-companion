/**
 * PROTOTYPE ONLY — realistic sample data + data export.
 *
 * This file exists so the proposed features can be evaluated against a life
 * that already has history in it. It never overwrites keys that already hold
 * data, and it runs once (flagged in localStorage).
 */

import { readStore, todayKey, uid, writeStore } from "./store";
import type { Recurrence } from "./recurrence";

const SEED_FLAG = "prototype-seed-v2";

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const monthISO = (offsetMonths: number, dayOfMonth: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  d.setDate(dayOfMonth);
  return d.toISOString().slice(0, 10);
};

const rec = (freq: Recurrence["freq"], startOffset = -14): Recurrence => ({
  freq,
  start: iso(startOffset),
});

export const PROTOTYPE_KEYS = [
  "profile",
  "tasks",
  "grocery",
  "recipes",
  "meals",
  "mealHistory",
  "events",
  "kids",
  "deeds",
  "notesList",
  "habits",
  "health",
  "workouts",
  "expenses",
  "limits",
  "salah",
  "fasting",
  "checkins",
  "rituals",
  "journal",
  "reminders",
  "notifPrefs",
] as const;

function seedKey<T>(key: string, value: T) {
  const existing = readStore<T | null>(key, null);
  const empty =
    existing === null ||
    (Array.isArray(existing) && existing.length === 0) ||
    (typeof existing === "object" &&
      !Array.isArray(existing) &&
      Object.keys(existing as object).length === 0) ||
    existing === "";
  if (empty) writeStore(key, value);
}

export function seedPrototypeData(force = false) {
  if (typeof window === "undefined") return;
  if (!force && readStore(SEED_FLAG, false)) return;
  writeStore(SEED_FLAG, true);

  seedKey("profile", {
    name: "Shahid",
    city: "Kozhikode",
    gender: "male",
    lat: 11.2588,
    lng: 75.7804,
    madhab: "shafi",
    method: "MuslimWorldLeague",
  });

  seedKey("tasks", [
    {
      id: uid(),
      title: "Pay the electricity bill",
      list: "Home",
      time: "17:00",
      done: false,
      date: todayKey(),
    },
    { id: uid(), title: "Call Umma", list: "General", done: false, date: todayKey() },
    {
      id: uid(),
      title: "Take out the bins",
      list: "Home",
      done: false,
      date: todayKey(),
      recur: rec("daily", -30),
      completions: [iso(-1), iso(-2)],
    },
    {
      id: uid(),
      title: "Water the plants",
      list: "Home",
      done: false,
      date: todayKey(),
      recur: rec("weekly", -21),
      completions: [iso(-7)],
    },
    {
      id: uid(),
      title: "Review the month's spending",
      list: "General",
      done: false,
      date: iso(2),
      recur: rec("monthly", -60),
      completions: [],
    },
    { id: uid(), title: "Book the car service", list: "General", done: true, date: iso(-1) },
    { id: uid(), title: "Send Fatima's school form", list: "Work", done: true, date: iso(-2) },
  ]);

  seedKey("recipes", [
    {
      id: uid(),
      name: "Kozhi curry",
      items: "chicken, onions, coconut milk, curry leaves, ginger",
    },
    { id: uid(), name: "Thattu dosa", items: "dosa batter, ghee, coconut chutney" },
    { id: uid(), name: "Beef fry", items: "beef, shallots, black pepper, coconut slices" },
    { id: uid(), name: "Lentil soup", items: "red lentils, tomatoes, cumin, lemon" },
  ]);

  seedKey("meals", {
    "Mon-Breakfast": "Thattu dosa",
    "Mon-Dinner": "Kozhi curry",
    "Tue-Breakfast": "Oats & dates",
    "Tue-Dinner": "Lentil soup",
    "Wed-Dinner": "Beef fry",
    "Thu-Breakfast": "Thattu dosa",
    "Thu-Dinner": "Kozhi curry",
    "Fri-Lunch": "Biryani",
    "Fri-Dinner": "Lentil soup",
    "Sat-Dinner": "Grilled fish",
    "Sun-Breakfast": "Puttu & kadala",
    "Sun-Dinner": "Beef fry",
  });

  seedKey("grocery", [
    { id: uid(), name: "chicken", got: true },
    { id: uid(), name: "coconut milk", got: true },
    { id: uid(), name: "red lentils", got: false },
    { id: uid(), name: "shallots", got: false },
    { id: uid(), name: "dates", got: false },
  ]);

  seedKey("events", [
    { id: uid(), title: "Fatima's parent meeting", date: todayKey(), time: "16:30" },
    {
      id: uid(),
      title: "Maghrib walk with Ammu",
      date: todayKey(),
      time: "18:45",
      recur: rec("daily", -10),
    },
    {
      id: uid(),
      title: "Jumu'ah at Palayam",
      date: iso((5 - new Date().getDay() + 7) % 7 || 7),
      time: "12:45",
      recur: rec("weekly", -7),
    },
    { id: uid(), title: "Ummi's birthday", date: iso(4) },
    { id: uid(), title: "Dentist — Yusuf", date: iso(6), time: "10:15" },
    { id: uid(), title: "Rent due", date: iso(9), recur: rec("monthly", -35) },
  ]);

  seedKey("kids", [
    {
      id: uid(),
      name: "Fatima",
      age: "9",
      chores: [
        {
          id: uid(),
          title: "Make the bed",
          done: false,
          recur: rec("daily", -30),
          completions: [iso(-1), iso(-2), iso(-3)],
        },
        {
          id: uid(),
          title: "Quran — 10 minutes",
          done: false,
          recur: rec("daily", -30),
          completions: [iso(-1), iso(-3)],
        },
        {
          id: uid(),
          title: "Tidy the study table",
          done: false,
          recur: rec("weekly", -28),
          completions: [iso(-7)],
        },
      ],
    },
    {
      id: uid(),
      name: "Yusuf",
      age: "6",
      chores: [
        {
          id: uid(),
          title: "Put away toys",
          done: false,
          recur: rec("daily", -20),
          completions: [iso(-1)],
        },
        {
          id: uid(),
          title: "Feed the fish",
          done: false,
          recur: rec("daily", -20),
          completions: [iso(-1), iso(-2)],
        },
      ],
    },
  ]);

  seedKey("deeds", [
    {
      id: uid(),
      who: "Fatima",
      what: "Shared her snack with Yusuf without being asked",
      date: iso(-1),
    },
    { id: uid(), who: "Yusuf", what: "Helped carry the grocery bags in", date: iso(-3) },
  ]);

  seedKey("notesList", [
    {
      id: uid(),
      title: "Wifi & gate codes",
      body: "Wifi: Sunnah Home-home / 8·4·2·2·1\nGate: 4417\nWater filter service: Rafeeq 98••••21",
      updated: iso(-9),
      pinned: true,
    },
    {
      id: uid(),
      title: "Ramadan prep",
      body: "— Sort iftar plan for the first week\n— Dates + laban from the wholesale shop\n— Fix taraweeh timing with the kids' sleep",
      updated: iso(-2),
      pinned: false,
    },
    {
      id: uid(),
      title: "Books to read",
      body: "Purification of the Heart\nThe Sealed Nectar (finish ch. 4)",
      updated: iso(-5),
      pinned: false,
    },
  ]);

  const habitDays = (hits: number[]) => hits.map((h) => iso(-h));
  seedKey("habits", [
    { id: uid(), name: "Walk after Maghrib", days: habitDays([1, 2, 3, 5, 6, 8, 9]) },
    { id: uid(), name: "Read 10 pages", days: habitDays([1, 3, 4, 7]) },
    { id: uid(), name: "No phone after Isha", days: habitDays([2, 4, 5, 9]) },
  ]);

  const health: Record<string, { water: number; weight: string; sleep: string }> = {};
  for (let i = 13; i >= 0; i--) {
    health[iso(-i)] = {
      water: 4 + ((i * 3) % 5),
      weight: (74.5 - i * 0.05).toFixed(1),
      sleep: (6 + (i % 4) * 0.5).toFixed(1),
    };
  }
  seedKey("health", health);

  seedKey("workouts", [
    { id: uid(), name: "Evening walk", detail: "3.4 km", date: iso(-1) },
    { id: uid(), name: "Push-ups", detail: "3 × 15", date: iso(-2) },
  ]);

  const expenses: { id: string; amount: number; category: string; note: string; date: string }[] =
    [];
  const catalogue: [string, number, string][] = [
    ["Groceries", 2400, "Weekly shop"],
    ["Groceries", 860, "Vegetables"],
    ["Transport", 700, "Fuel"],
    ["Home", 1800, "Electricity"],
    ["Health", 550, "Pharmacy"],
    ["Giving", 1000, "Sadaqah"],
    ["Other", 420, "Kids' books"],
  ];
  for (let m = 5; m >= 0; m--) {
    catalogue.forEach(([category, base, note], idx) => {
      const drift = 1 + ((m + idx) % 4) * 0.08;
      expenses.push({
        id: uid(),
        amount: Math.round(base * drift),
        category: category as string,
        note: note as string,
        date: monthISO(-m, 3 + idx * 3),
      });
    });
  }
  seedKey("expenses", expenses);
  seedKey("limits", { Groceries: 8000, Transport: 3000, Home: 5000, Giving: 1500 });

  const salah: Record<string, Record<string, "ontime" | "late">> = {};
  const names = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  for (let i = 13; i >= 1; i--) {
    const day: Record<string, "ontime" | "late"> = {};
    names.forEach((n, idx) => {
      if ((i + idx) % 7 === 0) return;
      day[n] = (i + idx) % 5 === 0 ? "late" : "ontime";
    });
    salah[iso(-i)] = day;
  }
  salah[todayKey()] = { fajr: "ontime", dhuhr: "ontime" };
  seedKey("salah", salah);

  seedKey("fasting", { [iso(-4)]: "voluntary", [iso(-11)]: "voluntary" });

  const checkins: Record<string, string> = {};
  const moods = ["steady", "bright", "tired", "grateful", "steady", "heavy", "steady"];
  for (let i = 6; i >= 0; i--) checkins[iso(-i)] = moods[i] as string;
  seedKey("checkins", checkins);

  seedKey("rituals", { [iso(-1)]: ["Drink a glass of water", "Sit quietly without a screen"] });

  seedKey("journal", {
    [iso(-1)]: { mood: "grateful", text: "Long day, but the walk after Maghrib fixed most of it." },
    [iso(-4)]: { mood: "tired", text: "Work ran late. Missed Isha at the masjid." },
  });

  seedKey("reminders", [
    { id: uid(), title: "Give Yusuf his vitamins", time: "20:00", recur: rec("daily", -14) },
    {
      id: uid(),
      title: "Surah Al-Kahf",
      time: "07:00",
      recur: rec("weekly", ((5 - new Date().getDay() + 7) % 7) - 7),
    },
  ]);

  seedKey("notifPrefs", { prayers: true, reminders: true, leadMinutes: 10 });
}

/** PROTOTYPE — export everything Sunnah Home holds for this person. */
export function exportAllData() {
  const payload: Record<string, unknown> = {};
  PROTOTYPE_KEYS.forEach((k) => {
    const v = readStore<unknown>(k, null);
    if (v !== null) payload[k] = v;
  });
  const blob = new Blob(
    [
      JSON.stringify(
        { app: "Sunnah Home", exportedAt: new Date().toISOString(), data: payload },
        null,
        2,
      ),
    ],
    {
      type: "application/json",
    },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Sunnah Home-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
