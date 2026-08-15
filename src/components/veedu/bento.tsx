/**
 * Dawn Bloom — the bento surface kit (Firdaus Premium).
 *
 * Presentation only. Every component here is a *tone carrier*: it takes a
 * life-area voice ("prayer", "task", "kids"…) and renders it with the matching
 * tinted field, icon container and ink. Nothing computes, nothing fetches.
 */

import { Link } from "@tanstack/react-router";
import type { ComponentType, CSSProperties, ReactNode } from "react";

export type Tone =
  | "prayer"
  | "task"
  | "meal"
  | "kids"
  | "grocery"
  | "habit"
  | "money"
  | "self";

type LinkTo = "/deen" | "/me" | "/budget" | "/review" | "/";

/** A tonal bento tile. Becomes a link when `to` is given. */
export function Tile({
  tone,
  to,
  onClick,
  className = "",
  index = 0,
  children,
  plain = false,
  quiet = false,
}: {
  tone?: Tone;
  to?: LinkTo;
  onClick?: () => void;
  className?: string;
  index?: number;
  children: ReactNode;
  /** plain = card surface instead of a tinted field */
  plain?: boolean | undefined;
  /** quiet = calm tonal surface for secondary information */
  quiet?: boolean | undefined;
}) {
  const surface = plain
    ? "border border-border/70 shadow-[var(--shadow-lift)]"
    : quiet
      ? "tile-quiet"
      : "tile-vivid";
  const cls = `tile bloom-in ${surface} ${className}`;
  const style = { "--i": index } as CSSProperties;

  if (to) {
    return (
      <Link to={to} data-tone={tone} className={`${cls} block`} style={style}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-tone={tone}
        className={`${cls} w-full text-left`}
        style={style}
      >
        {children}
      </button>
    );
  }
  return (
    <div data-tone={tone} className={cls} style={style}>
      {children}
    </div>
  );
}

/** The signature glyph holder — soft field, or a glowing gradient orb. */
export function IconChip({
  icon: Icon,
  solid = false,
  className = "",
  float = false,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  solid?: boolean;
  className?: string;
  float?: boolean;
}) {
  return (
    <span
      className={`${solid ? "icon-orb" : "icon-orb-soft"} ${float ? "float-soft" : ""} ${className}`}
    >
      <Icon className="size-[1.15rem]" strokeWidth={2.1} />
    </span>
  );
}

/** A compact tonal stat: icon, an expressive number, a human line. */
export function StatTile({
  tone,
  icon,
  figure,
  title,
  note,
  to,
  index = 0,
  emoji,
}: {
  tone: Tone;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  figure: string;
  title: string;
  note?: string;
  to?: LinkTo;
  index?: number;
  emoji?: string;
}) {
  return (
    <Tile
      tone={tone}
      {...(to ? { to } : {})}
      index={index}
      className="flex min-h-[9.75rem] flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2">
        <IconChip icon={icon} solid />
        <span className="figure-xl">{figure}</span>
      </div>
      <div className="mt-4">
        <p className="title-md text-[0.98rem]">
          {title}
          {emoji ? <span className="ml-1.5 text-[0.9rem]">{emoji}</span> : null}
        </p>
        {note && <p className="text-ink-soft mt-0.5 text-[0.78rem] font-medium">{note}</p>}
      </div>
    </Tile>
  );
}

/** A wide, calm row inside the bento — icon, label, value, optional trailing chip. */
export function RowTile({
  tone,
  icon,
  label,
  value,
  trailing,
  to,
  index = 0,
  wide = false,
}: {
  tone: Tone;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  trailing?: ReactNode;
  to?: LinkTo;
  index?: number;
  wide?: boolean;
}) {
  return (
    <Tile
      tone={tone}
      {...(to ? { to } : {})}
      index={index}
      className={`flex items-center gap-3 ${wide ? "col-span-2" : ""}`}
    >
      <IconChip icon={icon} />
      <span className="min-w-0 flex-1">
        <span className="text-ink-soft block text-[0.7rem] font-bold tracking-wide uppercase">
          {label}
        </span>
        <span className="title-md block truncate text-[0.95rem]">{value}</span>
      </span>
      {trailing}
    </Tile>
  );
}

/** Progress as a gentle arc, not a bar chart. */
export function ProgressRing({
  pct,
  size = 64,
  label,
  tone,
  thickness = 6,
  children,
}: {
  pct: number;
  size?: number;
  label?: string;
  tone?: Tone;
  thickness?: number;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - thickness - 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-grid flex-none place-items-center"
      data-tone={tone}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{
            filter:
              clamped > 0
                ? "drop-shadow(0 2px 6px color-mix(in oklab, var(--tone, var(--space-accent)) 60%, transparent))"
                : undefined,
          }}
        />
      </svg>
      <span className="absolute grid place-items-center text-center leading-none">
        {children ?? (
          <span className="numeric text-[0.78rem] font-bold">{Math.round(clamped)}%</span>
        )}
      </span>
    </span>
  );
}

/** Section heading with personality: a tonal dot, a warm title, a soft rule. */
export function BentoHeading({
  title,
  aside,
  tone,
}: {
  title: string;
  aside?: ReactNode;
  tone?: Tone | undefined;
}) {
  return (
    <div className="band-label mb-3" data-tone={tone}>
      <span
        className="size-2 flex-none rounded-full"
        style={{ background: "var(--tone, var(--space-accent))" }}
        aria-hidden
      />
      <h2 className="title-md text-[1.02rem]">{title}</h2>
      <span className="bg-border/70 h-px flex-1" />
      {aside}
    </div>
  );
}
