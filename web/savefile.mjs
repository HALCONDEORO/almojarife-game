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

function verifyWrite(store, key, text) {
  if (store.getItem(key) !== text) throw new Error(`Save write verification failed: ${key}`);
}

function writeVerified(store, key, text) {
  store.setItem(key, text);
  verifyWrite(store, key, text);
}

/**
 * Pending-rotation recovery. A failed earlier rotation leaves the previous save parked in
 * TMP_KEY (live slot already holds the restored copy, backup slot not yet rotated). Completing
 * the pending rotation is what makes the next restore a true undo, and it must run before
 * anything reuses TMP_KEY. Throws if the parked copy cannot be rotated in: callers abort and
 * the parked copy stays available, even if the backup write took effect.
 */
export function finishPendingRotation(store, isValid = () => true) {
  const parked = store.getItem(TMP_KEY);
  if (parked == null) return;
  if (!isValid(parked)) { // a corrupt parked copy must never replace a valid backup
    try { store.removeItem(TMP_KEY); } catch {}
    return;
  }
  writeVerified(store, BACKUP_KEY, parked);
  try { store.removeItem(TMP_KEY); } catch {}
}

/**
 * Restore/import rotation. Requires finishPendingRotation() first (no parked copy).
 * Parks the current save in TMP_KEY, writes the new content into the live slot, then rotates
 * the parked save into BACKUP_KEY. Both copies exist in storage before any overwrite, so a
 * failed or unverified write never retires the only recoverable copy. Throws on parking or
 * live-write failure so the caller aborts; a write may have taken effect despite the error.
 * If the final rotation fails, TMP_KEY stays for the next finishPendingRotation.
 */
export function restoreRotate(store, saveKey, cur, newLiveText) {
  if (cur) writeVerified(store, TMP_KEY, cur);
  try {
    store.setItem(saveKey, newLiveText);
  } catch (e) {
    // A throwing write may still have changed live. Retire parking only if live is intact.
    if (cur) try {
      if (store.getItem(saveKey) === cur) store.removeItem(TMP_KEY);
    } catch {}
    throw e;
  }
  verifyWrite(store, saveKey, newLiveText);
  if (cur) {
    let rotated = true;
    try { writeVerified(store, BACKUP_KEY, cur); } catch { rotated = false; }
    if (rotated) try { store.removeItem(TMP_KEY); } catch {}
  } else {
    try { store.removeItem(BACKUP_KEY); } catch {}
  }
}
