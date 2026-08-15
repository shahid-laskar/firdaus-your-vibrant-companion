import { useMemo, useState } from "react";
import { Action, EmptyState, Field, Meter, Section } from "@/components/veedu/primitives";
import { todayKey, uid, useStore } from "@/lib/store";
import { calculateBudgetAnalytics, generateBudgetInsights } from "@/lib/budget-intelligence";

export type Expense = { id: string; amount: number; category: string; note: string; date: string };

const DEFAULT_CATEGORIES = ["Groceries", "Transport", "Home", "Health", "Giving", "Other"];

export function useExpenses() {
  return useStore<Expense[]>("expenses", []);
}

export function useLimits() {
  return useStore<Record<string, number>>("limits", {
    Groceries: 8000,
    Transport: 3000,
    Home: 5000,
  });
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

const month = () => todayKey().slice(0, 7);

export function QuickEntry() {
  const [expenses, setExpenses] = useExpenses();
  const [limits] = useLimits();
  const categories = [...new Set([...DEFAULT_CATEGORIES, ...Object.keys(limits)])];
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [note, setNote] = useState("");

  const recent = expenses.filter((e) => e.date.startsWith(month()));

  return (
    <div className="space-y-10">
      <Section eyebrow="Log it and move on" title="Quick entry">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (!n) return;
            setExpenses([{ id: uid(), amount: n, category, note, date: todayKey() }, ...expenses]);
            setAmount("");
            setNote("");
          }}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-ink-faint text-3xl">₹</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-label="Amount"
              className="numeric font-display placeholder:text-ink-faint/50 w-full bg-transparent text-5xl outline-none"
            />
          </div>
          <div className="bg-rule my-5 h-px" />
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`press shrink-0 rounded-full px-3 py-1.5 text-[0.78rem] ${
                  c === category ? "bg-space-soft text-foreground" : "text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-end gap-2">
            <div className="flex-1">
              <Field
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Action type="submit" variant="solid" className="h-[42px]">
              Record
            </Action>
          </div>
        </form>
      </Section>

      <Section eyebrow="This month" title="Recent">
        {recent.length === 0 ? (
          <EmptyState
            glyph="◈"
            headline="Nothing spent yet this month"
            body="A clean slate. Record the first expense above and the picture builds itself."
          />
        ) : (
          <ul className="divide-border/70 divide-y">
            {recent.map((e) => (
              <li key={e.id} className="group flex items-baseline justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.95rem]">{e.category}</p>
                  <p className="text-ink-faint truncate text-xs">
                    {e.date}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="numeric font-display text-[1.05rem]">₹{money(e.amount)}</span>
                  <button
                    onClick={() => setExpenses(expenses.filter((x) => x.id !== e.id))}
                    className="text-ink-faint hover:text-destructive text-xs opacity-0 group-hover:opacity-100"
                    aria-label="Delete expense"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export function Overview() {
  const [expenses] = useExpenses();
  const [limits, setLimits] = useLimits();
  const [newCat, setNewCat] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const currentMonth = month();
  const analytics = useMemo(
    () => calculateBudgetAnalytics(expenses, currentMonth),
    [expenses, currentMonth],
  );
  const insights = useMemo(() => generateBudgetInsights(analytics, limits), [analytics, limits]);

  const total = analytics.currentMonthTotal;
  const cap = Object.values(limits).reduce((s, n) => s + n, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>(Object.entries(analytics.categoryTotals));
    Object.keys(limits).forEach((k) => !map.has(k) && map.set(k, 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [analytics.categoryTotals, limits]);

  return (
    <div className="space-y-10">
      <section className="rise">
        <p className="eyebrow">Spent this month</p>
        <p className="display-xl numeric mt-3">₹{money(total)}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {cap
            ? `of ₹${money(cap)} planned · ₹${money(Math.max(0, cap - total))} left`
            : "No monthly limit set yet"}
          {analytics.previousMonthTotal > 0 && (
            <span>
              {" "}
              · {analytics.delta.delta >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(Math.round(analytics.delta.percentage))}% vs last month
            </span>
          )}
        </p>
        <div className="mt-5">
          <Meter value={cap ? (total / cap) * 100 : 0} />
        </div>
        {insights.length > 0 && (
          <div className="mt-4 space-y-1.5 border-border/70 border-t pt-3">
            {insights.slice(0, 2).map((ins) => (
              <p key={ins.id} className="text-ink-soft text-xs">
                <span
                  className={
                    ins.severity === "warning"
                      ? "text-destructive font-medium"
                      : "text-space font-medium"
                  }
                >
                  {ins.title}:
                </span>{" "}
                {ins.explanation}
              </p>
            ))}
          </div>
        )}
      </section>

      <Section eyebrow="Where it went" title="Categories">
        {byCategory.length === 0 ? (
          <EmptyState
            glyph="◦"
            headline="No categories in play"
            body="Once you log expenses, they group themselves here so you can see the shape of the month."
          />
        ) : (
          <ul className="space-y-5">
            {byCategory.map(([cat, amt]) => {
              const limit = limits[cat];
              return (
                <li key={cat}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[0.95rem]">{cat}</span>
                    <span className="numeric text-ink-soft text-sm">
                      ₹{money(amt)}
                      {limit ? <span className="text-ink-faint"> / {money(limit)}</span> : null}
                    </span>
                  </div>
                  <Meter value={limit ? (amt / limit) * 100 : total ? (amt / total) * 100 : 0} />
                </li>
              );
            })}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCat.trim()) return;
            setLimits({ ...limits, [newCat.trim()]: Number(newLimit) || 0 });
            setNewCat("");
            setNewLimit("");
          }}
          className="mt-8 grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end"
        >
          <Field label="Category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Field
            label="Monthly limit"
            inputMode="decimal"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
          />
          <Action type="submit" className="h-[42px]">
            Set
          </Action>
        </form>
      </Section>
    </div>
  );
}

export function Zakat() {
  const [v, setV] = useStore("zakat", { cash: "", gold: "", business: "", debts: "" });
  const net =
    (Number(v.cash) || 0) +
    (Number(v.gold) || 0) +
    (Number(v.business) || 0) -
    (Number(v.debts) || 0);
  const nisab = 65000;
  const due = net >= nisab ? net * 0.025 : 0;

  return (
    <Section eyebrow="Purification of wealth" title="Zakat">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Cash & savings"
          inputMode="decimal"
          value={v.cash}
          onChange={(e) => setV({ ...v, cash: e.target.value })}
        />
        <Field
          label="Gold & silver value"
          inputMode="decimal"
          value={v.gold}
          onChange={(e) => setV({ ...v, gold: e.target.value })}
        />
        <Field
          label="Business assets"
          inputMode="decimal"
          value={v.business}
          onChange={(e) => setV({ ...v, business: e.target.value })}
        />
        <Field
          label="Debts owed"
          inputMode="decimal"
          value={v.debts}
          onChange={(e) => setV({ ...v, debts: e.target.value })}
        />
      </div>

      <div className="border-border/70 mt-8 border-t pt-6">
        <p className="eyebrow">Zakatable wealth</p>
        <p className="numeric font-display mt-1 text-2xl">₹{money(Math.max(0, net))}</p>
        <p className="eyebrow mt-6">Due at 2.5%</p>
        <p className="numeric display-lg text-space mt-1">₹{money(due)}</p>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          {net >= nisab
            ? "Your wealth is above the nisab threshold for a full lunar year."
            : `Below the nisab estimate of ₹${money(nisab)} — no zakat is due on this amount.`}
        </p>
      </div>
    </Section>
  );
}
