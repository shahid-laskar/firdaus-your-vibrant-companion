import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/** Offline-first local store. Every module reads/writes through this. */

const PREFIX = "veedu:";
const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota — keep working in memory */
  }
  emit(key);

  // Push to cloud if logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      supabase
        .from("user_data")
        .upsert(
          {
            user_id: session.user.id,
            key: key,
            value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" },
        )
        .then(({ error }) => {
          if (error) console.error("Sync push error for key", key, ":", error);
        });
    }
  });
}

export async function syncFromCloud() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return;

  const { data, error } = await supabase.from("user_data").select("key, value");

  if (error || !data) {
    console.error("Failed to sync pull from cloud:", error);
    return;
  }

  let changed = false;
  data.forEach((row) => {
    const current = window.localStorage.getItem(PREFIX + row.key);
    const incoming = JSON.stringify(row.value);
    if (current !== incoming) {
      window.localStorage.setItem(PREFIX + row.key, incoming);
      emit(row.key);
      changed = true;
    }
  });
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      if (session) {
        syncFromCloud();
      }
    }
  });
}

/** Hydration-safe persisted state. */
export function useStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(readStore(key, initial));
    setReady(true);
    const set = listeners.get(key) ?? new Set();
    const fn = () => setValue(readStore(key, initial));
    set.add(fn);
    listeners.set(key, set);
    return () => {
      set.delete(fn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeStore(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
