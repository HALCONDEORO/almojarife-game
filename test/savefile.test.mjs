import test from "node:test";
import assert from "node:assert/strict";
import { saveFileName, BACKUP_KEY, TMP_KEY, finishPendingRotation, restoreRotate } from "../web/savefile.mjs";

test("dated export name carries the date and the game day", () => {
  assert.equal(saveFileName(41, new Date(2026, 9, 23)), "almojarife-save-2026-10-23-dia41.json");
  assert.equal(saveFileName(0, new Date(2026, 0, 5)), "almojarife-save-2026-01-05-dia0.json");
});
test("unknown day is omitted, month/day are padded", () => {
  assert.equal(saveFileName(undefined, new Date(2026, 11, 9)), "almojarife-save-2026-12-09.json");
  assert.equal(saveFileName(null, new Date(2026, 11, 9)), "almojarife-save-2026-12-09.json");
});
test("backup key is stable and distinct from the live save key", () => {
  assert.equal(BACKUP_KEY, "almojarife.save.backup");
  assert.notEqual(BACKUP_KEY, "almojarife.save.v1");
});

test("rotation slot key is stable and distinct from save and backup keys", () => {
  assert.equal(TMP_KEY, "almojarife.save.tmp");
  assert.notEqual(TMP_KEY, "almojarife.save.v1");
  assert.notEqual(TMP_KEY, BACKUP_KEY);
});

const fakeStore = (failOn = () => false) => {
  const m = new Map();
  const st = {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (st.failOn(k)) throw new Error("quota"); m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    failOn,
  };
  return st;
};
const SAVE = "almojarife.save.v1";

test("restore rotation swaps save and backup and clears the parking slot", () => {
  const st = fakeStore();
  restoreRotate(st, SAVE, "current", "backup");
  assert.equal(st.getItem(SAVE), "backup");
  assert.equal(st.getItem(BACKUP_KEY), "current");
  assert.equal(st.getItem(TMP_KEY), null);
});
test("a failed backup rotation keeps the parked copy instead of losing the current save", () => {
  const st = fakeStore((k) => k === BACKUP_KEY);
  restoreRotate(st, SAVE, "current", "backup");
  assert.equal(st.getItem(SAVE), "backup", "restore itself succeeded");
  assert.equal(st.getItem(TMP_KEY), "current", "parked copy survives");
});
test("a failed parking write aborts before anything moves", () => {
  const m = new Map([[SAVE, "current"], [BACKUP_KEY, "backup"]]);
  const st2 = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { if (k === TMP_KEY) throw new Error("quota"); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) };
  assert.throws(() => restoreRotate(st2, SAVE, "current", "backup"));
  assert.equal(st2.getItem(SAVE), "current");
  assert.equal(st2.getItem(BACKUP_KEY), "backup");
});
test("a failed live-slot write restores nothing and cleans the parking slot", () => {
  const m = new Map([[SAVE, "current"], [BACKUP_KEY, "backup"]]);
  const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { if (k === SAVE) throw new Error("quota"); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) };
  assert.throws(() => restoreRotate(st, SAVE, "current", "backup"));
  assert.equal(st.getItem(SAVE), "current");
  assert.equal(st.getItem(BACKUP_KEY), "backup");
  assert.equal(st.getItem(TMP_KEY), null);
});
test("restore with no current save drops the backup slot", () => {
  const m = new Map([[BACKUP_KEY, "backup"]]);
  const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  restoreRotate(st, SAVE, null, "backup");
  assert.equal(st.getItem(SAVE), "backup");
  assert.equal(st.getItem(BACKUP_KEY), null);
});

test("pending-rotation recovery completes the parked copy into the backup slot", () => {
  const st = fakeStore();
  st.setItem(TMP_KEY, "parked");
  st.setItem(BACKUP_KEY, "oldbackup");
  finishPendingRotation(st);
  assert.equal(st.getItem(BACKUP_KEY), "parked");
  assert.equal(st.getItem(TMP_KEY), null);
});
test("recovery failure throws and leaves every slot untouched", () => {
  const st = fakeStore();
  st.setItem(SAVE, "current");
  st.setItem(BACKUP_KEY, "oldbackup");
  st.setItem(TMP_KEY, "parked");
  st.failOn = (k) => k === BACKUP_KEY;
  assert.throws(() => finishPendingRotation(st));
  assert.equal(st.getItem(SAVE), "current");
  assert.equal(st.getItem(BACKUP_KEY), "oldbackup");
  assert.equal(st.getItem(TMP_KEY), "parked", "parked copy is not lost");
});
test("second restore after a failed rotation is a true undo of the first", () => {
  // First restore: live write succeeds but the backup rotation fails (quota).
  const st = fakeStore();
  st.setItem(SAVE, "A");
  st.setItem(BACKUP_KEY, "B");
  st.failOn = (k) => k === BACKUP_KEY;
  restoreRotate(st, SAVE, "A", "B");
  assert.equal(st.getItem(SAVE), "B");
  assert.equal(st.getItem(TMP_KEY), "A", "A parked after the failed rotation");
  st.failOn = () => false;
  // Storage healthy again: the handler recovers the pending rotation first,
  // then restores the backup it reads AFTER recovery (A), undoing the restore.
  finishPendingRotation(st);
  assert.equal(st.getItem(BACKUP_KEY), "A");
  restoreRotate(st, SAVE, st.getItem(SAVE), st.getItem(BACKUP_KEY));
  assert.equal(st.getItem(SAVE), "A", "undo returns to the pre-restore save");
  assert.equal(st.getItem(BACKUP_KEY), "B");
  assert.equal(st.getItem(TMP_KEY), null);
});
test("import rotation keeps the old backup when the imported write fails", () => {
  // Import path: prev parked first, then the imported write fails: old backup survives.
  const m = new Map([[SAVE, "A"], [BACKUP_KEY, "B"]]);
  const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { if (k === SAVE) throw new Error("quota"); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) };
  assert.throws(() => restoreRotate(st, SAVE, "A", "imported"));
  assert.equal(st.getItem(SAVE), "A");
  assert.equal(st.getItem(BACKUP_KEY), "B", "old backup not clobbered by a failed import");
  assert.equal(st.getItem(TMP_KEY), null);
});
test("import rotation on healthy storage leaves the imported save live and prev in backup", () => {
  const st = fakeStore();
  st.setItem(SAVE, "A");
  st.setItem(BACKUP_KEY, "B");
  restoreRotate(st, SAVE, "A", "imported");
  assert.equal(st.getItem(SAVE), "imported");
  assert.equal(st.getItem(BACKUP_KEY), "A");
  assert.equal(st.getItem(TMP_KEY), null);
});
