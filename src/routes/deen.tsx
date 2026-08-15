import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/veedu/shell";
import { SubTabs } from "@/components/veedu/primitives";
import {
  DailyVerse,
  DeenHero,
  Duas,
  Fasting,
  Hifz,
  Qibla,
  Quran,
  Salah,
  Tasbih,
} from "@/components/deen/modules";
import { RamadanModeView } from "@/components/deen/ramadan";
import { useRamadanMode } from "@/lib/ramadan";

export const Route = createFileRoute("/deen")({
  head: () => ({
    meta: [
      { title: "Deen — prayer, Quran and dhikr in Sunnah Home" },
      {
        name: "description",
        content:
          "A calm space for Salah times, Quran reading, dhikr, duas, hifz and fasting — designed for focus and reverence.",
      },
      { property: "og:title", content: "Deen — prayer, Quran and dhikr in Sunnah Home" },
      {
        property: "og:description",
        content: "Salah, Quran, dhikr, duas, hifz and fasting in one quiet, reverent space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeenPage,
});

const BASE_TABS = [
  { id: "today", label: "Today" },
  { id: "ramadan", label: "Ramadan" },
  { id: "quran", label: "Quran" },
  { id: "dhikr", label: "Dhikr" },
  { id: "duas", label: "Duas" },
  { id: "hifz", label: "Hifz" },
  { id: "fasting", label: "Fasting" },
  { id: "qibla", label: "Qibla" },
];

function DeenPage() {
  const [tab, setTab] = useState("today");
  const { isActive, ramadanDay } = useRamadanMode();

  const tabs = BASE_TABS.map((t) =>
    t.id === "ramadan" && isActive
      ? { ...t, label: ramadanDay ? `☾ Ramadan ${ramadanDay}` : "☾ Ramadan" }
      : t
  );

  return (
    <Shell space="deen">
      <div className="mb-8">
        <SubTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>
      {tab === "today" && (
        <div className="space-y-12">
          <DeenHero />
          <Salah />
          <DailyVerse />
        </div>
      )}
      {tab === "ramadan" && <RamadanModeView />}
      {tab === "quran" && <Quran />}
      {tab === "dhikr" && <Tasbih />}
      {tab === "duas" && <Duas />}
      {tab === "hifz" && <Hifz />}
      {tab === "fasting" && <Fasting />}
      {tab === "qibla" && <Qibla />}
    </Shell>
  );
}
