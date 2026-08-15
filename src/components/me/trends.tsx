import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, Section } from "@/components/veedu/primitives";
import { useStore } from "@/lib/store";
import { average, isoOffset } from "@/lib/intelligence";
import {
  calculateMoodAnalytics,
  generateMoodInsights,
  type DailyActivityData,
} from "@/lib/mood-intelligence";
import { type SalahData } from "@/lib/salah-intelligence";

type Metrics = Record<string, { water: number; weight: string; sleep: string }>;

/** PROTOTYPE — the logging that already happens, finally given back as a picture. */
export function Trends() {
  const [metrics] = useStore<Metrics>("health", {});
  const [habits] = useStore<{ id: string; name: string; days: string[] }[]>("habits", []);
  const [checkins] = useStore<Record<string, string>>("checkins", {});
  const [salah] = useStore<SalahData>("salah", {});

  const days14 = useMemo(() => [...Array(14)].map((_, i) => isoOffset(new Date(), -(13 - i))), []);

  const data = useMemo(
    () =>
      days14.map((day) => {
        const m = metrics[day];
        return {
          day: day.slice(8),
          water: m?.water ?? 0,
          sleep: Number(m?.sleep ?? 0),
          weight: Number(m?.weight ?? 0) || null,
          habits: habits.filter((h) => h.days.includes(day)).length,
        };
      }),
    [days14, metrics, habits],
  );

  const moodActivityData: DailyActivityData[] = useMemo(() => {
    return days14.map((date) => {
      const daySalah = salah[date] || {};
      const sLogged = Object.keys(daySalah).length;
      const sOnTime = Object.values(daySalah).filter((s) => s === "ontime").length;
      const m = metrics[date];
      const entry: DailyActivityData = {
        date,
        waterGlasses: m?.water ?? 0,
        habitsCompleted: habits.filter((h) => h.days.includes(date)).length,
      };
      if (checkins[date]) entry.mood = checkins[date];
      if (m?.sleep && Number(m.sleep) > 0) entry.sleepHours = Number(m.sleep);
      if (sLogged > 0) entry.salahOnTimePct = (sOnTime / sLogged) * 100;
      return entry;
    });
  }, [days14, salah, metrics, checkins, habits]);

  const moodAnalytics = useMemo(() => calculateMoodAnalytics(moodActivityData), [moodActivityData]);
  const moodInsights = useMemo(() => generateMoodInsights(moodAnalytics), [moodAnalytics]);

  const logged = data.filter((d) => d.water || d.sleep || d.weight).length;
  const avgWater = average(data.map((d) => d.water)).toFixed(1);
  const sleepValues = data.filter((d) => d.sleep > 0).map((d) => d.sleep);
  const avgSleep = (sleepValues.length ? average(sleepValues) : 0).toFixed(1);

  if (logged === 0) {
    return (
      <Section eyebrow="Two weeks" title="Trends">
        <EmptyState
          glyph="◇"
          headline="Nothing to draw yet"
          body="Log water, sleep or weight for a few days and the shape of the fortnight appears here."
        />
      </Section>
    );
  }

  const axis = { stroke: "var(--ink-faint)", fontSize: 10 } as const;
  const tooltip = {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--rule)",
      borderRadius: 12,
      fontSize: 12,
    },
  };

  return (
    <div className="space-y-10">
      <Section eyebrow="Last 14 days" title="Water">
        <p className="text-muted-foreground mb-4 text-sm">Averaging {avgWater} glasses a day.</p>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} {...axis} />
              <YAxis width={22} tickLine={false} axisLine={false} {...axis} />
              <Tooltip {...tooltip} />
              <Bar dataKey="water" radius={[4, 4, 0, 0]} fill="var(--space-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section eyebrow="Last 14 days" title="Sleep">
        <p className="text-muted-foreground mb-4 text-sm">Averaging {avgSleep} hours a night.</p>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} {...axis} />
              <YAxis width={22} domain={[0, 10]} tickLine={false} axisLine={false} {...axis} />
              <Tooltip {...tooltip} />
              <Area
                dataKey="sleep"
                type="monotone"
                stroke="var(--space-accent)"
                fill="var(--space-accent-soft)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section eyebrow="Last 14 days" title="Weight">
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} {...axis} />
              <YAxis
                width={34}
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                {...axis}
              />
              <Tooltip {...tooltip} />
              <Line
                dataKey="weight"
                type="monotone"
                dot={false}
                connectNulls
                stroke="var(--brass)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {habits.length > 0 && (
        <Section eyebrow="Last 14 days" title="Habits kept">
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} {...axis} />
                <YAxis
                  width={22}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  {...axis}
                />
                <Tooltip {...tooltip} />
                <Bar dataKey="habits" radius={[4, 4, 0, 0]} fill="var(--leaf)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-ink-faint mt-3 text-xs">Out of {habits.length} tracked habits.</p>
        </Section>
      )}

      {moodInsights.filter((i) => i.severity === "success").length > 0 && (
        <Section eyebrow="Observations" title="Patterns noticed">
          <ul className="thread">
            {moodInsights
              .filter((i) => i.severity === "success")
              .map((ins) => (
                <li key={ins.id} className="thread-node py-3">
                  <p className="text-[0.95rem]">{ins.explanation}</p>
                </li>
              ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
