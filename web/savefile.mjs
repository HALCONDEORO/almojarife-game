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

/**
 * Restore rotation: parks the current save in TMP_KEY, writes the backup into the live slot,
 * then rotates the parked save into BACKUP_KEY. Both copies exist in storage before any
 * overwrite, so a quota failure mid-rotation never destroys either save. Throws on the two
 * guarded writes so the caller aborts with a message and the original state stays put; the
 * final rotation failure keeps the parked copy in TMP_KEY instead of deleting it.
 */
export function restoreRotate(store, saveKey, cur, backupText) {
  if (cur) store.setItem(TMP_KEY, cur);
  try {
    store.setItem(saveKey, backupText);
  } catch (e) {
    if (cur) try { store.removeItem(TMP_KEY); } catch {}
    throw e;
  }
  if (cur) {
    let rotated = true;
    try { store.setItem(BACKUP_KEY, cur); } catch { rotated = false; }
    if (rotated) try { store.removeItem(TMP_KEY); } catch {}
  } else {
    try { store.removeItem(BACKUP_KEY); } catch {}
  }
}
