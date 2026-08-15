import { useEffect, useMemo, useRef, useState } from "react";
import { Action, EmptyState, Field, Meter, Section, Tick } from "@/components/veedu/primitives";
import { ContextHero, Disclosure, ProgressLine, Status } from "@/components/veedu/phase4";
import { todayKey, uid, useNow, useStore } from "@/lib/store";
import { VERSES, verseOfDay } from "@/lib/verses";
import { getWeekRange } from "@/lib/intelligence";
import { calculateSalahAnalytics } from "@/lib/salah-intelligence";
import { ALL_SURAHS, searchSurahs } from "@/lib/quran-data";
import { useSurah, preloadBookmarkedSurahs, isSurahCached } from "@/lib/quran-service";
import {
  type HifzItem,
  type HifzRating,
  generateHifzRevisionQueue,
  getRetentionScore,
  recordHifzRevision,
  HIFZ_RATING_CONFIG,
} from "@/lib/hifz-scheduler";

import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";

export function usePrayers(date = new Date()) {
  const [profile] = useStore("profile", {
    name: "",
    city: "Kozhikode",
    gender: "",
    lat: 11.2588,
    lng: 75.7804,
    madhab: "shafi",
    method: "MuslimWorldLeague",
  });

  return useMemo(() => {
    const pLat = profile.lat ?? 11.2588;
    const pLng = profile.lng ?? 75.7804;
    const pMethod = profile.method ?? "MuslimWorldLeague";
    const pMadhab = profile.madhab ?? "shafi";

    const coordinates = new Coordinates(pLat, pLng);
    let params = (CalculationMethod as any)[pMethod]
      ? (CalculationMethod as any)[pMethod]()
      : CalculationMethod.MuslimWorldLeague();
    params.madhab = pMadhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    };

    return [
      { id: "fajr", name: "Fajr", time: formatTime(prayerTimes.fajr) },
      { id: "dhuhr", name: "Dhuhr", time: formatTime(prayerTimes.dhuhr) },
      { id: "asr", name: "Asr", time: formatTime(prayerTimes.asr) },
      { id: "maghrib", name: "Maghrib", time: formatTime(prayerTimes.maghrib) },
      { id: "isha", name: "Isha", time: formatTime(prayerTimes.isha) },
    ];
  }, [profile, date.toISOString().slice(0, 10)]);
}

type SalahLog = Record<string, Record<string, "ontime" | "late">>;

export function useSalah() {
  return useStore<SalahLog>("salah", {});
}

function minutes(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

export function useNextPrayer() {
  const now = useNow(15000);
  const prayers = usePrayers(now || new Date());
  return useMemo(() => {
    if (!now) return null;
    const cur = now.getHours() * 60 + now.getMinutes();
    const next = prayers.find((p) => minutes(p.time) > cur) ?? prayers[0]!;
    let diff = minutes(next.time) - cur;
    if (diff < 0) diff += 24 * 60;
    return { next, hours: Math.floor(diff / 60), mins: diff % 60 };
  }, [now, prayers]);
}

export function DeenHero() {
  const [log] = useSalah();
  const [profile] = useStore("profile", { name: "", city: "Kozhikode" });
  const countdown = useNextPrayer();
  const today = log[todayKey()] ?? {};
  const count = Object.keys(today).length;
  const isFriday = new Date().getDay() === 5;

  return (
    <header className="rise mb-10">
      <p className="eyebrow">{profile.city}</p>
      <h1 className="display-xl mt-3">
        {countdown ? (
          <>
            {countdown.next.name} in{" "}
            <span className="numeric text-space">
              {countdown.hours > 0 ? `${countdown.hours}h ` : ""}
              {countdown.mins}m
            </span>
          </>
        ) : (
          "Peace be upon you"
        )}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        {count} of 5 logged today · {countdown?.next.time ?? "—"}
      </p>
      {isFriday && (
        <p className="border-space/50 text-ink-soft mt-5 border-l-2 pl-4 text-sm italic">
          It's Friday — a good time for Surah Al-Kahf.
        </p>
      )}
    </header>
  );
}

export function DailyVerse() {
  const today = verseOfDay();
  const [offset, setOffset] = useState(0);
  const index = (VERSES.indexOf(today) + offset + VERSES.length * 2) % VERSES.length;
  const verse = VERSES[index]!;
  const [copied, setCopied] = useState(false);
  return (
    <section className="rise border-border/70 border-y py-8">
      <p className="eyebrow mb-5">{offset === 0 ? "Verse of the day" : "Another verse"}</p>
      <p className="arabic text-[1.9rem] leading-[2.4]">{verse.ar}</p>
      <p className="text-ink-soft mt-5 text-[1.02rem] leading-relaxed">{verse.en}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-ink-faint text-xs tracking-wide">{verse.ref}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOffset(offset + 1)}
            className="text-ink-faint hover:text-foreground text-xs"
          >
            Another
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="text-ink-faint hover:text-foreground text-xs"
            >
              Today's
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${verse.ar}\n\n${verse.en}\n— ${verse.ref}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="text-ink-faint hover:text-foreground text-xs"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function Salah() {
  const [log, setLog] = useSalah();
  const today = log[todayKey()] ?? {};
  const prayers = usePrayers();
  const week = useMemo(() => getWeekRange(new Date()), []);
  const analytics = useMemo(() => calculateSalahAnalytics(log, week), [log, week]);

  function mark(id: string, state: "ontime" | "late") {
    const day = { ...(log[todayKey()] ?? {}) };
    if (day[id] === state) delete day[id];
    else day[id] = state;
    setLog({ ...log, [todayKey()]: day });
  }

  return (
    <div className="space-y-10">
      <Section eyebrow="Today" title="Salah">
        <ul className="thread">
          {prayers.map((p) => {
            const state = today[p.id];
            return (
              <li
                key={p.id}
                data-done={!!state}
                className="thread-node flex items-center gap-3 py-3"
              >
                <Tick done={!!state} label={p.name} onToggle={() => mark(p.id, "ontime")} />
                <div className="flex-1">
                  <p className={`title-md ${state ? "text-ink-faint" : ""}`}>{p.name}</p>
                  <p className="text-ink-faint numeric text-xs">{p.time}</p>
                </div>
                <button
                  onClick={() => mark(p.id, "late")}
                  className={`press rounded-full px-2.5 py-1 text-[0.7rem] ${
                    state === "late" ? "bg-space-soft text-foreground" : "text-ink-faint"
                  }`}
                >
                  Late
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        eyebrow="Last seven days"
        title="Consistency"
        aside={
          analytics.totalLogged > 0 ? (
            <span className="text-ink-faint numeric text-xs">
              {analytics.totalLogged}/35 logged · {Math.round(analytics.onTimePercentage)}% on time
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-7 gap-2">
          {week.map((d) => {
            const day = log[d] ?? {};
            return (
              <div key={d} className="text-center">
                <div className="flex flex-col gap-1">
                  {prayers.map((p) => {
                    const s = day[p.id];
                    return (
                      <span
                        key={p.id}
                        title={`${p.name} — ${s ?? "missed"}`}
                        className="h-2.5 rounded-[3px]"
                        style={{
                          background:
                            s === "ontime"
                              ? "var(--space-accent)"
                              : s === "late"
                                ? "var(--space-accent-soft)"
                                : "var(--muted)",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-ink-faint mt-2 text-[0.62rem]">{d.slice(8)}</p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

const PHRASES = ["SubhanAllah", "Alhamdulillah", "Allahu Akbar", "Astaghfirullah"];
const TARGETS = [33, 100, 1000];

export function Tasbih() {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [target, setTarget] = useState(33);
  const [count, setCount] = useState(0);
  const [haptic, setHaptic] = useState(true);
  const done = count >= target;
  const r = 74;
  const circ = 2 * Math.PI * r;

  function tap() {
    setCount((c) => Math.min(target, c + 1));
    if (haptic && typeof navigator !== "undefined") navigator.vibrate?.(8);
  }

  return (
    <Section eyebrow="Dhikr" title="Tasbih">
      <div className="flex flex-wrap gap-1.5">
        {PHRASES.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPhrase(p);
              setCount(0);
            }}
            className={`press rounded-full px-3 py-1 text-[0.78rem] ${
              p === phrase ? "bg-space-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={tap}
        aria-label={`Count ${phrase}. ${count} of ${target}`}
        className="press mx-auto mt-8 block"
      >
        <svg viewBox="0 0 180 180" className="size-56 sm:size-64">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="var(--space-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (Math.min(count, target) / target) * circ}
            transform="rotate(-90 90 90)"
            style={{ transition: "stroke-dashoffset 260ms cubic-bezier(.2,.8,.2,1)" }}
          />
          {[...Array(target <= 100 ? target : 20)].map((_, i, arr) => {
            const a = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={90 + Math.cos(a) * (r - 16)}
                cy={90 + Math.sin(a) * (r - 16)}
                r="1.6"
                fill={i < (count / target) * arr.length ? "var(--space-accent)" : "var(--rule)"}
              />
            );
          })}
          <text
            x="90"
            y="92"
            textAnchor="middle"
            className="numeric"
            style={{ fontFamily: "var(--font-display)", fontSize: 40, fill: "var(--foreground)" }}
          >
            {count}
          </text>
          <text
            x="90"
            y="112"
            textAnchor="middle"
            style={{ fontSize: 9, letterSpacing: 2, fill: "var(--ink-faint)" }}
          >
            OF {target}
          </text>
        </svg>
      </button>

      <p className="text-ink-soft mt-2 text-center text-sm">
        {done ? "Complete — may it be accepted." : `Tap the ring for ${phrase}`}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTarget(t);
              setCount(0);
            }}
            className={`press numeric rounded-full px-3 py-1 text-[0.78rem] ${
              t === target ? "bg-space-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        <Action onClick={() => setCount(0)}>Reset</Action>
        <Action onClick={() => setHaptic(!haptic)}>
          {haptic ? "Feedback on" : "Feedback off"}
        </Action>
      </div>
    </Section>
  );
}

export function Quran() {
  const [openSurah, setOpenSurah] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [bookmarks, setBookmarks] = useStore<string[]>("quran-bookmarks", []);
  const [translation, setTranslation] = useStore("quran-translation", true);
  const [sessions, setSessions] = useStore<
    { id: string; surah: string; range: string; mins: string; date: string }[]
  >("quran-log", []);
  const [form, setForm] = useState({ surah: "", range: "", mins: "" });

  const { surah, loading, error, retry } = useSurah(openSurah);

  // Background preload for bookmarked surahs
  useEffect(() => {
    preloadBookmarkedSurahs(bookmarks);
  }, [bookmarks]);

  const filteredSurahs = useMemo(() => searchSurahs(search), [search]);

  if (openSurah !== null) {
    if (loading && !surah) {
      return (
        <div className="rise py-16 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--space-accent)] border-t-transparent mb-4" />
          <p className="title-md">Loading Surah {openSurah}…</p>
          <p className="text-muted-foreground text-xs mt-1">
            Retrieving and caching text for offline reading
          </p>
          <button
            onClick={() => setOpenSurah(null)}
            className="mt-6 text-ink-soft hover:text-foreground text-xs underline"
          >
            ← Back to Surahs
          </button>
        </div>
      );
    }

    if (error && !surah) {
      return (
        <div className="rise py-16 text-center">
          <p className="title-md text-destructive">Could not load Surah {openSurah}</p>
          <p className="text-muted-foreground text-xs mt-2 max-w-sm mx-auto">
            {error.includes("Failed to fetch") || error.includes("offline")
              ? "This Surah is not cached on this device yet. Connect to the internet once to cache it."
              : error}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Action onClick={retry}>Try again</Action>
            <Action onClick={() => setOpenSurah(null)}>Back to Surahs</Action>
          </div>
        </div>
      );
    }

    if (surah) {
      return (
        <div className="rise">
          <div className="bg-background/85 border-border/60 sticky top-0 z-10 -mx-1 mb-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-1 py-3 backdrop-blur">
            <button
              onClick={() => setOpenSurah(null)}
              className="text-ink-soft hover:text-foreground min-w-0 truncate text-left text-sm"
            >
              ← All surahs
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setTranslation(!translation)}
                className="text-ink-faint hover:text-foreground text-xs"
              >
                {translation ? "Arabic only" : "Translation"}
              </button>
              <span className="bg-border/70 h-4 w-px" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => surah.n > 1 && setOpenSurah(surah.n - 1)}
                  disabled={surah.n <= 1}
                  aria-label="Previous surah"
                  className="press text-ink-faint hover:text-foreground border-border grid size-7 place-items-center rounded-full border text-xs disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  onClick={() => surah.n < 114 && setOpenSurah(surah.n + 1)}
                  disabled={surah.n >= 114}
                  aria-label="Next surah"
                  className="press text-ink-faint hover:text-foreground border-border grid size-7 place-items-center rounded-full border text-xs disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="reader-measure">
            <header className="mb-12 text-center">
              <p className="arabic text-ink-soft text-4xl leading-tight sm:text-5xl" dir="rtl">
                {surah.arabicName}
              </p>
              <h1 className="display-lg mt-3">{surah.name}</h1>
              <p className="text-ink-faint mt-1 text-sm">{surah.meaning}</p>
              <p className="eyebrow text-ink-faint mt-3">
                {surah.revelationType} · {surah.numberOfAyahs} ayahs
              </p>

              {/* Bismillah — omitted for Al-Fatihah (Ayah 1) and At-Tawbah */}
              {surah.n !== 1 && surah.n !== 9 && (
                <div className="border-border/50 my-10 border-y py-5">
                  <p className="arabic text-ink-soft text-2xl leading-loose" dir="rtl">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  {translation && (
                    <p className="text-ink-faint mt-2 text-xs">
                      In the name of Allah, the Entirely Merciful, the Especially Merciful.
                    </p>
                  )}
                </div>
              )}
            </header>

            <div className="space-y-1">
              {surah.ayahs.map((a) => {
                const key = `${surah.n}:${a.n}`;
                const marked = bookmarks.includes(key);
                return (
                  <article key={a.n} className="ayah-block group">
                    <p
                      dir="rtl"
                      className="arabic text-[1.7rem] leading-[2.25] sm:text-[2rem] sm:leading-[2.3]"
                    >
                      {a.ar}
                      <span className="text-ink-faint border-rule mr-2 inline-grid size-7 place-items-center rounded-full border align-middle text-[0.7rem]">
                        {a.n}
                      </span>
                    </p>
                    {translation && (
                      <p className="text-ink-soft mt-3 text-[0.95rem] leading-relaxed">{a.en}</p>
                    )}
                    <div className="mt-3 flex gap-4 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        onClick={() =>
                          setBookmarks(
                            marked ? bookmarks.filter((b) => b !== key) : [...bookmarks, key]
                          )
                        }
                        aria-pressed={marked}
                        className={`text-xs ${
                          marked
                            ? "text-foreground font-medium"
                            : "text-ink-faint hover:text-foreground"
                        }`}
                      >
                        {marked ? "★ Saved" : "☆ Save"}
                      </button>
                      <button
                        onClick={() => navigator.clipboard?.writeText(`${a.ar}\n${a.en}`)}
                        className="text-ink-faint hover:text-foreground text-xs"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          setForm({ surah: surah.name, range: `Ayah ${a.n}`, mins: "5" });
                          setOpenSurah(null);
                        }}
                        className="text-ink-faint hover:text-foreground text-xs"
                      >
                        Log reading
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      );

    }
  }

  const lastRead = sessions[0];

  return (
    <div className="space-y-10">
      {lastRead && (
        <ContextHero
          eyebrow={<span>Continue reading</span>}
          headline={lastRead.surah}
          support={`You last read ${lastRead.range || "here"} on ${lastRead.date}.`}
        />
      )}

      <Section
        eyebrow="Read"
        title="Quran"
        aside={
          bookmarks.length > 0 ? (
            <span className="text-ink-faint text-xs">{bookmarks.length} saved · on device</span>
          ) : undefined
        }
      >
        <div className="mb-4">
          <Field
            label="Find a surah"
            value={search}
            placeholder="By name, meaning or number — Kahf, 18, Ya-Sin…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>


        <div className="divide-rule/70 max-h-[540px] divide-y overflow-y-auto pr-1">
          {filteredSurahs.map((s) => {
            const cached = isSurahCached(s.n);
            return (
              <button
                key={s.n}
                onClick={() => setOpenSurah(s.n)}
                className="group hover:bg-space-soft/40 grid w-full grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-2 py-3.5 text-left transition-colors"
              >
                <span className="text-ink-faint numeric text-sm">{s.n}</span>
                <span className="min-w-0">
                  <span className="title-md block truncate">{s.name}</span>
                  <span className="text-ink-faint block truncate text-xs">
                    {s.meaning} · {s.revelationType}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="arabic text-ink-soft block text-lg">{s.arabicName}</span>
                  <span className="text-ink-faint numeric block text-[0.7rem]">
                    {s.numberOfAyahs} ayahs
                    {cached && <span className="text-ink-faint/80"> · offline</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {filteredSurahs.length === 0 && (
          <p className="text-ink-faint py-6 text-center text-sm">
            Nothing matches “{search}”.
          </p>
        )}
      </Section>


      <Section
        eyebrow="Reading log"
        title="What you've read"
        aside={
          sessions.length > 0 ? (
            <span className="text-ink-faint numeric text-xs">{sessions.length} sessions</span>
          ) : undefined
        }
      >
        <div className="mb-6">
          <Disclosure summary="Log a reading" detail="Surah, range and time spent">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.surah.trim()) return;
                setSessions([{ id: uid(), ...form, date: todayKey() }, ...sessions]);
                setForm({ surah: "", range: "", mins: "" });
              }}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_90px_auto] sm:items-end"
            >
              <Field
                label="Surah"
                value={form.surah}
                placeholder="Al-Kahf"
                onChange={(e) => setForm({ ...form, surah: e.target.value })}
              />
              <Field
                label="Ayah range"
                value={form.range}
                placeholder="1–10"
                onChange={(e) => setForm({ ...form, range: e.target.value })}
              />
              <Field
                label="Minutes"
                inputMode="numeric"
                value={form.mins}
                onChange={(e) => setForm({ ...form, mins: e.target.value })}
              />
              <Action type="submit" variant="solid" className="h-[42px]">
                Log
              </Action>
            </form>
          </Disclosure>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            glyph="☾"
            headline="No sessions logged"
            body="Log what you read today — even a few ayahs are worth keeping track of."
          />
        ) : (
          <ul className="thread">
            {sessions.map((s) => (
              <li key={s.id} className="thread-node py-3">
                <p className="text-[0.95rem]">
                  {s.surah} <span className="text-ink-faint">{s.range}</span>
                </p>
                <p className="text-ink-faint numeric text-xs">
                  {s.date} · {s.mins || "—"} min
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

const DUAS = [
  {
    ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    en: "Our Lord, give us good in this world and good in the Hereafter.",
    when: "Anytime",
  },
  {
    ar: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا",
    en: "O Allah, in Your name I die and I live.",
    when: "Before sleep",
  },
  {
    ar: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ",
    en: "In the name of Allah, I place my trust in Allah.",
    when: "Leaving home",
  },
  {
    ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا",
    en: "O Allah, I ask You for beneficial knowledge.",
    when: "Studying",
  },
];

export function Duas() {
  return (
    <Section eyebrow="Adhkar" title="Duas">
      <div className="space-y-8">
        {DUAS.map((d) => (
          <article key={d.en} className="border-border/70 border-b pb-8 last:border-0">
            <p className="eyebrow mb-3">{d.when}</p>
            <p className="arabic text-[1.55rem]">{d.ar}</p>
            <p className="text-ink-soft mt-3 text-[0.95rem] leading-relaxed">{d.en}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function Hifz() {
  const [items, setItems] = useStore<HifzItem[]>("hifz", []);
  const [surah, setSurah] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ surah: string; nextDue?: string } | null>(null);

  const today = todayKey();
  const queue = useMemo(() => generateHifzRevisionQueue(items, today), [items, today]);

  const focus = queue.dueToday[0] ?? null;
  const focusRetention = focus ? getRetentionScore(focus, today) : null;
  const session = sessionId ? queue.allNormalized.find((i) => i.id === sessionId) : null;

  /** Human sentence for why a portion is being surfaced — no algorithm jargon. */
  function reason(item: HifzItem) {
    const r = getRetentionScore(item, today);
    if (r.status === "new") return "New portion — first revision sets the rhythm";
    if (r.daysOverdue > 0)
      return `Due ${r.daysOverdue} day${r.daysOverdue === 1 ? "" : "s"} ago · retention is falling`;
    if (r.isDue) return "Due today";
    return item.nextDue ? `Next revision on ${item.nextDue}` : "Settled";
  }

  function rate(itemId: string, rating: HifzRating, surahName: string) {
    const updated = recordHifzRevision(items, itemId, rating);
    setItems(updated);
    const fresh = updated.find((x) => x.id === itemId);
    setLastResult(fresh?.nextDue ? { surah: surahName, nextDue: fresh.nextDue } : { surah: surahName });
    setSessionId(null);
  }

  return (
    <div className="space-y-10">
      {/* Revision session — one portion, full attention */}
      {session ? (
        <ContextHero
          eyebrow={<span>Muraja'ah</span>}
          headline={session.surah}
          support={session.range ? `${session.range} · ${reason(session)}` : reason(session)}
          aside={
            <button
              onClick={() => setSessionId(null)}
              className="text-ink-faint hover:text-foreground text-xs"
            >
              Leave
            </button>
          }
        >
          <div>
            <p className="text-foreground mb-3 text-[0.92rem]">How did the recitation feel?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["hard", "fair", "good", "strong"] as HifzRating[]).map((rating) => {
                const cfg = HIFZ_RATING_CONFIG[rating];
                return (
                  <button
                    key={rating}
                    onClick={() => rate(session.id, rating, session.surah)}
                    className="press border-border bg-card hover:bg-space-soft/70 flex min-h-14 flex-col items-start justify-center rounded-2xl border px-4 py-2.5 text-left transition-colors"
                  >
                    <span className="text-foreground text-[0.92rem] font-medium">
                      <span aria-hidden="true" className="text-ink-faint mr-1.5">
                        {cfg.glyph}
                      </span>
                      {cfg.label}
                    </span>
                    <span className="text-ink-faint mt-0.5 text-xs">{cfg.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ContextHero>
      ) : focus && focusRetention ? (
        <ContextHero
          eyebrow={
            <>
              <span>Revise now</span>
              {queue.summary.dueCount > 1 && (
                <Status tone="attention">{queue.summary.dueCount} due</Status>
              )}
            </>
          }
          headline={focus.surah}
          support={reason(focus)}
        >
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <ProgressLine
              label="Retention"
              value={`${focusRetention.retentionPct}%`}
              pct={focusRetention.retentionPct}
              note={
                focusRetention.daysSince === null
                  ? "Not revised yet"
                  : `Last revised ${focusRetention.daysSince === 0 ? "today" : `${focusRetention.daysSince} days ago`}`
              }
            />
            <Action variant="solid" onClick={() => setSessionId(focus.id)}>
              Start revision
            </Action>
          </div>
        </ContextHero>
      ) : items.length > 0 ? (
        <ContextHero
          eyebrow={<span>Muraja'ah</span>}
          headline="Nothing due today"
          support={
            queue.completedToday.length > 0
              ? `${queue.completedToday.length} portion${queue.completedToday.length === 1 ? "" : "s"} revised today. Your memorisation is holding.`
              : "Everything you've memorised is still fresh. Come back when a portion is due."
          }
        />
      ) : null}

      {lastResult && (
        <p className="reveal text-ink-soft text-sm">
          {lastResult.surah} recorded.
          {lastResult.nextDue ? ` Next revision on ${lastResult.nextDue}.` : ""}
        </p>
      )}

      <Section
        eyebrow="Memorisation"
        title="Your portions"
        aside={
          items.length > 0 ? (
            <span className="text-ink-faint numeric text-xs">
              {queue.summary.masteredCount} complete · {queue.summary.averageRetention}% retention
            </span>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <EmptyState
            glyph="◈"
            headline="Nothing in progress"
            body="Add a surah or juz you're memorising. Revision days will be scheduled for you."
          />
        ) : (
          <ul className="thread">
            {queue.allNormalized.map((i) => {
              const retention = getRetentionScore(i, today);
              const tone =
                retention.daysOverdue > 0
                  ? "urgent"
                  : retention.isDue
                    ? "attention"
                    : retention.status === "fresh"
                      ? "settled"
                      : "ambient";
              return (
                <li
                  key={i.id}
                  className="thread-node py-4"
                  data-active={retention.isDue ? "true" : undefined}
                  data-done={!retention.isDue && retention.status === "fresh" ? "true" : undefined}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="title-md truncate">{i.surah}</p>
                      <p className="text-ink-faint mt-0.5 text-xs">{reason(i)}</p>
                    </div>
                    <span className="shrink-0 pt-0.5">
                      <Status tone={tone as "urgent" | "attention" | "ambient" | "settled"}>
                        {retention.isDue ? "Due" : `${retention.retentionPct}%`}
                      </Status>
                    </span>
                  </div>

                  <div className="mt-3">
                    <ProgressLine
                      label="Memorised"
                      value={`${i.pct}%`}
                      pct={i.pct}
                      note={i.range}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Action onClick={() => setSessionId(i.id)}>Revise</Action>
                    <Action
                      ariaLabel={`Reduce memorised amount for ${i.surah}`}
                      onClick={() =>
                        setItems(
                          items.map((x) =>
                            x.id === i.id ? { ...x, pct: Math.max(0, x.pct - 10) } : x
                          )
                        )
                      }
                    >
                      −10%
                    </Action>
                    <Action
                      ariaLabel={`Increase memorised amount for ${i.surah}`}
                      onClick={() =>
                        setItems(
                          items.map((x) =>
                            x.id === i.id ? { ...x, pct: Math.min(100, x.pct + 10) } : x
                          )
                        )
                      }
                    >
                      +10%
                    </Action>
                    <button
                      onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                      className="text-ink-faint hover:text-destructive ml-auto text-xs"
                    >
                      Remove
                    </button>
                  </div>

                  {(i.revisionHistory?.length ?? 0) > 0 && (
                    <div className="mt-3">
                      <Disclosure
                        summary="Revision history"
                        detail={`${i.revisionHistory!.length} recorded`}
                      >
                        <ul className="space-y-2">
                          {i.revisionHistory!.slice(0, 8).map((log) => (
                            <li
                              key={log.id}
                              className="text-ink-faint numeric flex items-baseline justify-between text-xs"
                            >
                              <span>{log.date}</span>
                              <span>{HIFZ_RATING_CONFIG[log.rating].label}</span>
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6">
          <Disclosure summary="Add a portion" detail="A surah, a juz, or a range of ayahs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!surah.trim()) return;
                setItems([...items, { id: uid(), surah: surah.trim(), pct: 0 }]);
                setSurah("");
              }}
              className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
            >
              <Field
                label="What are you memorising?"
                value={surah}
                placeholder="Al-Mulk, Yasin, Juz 30…"
                onChange={(e) => setSurah(e.target.value)}
              />
              <Action type="submit" variant="solid" className="h-[42px]">
                Track it
              </Action>
            </form>
          </Disclosure>
        </div>
      </Section>
    </div>
  );
}


export function Fasting() {
  const [fasts, setFasts] = useStore<Record<string, "obligatory" | "voluntary">>("fasting", {});
  const days = [...Array(28)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });
  return (
    <Section eyebrow="Last four weeks" title="Fasting">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const s = fasts[d];
          return (
            <button
              key={d}
              onClick={() => {
                const next = { ...fasts };
                if (s === "voluntary") next[d] = "obligatory";
                else if (s === "obligatory") delete next[d];
                else next[d] = "voluntary";
                setFasts(next);
              }}
              aria-label={`${d} ${s ?? "not fasted"}`}
              className="press numeric grid aspect-square place-items-center rounded-lg border text-[0.68rem]"
              style={{
                background:
                  s === "obligatory"
                    ? "var(--space-accent)"
                    : s === "voluntary"
                      ? "var(--space-accent-soft)"
                      : "transparent",
                color: s === "obligatory" ? "var(--background)" : "var(--ink-faint)",
                borderColor: s ? "transparent" : "var(--rule)",
              }}
            >
              {d.slice(8)}
            </button>
          );
        })}
      </div>
      <p className="text-ink-faint mt-4 text-xs">Tap once for voluntary, twice for obligatory.</p>
    </Section>
  );
}

export function Qibla() {
  const [heading, setHeading] = useState<number | null>(null);
  const qibla = 293;
  const ref = useRef(false);

  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent) {
      if (e.alpha != null) setHeading(e.alpha);
    }
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  async function request() {
    const anyDO = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (anyDO.requestPermission) await anyDO.requestPermission();
    ref.current = true;
  }

  const rotation = heading == null ? qibla : qibla - heading;

  return (
    <Section eyebrow="Direction" title="Qibla">
      <div className="mx-auto mt-4 w-fit">
        <svg viewBox="0 0 200 200" className="size-64">
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--rule)" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--rule)" strokeDasharray="2 6" />
          {["N", "E", "S", "W"].map((d, i) => {
            const a = (i * 90 - 90) * (Math.PI / 180);
            return (
              <text
                key={d}
                x={100 + Math.cos(a) * 82}
                y={100 + Math.sin(a) * 82 + 4}
                textAnchor="middle"
                style={{ fontSize: 10, letterSpacing: 1, fill: "var(--ink-faint)" }}
              >
                {d}
              </text>
            );
          })}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 400ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="26"
              stroke="var(--space-accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="100" cy="24" r="6" fill="var(--space-accent)" />
          </g>
          <circle cx="100" cy="100" r="3" fill="var(--ink)" />
        </svg>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        {heading == null
          ? "Holding steady at the compass bearing for Mecca."
          : `Facing ${Math.round(heading)}° — turn until the marker points up.`}
      </p>
      {heading == null && (
        <div className="mt-4 flex justify-center">
          <Action onClick={request}>Use device compass</Action>
        </div>
      )}
    </Section>
  );
}
