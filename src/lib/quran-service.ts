/**
 * Isolated Quran Data Service with offline caching and background pre-fetching.
 * UI components interact exclusively through this service.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ALL_SURAHS,
  INITIAL_OFFLINE_SURAHS,
  getSurahMeta,
  type Ayah,
  type SurahDetail,
  type SurahMeta,
} from "./quran-data";
import { readStore, writeStore } from "./store";

const QURAN_API_BASE = "https://api.alquran.cloud/v1";
const memoryCache = new Map<number, SurahDetail>();
const inFlightRequests = new Map<number, Promise<SurahDetail>>();

// Seed initial memory cache with bundled offline surahs
for (const [key, detail] of Object.entries(INITIAL_OFFLINE_SURAHS)) {
  memoryCache.set(Number(key), detail);
}

/** Check whether a surah is already present in memory or localStorage cache */
export function isSurahCached(surahNumber: number): boolean {
  if (memoryCache.has(surahNumber)) return true;
  if (typeof window === "undefined") return false;
  const stored = readStore<SurahDetail | null>(`quran-surah-${surahNumber}`, null);
  return stored !== null && Array.isArray(stored.ayahs) && stored.ayahs.length > 0;
}

/** Synchronously retrieve a surah from cache if available */
export function getSurahCached(surahNumber: number): SurahDetail | null {
  if (memoryCache.has(surahNumber)) {
    return memoryCache.get(surahNumber)!;
  }
  const stored = readStore<SurahDetail | null>(`quran-surah-${surahNumber}`, null);
  if (stored && Array.isArray(stored.ayahs) && stored.ayahs.length > 0) {
    memoryCache.set(surahNumber, stored);
    return stored;
  }
  if (INITIAL_OFFLINE_SURAHS[surahNumber]) {
    memoryCache.set(surahNumber, INITIAL_OFFLINE_SURAHS[surahNumber]!);
    return INITIAL_OFFLINE_SURAHS[surahNumber]!;
  }
  return null;
}

interface AlQuranEditionAyah {
  numberInSurah: number;
  text: string;
  juz?: number;
  page?: number;
}

interface AlQuranEditionResponse {
  code: number;
  status: string;
  data: Array<{
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: AlQuranEditionAyah[];
    edition: {
      identifier: string;
      language: string;
      name: string;
    };
  }>;
}

/**
 * Fetch a Surah by number with Arabic (Uthmani) and English (Sahih International).
 * Prioritizes local cache; falls back to API and caches response offline.
 */
export async function fetchSurah(surahNumber: number): Promise<SurahDetail> {
  if (surahNumber < 1 || surahNumber > 114) {
    throw new Error(`Invalid Surah number: ${surahNumber}. Must be between 1 and 114.`);
  }

  // 1. Check in-memory cache
  const cached = getSurahCached(surahNumber);
  if (cached) {
    return cached;
  }

  // 2. Check if a fetch is already in flight for this Surah
  if (inFlightRequests.has(surahNumber)) {
    return inFlightRequests.get(surahNumber)!;
  }

  const meta = getSurahMeta(surahNumber) ?? {
    n: surahNumber,
    name: `Surah ${surahNumber}`,
    arabicName: "",
    meaning: "",
    numberOfAyahs: 0,
    revelationType: "Meccan",
  };

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `${QURAN_API_BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih`
      );

      if (!response.ok) {
        throw new Error(`Quran API returned HTTP ${response.status}`);
      }

      const json: AlQuranEditionResponse = await response.json();
      if (!json.data || json.data.length < 2) {
        throw new Error("Malformed Quran API response: missing editions");
      }

      const arabicEdition = json.data.find((d) => d.edition.identifier === "quran-uthmani") ?? json.data[0]!;
      const englishEdition = json.data.find((d) => d.edition.identifier === "en.sahih") ?? json.data[1]!;

      const ayahs: Ayah[] = arabicEdition.ayahs.map((arAyah, index) => {
        const enAyah = englishEdition.ayahs[index];
        return {
          n: arAyah.numberInSurah,
          ar: arAyah.text,
          en: enAyah ? enAyah.text : "",
          juz: arAyah.juz,
          page: arAyah.page,
        };
      });

      const detail: SurahDetail = {
        n: surahNumber,
        name: meta.name || arabicEdition.englishName,
        arabicName: meta.arabicName || arabicEdition.name,
        meaning: meta.meaning || arabicEdition.englishNameTranslation,
        numberOfAyahs: arabicEdition.numberOfAyahs || ayahs.length,
        revelationType: (arabicEdition.revelationType as "Meccan" | "Medinan") || meta.revelationType,
        ayahs,
      };

      // Store in memory & persistent store for offline access
      memoryCache.set(surahNumber, detail);
      writeStore(`quran-surah-${surahNumber}`, detail);

      return detail;
    } catch (err) {
      // If network fails, check if seed data exists
      if (INITIAL_OFFLINE_SURAHS[surahNumber]) {
        const seed = INITIAL_OFFLINE_SURAHS[surahNumber]!;
        memoryCache.set(surahNumber, seed);
        return seed;
      }
      throw err;
    } finally {
      inFlightRequests.delete(surahNumber);
    }
  })();

  inFlightRequests.set(surahNumber, fetchPromise);
  return fetchPromise;
}

/** Preload a Surah in the background without throwing errors */
export async function preloadSurah(surahNumber: number): Promise<SurahDetail | null> {
  if (isSurahCached(surahNumber)) return getSurahCached(surahNumber);
  try {
    return await fetchSurah(surahNumber);
  } catch (e) {
    console.warn(`[QuranService] Background preload failed for Surah ${surahNumber}:`, e);
    return null;
  }
}

/** Preload all Surahs referenced in the user's bookmark list */
export async function preloadBookmarkedSurahs(bookmarks: string[]): Promise<void> {
  if (!bookmarks || bookmarks.length === 0) return;
  const surahNumbers = new Set<number>();
  for (const b of bookmarks) {
    const parts = b.split(":");
    const n = parseInt(parts[0] ?? "", 10);
    if (!isNaN(n) && n >= 1 && n <= 114) {
      surahNumbers.add(n);
    }
  }

  for (const n of surahNumbers) {
    if (!isSurahCached(n)) {
      await preloadSurah(n);
    }
  }
}

/** React hook for consuming Surah data with loading, error, and caching status */
export function useSurah(surahNumber: number | null) {
  const [surah, setSurah] = useState<SurahDetail | null>(() =>
    surahNumber ? getSurahCached(surahNumber) : null
  );
  const [loading, setLoading] = useState<boolean>(() =>
    Boolean(surahNumber && !getSurahCached(surahNumber))
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!surahNumber) {
      setSurah(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = getSurahCached(surahNumber);
    if (cached) {
      setSurah(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchSurah(surahNumber)
      .then((data) => {
        setSurah(data);
        setError(null);
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Could not load Surah. Please check your internet connection.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [surahNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return { surah, loading, error, retry: load };
}
