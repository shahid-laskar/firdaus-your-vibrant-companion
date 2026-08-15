import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, type ComponentType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Moon,
  ShoppingBasket,
  Sparkles,
  Sun,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import {
  BentoHeading,
  IconChip,
  ProgressRing,
  RowTile,
  StatTile,
  Tile,
  type Tone,
} from "@/components/veedu/bento";
import { Shell } from "@/components/veedu/shell";
import { SubTabs, EmptyState } from "@/components/veedu/primitives";
import {
  Deeds,
  GroceryList,
  Kids,
  Meals,
  Tasks,
  isTaskDone,
  type Task,
} from "@/components/home/modules";
import { Notes } from "@/components/home/notes";
import { UnifiedCalendar, eventsOn, type CalEvent } from "@/components/home/calendar";
import { Reminders, useReminderEngine } from "@/components/home/reminders";
import { useNextPrayer, usePrayers, useSalah } from "@/components/deen/modules";
import { isRepeating, occursOn } from "@/lib/recurrence";
import { useTab } from "@/lib/use-tab";
import { todayKey, useNow, useStore } from "@/lib/store";
import { useFamilyMigration } from "@/lib/family-model";
import { calculateBudgetAnalytics } from "@/lib/budget-intelligence";
import { buildDailyThread, type DailyThreadItem } from "@/lib/daily-surface";
import { useRamadanMode } from "@/lib/ramadan";
import type { HifzItem } from "@/lib/hifz-scheduler";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sunnah Home — a handcrafted home for everyday life" },
      {
        name: "description",
        content:
          "Sunnah Home brings family life, prayer, money and personal wellbeing into one calm, beautifully made daily companion.",
      },
      { property: "og:title", content: "Sunnah Home — a handcrafted home for everyday life" },
      {
        property: "og:description",
        content:
          "Family, Deen, budget and wellbeing in one quiet daily companion. Offline-first, private by default.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const TABS = [
  { id: "today", label: "Today" },
  { id: "tasks", label: "Tasks" },
  { id: "meals", label: "Meals" },
  { id: "grocery", label: "Grocery" },
  { id: "kids", label: "Kids" },
  { id: "deeds", label: "Deeds" },
  { id: "calendar", label: "Calendar" },
  { id: "notes", label: "Notes" },
  { id: "reminders", label: "Reminders" },
];

function greeting(h: number) {
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 16) return "Good afternoon";
  if (h < 20) return "Good evening";
  return "Winding down";
}

function Today() {
  const now = useNow(60_000);
  const today = todayKey();
  const [profile] = useStore("profile", { name: "", city: "Kozhikode" });
  const [tasks] = useStore<Task[]>("tasks", []);
  const [grocery] = useStore<{ id: string; got: boolean }[]>("grocery", []);
  const [events] = useStore<CalEvent[]>("events", []);
  const [meals] = useStore<Record<string, string>>("meals", {});
  const [habits] = useStore<{ id: string; name: string; days: string[] }[]>("habits", []);
  const [health] = useStore<Record<string, { water: number }>>("health", {});
  const [checkins] = useStore<Record<string, string>>("checkins", {});
  const [expenses] = useStore<{ amount: number; date: string }[]>("expenses", []);
  const [limits] = useStore<Record<string, number>>("limits", {});
  const [hifzItems] = useStore<HifzItem[]>("hifz", []);
  const [salah] = useSalah();
  const countdown = useNextPrayer();
  const prayers = usePrayers();
  const { isActive: isRamadan, ramadanDay } = useRamadanMode();
  const activeReminders = useReminderEngine();

  const hour = now?.getHours() ?? 8;
  const dueToday = tasks.filter((t) =>
    isRepeating(t.recur) ? occursOn(t.recur, today) : !t.done,
  );
  const open = dueToday.filter((t) => !isTaskDone(t));
  const doneCount = dueToday.length - open.length;
  const todayEvents = eventsOn(events, today);
  const prayed = Object.keys(salah[today] ?? {}).length;
  const leftToBuy = grocery.filter((g) => !g.got).length;

  const threadItems = useMemo(
    () =>
      buildDailyThread({
        now: now ?? new Date(),
        profile,
        prayers,
        nextPrayer: countdown,
        salahLog: salah,
        hifzItems,
        isRamadan,
        ramadanDay,
        tasks,
        events,
        meals,
        grocery,
        habits,
        health,
        checkins,
        expenses,
        limits,
        activeReminders,
      }),
    [
      now,
      profile,
      prayers,
      countdown,
      salah,
      hifzItems,
      isRamadan,
      ramadanDay,
      tasks,
      events,
      meals,
      grocery,
      habits,
      health,
      checkins,
      expenses,
      limits,
      activeReminders,
    ]
  );

  const bands = useMemo(() => groupThread(threadItems), [threadItems]);
  const quietDay = threadItems.every((i) => i.done) || threadItems.length === 0;

  const taskPct = dueToday.length ? (doneCount / dueToday.length) * 100 : 0;
  const salahPct = (prayed / 5) * 100;
  const groceryPct = grocery.length ? ((grocery.length - leftToBuy) / grocery.length) * 100 : 0;
  const dayPct = Math.round((taskPct + salahPct + groceryPct) / 3);
  const spentToday = expenses
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const mealToday = meals[today];

  return (
    <div className="space-y-10">
      {/* ── The one warm, dominant moment of the screen ─────────────────── */}
      <header className="tile tile-hero bloom-in min-h-[13.5rem] p-6">
        <span className="bloom -top-10 -left-8 size-40" aria-hidden />
        <span className="bloom -right-6 -bottom-14 size-44" aria-hidden />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div>
            <p className="eyebrow opacity-80">
              {now?.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              }) ?? " "}
              {isRamadan ? ` · Ramadan ${ramadanDay}` : ""}
            </p>
            <h1 className="display-xl mt-2.5">
              {greeting(hour)}
              {profile.name ? `, ${profile.name}` : ""}.
            </h1>
            <p className="mt-2.5 max-w-md text-[0.95rem] leading-relaxed opacity-85">
              {open.length === 0 && todayEvents.length === 0
                ? "Nothing is asking for you right now. That is allowed."
                : `${open.length} thing${open.length === 1 ? "" : "s"} waiting${
                    todayEvents.length ? ` · ${todayEvents.length} on the calendar` : ""
                  }.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {countdown && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3.5 py-2 text-[0.82rem] font-semibold backdrop-blur-sm">
                <span className="breathe size-1.5 rounded-full bg-current" aria-hidden />
                {countdown.next.name} in{" "}
                {countdown.hours > 0 ? `${countdown.hours}h ` : ""}
                {countdown.mins}m
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3.5 py-2 text-[0.82rem] font-semibold backdrop-blur-sm">
              <Sun className="size-3.5" strokeWidth={2.4} aria-hidden />
              {dayPct}% of today tended
            </span>
          </div>
        </div>
      </header>

      {/* ── Bento: the day at a glance, one hue per life-area ───────────── */}
      <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile tone="prayer" to="/deen" index={0} className="col-span-2 flex items-center gap-4">
          <ProgressRing pct={salahPct} tone="prayer" label="Salah" />
          <span className="min-w-0">
            <span className="eyebrow block" style={{ color: "var(--tone)" }}>
              Salah
            </span>
            <span className="title-md mt-1 block text-[1.05rem]">{prayed} of 5 prayed</span>
            <span className="text-ink-soft mt-0.5 block text-[0.8rem] font-medium">
              {prayed === 5 ? "Complete, alhamdulillah" : "Keep the thread going"}
            </span>
          </span>
        </Tile>

        <StatTile
          tone="task"
          icon={CheckCircle2}
          figure={`${doneCount}/${dueToday.length}`}
          title="Tasks"
          note={open.length ? `${open.length} still open` : "All clear"}
          index={1}
        />
        <StatTile
          tone="grocery"
          icon={ShoppingBasket}
          figure={`${leftToBuy}`}
          title="To buy"
          note={leftToBuy ? "Items left on the list" : "Basket is settled"}
          index={2}
        />
        <RowTile
          tone="meal"
          icon={UtensilsCrossed}
          label="Tonight"
          value={mealToday || "Not planned yet"}
          index={3}
          wide
        />
        <RowTile
          tone="money"
          icon={Wallet}
          label="Spent today"
          value={spentToday ? spentToday.toLocaleString() : "Nothing yet"}
          to="/budget"
          index={4}
        />
        <RowTile
          tone="self"
          icon={HeartPulse}
          label="Water"
          value={`${health[today]?.water ?? 0} glasses`}
          to="/me"
          index={5}
        />
      </section>

      {/* ── The thread — now → next → today → later, as tonal cards ─────── */}
      {quietDay && bands.length === 0 ? (
        <EmptyState
          glyph="☾"
          headline="A quiet day"
          body="Nothing is due and nothing is waiting. When something arrives, it will appear here first."
        />
      ) : (
        <div className="space-y-8">
          {bands.map((band) => (
            <section key={band.id} aria-label={band.label}>
              <BentoHeading
                title={band.label}
                aside={
                  <span className="text-ink-faint text-[0.72rem] font-semibold">
                    {band.items.length}
                  </span>
                }
              />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {band.items.map((item, idx) => (
                  <ThreadCard key={item.id} item={item} index={idx} lead={band.id === "now"} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="px-1">
        <Link
          to="/review"
          className="text-ink-faint hover:text-foreground text-xs font-semibold transition-colors"
        >
          Weekly review →
        </Link>
      </div>
    </div>
  );
}

/**
 * Presentation-only arrangement of the engine's already-prioritised thread into
 * temporal bands. Priority scores come from buildDailyThread — nothing is
 * recalculated here.
 */
type Band = { id: string; label: string; meta?: string | undefined; items: DailyThreadItem[] };

function groupThread(items: DailyThreadItem[]): Band[] {
  const now = items.filter((i) => !i.done && i.priority <= 2);
  const next = items.filter((i) => !i.done && i.priority >= 3 && i.priority <= 4);
  const today = items.filter((i) => !i.done && i.priority >= 5 && i.priority <= 7);
  const later = items.filter((i) => !i.done && i.priority >= 8);
  const behind = items.filter((i) => i.done);

  return [
    { id: "now", label: "Now", items: now },
    { id: "next", label: "Next", items: next },
    { id: "today", label: "Today", items: today },
    { id: "later", label: "Later", items: later },
    { id: "behind", label: "Behind you", items: behind },
  ].filter((b) => b.items.length > 0);
}

/** Category → life-area voice. Colour always means the same thing. */
const TONE_BY_CATEGORY: Record<string, Tone> = {
  prayer: "prayer",
  hifz: "prayer",
  ramadan: "prayer",
  reminder: "task",
  task: "task",
  event: "kids",
  kids: "kids",
  meal: "meal",
  grocery: "grocery",
  habit: "habit",
  health: "self",
  checkin: "self",
  money: "money",
  budget: "money",
};

const ICON_BY_TONE: Record<Tone, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  prayer: Moon,
  task: CheckCircle2,
  meal: UtensilsCrossed,
  kids: CalendarDays,
  grocery: ShoppingBasket,
  habit: Sparkles,
  money: Wallet,
  self: HeartPulse,
};

function ThreadCard({
  item,
  index,
  lead,
}: {
  item: DailyThreadItem;
  index: number;
  lead: boolean;
}) {
  const tone: Tone = TONE_BY_CATEGORY[item.category] ?? "task";
  const Icon = ICON_BY_TONE[tone];

  return (
    <Tile
      tone={tone}
      {...(item.to ? { to: item.to } : {})}
      index={index}
      className={`flex items-start gap-3 ${lead ? "sm:col-span-2" : ""} ${
        item.done ? "opacity-60" : ""
      }`}
    >
      <IconChip icon={Icon} solid={lead && !item.done} />
      <span className="min-w-0 flex-1">
        <span className="eyebrow block" style={{ color: "var(--tone)" }}>
          {item.label}
        </span>
        <span
          className={`mt-1 block ${lead ? "title-md text-[1.12rem]" : "text-[1rem] font-semibold"} ${
            item.done ? "text-ink-faint line-through decoration-1" : "text-foreground"
          }`}
        >
          {item.value}
        </span>
        {item.detail && (
          <span className="text-ink-soft numeric mt-1 block text-[0.78rem] font-medium">
            {item.detail}
          </span>
        )}
      </span>
      {item.active && !item.done && (
        <span className="chip shrink-0">
          <span className="breathe size-1.5 rounded-full bg-current" aria-hidden />
          {item.priority <= 2 ? "Now" : "Soon"}
        </span>
      )}
    </Tile>
  );
}

function HomePage() {
  useFamilyMigration();
  const [tab, setTab] = useTab("today");
  return (
    <Shell space="home">
      <div className="mb-8">
        <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === "today" && <Today />}
      {tab === "tasks" && <Tasks />}
      {tab === "meals" && <Meals />}
      {tab === "grocery" && <GroceryList />}
      {tab === "kids" && <Kids />}
      {tab === "deeds" && <Deeds />}
      {tab === "calendar" && <UnifiedCalendar />}
      {tab === "notes" && <Notes />}
      {tab === "reminders" && <Reminders />}
    </Shell>
  );
}
