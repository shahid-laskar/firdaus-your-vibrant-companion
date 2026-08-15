import { useTheme } from "@/lib/theme-provider";
import { themes, type ColorMode, type ThemeDefinition } from "@/lib/themes";

function swatchFor(theme: ThemeDefinition, mode: ColorMode) {
  return mode === "dark" ? theme.swatchDark : theme.swatch;
}

/**
 * Minimal theme picker. Drop it anywhere (settings screen, dev toolbar).
 * It only writes `data-theme` + `.dark` on <html>; no component styles change.
 */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme, mode, toggleMode } = useTheme();

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Theme
        </span>
        <button
          type="button"
          onClick={toggleMode}
          className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {mode === "dark" ? "Night" : "Day"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {themes.map((t: ThemeDefinition) => {
          const s = swatchFor(t, mode);
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                active
                  ? "border-ring ring-2 ring-ring/40"
                  : "border-border hover:border-border-strong"
              }`}
              style={{ background: s.bg, color: s.fg }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full"
                  style={{ background: s.primary, outline: `1px solid ${s.border}` }}
                />
                <span className="size-3 rounded-full" style={{ background: s.accent }} />
                <span className="size-3 rounded-full" style={{ background: s.border }} />
              </span>
              <span className="mt-1.5 block text-[13px] font-semibold">{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
