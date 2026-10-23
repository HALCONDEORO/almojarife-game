import test from "node:test";
import assert from "node:assert/strict";
import { saveFileName, BACKUP_KEY, TMP_KEY, restoreRotate } from "../web/savefile.mjs";

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
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (failOn(k)) throw new Error("quota"); m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
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
