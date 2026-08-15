import { useEffect, useMemo, useState } from "react";
import { Action, EmptyState, Field, Meter, Section, Tick } from "@/components/veedu/primitives";
import { useLogGroceryRun } from "@/components/budget/history";
import { RecurrenceField, RepeatChip } from "@/components/veedu/recurrence-field";
import { type Recurrence, isRepeating, nextOccurrence, occursOn } from "@/lib/recurrence";
import { todayKey, uid, useStore } from "@/lib/store";
import { type FamilyMember, type Chore } from "@/lib/family-model";
import { rankRecipes } from "@/lib/meal-intelligence";

export type Task = {
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
const LISTS = ["General", "Shopping", "Work", "Home"];

/** A repeating task is "done" only for the day you're looking at. */
export function isTaskDone(t: Task, iso = todayKey()) {
  return isRepeating(t.recur) ? (t.completions ?? []).includes(iso) : t.done;
}

export function Tasks() {
  const [tasks, setTasks] = useStore<Task[]>("tasks", []);
  const [list, setList] = useState("General");
  const [filter, setFilter] = useState<"all" | "today" | "done">("all");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [recur, setRecur] = useState<Recurrence>({ freq: "none", start: todayKey() });
  const today = todayKey();

  const visible = tasks.filter((t) => {
    if (t.list !== list) return false;
    const done = isTaskDone(t, today);
    if (filter === "done") return done;
    if (filter === "today")
      return !done && (isRepeating(t.recur) ? occursOn(t.recur, today) : t.date <= today);
    return true;
  });

  function toggle(t: Task) {
    setTasks(
      tasks.map((x) => {
        if (x.id !== t.id) return x;
        if (!isRepeating(x.recur)) return { ...x, done: !x.done };
        const days = x.completions ?? [];
        return {
          ...x,
          completions: days.includes(today) ? days.filter((d) => d !== today) : [...days, today],
        };
      }),
    );
  }

  return (
    <Section eyebrow="Household" title="Tasks">
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {LISTS.map((l) => (
          <button
            key={l}
            onClick={() => setList(l)}
            className={`press rounded-full px-3 py-1 text-[0.78rem] ${
              l === list ? "bg-space-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {l}
          </button>
        ))}
        <span className="bg-rule mx-1 h-4 w-px" />
        {(["all", "today", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`press rounded-full px-2.5 py-1 text-[0.72rem] capitalize ${
              f === filter
                ? "text-foreground underline decoration-[var(--space-accent)] decoration-2 underline-offset-4"
                : "text-ink-faint"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setTasks([
            {
              id: uid(),
              title: title.trim(),
              list,
              time,
              done: false,
              date: today,
              recur: { ...recur },
              completions: [],
            },
            ...tasks,
          ]);
          setTitle("");
          setTime("");
          setRecur({ freq: "none", start: today });
        }}
        className="mb-6 space-y-3"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label="Add to this list"
              value={title}
              placeholder="Something to take care of…"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <input
            type="time"
            aria-label="Due time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border-border/80 numeric h-[42px] rounded-xl border bg-transparent px-2.5 text-sm"
          />
          <Action type="submit" variant="solid" className="h-[42px]">
            Add
          </Action>
        </div>
        <RecurrenceField value={recur} onChange={setRecur} compact />
      </form>

      {visible.length === 0 ? (
        <EmptyState
          glyph="⌂"
          headline="Nothing waiting here"
          body={`Your ${list.toLowerCase()} list is clear. Add the next thing when it comes to mind.`}
        />
      ) : (
        <ul className="thread space-y-1">
          {visible.map((t) => {
            const done = isTaskDone(t, today);
            const next = isRepeating(t.recur) ? nextOccurrence(t.recur, today) : null;
            return (
              <li
                key={t.id}
                data-done={done}
                className="thread-node group flex items-start gap-3 py-2.5"
              >
                <Tick done={done} label={t.title} onToggle={() => toggle(t)} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[0.95rem] ${done ? "text-ink-faint line-through" : ""}`}>
                    {t.title}
                  </p>
                  <p className="text-ink-faint numeric text-xs">
                    {[t.time, next && next !== today ? `next ${next}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <RepeatChip recur={t.recur} />
                  <button
                    onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}
                    aria-label={`Remove ${t.title}`}
                    className="text-ink-faint hover:text-destructive text-xs opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
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
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];
type Plan = Record<string, string>;

/** ISO-ish week key, e.g. 2026-W33 — used to keep a light history of meal plans. */
export function weekKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function Meals() {
  const [plan, setPlan] = useStore<Plan>("meals", {});
  const [history, setHistory] = useStore<Record<string, Plan>>("mealsHistory", {});
  const [recipes, setRecipes] = useStore<{ id: string; name: string; items: string }[]>(
    "recipes",
    [],
  );
  const [name, setName] = useState("");
  const [items, setItems] = useState("");
  const thisWeek = weekKey(0);
  const lastWeek = weekKey(-1);
  const previous = history[lastWeek];

  const rankedRecipes = useMemo(() => {
    return rankRecipes(recipes, history, thisWeek);
  }, [recipes, history, thisWeek]);
  const suggestions = rankedRecipes.slice(0, 4);

  function addSuggestion(dishName: string) {
    const slotOrder: string[] = [];
    for (const d of DAYS) {
      slotOrder.push(`${d}-Dinner`);
      slotOrder.push(`${d}-Lunch`);
      slotOrder.push(`${d}-Breakfast`);
    }
    const emptySlot = slotOrder.find((slot) => !plan[slot]);
    if (emptySlot) {
      setPlan({ ...plan, [emptySlot]: dishName });
    }
  }

  // Keep this week's plan in the light history so "copy last week" has something to read.
  useEffect(() => {
    if (Object.keys(plan).length === 0) return;
    if (JSON.stringify(history[thisWeek] ?? {}) === JSON.stringify(plan)) return;
    setHistory({ ...history, [thisWeek]: plan });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <div className="space-y-10">
      <Section
        eyebrow="This week"
        title="Meal plan"
        aside={
          <div className="flex items-center gap-3">
            {previous && (
              <button
                onClick={() => setPlan({ ...previous })}
                className="text-ink-faint hover:text-foreground text-xs transition"
              >
                Copy last week
              </button>
            )}
            {Object.keys(plan).length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear the entire week?")) setPlan({});
                }}
                className="text-ink-faint hover:text-destructive text-xs transition"
              >
                Clear week
              </button>
            )}
          </div>
        }
      >
        {suggestions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="text-ink-faint text-xs mr-1">Suggestions:</span>
            {suggestions.map((s) => (
              <button
                key={s.recipe.id}
                type="button"
                onClick={() => addSuggestion(s.recipe.name)}
                className="press bg-space-soft/60 hover:bg-space-soft text-foreground rounded-full px-2.5 py-0.5 text-xs inline-flex items-center gap-1 cursor-pointer transition"
                title={
                  s.lastUsedWeek
                    ? `Click to add · Used in ${s.lastUsedWeek} (${s.historicalCount}x historically)`
                    : `Click to add · Fresh idea (${s.historicalCount}x recorded)`
                }
              >
                + {s.recipe.name}
              </button>
            ))}
          </div>
        )}

        <datalist id="saved-recipes">
          {rankedRecipes.map((r) => (
            <option key={r.recipe.id} value={r.recipe.name} />
          ))}
        </datalist>
        <div className="overflow-x-auto no-scrollbar -mx-5 px-5">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="eyebrow w-20 text-left"> </th>
                {SLOTS.map((s) => (
                  <th key={s} className="eyebrow text-left">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((d) => {
                const isToday =
                  d === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
                return (
                  <tr key={d} className={isToday ? "bg-space-soft/30 rounded-lg" : ""}>
                    <td
                      className={`font-display pr-3 text-sm rounded-l-lg py-1 pl-2 ${isToday ? "text-foreground font-semibold" : "text-ink-soft"}`}
                    >
                      {d}
                    </td>
                    {SLOTS.map((s, i) => (
                      <td
                        key={s}
                        className={`pr-2 ${i === SLOTS.length - 1 ? "rounded-r-lg" : ""}`}
                      >
                        <input
                          aria-label={`${d} ${s}`}
                          list="saved-recipes"
                          value={plan[`${d}-${s}`] ?? ""}
                          placeholder="—"
                          onChange={(e) => setPlan({ ...plan, [`${d}-${s}`]: e.target.value })}
                          className={`w-full border-b bg-transparent py-1.5 text-sm outline-none transition-colors ${
                            isToday
                              ? "border-border/80 focus:border-space"
                              : "border-border/50 focus:border-space"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Repository" title="Recipes">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setRecipes([{ id: uid(), name: name.trim(), items }, ...recipes]);
            setName("");
            setItems("");
          }}
          className="mb-5 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
        >
          <Field label="Dish" value={name} onChange={(e) => setName(e.target.value)} />
          <Field
            label="Ingredients (comma separated)"
            value={items}
            onChange={(e) => setItems(e.target.value)}
          />
          <Action type="submit" variant="solid" className="h-[42px]">
            Save
          </Action>
        </form>
        {recipes.length === 0 ? (
          <EmptyState
            glyph="✧"
            headline="No recipes yet"
            body="Save the meals your family actually eats — grocery lists build themselves from here."
          />
        ) : (
          <ul className="divide-border/70 divide-y">
            {recipes.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-4 py-3">
                <div>
                  <p className="title-md">{r.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {r.items || "No ingredients noted"}
                  </p>
                </div>
                <button
                  onClick={() => setRecipes(recipes.filter((x) => x.id !== r.id))}
                  className="text-ink-faint hover:text-destructive text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

type Grocery = { id: string; name: string; got: boolean };

export function GroceryList() {
  const [items, setItems] = useStore<Grocery[]>("grocery", []);
  const [plan] = useStore<Plan>("meals", {});
  const [recipes] = useStore<{ id: string; name: string; items: string }[]>("recipes", []);
  const [draft, setDraft] = useState("");

  const remaining = items.filter((i) => !i.got).length;

  function generate() {
    const planned = new Set(
      Object.values(plan)
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean),
    );
    const derived: string[] = [];
    recipes.forEach((r) => {
      if (planned.has(r.name.trim().toLowerCase())) {
        r.items.split(",").forEach((i) => i.trim() && derived.push(i.trim()));
      }
    });
    const existing = new Set(items.map((i) => i.name.toLowerCase()));
    const fresh = [...new Set(derived)]
      .filter((d) => !existing.has(d.toLowerCase()))
      .map((name) => ({ id: uid(), name, got: false }));
    setItems([...fresh, ...items]);
  }

  return (
    <Section
      eyebrow="Shopping"
      title="Grocery"
      aside={<Action onClick={generate}>From meal plan</Action>}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setItems([{ id: uid(), name: draft.trim(), got: false }, ...items]);
          setDraft("");
        }}
        className="mb-5"
      >
        <Field
          label="Add item"
          value={draft}
          placeholder="Rice, onions, olive oil…"
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>
      {items.length === 0 ? (
        <EmptyState
          glyph="◦"
          headline="The basket is empty"
          body="Add what's missing, or let Sunnah Home read this week's meal plan and fill it for you."
          action={
            <Action variant="solid" onClick={generate}>
              Build from meal plan
            </Action>
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground mb-3 text-xs">
            {remaining} of {items.length} still to pick up
          </p>
          <ul className="space-y-0.5">
            {items.map((i) => (
              <li key={i.id} className="group flex items-center gap-3 py-2">
                <Tick
                  done={i.got}
                  label={i.name}
                  onToggle={() =>
                    setItems(items.map((x) => (x.id === i.id ? { ...x, got: !x.got } : x)))
                  }
                />
                <span
                  className={`flex-1 text-[0.95rem] ${i.got ? "text-ink-faint line-through" : ""}`}
                >
                  {i.name}
                </span>
                <button
                  onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                  className="text-ink-faint hover:text-destructive text-xs opacity-0 group-hover:opacity-100"
                  aria-label={`Remove ${i.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <GroceryRun />
        </>
      )}
    </Section>
  );
}

/** PROTOTYPE — the shopping run flows straight into Budget instead of being retyped. */
function GroceryRun() {
  const { picked, log } = useLogGroceryRun();
  const [amount, setAmount] = useState("");
  const [logged, setLogged] = useState<string | null>(null);

  if (picked.length === 0)
    return (
      <p className="text-ink-faint mt-6 text-xs">
        Tick what you've picked up — Sunnah Home can log the run as an expense.
      </p>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(amount);
        if (log(value)) {
          setLogged(`₹${value} logged to Groceries · list cleared`);
          setAmount("");
          setTimeout(() => setLogged(null), 3000);
        }
      }}
      className="border-border/70 mt-7 rounded-2xl border p-4"
    >
      <p className="eyebrow">Finished shopping</p>
      <p className="text-muted-foreground mt-1 mb-3 text-sm">
        {picked.length} item{picked.length === 1 ? "" : "s"} in the basket. Log what it cost and
        Budget picks it up.
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field
            label="Amount spent"
            type="number"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Action type="submit" variant="solid" className="h-[42px]">
          Log to Budget
        </Action>
      </div>
      {logged && <p className="text-space mt-3 text-xs">{logged}</p>}
    </form>
  );
}

export function isChoreDone(c: Chore, iso = todayKey()) {
  return isRepeating(c.recur) ? (c.completions ?? []).includes(iso) : c.done;
}

export function Kids() {
  const [family, setFamily] = useStore<FamilyMember[]>("family", []);
  const kids = family.filter((f) => f.role === "child");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const today = todayKey();

  const routineTotal = kids.reduce(
    (s, k) => s + k.chores.filter((c) => !isRepeating(c.recur) || occursOn(c.recur, today)).length,
    0,
  );
  const routineDone = kids.reduce(
    (s, k) =>
      s +
      k.chores.filter(
        (c) => (!isRepeating(c.recur) || occursOn(c.recur, today)) && isChoreDone(c, today),
      ).length,
    0,
  );

  return (
    <Section
      eyebrow="Family"
      title="Kids"
      aside={
        routineTotal > 0 ? (
          <span className="text-ink-faint numeric text-xs">
            {routineDone}/{routineTotal} done today
          </span>
        ) : undefined
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setFamily([...family, { id: uid(), name: name.trim(), role: "child", age, chores: [] }]);
          setName("");
          setAge("");
        }}
        className="mb-6 grid gap-2 sm:grid-cols-[1fr_100px_auto] sm:items-end"
      >
        <Field label="Child" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Age" value={age} onChange={(e) => setAge(e.target.value)} />
        <Action type="submit" variant="solid" className="h-[42px]">
          Add
        </Action>
      </form>

      {kids.length === 0 ? (
        <EmptyState
          glyph="❋"
          headline="No little ones added"
          body="Add a child to track routines, chores and the small wins worth noticing."
        />
      ) : (
        <div className="space-y-8">
          {kids.map((k) => (
            <div key={k.id}>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="title-md">
                  {k.name}
                  {k.age && <span className="text-ink-faint text-sm font-normal"> · {k.age}</span>}
                </h3>
                <button
                  onClick={() => setFamily(family.filter((x) => x.id !== k.id))}
                  className="text-ink-faint hover:text-destructive text-xs"
                >
                  Remove
                </button>
              </div>
              <ChoreList
                kid={k}
                onChange={(chores) =>
                  setFamily(family.map((x) => (x.id === k.id ? { ...x, chores } : x)))
                }
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ChoreList({ kid, onChange }: { kid: FamilyMember; onChange: (c: Chore[]) => void }) {
  const [draft, setDraft] = useState("");
  const [recur, setRecur] = useState<Recurrence>({ freq: "daily", start: todayKey() });
  const today = todayKey();

  function toggle(c: Chore) {
    onChange(
      kid.chores.map((x) => {
        if (x.id !== c.id) return x;
        if (!isRepeating(x.recur)) return { ...x, done: !x.done };
        const days = x.completions ?? [];
        return {
          ...x,
          completions: days.includes(today) ? days.filter((d) => d !== today) : [...days, today],
        };
      }),
    );
  }

  const visible = kid.chores.filter((c) => !isRepeating(c.recur) || occursOn(c.recur, today));

  return (
    <div className="thread">
      {visible.map((c) => {
        const done = isChoreDone(c, today);
        return (
          <div
            key={c.id}
            data-done={done}
            className="thread-node group flex items-center gap-3 py-2"
          >
            <Tick done={done} label={c.title} onToggle={() => toggle(c)} />
            <span className={`flex-1 text-[0.95rem] ${done ? "text-ink-faint line-through" : ""}`}>
              {c.title}
            </span>
            <RepeatChip recur={c.recur} />
            <button
              onClick={() => onChange(kid.chores.filter((x) => x.id !== c.id))}
              aria-label={`Remove ${c.title}`}
              className="text-ink-faint hover:text-destructive text-xs opacity-0 transition group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        );
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onChange([
            ...kid.chores,
            { id: uid(), title: draft.trim(), done: false, recur: { ...recur }, completions: [] },
          ]);
          setDraft("");
        }}
        className="thread-node space-y-2 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a routine or chore"
          className="text-ink-faint placeholder:text-ink-faint focus:text-foreground w-full bg-transparent text-sm outline-none"
        />
        <RecurrenceField value={recur} onChange={setRecur} compact />
      </form>
    </div>
  );
}

export function Deeds() {
  const [deeds, setDeeds] = useStore<{ id: string; who: string; what: string; date: string }[]>(
    "deeds",
    [],
  );
  const [who, setWho] = useState("");
  const [what, setWhat] = useState("");

  return (
    <Section eyebrow="Noticed" title="Good deeds">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!what.trim()) return;
          setDeeds([
            { id: uid(), who: who.trim() || "Family", what: what.trim(), date: todayKey() },
            ...deeds,
          ]);
          setWhat("");
        }}
        className="mb-6 grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-end"
      >
        <Field label="Who" value={who} onChange={(e) => setWho(e.target.value)} />
        <Field label="What they did" value={what} onChange={(e) => setWhat(e.target.value)} />
        <Action type="submit" variant="solid" className="h-[42px]">
          Record
        </Action>
      </form>
      {deeds.length === 0 ? (
        <EmptyState
          glyph="✧"
          headline="Nothing recorded yet"
          body="Small kindnesses are easy to forget. Write one down and it stays."
        />
      ) : (
        <ul className="thread">
          {deeds.map((d) => (
            <li key={d.id} data-active="true" className="thread-node py-3">
              <p className="text-[0.95rem]">{d.what}</p>
              <p className="text-ink-faint numeric text-xs">
                {d.who} · {d.date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* Calendar and Notes now live in ./calendar.tsx and ./notes.tsx — richer versions of both. */

export function TodayGlance() {
  const [tasks] = useStore<Task[]>("tasks", []);
  const [grocery] = useStore<Grocery[]>("grocery", []);
  const done = tasks.filter((t) => t.done).length;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Eyebrowed label="Tasks completed" value={`${done}/${tasks.length || 0}`} />
        <Meter value={tasks.length ? (done / tasks.length) * 100 : 0} />
      </div>
      <div>
        <Eyebrowed
          label="Grocery picked up"
          value={`${grocery.filter((g) => g.got).length}/${grocery.length || 0}`}
        />
        <Meter
          value={grocery.length ? (grocery.filter((g) => g.got).length / grocery.length) * 100 : 0}
        />
      </div>
    </div>
  );
}

function Eyebrowed({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="eyebrow">{label}</span>
      <span className="numeric font-display text-lg">{value}</span>
    </div>
  );
}
