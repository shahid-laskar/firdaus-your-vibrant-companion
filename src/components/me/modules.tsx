import { useState } from "react";
import { Action, EmptyState, Field, Meter, Section, Tick } from "@/components/veedu/primitives";
import { todayKey, uid, useStore } from "@/lib/store";

const MOODS = [
  { id: "bright", label: "Bright", glyph: "☀" },
  { id: "steady", label: "Steady", glyph: "◐" },
  { id: "tired", label: "Tired", glyph: "☾" },
  { id: "heavy", label: "Heavy", glyph: "☁" },
  { id: "grateful", label: "Grateful", glyph: "✧" },
];

export function SelfCare() {
  const [checkins, setCheckins] = useStore<Record<string, string>>("checkins", {});
  const today = checkins[todayKey()];
  const rituals = [
    "Step outside for a few minutes",
    "Drink a glass of water",
    "Message someone you love",
    "Sit quietly without a screen",
  ];
  const [done, setDone] = useStore<Record<string, string[]>>("rituals", {});
  const todayDone = done[todayKey()] ?? [];

  return (
    <div className="space-y-10">
      <section className="rise">
        <p className="eyebrow">Check in</p>
        <h1 className="display-lg mt-2">How are you, really?</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = today === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setCheckins({ ...checkins, [todayKey()]: m.id })}
                aria-pressed={active}
                className="press flex min-w-[84px] flex-col items-center gap-1.5 rounded-2xl border px-4 py-4"
                style={{
                  borderColor: active ? "var(--space-accent)" : "var(--rule)",
                  background: active ? "var(--space-accent-soft)" : "transparent",
                }}
              >
                <span className="text-xl leading-none">{m.glyph}</span>
                <span className="text-[0.76rem]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Section eyebrow="Small things" title="Today's rituals">
        <ul className="thread">
          {rituals.map((r) => {
            const isDone = todayDone.includes(r);
            return (
              <li key={r} data-done={isDone} className="thread-node flex items-center gap-3 py-2.5">
                <Tick
                  done={isDone}
                  label={r}
                  onToggle={() =>
                    setDone({
                      ...done,
                      [todayKey()]: isDone ? todayDone.filter((x) => x !== r) : [...todayDone, r],
                    })
                  }
                />
                <span className={`text-[0.95rem] ${isDone ? "text-ink-faint line-through" : ""}`}>
                  {r}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

type Habit = { id: string; name: string; days: string[] };

export function Habits() {
  const [habits, setHabits] = useStore<Habit[]>("habits", []);
  const [name, setName] = useState("");
  const week = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  function streak(h: Habit) {
    let s = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (h.days.includes(d.toISOString().slice(0, 10))) s++;
      else break;
    }
    return s;
  }

  return (
    <Section eyebrow="Quietly repeated" title="Habits">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setHabits([...habits, { id: uid(), name: name.trim(), days: [] }]);
          setName("");
        }}
        className="mb-8 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <Field
          label="New habit"
          value={name}
          placeholder="Walk after Maghrib"
          onChange={(e) => setName(e.target.value)}
        />
        <Action type="submit" variant="solid" className="h-[42px]">
          Add
        </Action>
      </form>

      {habits.length === 0 ? (
        <EmptyState
          glyph="❋"
          headline="No habits yet"
          body="Start with one small thing you'd like to repeat. Streaks build themselves."
        />
      ) : (
        <ul className="space-y-7">
          {habits.map((h) => (
            <li key={h.id}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="title-md">{h.name}</p>
                <span className="text-ink-faint numeric text-xs">{streak(h)} day streak</span>
              </div>
              <div className="flex gap-1.5">
                {week.map((d) => {
                  const on = h.days.includes(d);
                  return (
                    <button
                      key={d}
                      aria-label={`${h.name} on ${d}`}
                      aria-pressed={on}
                      onClick={() =>
                        setHabits(
                          habits.map((x) =>
                            x.id === h.id
                              ? { ...x, days: on ? x.days.filter((y) => y !== d) : [...x.days, d] }
                              : x,
                          ),
                        )
                      }
                      className="press numeric h-9 flex-1 rounded-lg border text-[0.66rem]"
                      style={{
                        background: on ? "var(--space-accent)" : "transparent",
                        color: on ? "var(--background)" : "var(--ink-faint)",
                        borderColor: on ? "transparent" : "var(--rule)",
                      }}
                    >
                      {d.slice(8)}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function Journal() {
  const [entries, setEntries] = useStore<Record<string, { mood: string; text: string }>>(
    "journal",
    {},
  );
  const today = entries[todayKey()] ?? { mood: "", text: "" };
  const [saved, setSaved] = useState(false);
  const past = Object.entries(entries)
    .filter(([d]) => d !== todayKey())
    .sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-10">
      <Section eyebrow={new Date().toDateString()} title="Journal">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setEntries({ ...entries, [todayKey()]: { ...today, mood: m.id } })}
              className={`press rounded-full px-3 py-1 text-[0.78rem] ${
                today.mood === m.id ? "bg-space-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {m.glyph} {m.label}
            </button>
          ))}
        </div>
        <textarea
          value={today.text}
          onChange={(e) => {
            setEntries({ ...entries, [todayKey()]: { ...today, text: e.target.value } });
            setSaved(false);
          }}
          rows={10}
          placeholder="Nobody else reads this."
          className="focus:border-space/50 w-full resize-none rounded-2xl border border-transparent bg-[linear-gradient(transparent_calc(2rem_-_1px),var(--rule)_calc(2rem_-_1px))] bg-[size:100%_2rem] p-4 text-[0.98rem] leading-8 outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-ink-faint text-xs">
            {saved ? "Saved for today" : "Kept privately on this device"}
          </span>
          <Action onClick={() => setSaved(true)}>Save</Action>
        </div>
      </Section>

      {past.length > 0 && (
        <Section eyebrow="Earlier" title="Entries">
          <ul className="thread">
            {past.map(([date, entry]) => (
              <li key={date} className="thread-node py-3">
                <p className="text-ink-faint numeric text-xs">{date}</p>
                <p className="text-ink-soft mt-1 line-clamp-2 text-sm">{entry.text || "—"}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function Health() {
  const [metrics, setMetrics] = useStore<
    Record<string, { water: number; weight: string; sleep: string }>
  >("health", {});
  const today = metrics[todayKey()] ?? { water: 0, weight: "", sleep: "" };
  const [workouts, setWorkouts] = useStore<
    { id: string; name: string; detail: string; date: string }[]
  >("workouts", []);
  const [w, setW] = useState({ name: "", detail: "" });

  function set(patch: Partial<typeof today>) {
    setMetrics({ ...metrics, [todayKey()]: { ...today, ...patch } });
  }

  return (
    <div className="space-y-10">
      <Section eyebrow="Today" title="Body">
        <div className="mb-6">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow">Water</span>
            <span className="numeric font-display text-lg">{today.water} / 8</span>
          </div>
          <div className="flex gap-1.5">
            {[...Array(8)].map((_, i) => (
              <button
                key={i}
                aria-label={`${i + 1} glasses`}
                onClick={() => set({ water: today.water === i + 1 ? i : i + 1 })}
                className="press h-10 flex-1 rounded-lg border"
                style={{
                  background: i < today.water ? "var(--space-accent)" : "transparent",
                  borderColor: i < today.water ? "transparent" : "var(--rule)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Weight (kg)"
            inputMode="decimal"
            value={today.weight}
            onChange={(e) => set({ weight: e.target.value })}
          />
          <Field
            label="Sleep (hours)"
            inputMode="decimal"
            value={today.sleep}
            onChange={(e) => set({ sleep: e.target.value })}
          />
        </div>
      </Section>

      <Section eyebrow="Movement" title="Workouts">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!w.name.trim()) return;
            setWorkouts([{ id: uid(), ...w, date: todayKey() }, ...workouts]);
            setW({ name: "", detail: "" });
          }}
          className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field
            label="Exercise"
            value={w.name}
            onChange={(e) => setW({ ...w, name: e.target.value })}
          />
          <Field
            label="Sets / distance"
            value={w.detail}
            onChange={(e) => setW({ ...w, detail: e.target.value })}
          />
          <Action type="submit" variant="solid" className="h-[42px]">
            Log
          </Action>
        </form>
        {workouts.length === 0 ? (
          <EmptyState
            glyph="◇"
            headline="Nothing logged"
            body="Record a walk, a set, a swim — whatever counts as moving today."
          />
        ) : (
          <ul className="thread">
            {workouts.map((x) => (
              <li key={x.id} className="thread-node py-3">
                <p className="text-[0.95rem]">
                  {x.name} <span className="text-ink-faint">{x.detail}</span>
                </p>
                <p className="text-ink-faint numeric text-xs">{x.date}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export function Cycle() {
  const [data, setData] = useStore<{ last: string; length: number }>("cycle", {
    last: "",
    length: 28,
  });
  const next = data.last
    ? new Date(new Date(data.last).getTime() + data.length * 864e5).toISOString().slice(0, 10)
    : "";
  const daysAway = next ? Math.ceil((new Date(next).getTime() - Date.now()) / 864e5) : null;

  return (
    <Section eyebrow="Private" title="Cycle">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Last period started"
          type="date"
          value={data.last}
          onChange={(e) => setData({ ...data, last: e.target.value })}
        />
        <Field
          label="Cycle length (days)"
          inputMode="numeric"
          value={String(data.length)}
          onChange={(e) => setData({ ...data, length: Number(e.target.value) || 28 })}
        />
      </div>
      {next ? (
        <div className="border-border/70 mt-8 border-t pt-6">
          <p className="eyebrow">Next expected</p>
          <p className="display-lg numeric mt-1">{next}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {daysAway !== null && daysAway >= 0
              ? `${daysAway} days away`
              : "Overdue — this is often normal."}
          </p>
          <div className="mt-5">
            <Meter
              value={daysAway !== null ? Math.max(0, 100 - (daysAway / data.length) * 100) : 0}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            glyph="❋"
            headline="Nothing tracked yet"
            body="Add the date your last period started and Sunnah Home will keep the rest quiet and simple."
          />
        </div>
      )}
    </Section>
  );
}
