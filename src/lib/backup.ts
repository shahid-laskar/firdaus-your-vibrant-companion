/** PROTOTYPE — data export/import so nothing is trapped in one browser. */

const PREFIX = "veedu:";

export function exportData() {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const raw = window.localStorage.getItem(key);
    try {
      out[key.slice(PREFIX.length)] = raw ? JSON.parse(raw) : null;
    } catch {
      out[key.slice(PREFIX.length)] = raw;
    }
  }
  return { app: "Sunnah Home", exportedAt: new Date().toISOString(), data: out };
}

export function downloadExport() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Sunnah Home-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as { data?: Record<string, unknown> };
  const data = parsed.data ?? (parsed as Record<string, unknown>);
  let count = 0;
  Object.entries(data).forEach(([key, value]) => {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    count++;
  });
  return count;
}
