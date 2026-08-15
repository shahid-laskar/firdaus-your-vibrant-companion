import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_THEME, isThemeId, type ColorMode, type ThemeId } from "./themes";

const THEME_KEY = "veedu.theme";
const MODE_KEY = "theme"; // same key the existing day/night toggle already uses

type ThemeContextValue = {
  theme: ThemeId;
  mode: ColorMode;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToDocument(theme: ThemeId, mode: ColorMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset["theme"] = theme;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultMode = "light",
}: {
  children: ReactNode;
  defaultTheme?: ThemeId;
  defaultMode?: ColorMode;
}) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);
  const [mode, setModeState] = useState<ColorMode>(defaultMode);

  // Hydrate from storage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_KEY);
      if (isThemeId(storedTheme)) setThemeState(storedTheme);
      const storedMode = window.localStorage.getItem(MODE_KEY)?.replace(/"/g, "");
      if (storedMode === "dark" || storedMode === "light") setModeState(storedMode);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    applyToDocument(theme, mode);
  }, [theme, mode]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setTheme,
      setMode,
      toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [theme, mode, setTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
