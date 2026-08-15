/**
 * PROTOTYPE — shared recurrence capability.
 *
 * One model, reused by tasks, calendar events, kid chores and reminders so the
 * interaction stays identical everywhere: does it repeat, how often, from when,
 * until when.
 */

export type Freq = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export type Recurrence = {
  freq: Freq;
  start: string;
  until?: string | undefined;
};

export const FREQ_LABELS: Record<Freq, string> = {
  none: "Doesn't repeat",
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Every week",
  monthly: "Every month",
};

export function isRepeating(r?: Recurrence | undefined): boolean {
  return !!r && r.freq !== "none";
}

function day(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

/** Does a repeating thing land on this calendar day? */
export function occursOn(r: Recurrence | undefined, iso: string): boolean {
  if (!isRepeating(r)) return false;
  const rec = r as Recurrence;
  if (iso < rec.start) return false;
  if (rec.until && iso > rec.until) return false;
  const d = day(iso);
  const s = day(rec.start);
  const dow = d.getDay();
  switch (rec.freq) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekly":
      return dow === s.getDay();
    case "monthly":
      return d.getDate() === s.getDate();
    default:
      return false;
  }
}

/** Next day (inclusive of `fromIso`) this thing occurs, within a year. */
export function nextOccurrence(r: Recurrence | undefined, fromIso: string): string | null {
  if (!isRepeating(r)) return null;
  const from = day(fromIso);
  for (let i = 0; i < 400; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (occursOn(r, iso)) return iso;
  }
  return null;
}

export function describeRecurrence(r?: Recurrence | undefined): string {
  if (!isRepeating(r)) return "";
  const rec = r as Recurrence;
  const base = FREQ_LABELS[rec.freq];
  if (rec.freq === "weekly") {
    const dow = day(rec.start).toLocaleDateString(undefined, { weekday: "long" });
    return `Every ${dow}`;
  }
  if (rec.freq === "monthly") {
    return `Monthly on day ${day(rec.start).getDate()}`;
  }
  return rec.until ? `${base} · until ${rec.until}` : base;
}
