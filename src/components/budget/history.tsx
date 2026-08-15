import { useMemo, useState } from "react";
import { EmptyState, Meter, Section } from "@/components/veedu/primitives";
import { useStore } from "@/lib/store";
import { money, useExpenses, useLimits } from "./modules";

/** PROTOTYPE — spending is no longer only "this month". */
export function History() {
  const [expenses] = useExpenses();
  const [limits] = useLimits();
  const [offset, setOffset] = useState(0);

  const months = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) =>
      map.set(e.date.slice(0, 7), (map.get(e.date.slice(0, 7)) ?? 0) + e.amount),
    );
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [expenses]);

  const active = months[months.length - 1 - offset]?.[0] ?? new Date().toISOString().slice(0, 7);
  const rows = expenses
    .filter((e) => e.date.startsWith(active))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const cap = Object.values(limits).reduce((s, n) => s + n, 0);
  const peak = Math.max(1, ...months.map(([, v]) => v));
  const prev = months[months.length - 2 - offset]?.[1];
  const delta = prev ? Math.round(((total - prev) / prev) * 100) : null;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const label = (m: string) =>
    new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  if (months.length === 0) {
    return (
      <Section eyebrow="Looking back" title="History">
        <EmptyState
          glyph="◈"
          headline="No history yet"
          body="Once a few months of expenses exist, the trend shows up here."
        />
      </Section>
    );
  }

  return (
    <div className="space-y-10">
      <Section eyebrow="Last six months" title="Spending trend">
        <div className="flex items-end gap-2">
          {months.map(([m, v], i) => {
            const activeBar = months.length - 1 - i === offset;
            return (
              <button
                key={m}
                onClick={() => setOffset(months.length - 1 - i)}
                className="press group flex flex-1 flex-col items-center gap-2"
                aria-label={`${label(m)} — ₹${money(v)}`}
              >
                <span className="numeric text-ink-faint text-[0.62rem]">
                  {Math.round(v / 1000)}k
                </span>
                <span
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(6, (v / peak) * 130)}px`,
                    background: activeBar ? "var(--space-accent)" : "var(--space-accent-soft)",
                  }}
                />
                <span
                  className={`text-[0.66rem] ${activeBar ? "text-foreground" : "text-ink-faint"}`}
                >
                  {label(m)}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <section className="rise">
        <p className="eyebrow">{label(active)}</p>
        <p className="display-xl numeric mt-3">₹{money(total)}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {delta === null
            ? cap
              ? `of ₹${money(cap)} planned`
              : "No comparison yet"
            : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs the month before`}
        </p>
        {cap > 0 && (
          <div className="mt-5">
            <Meter
              value={(total / cap) * 100}
              label={
                total > cap
                  ? `₹${money(total - cap)} over plan`
                  : `₹${money(cap - total)} left in plan`
              }
            />
          </div>
        )}
      </section>

      <Section eyebrow="Where it went" title="Categories">
        <ul className="space-y-4">
          {byCategory.map(([cat, amt]) => (
            <li key={cat}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[0.95rem]">{cat}</span>
                <span className="numeric text-ink-soft text-sm">₹{money(amt)}</span>
              </div>
              <Meter value={total ? (amt / total) * 100 : 0} />
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow={label(active)} title="Every expense">
        <ul className="divide-border/70 divide-y">
          {rows.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-[0.95rem]">{e.category}</p>
                <p className="text-ink-faint truncate text-xs">
                  {e.date}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <span className="numeric font-display text-[1.02rem]">₹{money(e.amount)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** PROTOTYPE — grocery run finished → log it as an expense without retyping. */
export function useLogGroceryRun() {
  const [expenses, setExpenses] = useExpenses();
  const [items, setItems] = useStore<{ id: string; name: string; got: boolean }[]>("grocery", []);
  return {
    picked: items.filter((i) => i.got),
    log(amount: number) {
      const picked = items.filter((i) => i.got);
      if (!amount || picked.length === 0) return false;
      setExpenses([
        {
          id: `${Date.now()}`,
          amount,
          category: "Groceries",
          note: `${picked.length} items · ${picked
            .slice(0, 3)
            .map((i) => i.name)
            .join(", ")}${picked.length > 3 ? "…" : ""}`,
          date: new Date().toISOString().slice(0, 10),
        },
        ...expenses,
      ]);
      setItems(items.filter((i) => !i.got));
      return true;
    },
  };
}
