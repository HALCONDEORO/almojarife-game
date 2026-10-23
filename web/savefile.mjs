// Save-file helpers: dated export names and the safety-backup key used on import.
// Pure and DOM-free so the naming rule is testable in node.
export const BACKUP_KEY = "almojarife.save.backup";
export const TMP_KEY = "almojarife.save.tmp"; // rotation slot: both saves are preserved before any overwrite

/** Dated export file name, e.g. almojarife-save-2026-10-23-dia41.json (day omitted when unknown). */
export function saveFileName(day, now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  return `almojarife-save-${stamp}${Number.isFinite(day) ? `-dia${day}` : ""}.json`;
}
