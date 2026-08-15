import { useMemo, useState } from "react";
import { Action, Field, Section } from "@/components/veedu/primitives";
import { RecurrenceField, RepeatChip } from "@/components/veedu/recurrence-field";
import { hijriLabel, islamicMarker, hijriParts } from "@/lib/hijri";
import { type Recurrence, occursOn } from "@/lib/recurrence";
import { todayKey, uid, useStore } from "@/lib/store";

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  time?: string | undefined;
  recur?: Recurrence | undefined;
  assigneeId?: string;
};

type Task = {
  id: string;
  title: string;
  list: string;
  time?: string;
  done: boolean;
  date: string;
  recur?: Recurrence;
  completions?: string[];
  assigneeId?: string;
};

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isoOf = (d: Date) => {
  const c = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return c.toISOString().slice(0, 10);
};

export function eventsOn(events: CalEvent[], iso: string) {
  return events
    .filter((e) => e.date === iso || occursOn(e.recur, iso))
    .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
}

export function tasksOn(tasks: Task[], iso: string) {
  return tasks.filter((t) => (t.date === iso && !t.recur) || occursOn(t.recur, iso));
}

/** PROTOTYPE — one visual calendar carrying events, tasks, meals, fasting and Hijri dates. */
export function UnifiedCalendar() {
  const [events, setEvents] = useStore<CalEvent[]>("events", []);
  const [tasks] = useStore<Task[]>("tasks", []);
  const [meals] = useStore<Record<string, string>>("meals", {});
  const [fasting] = useStore<Record<string, string>>("fasting", {});
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState(todayKey());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    date: string;
    time: string;
    recur: Recurrence;
  }>({
    title: "",
    date: todayKey(),
    time: "",
    recur: { freq: "none", start: todayKey() },
  });

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days: (string | null)[] = Array.from({ length: offset }, () => null);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i++)
      days.push(isoOf(new Date(cursor.getFullYear(), cursor.getMonth(), i)));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  const selDate = new Date(`${selected}T00:00:00`);
  const selEvents = eventsOn(events, selected);
  const selTasks = tasksOn(tasks, selected);
  const selMeal = meals[`${DAY_KEYS[selDate.getDay()]}-Dinner`];
  const marker = islamicMarker(selDate);

  return (
    <div className="space-y-10">
      <Section
        eyebrow="Everything, one month at a time"
        title={cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        aside={
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="press text-ink-soft hover:text-foreground grid size-8 place-items-center rounded-full"
            >
              ‹
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(todayKey());
              }}
              className="text-ink-faint hover:text-foreground px-1 text-xs"
            >
              Today
            </button>
            <button
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="press text-ink-soft hover:text-foreground grid size-8 place-items-center rounded-full"
            >
              ›
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1">
          {WEEK.map((w) => (
            <div key={w} className="eyebrow pb-1 text-center">
              {w.slice(0, 1)}
            </div>
          ))}
          {grid.map((iso, i) => {
            if (!iso) return <div key={`x${i}`} />;
            const dayEvents = eventsOn(events, iso);
            const dayTasks = tasksOn(tasks, iso);
            const d = new Date(`${iso}T00:00:00`);
            const hasMeal = !!meals[`${DAY_KEYS[d.getDay()]}-Dinner`];
            const fasted = !!fasting[iso];
            const isSel = iso === selected;
            const isToday = iso === todayKey();
            const hp = hijriParts(d);
            const imarker = islamicMarker(d);
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className="press relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-[0.72rem] transition-colors"
                style={{
                  borderColor: isSel
                    ? "var(--space-accent)"
                    : isToday
                      ? "var(--rule)"
                      : "transparent",
                  background: isSel ? "var(--space-accent-soft)" : "transparent",
                }}
              >
                {hp && (
                  <span
                    className="absolute top-1.5 right-1.5 text-[0.55rem] leading-none"
                    style={{
                      color: imarker ? "var(--clay)" : "var(--ink-faint)",
                      opacity: imarker ? 1 : 0.5,
                    }}
                  >
                    {hp.day}
                  </span>
                )}
                <span
                  className={`numeric mt-1 ${isToday ? "text-foreground font-semibold" : "text-ink-soft"}`}
                >
                  {iso.slice(8)}
                </span>
                <span className="flex h-1.5 items-center gap-[3px]">
                  {imarker && (
                    <i className="size-[5px] rounded-full" style={{ background: "var(--clay)" }} />
                  )}
                  {dayEvents.length > 0 && (
                    <i
                      className="size-[5px] rounded-full"
                      style={{ background: "var(--space-accent)" }}
                    />
                  )}
                  {dayTasks.length > 0 && (
                    <i className="size-[5px] rounded-full" style={{ background: "var(--brass)" }} />
                  )}
                  {fasted && (
                    <i className="size-[5px] rounded-full" style={{ background: "var(--leaf)" }} />
                  )}
                  {hasMeal && !dayEvents.length && !dayTasks.length && !fasted && !imarker && (
                    <i className="bg-rule size-[5px] rounded-full" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-ink-faint mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.68rem]">
          <Legend color="var(--space-accent)" label="Events" />
          <Legend color="var(--brass)" label="Tasks due" />
          <Legend color="var(--leaf)" label="Fasting" />
          <Legend color="var(--rule)" label="Meal planned" />
          <Legend color="var(--clay)" label="Islamic Event" />
        </div>
      </Section>

      <Section
        eyebrow={hijriLabel(selDate) || selected}
        title={selDate.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        aside={
          <Action
            variant={adding ? "quiet" : "solid"}
            onClick={() => {
              setDraft({
                title: "",
                date: selected,
                time: "",
                recur: { freq: "none", start: selected },
              });
              setAdding(!adding);
            }}
          >
            {adding ? "Cancel" : "Add event"}
          </Action>
        }
      >
        {marker && (
          <p className="border-space/50 text-ink-soft mb-5 border-l-2 pl-4 text-sm italic">
            {marker}
          </p>
        )}

        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.title.trim()) return;
              setEvents([
                ...events,
                {
                  id: uid(),
                  title: draft.title.trim(),
                  date: draft.date,
                  time: draft.time || undefined,
                  recur:
                    draft.recur.freq === "none" ? undefined : { ...draft.recur, start: draft.date },
                },
              ]);
              setAdding(false);
            }}
            className="border-border/70 mb-7 space-y-4 rounded-2xl border p-4"
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_140px_110px]">
              <Field
                label="Event"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Field
                label="Date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
              <Field
                label="Time"
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
                Save event
              </Action>
            </div>
          </form>
        )}

        <div className="thread">
          {selEvents.length === 0 && selTasks.length === 0 && !selMeal && (
            <p className="text-muted-foreground py-3 text-sm">Nothing on this day.</p>
          )}
          {selEvents.map((e) => (
            <div
              key={e.id}
              className="thread-node group flex items-baseline justify-between gap-3 py-3"
              data-active="true"
            >
              <div className="min-w-0">
                <p className="eyebrow">{e.time ? e.time : "All day"}</p>
                <p className="mt-0.5 text-[0.98rem]">{e.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RepeatChip recur={e.recur} />
                <button
                  onClick={() => setEvents(events.filter((x) => x.id !== e.id))}
                  className="text-ink-faint hover:text-destructive text-xs opacity-0 group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {selTasks.map((t) => (
            <div key={t.id} className="thread-node py-3">
              <p className="eyebrow">Task · {t.list}</p>
              <p className="mt-0.5 text-[0.98rem]">{t.title}</p>
            </div>
          ))}
          {selMeal && (
            <div className="thread-node py-3">
              <p className="eyebrow">Dinner</p>
              <p className="mt-0.5 text-[0.98rem]">{selMeal}</p>
            </div>
          )}
          {fasting[selected] && (
            <div className="thread-node py-3">
              <p className="eyebrow">Fasting</p>
              <p className="mt-0.5 text-[0.98rem] capitalize">{fasting[selected]}</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className="size-[5px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
