import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shell } from "@/components/veedu/shell";
import { money } from "@/components/budget/modules";
import { useStore } from "@/lib/store";
import { useInsights } from "@/components/insights/use-insights";
import {
  DayStrip,
  FigureRow,
  InsightCard,
  InsightSection,
  NotEnoughYet,
} from "@/components/insights/cards";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Insights — what your week is telling you | Sunnah Home" },
      {
        name: "description",
        content:
          "A quiet reflection on your week: salah consistency, spending movement, mood and sleep patterns, and the few useful things worth doing today.",
      },
      { property: "og:title", content: "Insights — what your week is telling you" },
      {
        property: "og:description",
        content:
          "One calm page that turns what you already logged into gentle, useful understanding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function InsightsPage() {
  const data = useInsights();
  const { week, salah, budget, mood, meals, dueReminders, family, headline } = data;

  const [salahLog] = useStore<Record<string, Record<string, string>>>("salah", {});
  const [sessions] = useStore<{ date: string }[]>("quran-log", []);
  const [fasting] = useStore<Record<string, string>>("fasting", {});

  const salahStrip = useMemo(
    () =>
      week.map((date) => {
        const day = salahLog[date] ?? {};
        const onTime = Object.values(day).filter((s) => s === "ontime").length;
        return { key: date, level: (onTime / 5) * 100 };
      }),
    [week, salahLog],
  );
  const dayLetters = useMemo(
    () => week.map((d) => DAY_LETTERS[new Date(d).getDay()] ?? ""),
    [week],
  );

  const quranSessions = sessions.filter((s) => week.includes(s.date)).length;
  const fasts = week.filter((d) => fasting[d]).length;

  const topMovers = useMemo(
    () =>
      Object.entries(budget.analytics.categoryTrends)
        .filter(([cat]) => (budget.analytics.categoryTotals[cat] ?? 0) > 0)
        .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))
        .slice(0, 3),
    [budget.analytics],
  );

  const parents = family.filter((m) => m.role === "parent").length;
  const children = family.filter((m) => m.role === "child").length;

  const shown = new Set(headline.map((i) => i.id));
  const salahRest = salah.insights.filter((i) => !shown.has(i.id)).slice(0, 2);
  const budgetRest = budget.insights.filter((i) => !shown.has(i.id)).slice(0, 2);

  const openingLine = headline.length
    ? headline[0]!.explanation
    : "Nothing conclusive yet. A few more days of logging and the first real pattern will show up here.";

  return (
    <Shell space="home">
      <header className="rise mb-10">
        <p className="eyebrow">
          {week[0]} → {week[6]}
        </p>
        <h1 className="display-xl mt-3">What your week is telling you</h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm leading-relaxed">
          {openingLine}
        </p>
      </header>

      <div className="space-y-12">
        {headline.length > 0 && (
          <InsightSection eyebrow="Summary" title="Worth knowing">
            {headline.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                to={
                  insight.source === "budget"
                    ? "/budget"
                    : insight.source === "salah"
                      ? "/deen"
                      : "/me"
                }
                toLabel={
                  insight.source === "budget"
                    ? "Open Budget"
                    : insight.source === "salah"
                      ? "Open Deen"
                      : "Open Trends"
                }
                {...(insight.source === "budget"
                  ? { search: { tab: "history" } }
                  : insight.source === "salah"
                    ? { search: { tab: "salah" } }
                    : { search: { tab: "trends" } })}
              />
            ))}
          </InsightSection>
        )}

        <InsightSection eyebrow="Spiritual" title="Salah & Quran">
          {salah.hasData ? (
            <>
              <div className="border-border/70 bg-card/60 rounded-2xl border p-4 sm:p-5">
                <FigureRow
                  items={[
                    {
                      label: "Prayers logged",
                      value: `${salah.comparison.current.totalLogged}/35`,
                    },
                    {
                      label: "On time",
                      value: `${Math.round(salah.comparison.current.onTimePercentage)}%`,
                    },
                    { label: "Quran sessions", value: String(quranSessions) },
                  ]}
                />
                <div className="mt-5">
                  <DayStrip days={salahStrip} labels={dayLetters} />
                  <p className="text-muted-foreground mt-2 text-xs">
                    On-time prayers, day by day
                    {fasts > 0 ? ` · ${fasts} day${fasts > 1 ? "s" : ""} of fasting` : ""}
                  </p>
                </div>
              </div>
              {salahRest.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  to="/deen"
                  toLabel="Open Deen"
                  search={{ tab: "salah" }}
                  detail={
                    <ul className="space-y-2">
                      {Object.entries(salah.comparison.current.perPrayerConsistency)
                        .filter(([, s]) => s.logged > 0)
                        .map(([prayer, s]) => (
                          <li key={prayer} className="flex items-baseline justify-between text-sm">
                            <span className="capitalize">{prayer}</span>
                            <span className="numeric text-muted-foreground">
                              {s.onTime}/{s.logged} on time
                            </span>
                          </li>
                        ))}
                    </ul>
                  }
                />
              ))}
            </>
          ) : (
            <NotEnoughYet body="Once a few prayers are logged, your consistency and pattern will appear here." />
          )}
        </InsightSection>

        <InsightSection eyebrow="Money" title="Spending">
          {budget.hasData ? (
            <>
              <div className="border-border/70 bg-card/60 rounded-2xl border p-4 sm:p-5">
                <p className="eyebrow">This month</p>
                <p className="display-lg numeric mt-2">
                  ₹{money(budget.analytics.currentMonthTotal)}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  ₹{money(Math.round(budget.analytics.dailyAverage))} a day so far
                  {budget.analytics.previousMonthTotal > 0
                    ? ` · ${budget.analytics.delta.delta >= 0 ? "up" : "down"} ${Math.abs(
                        Math.round(budget.analytics.delta.percentage),
                      )}% on last month`
                    : ""}
                </p>
                <div className="mt-4">
                  <Link
                    to="/budget"
                    search={{ tab: "history" }}
                    className="press text-ink-soft hover:text-foreground min-h-9 text-xs underline decoration-dotted underline-offset-4"
                  >
                    See the full history
                  </Link>
                </div>
              </div>
              {budgetRest.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  to="/budget"
                  toLabel="Open Budget"
                  search={{ tab: "history" }}
                  detail={
                    <ul className="space-y-2">
                      {topMovers.map(([cat, trend]) => (
                        <li key={cat} className="flex items-baseline justify-between text-sm">
                          <span>{cat}</span>
                          <span className="numeric text-muted-foreground">
                            ₹{money(budget.analytics.categoryTotals[cat] ?? 0)}
                            {budget.analytics.previousMonthTotal > 0
                              ? ` · ${trend.delta >= 0 ? "+" : "−"}${Math.abs(Math.round(trend.percentage))}%`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  }
                />
              ))}
            </>
          ) : (
            <NotEnoughYet body="Record a few expenses and month-over-month movement will show up here." />
          )}
        </InsightSection>

        <InsightSection eyebrow="Wellbeing" title="Mood & rest">
          {mood.hasData ? (
            <InsightCard
              insight={mood.insights[0]!}
              to="/me"
              toLabel="Open Trends"
              search={{ tab: "trends" }}
              detail={
                <div className="space-y-4">
                  <FigureRow
                    items={[
                      { label: "Days checked in", value: String(mood.analytics.totalLoggedDays) },
                      { label: "Lighter days", value: String(mood.analytics.positiveDays) },
                      { label: "Heavier days", value: String(mood.analytics.negativeDays) },
                    ]}
                  />
                  {mood.insights.length > 1 && (
                    <ul className="thread">
                      {mood.insights.slice(1).map((i) => (
                        <li key={i.id} className="thread-node py-2 text-sm">
                          {i.explanation}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              }
            />
          ) : (
            <NotEnoughYet body="A handful of check-ins is enough to start seeing how rest and movement sit with your mood." />
          )}
        </InsightSection>

        <InsightSection eyebrow="Daily life" title="Useful today">
          {dueReminders.length === 0 && !meals.hasData ? (
            <NotEnoughYet body="Add a reminder or save a few recipes and this becomes the practical part of your day." />
          ) : (
            <div className="border-border/70 bg-card/60 space-y-5 rounded-2xl border p-4 sm:p-5">
              {dueReminders.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Due today</p>
                  <ul className="thread">
                    {dueReminders.map((r) => (
                      <li
                        key={r.id}
                        data-active="true"
                        className="thread-node py-2.5 text-[0.95rem]"
                      >
                        <span className="numeric text-muted-foreground mr-2 text-xs">{r.time}</span>
                        {r.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {meals.hasData && (
                <div>
                  <p className="eyebrow mb-2">Worth cooking</p>
                  <ul className="space-y-1.5">
                    {meals.suggestions.map((s) => (
                      <li
                        key={s.recipe.id}
                        className="flex items-baseline justify-between gap-3 text-[0.95rem]"
                      >
                        <span>{s.recipe.name}</span>
                        <span className="text-ink-faint text-xs">
                          {s.lastUsedWeek ? `last ${s.lastUsedWeek}` : "not yet planned"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/"
                    search={{ tab: "meals" }}
                    className="press text-ink-soft hover:text-foreground mt-3 inline-flex min-h-9 items-center text-xs underline decoration-dotted underline-offset-4"
                  >
                    Plan the week
                  </Link>
                </div>
              )}

              {family.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {parents > 0 ? `${parents} parent${parents > 1 ? "s" : ""}` : ""}
                  {parents > 0 && children > 0 ? " · " : ""}
                  {children > 0 ? `${children} child${children > 1 ? "ren" : ""}` : ""} sharing this
                  home.
                </p>
              )}
            </div>
          )}
        </InsightSection>
      </div>
    </Shell>
  );
}
