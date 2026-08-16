import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, TrendingUp, Wallet } from "lucide-react";
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
  return (
    <Shell space="budget">
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
