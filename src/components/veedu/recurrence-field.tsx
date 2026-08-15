import { FREQ_LABELS, type Freq, type Recurrence, describeRecurrence } from "@/lib/recurrence";
import { todayKey } from "@/lib/store";

/**
 * PROTOTYPE — the single recurrence control used everywhere.
 * Progressive disclosure: nothing appears until "repeats" is chosen.
 */
export function RecurrenceField({
  value,
  onChange,
  compact = false,
}: {
  value: Recurrence;
  onChange: (r: Recurrence) => void;
  compact?: boolean;
}) {
  const repeating = value.freq !== "none";
  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {(Object.keys(FREQ_LABELS) as Freq[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChange({ ...value, freq: f, start: value.start || todayKey() })}
            className={`press shrink-0 rounded-full px-3 py-1 text-[0.74rem] ${
              value.freq === f ? "bg-space-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {FREQ_LABELS[f]}
          </button>
        ))}
      </div>
      {repeating && !compact && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Starts</span>
            <input
              type="date"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="border-border/80 focus:border-space numeric mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Until (optional)</span>
            <input
              type="date"
              value={value.until ?? ""}
              onChange={(e) => onChange({ ...value, until: e.target.value || undefined })}
              className="border-border/80 focus:border-space numeric mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>
      )}
      {repeating && <p className="text-ink-faint text-xs">{describeRecurrence(value)}</p>}
    </div>
  );
}

export function RepeatChip({ recur }: { recur?: Recurrence | undefined }) {
  const text = describeRecurrence(recur);
  if (!text) return null;
  return (
    <span className="text-ink-faint bg-space-soft/50 rounded-full px-2 py-0.5 text-[0.66rem] whitespace-nowrap">
      ↻ {text}
    </span>
  );
}
