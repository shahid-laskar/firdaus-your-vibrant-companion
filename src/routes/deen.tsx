import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Star, Sunrise } from "lucide-react";
import { Shell } from "@/components/veedu/shell";
import { SubTabs } from "@/components/veedu/primitives";
import { PageHero, HeroFigure, type HeroPill } from "@/components/veedu/page-hero";
import {
  DailyVerse,
  Duas,
  Fasting,
  Hifz,
  Qibla,
  Quran,
  Salah,
  Tasbih,
  useNextPrayer,
  useSalah,
} from "@/components/deen/modules";
import { RamadanModeView } from "@/components/deen/ramadan";
import { useRamadanMode } from "@/lib/ramadan";
import { hijriLabel } from "@/lib/hijri";
import { todayKey, useNow, useStore } from "@/lib/store";


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
  const now = useNow(30_000);
  const countdown = useNextPrayer();
  const [salah] = useSalah();
  const [profile] = useStore("profile", { name: "", city: "Kozhikode" });
  const prayed = Object.keys(salah[todayKey()] ?? {}).length;
  const hijri = now ? hijriLabel(now) : "";

  const tabs = BASE_TABS.map((t) =>
    t.id === "ramadan" && isActive
      ? { ...t, label: ramadanDay ? `☾ Ramadan ${ramadanDay}` : "☾ Ramadan" }
      : t
  );

  const pills: HeroPill[] = [];
  if (countdown)
    pills.push({
      id: "next",
      icon: Sunrise,
      label: `${countdown.next.name} at ${countdown.next.time}`,
    });
  if (hijri) pills.push({ id: "hijri", icon: Moon, label: hijri });
  if (isActive) pills.push({ id: "ramadan", icon: Star, label: `Ramadan ${ramadanDay ?? ""}` });

  return (
    <Shell space="deen">
      <PageHero
        variant="deen"
        eyebrow={profile.city}
        title={
          countdown ? (
            <>
              {countdown.next.name} in{" "}
              <span className="numeric">
                {countdown.hours > 0 ? `${countdown.hours}h ` : ""}
                {countdown.mins}m
              </span>
            </>
          ) : (
            "Peace be upon you"
          )
        }
        subtitle={
          prayed === 5
            ? "All five kept today — a complete thread, alhamdulillah."
            : `${prayed} of 5 prayers logged today. Small, steady deeds are the most beloved.`
        }
        pills={pills}
        aside={<HeroFigure value={`${prayed}/5`} label="prayers" />}
        arabic="ٱلسَّلَامُ عَلَيْكُمْ"
      />
      <div className="mb-8">
        <SubTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>
      {tab === "today" && (
        <div className="space-y-12">
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

