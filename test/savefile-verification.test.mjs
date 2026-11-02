import test from "node:test";
import assert from "node:assert/strict";
import { BACKUP_KEY, TMP_KEY, finishPendingRotation, restoreRotate } from "../web/savefile.mjs";

const SAVE = "almojarife.save.v1";
const fixture = (entries = [[SAVE, "A"], [BACKUP_KEY, "B"]]) => {
  const data = new Map(entries);
  const writes = [];
  const store = {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { writes.push(key); data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
  return { data, writes, store };
};

for (const key of [TMP_KEY, SAVE, BACKUP_KEY]) {
  test(`silent write at ${key} preserves the previous save`, () => {
    const { data, writes, store } = fixture();
    const set = store.setItem;
    store.setItem = (k, v) => { if (k !== key) set(k, v); };
    if (key === BACKUP_KEY) {
      assert.doesNotThrow(() => restoreRotate(store, SAVE, "A", "imported"));
      assert.equal(data.get(SAVE), "imported");
      assert.equal(data.get(TMP_KEY), "A");
    } else {
      assert.throws(() => restoreRotate(store, SAVE, "A", "imported"));
      assert.equal(data.get(SAVE), "A");
      assert.equal(data.get(BACKUP_KEY), "B");
      if (key === TMP_KEY) assert.deepEqual(writes, []);
    }
  });

  test(`readback throws after writing ${key}: keeps recoverable copies`, () => {
    const { data, writes, store } = fixture();
    const get = store.getItem;
    store.getItem = (k) => {
      if (k === key && writes.includes(key)) throw new Error("readback unavailable");
      return get(k);
    };
    if (key === BACKUP_KEY) {
      assert.doesNotThrow(() => restoreRotate(store, SAVE, "A", "imported"));
      assert.equal(data.get(SAVE), "imported");
    } else {
      assert.throws(() => restoreRotate(store, SAVE, "A", "imported"));
      assert.equal(data.get(BACKUP_KEY), "B");
      assert.equal(data.get(SAVE), key === SAVE ? "imported" : "A");
    }
    assert.equal(data.get(TMP_KEY), "A");
  });
}

for (const mode of ["silent", "readback throws"]) {
  test(`pending recovery backup ${mode} preserves TMP and aborts the caller`, () => {
    const { data, writes, store } = fixture([[SAVE, "B"], [BACKUP_KEY, "B"], [TMP_KEY, "A"]]);
    const set = store.setItem;
    const get = store.getItem;
    if (mode === "silent") store.setItem = (k, v) => { if (k !== BACKUP_KEY) set(k, v); };
    else store.getItem = (k) => {
      if (k === BACKUP_KEY && writes.includes(k)) throw new Error("readback unavailable");
      return get(k);
    };
    assert.throws(() => {
      finishPendingRotation(store);
      restoreRotate(store, SAVE, store.getItem(SAVE), "imported");
    });
    assert.equal(data.get(TMP_KEY), "A");
    assert.equal(data.get(SAVE), "B");
    assert.equal(data.get(BACKUP_KEY), mode === "silent" ? "B" : "A");
  });
}

test("unreadable TMP aborts before the caller can reuse it", () => {
  const { data, writes, store } = fixture([[SAVE, "B"], [BACKUP_KEY, "B"], [TMP_KEY, "A"]]);
  const get = store.getItem;
  store.getItem = (k) => { if (k === TMP_KEY) throw new Error("TMP unavailable"); return get(k); };
  assert.throws(() => {
    finishPendingRotation(store);
    restoreRotate(store, SAVE, "B", "imported");
  });
  assert.deepEqual(writes, []);
  assert.equal(data.get(TMP_KEY), "A");
});

test("live write that mutates then throws never discards the parked save", () => {
  const { data, store } = fixture();
  const set = store.setItem;
  store.setItem = (k, v) => { set(k, v); if (k === SAVE) throw new Error("write failed after mutation"); };
  assert.throws(() => restoreRotate(store, SAVE, "A", "imported"));
  assert.equal(data.get(SAVE), "imported");
  assert.equal(data.get(TMP_KEY), "A");
  assert.equal(data.get(BACKUP_KEY), "B");
});

test("a missing live save is verified before retiring its backup", () => {
  const { data, store } = fixture([[BACKUP_KEY, "B"]]);
  store.setItem = () => {};
  assert.throws(() => restoreRotate(store, SAVE, null, "B"));
  assert.equal(data.get(BACKUP_KEY), "B");
});

test("healthy import followed by two restores returns to the imported save", () => {
  const { data, store } = fixture();
  restoreRotate(store, SAVE, "A", "imported");
  assert.equal(data.get(BACKUP_KEY), "A");
  for (const expected of ["A", "imported"]) {
    finishPendingRotation(store);
    restoreRotate(store, SAVE, store.getItem(SAVE), store.getItem(BACKUP_KEY));
    assert.equal(data.get(SAVE), expected);
    assert.equal(data.has(TMP_KEY), false);
  }
  assert.equal(data.get(BACKUP_KEY), "A");
});

test("corrupt TMP never writes over a valid backup", () => {
  const { data, writes, store } = fixture([[SAVE, "C"], [BACKUP_KEY, "B"], [TMP_KEY, "corrupt"]]);
  finishPendingRotation(store, (text) => text !== "corrupt");
  assert.equal(data.get(BACKUP_KEY), "B");
  assert.deepEqual(writes, []);
});
