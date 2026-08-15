import { type ReactNode, useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Insight } from "@/lib/intelligence";

// Routes are supplied by callers as plain paths; keep the link generic.
const LinkAny = Link as unknown as (props: Record<string, unknown>) => ReactNode;

const TONE: Record<Insight["severity"], { dot: string; label: string }> = {
  critical: { dot: "var(--destructive)", label: "Needs attention" },
  warning: {
    dot: "color-mix(in oklab, var(--destructive) 65%, var(--background))",
    label: "Worth a look",
  },
  success: { dot: "var(--space-accent)", label: "Going well" },
  info: {
    dot: "color-mix(in oklab, var(--space-accent) 45%, var(--background))",
    label: "Noticed",
  },
};

const ARROW: Record<string, string> = { up: "↑", down: "↓", flat: "→" };

/**
 * A single insight: headline, one quiet sentence, and — only when asked for —
 * a little more detail. Nothing is computed here.
 */
export function InsightCard({
  insight,
  detail,
  to,
  toLabel,
  search,
}: {
  insight: Insight;
  detail?: ReactNode;
  to?: string;
  toLabel?: string;
  search?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = TONE[insight.severity];

  return (
    <article className="rise border-border/70 bg-card/60 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-[7px] size-[7px] shrink-0 rounded-full"
          style={{ background: tone.dot }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="title-md flex flex-wrap items-baseline gap-2">
            {insight.title}
            {insight.trend && insight.trend !== "none" && (
              <span className="text-ink-faint numeric text-xs" aria-hidden="true">
                {ARROW[insight.trend]}
              </span>
            )}
          </h3>
          <p className="text-muted-foreground mt-1 text-[0.9rem] leading-relaxed">
            {insight.explanation}
          </p>

          {(detail || to) && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {detail && (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="press text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-xs transition-colors"
                >
                  {open ? "Hide detail" : "See detail"}
                </button>
              )}
              {to && (
                <LinkAny
                  to={to}
                  {...(search ? { search } : {})}
                  className="press text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-xs underline decoration-dotted underline-offset-4 transition-colors"
                >
                  {toLabel ?? "Open"}
                </LinkAny>
              )}
            </div>
          )}

          {detail && open && (
            <div id={panelId} className="reveal border-border/60 mt-4 border-t pt-4">
              {detail}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** Insufficient data — honest, never invented. */
export function NotEnoughYet({ body }: { body: string }) {
  return (
    <div className="border-border/70 rounded-2xl border border-dashed px-5 py-8 text-center">
      <p className="title-md">Keep logging a little longer</p>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-xs text-sm leading-relaxed">
        {body}
      </p>
    </div>
  );
}

export function InsightSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rise" aria-labelledby={`${eyebrow.toLowerCase()}-heading`}>
      <header className="mb-3">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${eyebrow.toLowerCase()}-heading`} className="display-lg mt-1.5">
          {title}
        </h2>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** A compact, readable row of numbers — no chart where a line will do. */
export function FigureRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="eyebrow">{i.label}</dt>
          <dd className="numeric font-display mt-1 text-lg">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Seven quiet marks: one per day. Readable at a glance on a phone. */
export function DayStrip({
  days,
  labels,
}: {
  days: { key: string; level: number }[];
  labels?: string[];
}) {
  return (
    <ul className="flex items-end gap-1.5" aria-hidden="true">
      {days.map((d, i) => (
        <li key={d.key} className="flex-1">
          <div className="bg-muted h-12 w-full overflow-hidden rounded-md">
            <div
              className="bg-space w-full rounded-md transition-[height] duration-700 ease-out"
              style={{
                height: `${Math.max(4, Math.min(100, d.level))}%`,
                marginTop: `${100 - Math.max(4, Math.min(100, d.level))}%`,
              }}
            />
          </div>
          {labels?.[i] && (
            <p className="text-ink-faint numeric mt-1 text-center text-[0.6rem]">{labels[i]}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
