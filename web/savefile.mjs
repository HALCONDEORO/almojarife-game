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
 * Pending-rotation recovery. A failed earlier rotation leaves the previous save parked in
 * TMP_KEY (live slot already holds the restored copy, backup slot not yet rotated). Completing
 * the pending rotation is what makes the next restore a true undo, and it must run before
 * anything reuses TMP_KEY. Throws if the parked copy cannot be rotated in: callers abort and
 * every copy stays where it is.
 */
export function finishPendingRotation(store, isValid = () => true) {
  let parked;
  try { parked = store.getItem(TMP_KEY); } catch { return; }
  if (parked == null) return;
  if (!isValid(parked)) { // a corrupt parked copy must never replace a valid backup
    try { store.removeItem(TMP_KEY); } catch {}
    return;
  }
  store.setItem(BACKUP_KEY, parked);
  try { store.removeItem(TMP_KEY); } catch {}
}

/**
 * Restore/import rotation. Requires finishPendingRotation() first (no parked copy).
 * Parks the current save in TMP_KEY, writes the new content into the live slot, then rotates
 * the parked save into BACKUP_KEY. Both copies exist in storage before any overwrite, so a
 * quota failure mid-rotation never destroys either save. Throws on the two guarded writes so
 * the caller aborts with a message and the original state stays put; if the final rotation
 * fails the parked copy stays in TMP_KEY (recovered by the next finishPendingRotation).
 */
export function restoreRotate(store, saveKey, cur, newLiveText) {
  if (cur) store.setItem(TMP_KEY, cur);
  try {
    store.setItem(saveKey, newLiveText);
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
