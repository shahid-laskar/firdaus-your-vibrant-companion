/**
 * Dawn Bloom — the bento surface kit.
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
}: {
  tone?: Tone;
  to?: LinkTo;
  onClick?: () => void;
  className?: string;
  index?: number;
  children: ReactNode;
  /** plain = card surface instead of a tinted field */
  plain?: boolean;
}) {
  const cls = `tile bloom-in ${plain ? "border border-border/70 shadow-[var(--shadow-lift)]" : "tile-tone"} ${className}`;
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
      <button type="button" onClick={onClick} data-tone={tone} className={`${cls} w-full text-left`} style={style}>
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

/** The signature glyph holder — soft field, or solid for emphasis. */
export function IconChip({
  icon: Icon,
  solid = false,
  className = "",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  solid?: boolean;
  className?: string;
}) {
  return (
    <span className={`${solid ? "icon-chip-solid" : "icon-chip"} ${className}`}>
      <Icon className="size-[1.15rem]" strokeWidth={2} />
    </span>
  );
}

/** A compact tonal stat: icon, a warm number, a human line. */
export function StatTile({
  tone,
  icon,
  figure,
  title,
  note,
  to,
  index = 0,
}: {
  tone: Tone;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  figure: string;
  title: string;
  note?: string;
  to?: LinkTo;
  index?: number;
}) {
  return (
    <Tile tone={tone} {...(to ? { to } : {})} index={index} className="flex min-h-[9.5rem] flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <IconChip icon={icon} solid />
        <span className="figure-lg" style={{ color: "var(--tone)" }}>
          {figure}
        </span>
      </div>
      <div className="mt-4">
        <p className="title-md text-[0.98rem]">{title}</p>
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
}: {
  pct: number;
  size?: number;
  label?: string;
  tone?: Tone;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-grid place-items-center"
      data-tone={tone}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
        />
      </svg>
      <span className="absolute text-[0.78rem] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
        {Math.round(clamped)}%
      </span>
    </span>
  );
}

/** Section heading with personality: a warm title and a soft rule. */
export function BentoHeading({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-3 px-1">
      <h2 className="title-md text-[1.05rem]">{title}</h2>
      <span className="bg-border/70 h-px flex-1" />
      {aside}
    </div>
  );
}
