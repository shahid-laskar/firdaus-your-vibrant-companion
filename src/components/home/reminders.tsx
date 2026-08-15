import { useEffect, useMemo, useState } from "react";
import { Action, EmptyState, Field, Section } from "@/components/veedu/primitives";
import { RecurrenceField, RepeatChip } from "@/components/veedu/recurrence-field";
import { type Recurrence, describeRecurrence, nextOccurrence, occursOn } from "@/lib/recurrence";
import { todayKey, uid, useNow, useStore } from "@/lib/store";
import { useNextPrayer } from "@/components/deen/modules";
import { evaluateReminders, coreReminderRules, type ReminderContext, type ReminderSignal } from "@/lib/reminder-engine";

export type Reminder = { id: string; title: string; time: string; recur: Recurrence };
export type NotifPrefs = { prayers: boolean; reminders: boolean; leadMinutes: number };

export function useNotifPrefs() {
  return useStore<NotifPrefs>("notifPrefs", { prayers: false, reminders: false, leadMinutes: 10 });
}

export function useReminderEngine(): ReminderSignal[] {
  const [reminders] = useStore<Reminder[]>("reminders", []);
  const [prefs] = useNotifPrefs();
  const [history, setHistory] = useStore<Record<string, string>>("reminderHistory", {});
  const countdown = useNextPrayer();
  const now = useNow(30_000);

  const activeReminders = useMemo(() => {
    if (!now) return [];
    if (!prefs.prayers && !prefs.reminders) return [];

    const ctx: ReminderContext = {
      currentTime: now,
      prefs,
      history: {},
      nextPrayer: countdown,
      customReminders: reminders,
    };

    return evaluateReminders(ctx, coreReminderRules);
  }, [now, prefs, countdown, reminders]);

  useEffect(() => {
    if (!now || typeof Notification === "undefined" || Notification.permission !== "granted")
      return;
    if (activeReminders.length === 0) return;

    const unnotified = activeReminders.filter((sig) => !history[sig.dedupeKey]);
    if (unnotified.length === 0) return;

    const newHistory = { ...history };
    for (const sig of unnotified) {
      newHistory[sig.dedupeKey] = sig.timestamp;
      try {
        new Notification("Sunnah Home", {
          body: sig.message,
        });
      } catch (e) {
        console.error("Failed to show notification:", e);
      }
    }
    setHistory(newHistory);
  }, [now, activeReminders, history, setHistory]);

  return activeReminders;
}

/** PROTOTYPE — one reminder system, plus prayer nudges, using the browser's own notifications. */
export function Reminders() {
  const [reminders, setReminders] = useStore<Reminder[]>("reminders", []);
  const [prefs, setPrefs] = useNotifPrefs();
  const [permission, setPermission] = useState<string>("default");
  const [draft, setDraft] = useState<{ title: string; time: string; recur: Recurrence }>({
    title: "",
    time: "08:00",
    recur: { freq: "daily", start: todayKey() },
  });
  const countdown = useNextPrayer();

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  async function enable(kind: "prayers" | "reminders") {
    if (typeof Notification === "undefined") return;
    let state = Notification.permission;
    if (state === "default") state = await Notification.requestPermission();
    setPermission(state);
    if (state === "granted") {
      setPrefs({ ...prefs, [kind]: !prefs[kind] });
      new Notification("Sunnah Home", {
        body: kind === "prayers" ? "Prayer reminders are on." : "Reminders are on.",
      });
    }
  }

  const dueToday = reminders
    .filter((r) => occursOn(r.recur, todayKey()))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-10">
      <Section eyebrow="Gentle nudges" title="Notifications">
        <div className="divide-border/70 divide-y">
          <Toggle
            label="Prayer times"
            detail={
              countdown
                ? `Next: ${countdown.next.name} at ${countdown.next.time} · ${prefs.leadMinutes} min before`
                : "Reminds you shortly before each prayer"
            }
            on={prefs.prayers}
            onToggle={() => enable("prayers")}
          />
          <Toggle
            label="Reminders"
            detail={dueToday.length ? `${dueToday.length} due today` : "Your own repeating nudges"}
            on={prefs.reminders}
            onToggle={() => enable("reminders")}
          />
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="title-md">Lead time</p>
              <p className="text-muted-foreground text-xs">How early the prayer nudge arrives</p>
            </div>
            <div className="flex gap-1.5">
              {[5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => setPrefs({ ...prefs, leadMinutes: m })}
                  className={`press numeric rounded-full px-3 py-1 text-[0.74rem] ${
                    prefs.leadMinutes === m
                      ? "bg-space-soft text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
        {permission === "denied" && (
          <p className="text-ink-faint mt-4 text-xs">
            Notifications are blocked in this browser's settings, so nudges stay inside Sunnah Home.
          </p>
        )}
      </Section>

      <Section eyebrow="Repeating" title="Reminders">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.title.trim()) return;
            setReminders([
              ...reminders,
              { id: uid(), title: draft.title.trim(), time: draft.time, recur: { ...draft.recur } },
            ]);
            setDraft({ title: "", time: "08:00", recur: { freq: "daily", start: todayKey() } });
          }}
          className="border-border/70 mb-7 space-y-4 rounded-2xl border p-4"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <Field
              label="Remind me to"
              value={draft.title}
              placeholder="Give Yusuf his vitamins"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <Field
              label="At"
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            />
          </div>
          <RecurrenceField
            value={draft.recur}
            onChange={(recur) => setDraft({ ...draft, recur })}
            compact
          />
          <div className="flex justify-end">
            <Action type="submit" variant="solid">
              Add reminder
            </Action>
          </div>
        </form>

        {reminders.length === 0 ? (
          <EmptyState
            glyph="◦"
            headline="No reminders"
            body="Set the small repeating things you'd rather not hold in your head."
          />
        ) : (
          <ul className="thread">
            {reminders.map((r) => {
              const next = nextOccurrence(r.recur, todayKey());
              return (
                <li
                  key={r.id}
                  data-active={next === todayKey() ? "true" : undefined}
                  className="thread-node group flex items-baseline justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="eyebrow numeric">{r.time}</p>
                    <p className="mt-0.5 text-[0.98rem]">{r.title}</p>
                    <p className="text-ink-faint mt-0.5 text-xs">
                      {describeRecurrence(r.recur)}
                      {next ? ` · next ${next === todayKey() ? "today" : next}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <RepeatChip recur={r.recur} />
                    <button
                      onClick={() => setReminders(reminders.filter((x) => x.id !== r.id))}
                      className="text-ink-faint hover:text-destructive text-xs opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Toggle({
  label,
  detail,
  on,
  onToggle,
}: {
  label: string;
  detail: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="title-md">{label}</p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className="press relative h-6 w-11 shrink-0 rounded-full border transition-colors"
        style={{
          background: on ? "var(--space-accent)" : "transparent",
          borderColor: on ? "transparent" : "var(--rule)",
        }}
      >
        <span
          className="absolute top-[3px] size-[16px] rounded-full transition-all"
          style={{
            left: on ? "24px" : "4px",
            background: on ? "var(--background)" : "var(--ink-faint)",
          }}
        />
      </button>
    </div>
  );
}
