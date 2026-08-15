import { type ReactNode, useEffect, useRef, useState } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Section({
  eyebrow,
  title,
  aside,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rise ${className}`}>
      {(eyebrow || title || aside) && (
        <header className="mb-4 flex items-end justify-between gap-4">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="display-lg mt-1.5">{title}</h2>}
          </div>
          {aside && <div className="shrink-0 pb-1">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function SubTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="-mx-5 px-5">
      <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1.5 pb-px">
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={`press relative shrink-0 rounded-full px-3.5 py-2 text-[0.8rem] font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-space text-background shadow-[var(--shadow-lift)]"
                  : "bg-space-soft/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState({
  headline,
  body,
  action,
  glyph = "◦",
}: {
  headline: string;
  body: string;
  action?: ReactNode;
  glyph?: string;
}) {
  return (
    <div className="bg-space-soft/45 rounded-[1.85rem] px-6 py-12 text-center">
      <div className="text-space icon-chip mx-auto mb-4 size-12 text-2xl leading-none">{glyph}</div>
      <p className="title-md">{headline}</p>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-xs text-sm leading-relaxed">
        {body}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Action({
  children,
  onClick,
  variant = "quiet",
  type = "button",
  className = "",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "quiet" | "solid" | "ghost";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const styles = {
    quiet:
      "border border-border bg-card text-foreground hover:border-space/60 hover:bg-space-soft/40",
    solid:
      "bg-space text-background hover:opacity-90 border border-transparent shadow-[var(--shadow-lift)]",
    ghost: "text-muted-foreground hover:text-foreground border border-transparent",
  }[variant];
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`press inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[0.82rem] font-medium disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        {...props}
        className={`border-border/80 focus:border-space mt-1.5 w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.95rem] outline-none transition-colors ${props.className ?? ""}`}
      />
    </label>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="bg-muted h-[6px] w-full overflow-hidden rounded-full">
        <div
          className="bg-space h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && <p className="text-muted-foreground mt-1.5 text-xs">{label}</p>}
    </div>
  );
}

/** Quietly rewarding completion tick — draws itself, no confetti. */
export function Tick({
  done,
  onToggle,
  label,
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
}) {
  const [burst, setBurst] = useState(false);
  return (
    <button
      onClick={() => {
        if (!done) {
          setBurst(true);
          setTimeout(() => setBurst(false), 900);
        }
        onToggle();
      }}
      aria-pressed={done}
      aria-label={label}
      className="press relative grid size-6 shrink-0 place-items-center rounded-full border transition-colors"
      style={{
        borderColor: done ? "var(--space-accent)" : "var(--rule)",
        background: done ? "var(--space-accent)" : "transparent",
      }}
    >
      {burst && <span className="border-space pulse-ring absolute inset-0 rounded-full border" />}
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="var(--background)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 24,
            strokeDashoffset: done ? 0 : 24,
            transition: "stroke-dashoffset 340ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </svg>
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-card rise relative max-h-[86vh] w-full overflow-y-auto rounded-t-3xl border p-6 shadow-[var(--shadow-float)] sm:max-w-md sm:rounded-3xl"
      >
        <div className="bg-rule mx-auto mb-5 h-1 w-9 rounded-full sm:hidden" />
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="display-lg">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground text-sm">
            Done
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
