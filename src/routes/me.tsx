import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Flower2, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/veedu/shell";
import { SubTabs } from "@/components/veedu/primitives";
import { PageHero, HeroFigure, type HeroPill } from "@/components/veedu/page-hero";
import { Cycle, Habits, Health, Journal, SelfCare } from "@/components/me/modules";
import { Trends } from "@/components/me/trends";
import { useTab } from "@/lib/use-tab";
import { todayKey, useStore } from "@/lib/store";


export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Me — your private corner of Sunnah Home" },
      {
        name: "description",
        content:
          "Check in with yourself, keep habits, write a private journal and track health — quietly, on your own device.",
      },
      { property: "og:title", content: "Me — your private corner of Sunnah Home" },
      {
        property: "og:description",
        content: "Mood check-ins, habits, journaling, health and cycle tracking, kept private.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

const TABS = [
  { id: "care", label: "Self care" },
  { id: "habits", label: "Habits" },
  { id: "journal", label: "Journal" },
  { id: "health", label: "Health" },
  { id: "trends", label: "Trends" },
  { id: "cycle", label: "Cycle" },
];

function MePage() {
  const [profile] = useStore("profile", { name: "", city: "Kozhikode", gender: "" });
  const [tab, setTab] = useTab("care");
  const [checkins] = useStore<Record<string, string>>("checkins", {});
  const [health] = useStore<Record<string, { water: number }>>("health", {});
  const [habits] = useStore<{ id: string }[]>("habits", []);

  const today = todayKey();
  const mood = checkins[today];
  const water = health[today]?.water ?? 0;

  const pills: HeroPill[] = [
    { id: "water", icon: Droplets, label: `${water} glasses of water` },
    { id: "private", icon: ShieldCheck, label: "Private to this device" },
  ];

  const availableTabs = TABS.filter((t) => t.id !== "cycle" || profile.gender === "female");
  return (
    <Shell space="me">
      <PageHero
        variant="me"
        eyebrow="Your corner"
        title={profile.name ? `How are you, ${profile.name}?` : "How are you today?"}
        subtitle={
          mood
            ? "Thank you for checking in. Keep tending to yourself gently."
            : "Nothing here is shared or scored. Check in whenever you're ready."
        }
        pills={pills}
        aside={<HeroFigure value={`${habits.length}`} label="habits" />}
      />
      <div className="mb-8">
        <SubTabs tabs={availableTabs} value={tab} onChange={setTab} />
      </div>

      {tab === "care" && <SelfCare />}
      {tab === "habits" && <Habits />}
      {tab === "journal" && <Journal />}
      {tab === "health" && <Health />}
      {tab === "trends" && <Trends />}
      {tab === "cycle" && <Cycle />}
    </Shell>
  );
}
