import { occursOn } from "./recurrence";

export interface ReminderSignal {
  id: string; // unique string for the signal type, e.g. "prayer-fajr"
  category: "prayer" | "custom" | "task" | "habit" | "system";
  priority: "high" | "medium" | "low";
  message: string;
  source: string;
  timestamp: string; // ISO string of when it became relevant
  actionTarget?: string; // route or id to navigate to
  dedupeKey: string; // e.g., "prayer-fajr-2023-10-15" to ensure it fires only once per window
}

export interface NextPrayerContext {
  next: { name: string; time: string };
  hours: number;
  mins: number;
}

export interface CustomReminderContext {
  id: string;
  title: string;
  time: string;
  recur: any;
}

export interface ReminderContext {
  currentTime: Date;
  prefs: { prayers: boolean; reminders: boolean; leadMinutes: number };
  history: Record<string, string>; // dedupeKey -> ISO timestamp fired

  nextPrayer: NextPrayerContext | null;
  customReminders: CustomReminderContext[];
}

export type ReminderRule = (context: ReminderContext) => ReminderSignal[];

/**
 * Core engine evaluator. Takes the context and a list of rules,
 * outputs the deduplicated, prioritized signals that should fire NOW.
 */
export function evaluateReminders(
  context: ReminderContext,
  rules: ReminderRule[],
): ReminderSignal[] {
  const signals: ReminderSignal[] = [];

  for (const rule of rules) {
    try {
      const generated = rule(context);
      if (generated && generated.length > 0) {
        signals.push(...generated);
      }
    } catch (e) {
      // Graceful fallback for faulty rules
      console.error("Reminder rule failed:", e);
    }
  }

  // Filter out those already present in history (deduplication)
  const filtered = signals.filter((sig) => !context.history[sig.dedupeKey]);

  // Priority sort mapping
  const weights = { high: 3, medium: 2, low: 1 };
  filtered.sort((a, b) => weights[b.priority] - weights[a.priority]);

  // Final dedupe by dedupeKey in case a single run produced multiple identical keys
  const seen = new Set<string>();
  const deduplicated: ReminderSignal[] = [];

  for (const sig of filtered) {
    if (!seen.has(sig.dedupeKey)) {
      seen.add(sig.dedupeKey);
      deduplicated.push(sig);
    }
  }

  return deduplicated;
}

// -----------------------------------------------------------------------------
// STANDARD RULES
// -----------------------------------------------------------------------------

export const prayerRule: ReminderRule = (context) => {
  if (!context.prefs.prayers || !context.nextPrayer) return [];

  const { hours, mins, next } = context.nextPrayer;

  // If it's within lead time
  if (hours === 0 && mins <= context.prefs.leadMinutes && mins >= 0) {
    // Construct dedupe key for today + this prayer
    // Using simple local date string for the key
    const yyyy = context.currentTime.getFullYear();
    const mm = String(context.currentTime.getMonth() + 1).padStart(2, "0");
    const dd = String(context.currentTime.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    return [
      {
        id: `prayer-${next.name.toLowerCase()}`,
        category: "prayer",
        priority: "high",
        message: `${next.name} is in ${mins} minute${mins !== 1 ? "s" : ""}`,
        source: "deen",
        timestamp: context.currentTime.toISOString(),
        dedupeKey: `prayer-${next.name.toLowerCase()}-${dateStr}`,
      },
    ];
  }

  return [];
};

export const customReminderRule: ReminderRule = (context) => {
  if (!context.prefs.reminders) return [];

  const signals: ReminderSignal[] = [];
  const yyyy = context.currentTime.getFullYear();
  const mm = String(context.currentTime.getMonth() + 1).padStart(2, "0");
  const dd = String(context.currentTime.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  for (const r of context.customReminders) {
    if (occursOn(r.recur, dateStr)) {
      const curH = context.currentTime.getHours();
      const curM = context.currentTime.getMinutes();

      const parts = r.time.split(":");
      if (parts.length !== 2) continue;

      const rH = parseInt(parts[0] ?? "0", 10);
      const rM = parseInt(parts[1] ?? "0", 10);

      // Is past due?
      const isPast = curH > rH || (curH === rH && curM >= rM);
      // Let's give it a 2-hour window so we don't spam them with yesterday's overdue stuff
      const elapsedMins = curH * 60 + curM - (rH * 60 + rM);
      const isWithinWindow = elapsedMins >= 0 && elapsedMins <= 120;

      if (isPast && isWithinWindow) {
        signals.push({
          id: `custom-${r.id}`,
          category: "custom",
          priority: "medium",
          message: r.title,
          source: "reminders",
          timestamp: context.currentTime.toISOString(),
          dedupeKey: `custom-${r.id}-${dateStr}`,
        });
      }
    }
  }

  return signals;
};

// Expose standard rules array for convenience
export const coreReminderRules: ReminderRule[] = [prayerRule, customReminderRule];
