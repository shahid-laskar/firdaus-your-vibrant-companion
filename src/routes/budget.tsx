import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, TrendingUp } from "lucide-react";
import { Shell } from "@/components/veedu/shell";
import { SubTabs } from "@/components/veedu/primitives";
import { PageHero, HeroFigure, type HeroPill } from "@/components/veedu/page-hero";
import { Overview, QuickEntry, Zakat, money, useExpenses, useLimits } from "@/components/budget/modules";
import { History } from "@/components/budget/history";
import { useTab } from "@/lib/use-tab";
import { todayKey } from "@/lib/store";


export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget — clear, calm money tracking in Sunnah Home" },
      {
        name: "description",
        content:
          "Record expenses in seconds, see where the month is going, and calculate zakat — without spreadsheets or anxiety.",
      },
      { property: "og:title", content: "Budget — clear, calm money tracking in Sunnah Home" },
      {
        property: "og:description",
        content: "Quick expense entry, monthly limits and a zakat calculator, made understandable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetPage,
});

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "entry", label: "Quick entry" },
  { id: "history", label: "History" },
  { id: "zakat", label: "Zakat" },
];

function BudgetPage() {
  const [tab, setTab] = useTab("overview");
  const [expenses] = useExpenses();
  const [limits] = useLimits();

  const { total, today, cap } = useMemo(() => {
    const m = todayKey().slice(0, 7);
    const d = todayKey();
    const thisMonth = expenses.filter((e) => e.date.startsWith(m));
    return {
      total: thisMonth.reduce((s, e) => s + e.amount, 0),
      today: expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0),
      cap: Object.values(limits).reduce((s, n) => s + n, 0),
    };
  }, [expenses, limits]);

  const pills: HeroPill[] = [
    { id: "today", icon: CalendarDays, label: `₹${money(today)} today` },
  ];
  if (cap > 0)
    pills.push({
      id: "cap",
      icon: TrendingUp,
      label: `₹${money(Math.max(0, cap - total))} left of ₹${money(cap)}`,
    });

  return (
    <Shell space="budget">
      <PageHero
        variant="budget"
        eyebrow="This month"
        title={<span className="numeric">₹{money(total)}</span>}
        subtitle={
          total === 0
            ? "Nothing recorded yet this month. Add an expense and the picture starts forming."
            : "Every rupee accounted for, calmly. No spreadsheets, no guilt."
        }
        pills={pills}
        aside={<HeroFigure value={`${expenses.length}`} label="entries" />}
      />
      <div className="mb-8">
        <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "overview" && <Overview />}
      {tab === "entry" && <QuickEntry />}
      {tab === "history" && <History />}
      {tab === "zakat" && <Zakat />}
    </Shell>
  );
}
