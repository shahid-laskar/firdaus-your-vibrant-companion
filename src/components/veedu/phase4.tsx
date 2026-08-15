/**
 * Phase 4 presentation primitives — shared visual language for the Daily Surface,
 * Ramadan Mode, Hifz / Muraja'ah and the Quran reader.
 *
 * Presentation only: no calculations, no data access. Everything here receives
 * values already produced by the Firdaus engines.
 */

import { type ReactNode, useId, useState } from "react";

/** A quiet temporal band heading — "Now", "Next", "Today", "Later". */
export function TimeBand({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">{label}</h2>
        {meta && <span className="text-ink-faint numeric text-[0.68rem]">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * Progressive disclosure. Collapsed by default, keyboard accessible,
 * reveals supporting detail without adding a second surface.
 */
export function Disclosure({
  summary,
  detail,
  children,
  defaultOpen = false,
}: {
  summary: string;
  detail?: string | undefined;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-border/60 border-t pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="press group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="text-foreground block truncate text-[0.9rem] font-medium">{summary}</span>
          {detail && <span className="text-ink-faint block truncate text-xs">{detail}</span>}
        </span>
        <span
          aria-hidden="true"
          className="text-ink-faint shrink-0 text-xs transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div id={id} className="reveal pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * The primary context area used by Ramadan Mode and Hifz — one calm statement
 * of what matters right now, with room for supporting facts and actions.
 */
export function ContextHero({
  eyebrow,
  headline,
  support,
  aside,
  children,
  tone = "calm",
}: {
  eyebrow: ReactNode;
  headline: string;
  support?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  tone?: "calm" | "seasonal";
}) {
  return (
    <section
      data-tone={tone}
      className="context-hero rise grid gap-6 rounded-3xl p-6 sm:p-8"
      aria-live="polite"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="eyebrow flex min-w-0 items-center gap-2">{eyebrow}</div>
          <p className="display-lg mt-2 text-balance">{headline}</p>
          {support && (
            <p className="text-ink-soft mt-2 text-[0.9rem] leading-relaxed">{support}</p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/** Two facts side by side inside a hero — e.g. Suhur and Iftar times. */
export function HeroFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-border/60 bg-card/70 min-w-0 rounded-2xl border p-4">
      <p className="eyebrow truncate">{label}</p>
      <p className="numeric font-display mt-1 text-2xl font-semibold sm:text-3xl">{value}</p>
      {note && <p className="text-ink-faint mt-0.5 text-xs">{note}</p>}
    </div>
  );
}

/** A single line of meaningful progress — no rings, no badges, no points. */
export function ProgressLine({
  label,
  value,
  pct,
  note,
}: {
  label: string;
  value: string;
  pct: number;
  note?: string | undefined;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="mb-1.5 flex min-w-0 items-baseline justify-between gap-3">
        <span className="eyebrow truncate">{label}</span>
        <span className="numeric font-display shrink-0 text-[0.95rem]">{value}</span>
      </div>
      <div
        className="bg-muted h-[5px] w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`${label}: ${value}`}
      >
        <div
          className="bg-space h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {note && <p className="text-ink-faint mt-1.5 text-xs">{note}</p>}
    </div>
  );
}

/** Quiet inline status word — calm even when something is overdue. */
export function Status({
  children,
  tone = "ambient",
}: {
  children: ReactNode;
  tone?: "urgent" | "attention" | "ambient" | "settled";
}) {
  return (
    <span className="status-chip numeric" data-tone={tone}>
      {children}
    </span>
  );
}
