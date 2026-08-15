import { useEffect, useMemo, useState } from "react";
import { Action, EmptyState, Section } from "@/components/veedu/primitives";
import { readStore, todayKey, uid, useStore, writeStore } from "@/lib/store";

export type Note = { id: string; title: string; body: string; updated: string; pinned?: boolean };

/** PROTOTYPE — Notes becomes many notes instead of one shared textarea. */
export function Notes() {
  const [notes, setNotes] = useStore<Note[]>("notesList", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Carry the old single note across, once.
  useEffect(() => {
    const legacy = readStore<string>("notes", "");
    if (legacy.trim() && readStore<Note[]>("notesList", []).length === 0) {
      writeStore<Note[]>("notesList", [
        { id: uid(), title: "Family scratchpad", body: legacy, updated: todayKey(), pinned: true },
      ]);
      writeStore("notes", "");
    }
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .filter((n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q))
      .sort(
        (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updated.localeCompare(a.updated),
      );
  }, [notes, query]);

  const open = notes.find((n) => n.id === openId) ?? null;

  function patch(id: string, next: Partial<Note>) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...next, updated: todayKey() } : n)));
  }

  function create() {
    const note: Note = { id: uid(), title: "", body: "", updated: todayKey() };
    setNotes([note, ...notes]);
    setOpenId(note.id);
  }

  if (open) {
    return (
      <Section
        eyebrow={`Edited ${open.updated}`}
        title="Note"
        aside={
          <div className="flex items-center gap-2">
            <button
              onClick={() => patch(open.id, { pinned: !open.pinned })}
              className={`text-xs ${open.pinned ? "text-space" : "text-ink-faint hover:text-foreground"}`}
            >
              {open.pinned ? "Pinned" : "Pin"}
            </button>
            <Action onClick={() => setOpenId(null)}>Back</Action>
          </div>
        }
      >
        <input
          value={open.title}
          onChange={(e) => patch(open.id, { title: e.target.value })}
          placeholder="Title"
          className="display-lg w-full bg-transparent outline-none"
        />
        <textarea
          value={open.body}
          onChange={(e) => patch(open.id, { body: e.target.value })}
          rows={14}
          placeholder="Write it down before it's gone."
          className="focus:border-space/60 mt-4 w-full resize-none rounded-2xl border border-transparent bg-[linear-gradient(transparent_calc(2rem_-_1px),var(--rule)_calc(2rem_-_1px))] bg-[size:100%_2rem] p-4 text-[0.95rem] leading-8 outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-ink-faint text-xs">Saved as you type</span>
          <button
            onClick={() => {
              setNotes(notes.filter((n) => n.id !== open.id));
              setOpenId(null);
            }}
            className="text-ink-faint hover:text-destructive text-xs"
          >
            Delete note
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Shared"
      title="Notes"
      aside={
        <Action variant="solid" onClick={create}>
          New note
        </Action>
      }
    >
      {notes.length > 3 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes"
          className="border-border/70 focus:border-space mb-5 w-full rounded-xl border bg-transparent px-3.5 py-2 text-sm outline-none"
        />
      )}
      {visible.length === 0 ? (
        <EmptyState
          glyph="◇"
          headline="No notes yet"
          body="Keep codes, lists and half-thoughts in separate notes instead of one long page."
          action={
            <Action variant="solid" onClick={create}>
              Write the first one
            </Action>
          }
        />
      ) : (
        <ul className="divide-border/70 divide-y">
          {visible.map((n) => (
            <li key={n.id}>
              <button onClick={() => setOpenId(n.id)} className="w-full py-3.5 text-left">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="title-md truncate">
                    {n.pinned && <span className="text-space mr-1.5">•</span>}
                    {n.title || "Untitled"}
                  </p>
                  <span className="text-ink-faint numeric shrink-0 text-xs">{n.updated}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                  {n.body.replace(/\n/g, " ") || "Empty"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
