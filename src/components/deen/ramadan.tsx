import { useMemo, useState } from "react";
import { Action, EmptyState, Field, Section } from "@/components/veedu/primitives";
import { ContextHero, Disclosure, HeroFact, ProgressLine, Status } from "@/components/veedu/phase4";
import { todayKey, useNow, useStore } from "@/lib/store";
import { usePrayers } from "./modules";
import {
  calculateSuhurIftar,
  useRamadanCharity,
  useRamadanKhatm,
  useRamadanMode,
  useTaraweeh,
} from "@/lib/ramadan";

export function RamadanModeView() {
  const { isActive, isNaturalRamadan, ramadanDay, override, setOverride } = useRamadanMode();
  const prayers = usePrayers();
  const now = useNow(30_000);
  const today = todayKey();

  const fajrTime = prayers.find((p) => p.id === "fajr")?.time ?? "05:00";
  const maghribTime = prayers.find((p) => p.id === "maghrib")?.time ?? "18:30";

  const suhurIftar = useMemo(
    () => calculateSuhurIftar(fajrTime, maghribTime, now ?? new Date()),
    [fajrTime, maghribTime, now]
  );

  const [fasts, setFasts] = useStore<Record<string, "obligatory" | "voluntary">>("fasting", {});
  const isFastingToday = Boolean(fasts[today]);

  const { taraweehLog, logTaraweeh } = useTaraweeh();
  const taraweehToday = taraweehLog[today];

  const { khatm, toggleJuz, progressPercentage, completedCount } = useRamadanKhatm();
  const { charityLog, addCharity, removeCharity } = useRamadanCharity();

  const [charityTitle, setCharityTitle] = useState("");
  const [charityAmount, setCharityAmount] = useState("");
  const [charityCategory, setCharityCategory] = useState<
    "sadaqah" | "zakat_fitr" | "food" | "good_deed"
  >("sadaqah");

  const previewToggle = (
    <button
      onClick={() => setOverride(!override)}
      className="press text-ink-faint hover:text-foreground border-border bg-background/70 rounded-full border px-2.5 py-1 text-[0.7rem]"
    >
      {override ? "Preview on" : "Preview"}
    </button>
  );

  // Outside Ramadan, and with no preview: a quiet, honest waiting state.
  if (!isActive) {
    return (
      <div className="rise space-y-8">
        <EmptyState
          glyph="☾"
          headline="Ramadan is not here yet"
          body="When the month begins, this space opens on its own — Suhur and Iftar timing, your fast, Taraweeh, the Khatm journey and your giving."
          action={<Action onClick={() => setOverride(true)}>Preview Ramadan Mode</Action>}
        />
      </div>
    );
  }

  const phaseCopy =
    suhurIftar.phase === "suhur"
      ? "The night is still yours. Eat gently, and make your intention."
      : suhurIftar.phase === "fasting"
        ? "You are fasting. Keep the day light and unhurried."
        : "The fast is complete. Break it slowly.";

  const dua = suhurIftar.phase === "suhur" ? suhurIftar.suhurDua : suhurIftar.iftarDua;
  const duaLabel = suhurIftar.phase === "suhur" ? "Suhur intention" : "Iftar dua";

  const journeyDone =
    (isFastingToday ? 1 : 0) +
    (taraweehToday ? 1 : 0) +
    (charityLog.some((c) => c.date === today) ? 1 : 0) +
    (completedCount >= (ramadanDay ?? 1) ? 1 : 0);

  return (
    <div className="rise space-y-10">
      {/* 1. Suhur / Iftar — the one thing that matters right now */}
      <ContextHero
        tone="seasonal"
        eyebrow={
          <>
            <span aria-hidden="true">☾</span>
            <span className="truncate">
              {ramadanDay ? `Ramadan · Day ${ramadanDay}` : "Ramadan Mubarak"}
            </span>
            {!isNaturalRamadan && <Status tone="settled">Preview</Status>}
          </>
        }
        headline={suhurIftar.countdownText}
        support={phaseCopy}
        aside={previewToggle}
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <HeroFact label="Suhur ends" value={suhurIftar.suhurTime} note="Fajr cutoff" />
          <HeroFact label="Iftar" value={suhurIftar.iftarTime} note="At Maghrib" />
        </div>

        <Disclosure summary={duaLabel} detail={dua.transliteration}>
          <p className="arabic text-xl leading-relaxed sm:text-2xl" dir="rtl">
            {dua.ar}
          </p>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">{dua.en}</p>
        </Disclosure>
      </ContextHero>

      {/* 2. One day, one journey — fast, Qiyam, Quran, giving */}
      <Section
        eyebrow="Today's journey"
        title="Your day of Ramadan"
        aside={
          <span className="text-ink-faint numeric text-xs">{journeyDone} of 4 kept</span>
        }
      >
        <ul className="thread">
          <li className="thread-node py-4" data-done={isFastingToday ? "true" : undefined}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="title-md">Fasting</p>
                <p className="text-ink-faint mt-0.5 text-xs">
                  {isFastingToday
                    ? "Recorded for today. May it be accepted."
                    : "Not recorded yet today."}
                </p>
              </div>
              <button
                onClick={() => {
                  const next = { ...fasts };
                  if (isFastingToday) delete next[today];
                  else next[today] = "obligatory";
                  setFasts(next);
                }}
                aria-pressed={isFastingToday}
                className={`press shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isFastingToday
                    ? "bg-space text-background border-transparent"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {isFastingToday ? "Fasted" : "Mark fasted"}
              </button>
            </div>
          </li>

          <li className="thread-node py-4" data-done={taraweehToday ? "true" : undefined}>
            <p className="title-md">Taraweeh &amp; Qiyam</p>
            <p className="text-ink-faint mt-0.5 text-xs">
              {taraweehToday
                ? `${taraweehToday.rakahs} rak'ahs · ${taraweehToday.location}`
                : "Not logged yet tonight."}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(
                [
                  { rakahs: 8, location: "masjid" as const, label: "8 · masjid" },
                  { rakahs: 20, location: "masjid" as const, label: "20 · masjid" },
                  { rakahs: 8, location: "home" as const, label: "8 · home" },
                ]
              ).map((opt) => {
                const on =
                  taraweehToday?.rakahs === opt.rakahs && taraweehToday?.location === opt.location;
                return (
                  <button
                    key={opt.label}
                    onClick={() => logTaraweeh(today, opt.rakahs, opt.location)}
                    aria-pressed={on}
                    className={`press min-h-8 rounded-full border px-3 text-xs font-medium ${
                      on
                        ? "bg-space text-background border-transparent"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </li>

          <li className="thread-node py-4">
            <ProgressLine
              label="Quran · Khatm"
              value={`${completedCount}/30 juz`}
              pct={progressPercentage}
              note={
                ramadanDay
                  ? completedCount >= ramadanDay
                    ? "On pace with the month."
                    : `${ramadanDay - completedCount} juz behind day ${ramadanDay}.`
                  : "Thirty juz across the month."
              }
            />
            <div className="mt-3">
              <Disclosure summary="Mark the juz you've completed" detail={`${progressPercentage}% of the Khatm`}>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
                  {[...Array(30)].map((_, idx) => {
                    const juzNum = idx + 1;
                    const isDone = khatm.completedJuz.includes(juzNum);
                    return (
                      <button
                        key={juzNum}
                        onClick={() => toggleJuz(juzNum)}
                        aria-pressed={isDone}
                        aria-label={`Juz ${juzNum}${isDone ? ", completed" : ""}`}
                        className={`press numeric grid aspect-square min-h-9 place-items-center rounded-xl border text-xs transition-colors ${
                          isDone
                            ? "bg-space text-background border-transparent font-semibold"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-space-soft/50"
                        }`}
                      >
                        {juzNum}
                      </button>
                    );
                  })}
                </div>
              </Disclosure>
            </div>
          </li>

          <li
            className="thread-node py-4"
            data-done={charityLog.some((c) => c.date === today) ? "true" : undefined}
          >
            <p className="title-md">Giving</p>
            <p className="text-ink-faint mt-0.5 text-xs">
              {charityLog.length === 0
                ? "Nothing recorded yet — small acts count."
                : `${charityLog.length} recorded this month`}
            </p>
            <div className="mt-3">
              <Disclosure summary="Record a deed or charity" detail="Sadaqah, Zakat al-Fitr, feeding the fasting">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!charityTitle.trim()) return;
                    const amt = charityAmount ? parseFloat(charityAmount) : undefined;
                    addCharity(charityTitle, amt, charityCategory);
                    setCharityTitle("");
                    setCharityAmount("");
                  }}
                  className="grid gap-3 sm:grid-cols-[1fr_110px_150px_auto] sm:items-end"
                >
                  <Field
                    label="Deed"
                    value={charityTitle}
                    placeholder="Iftar for a neighbour…"
                    onChange={(e) => setCharityTitle(e.target.value)}
                  />
                  <Field
                    label="Amount"
                    type="number"
                    inputMode="decimal"
                    value={charityAmount}
                    placeholder="0"
                    onChange={(e) => setCharityAmount(e.target.value)}
                  />
                  <label className="block">
                    <span className="eyebrow">Kind</span>
                    <select
                      value={charityCategory}
                      onChange={(e) => setCharityCategory(e.target.value as typeof charityCategory)}
                      className="border-border/80 focus:border-space mt-1.5 min-h-[42px] w-full rounded-xl border bg-transparent px-3 text-[0.9rem] outline-none"
                    >
                      <option value="sadaqah">Sadaqah</option>
                      <option value="zakat_fitr">Zakat al-Fitr</option>
                      <option value="food">Feeding the fasting</option>
                      <option value="good_deed">Good deed</option>
                    </select>
                  </label>
                  <Action type="submit" variant="solid" className="h-[42px]">
                    Record
                  </Action>
                </form>

                {charityLog.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {charityLog.map((c) => (
                      <li
                        key={c.id}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-[0.92rem]">{c.title}</p>
                          <p className="text-ink-faint numeric mt-0.5 text-xs">
                            {c.date} · <span className="capitalize">{c.category.replace("_", " ")}</span>
                            {c.amount !== undefined && ` · ₹${c.amount}`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCharity(c.id)}
                          className="text-ink-faint hover:text-destructive shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Disclosure>
            </div>
          </li>
        </ul>
      </Section>
    </div>
  );
}
