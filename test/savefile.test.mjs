import test from "node:test";
import assert from "node:assert/strict";
import { saveFileName, BACKUP_KEY, TMP_KEY } from "../web/savefile.mjs";

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
