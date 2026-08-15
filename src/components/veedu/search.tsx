import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Note } from "@/components/home/notes";
import type { CalEvent } from "@/components/home/calendar";

type Hit = { id: string; label: string; where: string; to: string };

/** PROTOTYPE — one search across everything Sunnah Home already knows. */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const [tasks] = useStore<{ id: string; title: string; list: string; done: boolean }[]>(
    "tasks",
    [],
  );
  const [notes] = useStore<Note[]>("notesList", []);
  const [events] = useStore<CalEvent[]>("events", []);
  const [recipes] = useStore<{ id: string; name: string; items: string }[]>("recipes", []);
  const [grocery] = useStore<{ id: string; name: string; got: boolean }[]>("grocery", []);
  const [expenses] = useStore<
    { id: string; category: string; note: string; amount: number; date: string }[]
  >("expenses", []);
  const [habits] = useStore<{ id: string; name: string }[]>("habits", []);
  const [family] = useStore<
    { id: string; name: string; role: string; chores: { id: string; title: string }[] }[]
  >("family", []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const all: Hit[] = [
      ...tasks.map((t) => ({
        id: `t${t.id}`,
        label: t.title,
        where: `Task · ${t.list}`,
        to: "/?tab=tasks",
      })),
      ...notes.map((n) => ({
        id: `n${n.id}`,
        label: n.title || "Untitled",
        where: "Note",
        to: "/?tab=notes",
      })),
      ...events.map((e) => ({
        id: `e${e.id}`,
        label: e.title,
        where: `Calendar · ${e.date}`,
        to: "/?tab=calendar",
      })),
      ...recipes.map((r) => ({
        id: `r${r.id}`,
        label: r.name,
        where: "Recipe",
        to: "/?tab=meals",
      })),
      ...grocery.map((g) => ({
        id: `g${g.id}`,
        label: g.name,
        where: "Grocery",
        to: "/?tab=grocery",
      })),
      ...habits.map((h) => ({
        id: `h${h.id}`,
        label: h.name,
        where: "Habit",
        to: "/me?tab=habits",
      })),
      ...family
        .filter((f) => f.role === "child")
        .flatMap((k) =>
          k.chores.map((c) => ({
            id: `c${c.id}`,
            label: c.title,
            where: `${k.name}'s routine`,
            to: "/?tab=kids",
          })),
        ),
      ...expenses.map((e) => ({
        id: `x${e.id}`,
        label: `${e.category}${e.note ? ` — ${e.note}` : ""} · ₹${e.amount}`,
        where: `Expense · ${e.date}`,
        to: "/budget?tab=history",
      })),
    ];
    return all.filter((h) => h.label.toLowerCase().includes(term)).slice(0, 12);
  }, [q, tasks, notes, events, recipes, grocery, habits, family, expenses]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
      />
      <div className="bg-card rise relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-[var(--shadow-float)]">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks, notes, events, spending…"
          className="w-full bg-transparent px-5 py-4 text-[1rem] outline-none"
        />
        <div className="bg-rule h-px" />
        {q.trim().length < 2 ? (
          <p className="text-ink-faint px-5 py-5 text-sm">Type at least two letters.</p>
        ) : hits.length === 0 ? (
          <p className="text-ink-faint px-5 py-5 text-sm">Nothing found.</p>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto py-1">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => {
                    onClose();
                    navigate({ to: h.to });
                  }}
                  className="hover:bg-space-soft/40 flex w-full items-baseline justify-between gap-4 px-5 py-2.5 text-left"
                >
                  <span className="truncate text-[0.95rem]">{h.label}</span>
                  <span className="text-ink-faint shrink-0 text-[0.7rem]">{h.where}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
