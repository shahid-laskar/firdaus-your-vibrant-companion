/**
 * Ramadan Mode Engine — Suhur/Iftar context, Taraweeh tracking, Quran Khatm planner, and charity logging.
 */

import { hijriParts } from "./hijri";
import { isoDate, type DailySignal } from "./intelligence";
import { uid, useStore } from "./store";

export interface SuhurIftarContext {
  suhurTime: string; // HH:mm (Fajr)
  iftarTime: string; // HH:mm (Maghrib)
  phase: "suhur" | "fasting" | "iftar";
  countdownText: string;
  minutesRemaining: number;
  iftarDua: {
    ar: string;
    en: string;
    transliteration: string;
  };
  suhurDua: {
    ar: string;
    en: string;
    transliteration: string;
  };
}

export interface TaraweehRecord {
  date: string; // YYYY-MM-DD
  rakahs: number; // 8, 20, etc.
  location: "masjid" | "home";
  tahajjudRakahs?: number | undefined;
  note?: string | undefined;
}

export interface RamadanKhatm {
  targetKhatms: number; // default 1
  completedJuz: number[]; // array of juz numbers (1-30)
  dailyTargetPages: number; // default 20 (1 juz / day)
}

export interface RamadanCharityItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount?: number | undefined;
  category: "sadaqah" | "zakat_fitr" | "food" | "good_deed";
}

export const IFTAR_DUA = {
  ar: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ",
  transliteration: "Dhahaba adh-dhama'u wabtallat al-'urooqu wa thabata al-ajru in sha Allah",
  en: "The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.",
};

export const SUHUR_DUA = {
  ar: "وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ",
  transliteration: "Wa bi-sawmi ghadin nawaytu min shahri Ramadan",
  en: "I intend to keep the fast tomorrow for the month of Ramadan.",
};

/** Determine if a given date falls within the month of Ramadan */
export function isRamadanDate(d = new Date()): boolean {
  const parts = hijriParts(d);
  return parts !== null && parts.month === 9;
}

/** Get the current day of Ramadan (1 to 30) or null if not in Ramadan */
export function getRamadanDay(d = new Date()): number | null {
  const parts = hijriParts(d);
  if (!parts || parts.month !== 9) return null;
  return parts.day;
}

/** Hook for accessing and toggling Ramadan mode */
export function useRamadanMode() {
  const [override, setOverride] = useStore<boolean>("ramadan-override", false);
  const isNaturalRamadan = isRamadanDate();
  const isActive = isNaturalRamadan || override;
  const naturalDay = getRamadanDay();
  const ramadanDay = isActive ? naturalDay ?? 1 : null;

  return {
    isActive,
    isNaturalRamadan,
    ramadanDay,
    override,
    setOverride,
  };
}

/** Calculate time-of-day Suhur & Iftar context from prayer times */
export function calculateSuhurIftar(
  fajrTimeStr: string,
  maghribTimeStr: string,
  now = new Date()
): SuhurIftarContext {
  const [fH, fM] = fajrTimeStr.split(":").map((x) => parseInt(x, 10));
  const [mH, mM] = maghribTimeStr.split(":").map((x) => parseInt(x, 10));

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const fajrMinutes = (fH ?? 5) * 60 + (fM ?? 0);
  const maghribMinutes = (mH ?? 18) * 60 + (mM ?? 30);

  let phase: "suhur" | "fasting" | "iftar" = "fasting";
  let countdownText = "";
  let minutesRemaining = 0;

  if (currentMinutes < fajrMinutes) {
    // Before Fajr: Suhur window
    phase = "suhur";
    minutesRemaining = fajrMinutes - currentMinutes;
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    countdownText = hours > 0 ? `Suhur ends in ${hours}h ${mins}m` : `Suhur ends in ${mins}m`;
  } else if (currentMinutes < maghribMinutes) {
    // Between Fajr and Maghrib: Fasting
    phase = "fasting";
    minutesRemaining = maghribMinutes - currentMinutes;
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    countdownText = hours > 0 ? `Iftar in ${hours}h ${mins}m` : `Iftar in ${mins}m`;
  } else {
    // After Maghrib: Iftar window
    phase = "iftar";
    const minutesSinceIftar = currentMinutes - maghribMinutes;
    if (minutesSinceIftar <= 120) {
      countdownText = "Iftar Mubarak — may Allah accept your fast";
      minutesRemaining = 0;
    } else {
      // Next day's suhur calculation
      const tomorrowFajrMinutes = 24 * 60 + fajrMinutes;
      minutesRemaining = tomorrowFajrMinutes - currentMinutes;
      const hours = Math.floor(minutesRemaining / 60);
      const mins = minutesRemaining % 60;
      countdownText = `Next Suhur ends in ${hours}h ${mins}m`;
    }
  }

  return {
    suhurTime: fajrTimeStr,
    iftarTime: maghribTimeStr,
    phase,
    countdownText,
    minutesRemaining,
    iftarDua: IFTAR_DUA,
    suhurDua: SUHUR_DUA,
  };
}

/** Hook for Taraweeh records */
export function useTaraweeh() {
  const [taraweehLog, setTaraweehLog] = useStore<Record<string, TaraweehRecord>>("ramadan-taraweeh", {});

  const logTaraweeh = (
    date: string,
    rakahs: number,
    location: "masjid" | "home" = "masjid",
    tahajjudRakahs?: number,
    note?: string
  ) => {
    setTaraweehLog({
      ...taraweehLog,
      [date]: { date, rakahs, location, tahajjudRakahs, note },
    });
  };

  const removeTaraweeh = (date: string) => {
    const next = { ...taraweehLog };
    delete next[date];
    setTaraweehLog(next);
  };

  return { taraweehLog, logTaraweeh, removeTaraweeh };
}

/** Hook for Ramadan Quran Khatm Planner */
export function useRamadanKhatm() {
  const [khatm, setKhatm] = useStore<RamadanKhatm>("ramadan-khatm", {
    targetKhatms: 1,
    completedJuz: [],
    dailyTargetPages: 20,
  });

  const toggleJuz = (juzNumber: number) => {
    if (juzNumber < 1 || juzNumber > 30) return;
    const exists = khatm.completedJuz.includes(juzNumber);
    const completedJuz = exists
      ? khatm.completedJuz.filter((j) => j !== juzNumber)
      : [...khatm.completedJuz, juzNumber].sort((a, b) => a - b);
    setKhatm({ ...khatm, completedJuz });
  };

  const progressPercentage = Math.round((khatm.completedJuz.length / 30) * 100);

  return {
    khatm,
    setKhatm,
    toggleJuz,
    progressPercentage,
    completedCount: khatm.completedJuz.length,
  };
}

/** Hook for Ramadan Charity and Good Deeds */
export function useRamadanCharity() {
  const [charityLog, setCharityLog] = useStore<RamadanCharityItem[]>("ramadan-charity", []);

  const addCharity = (
    title: string,
    amount?: number,
    category: "sadaqah" | "zakat_fitr" | "food" | "good_deed" = "sadaqah",
    date = isoDate()
  ) => {
    const item: RamadanCharityItem = {
      id: uid(),
      date,
      title: title.trim(),
      amount,
      category,
    };
    setCharityLog([item, ...charityLog]);
  };

  const removeCharity = (id: string) => {
    setCharityLog(charityLog.filter((c) => c.id !== id));
  };

  return { charityLog, addCharity, removeCharity };
}

/** Generate operational Ramadan deen signals for Daily Operating Surface */
export function generateRamadanSignals(
  suhurIftar: SuhurIftarContext | null,
  taraweehDoneToday: boolean,
  ramadanDay: number | null,
  today = isoDate()
): DailySignal[] {
  const signals: DailySignal[] = [];

  if (suhurIftar) {
    if (suhurIftar.phase === "suhur" && suhurIftar.minutesRemaining <= 60) {
      signals.push({
        id: `ramadan-suhur-${today}`,
        category: "deen",
        priority: "high",
        reason: `${suhurIftar.countdownText} (Cutoff: ${suhurIftar.suhurTime})`,
        action: { label: "View Suhur Dua", href: "/deen?tab=ramadan" },
        source: "ramadan-mode",
      });
    } else if (suhurIftar.phase === "fasting" && suhurIftar.minutesRemaining <= 90) {
      signals.push({
        id: `ramadan-iftar-${today}`,
        category: "deen",
        priority: "high",
        reason: `${suhurIftar.countdownText} (Maghrib: ${suhurIftar.iftarTime})`,
        action: { label: "Iftar Dua", href: "/deen?tab=ramadan" },
        source: "ramadan-mode",
      });
    }
  }

  if (ramadanDay && !taraweehDoneToday) {
    signals.push({
      id: `ramadan-taraweeh-${today}`,
      category: "deen",
      priority: "medium",
      reason: `Ramadan Night ${ramadanDay} — log your Taraweeh prayer`,
      action: { label: "Log Taraweeh", href: "/deen?tab=ramadan" },
      source: "ramadan-mode",
    });
  }

  return signals;
}
