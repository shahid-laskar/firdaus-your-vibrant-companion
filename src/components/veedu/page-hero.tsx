import type { ComponentType, ReactNode } from "react";

export type HeroPill = {
  id: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: ReactNode;
};

/**
 * The shared emotional header for every space. Purely presentational —
 * callers pass already-derived copy and figures.
 */
export function PageHero({
  variant,
  eyebrow,
  title,
  subtitle,
  pills = [],
  aside,
  arabic,
}: {
  variant: "home" | "deen" | "budget" | "me" | "review";
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  pills?: HeroPill[];
  aside?: ReactNode;
  arabic?: string;
}) {
  return (
    <header
      data-hero={variant}
      className="hero-aurora bloom-in mb-8 min-h-[12.5rem] p-6 sm:p-7"
    >
      <span
        className="orb drift -top-14 -left-10 size-44"
        style={{ "--i": 0 } as never}
        aria-hidden
      />
      <span
        className="orb drift -right-10 -bottom-16 size-52"
        style={{ "--i": 1 } as never}
        aria-hidden
      />
      <span className="motif top-0 right-0 h-40 w-52" aria-hidden />

      <div className="relative z-[3] flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow opacity-85">{eyebrow}</p>}
            <h1 className="display-xl mt-2.5">{title}</h1>
            {subtitle && (
              <p className="mt-2.5 max-w-md text-[0.95rem] leading-relaxed opacity-90">
                {subtitle}
              </p>
            )}
            {arabic && (
              <p className="arabic mt-3 text-[1.2rem] leading-[2] opacity-90">{arabic}</p>
            )}
          </div>
          {aside && <div className="flex-none">{aside}</div>}
        </div>

        {pills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            {pills.map((p) => (
              <span key={p.id} className="hero-pill">
                {p.icon && <p.icon className="size-3.5" strokeWidth={2.4} aria-hidden />}
                {p.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/** A compact figure that can sit on the right of a hero. */
export function HeroFigure({ value, label }: { value: string; label: string }) {
  return (
    <span className="hero-figure">
      <span className="numeric block text-[1.6rem] leading-none font-bold">{value}</span>
      <span className="mt-1.5 block text-[0.6rem] font-bold tracking-wider uppercase opacity-80">
        {label}
      </span>
    </span>
  );
}
