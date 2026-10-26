import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SLOT_COUNT, slotKey, readSlot, listSlots, writeSlot, clearSlot } from "../src/game/saveslots.mjs";
import { slotsHtml, SLOT_TEXT } from "../src/view/slotsview.mjs";

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const unpack = (raw) => { const o = JSON.parse(raw); if (!o.g) throw new Error("bad"); return { company: o.company, g: o.g }; };

test("three slots, distinct from the autosave key", () => {
  assert.equal(SLOT_COUNT, 3);
  assert.notEqual(slotKey(1), "almojarife.save.v1");
  assert.equal(new Set([1, 2, 3].map(slotKey)).size, 3);
});

test("write, list, overwrite and clear a slot", () => {
  const s = mem(), raw = JSON.stringify({ company: "Casa A", g: { day: 12, cash: 3400 } });
  assert.deepEqual(listSlots(s, unpack).map((x) => x.state), ["empty", "empty", "empty"]);
  writeSlot(s, 2, raw, (r) => { unpack(r); return true; });
  const l = listSlots(s, unpack);
  assert.deepEqual(l[1], { n: 2, state: "ok", house: "Casa A", day: 12, cash: 3400 });
  assert.equal(readSlot(s, 2), raw);
  const raw2 = JSON.stringify({ company: "Casa B", g: { day: 40, cash: 1 } });
  writeSlot(s, 2, raw2); assert.equal(listSlots(s, unpack)[1].house, "Casa B");
  assert.equal(clearSlot(s, 2), true); assert.equal(readSlot(s, 2), null);
});

test("an invalid save or bad slot number never touches storage", () => {
  const s = mem(), good = JSON.stringify({ g: { day: 1, cash: 1 } });
  writeSlot(s, 1, good);
  assert.throws(() => writeSlot(s, 1, "nope", (r) => { unpack(r); return true; }) , /Unexpected|bad/);
  assert.throws(() => writeSlot(s, 1, "x", () => false), /invalid save/);
  assert.equal(readSlot(s, 1), good);
  assert.throws(() => writeSlot(s, 4, good), /bad slot/);
  assert.throws(() => writeSlot(s, 0, good), /bad slot/);
  assert.equal(readSlot(s, 9), null); assert.equal(clearSlot(s, 9), false);
});

test("a failing store leaves the old slot and reports it", () => {
  const s = mem(); writeSlot(s, 1, "{\"g\":{}}");
  const full = { ...s, setItem() { throw new Error("quota"); } };
  assert.throws(() => writeSlot(full, 1, "{\"g\":{\"day\":2}}"), /quota/);
  assert.equal(readSlot(s, 1), "{\"g\":{}}");
});

test("a damaged slot is listed as corrupt, not loadable", () => {
  const s = mem(); s.setItem(slotKey(3), "{broken");
  assert.equal(listSlots(s, unpack)[2].state, "corrupt");
});

test("the window shows each slot, disables save outside a game and load on empty slots", () => {
  const s = mem(); writeSlot(s, 1, JSON.stringify({ company: "Casa A", g: { day: 3, cash: 99 } }));
  const sl = listSlots(s, unpack);
  const inGame = slotsHtml(sl, { lang: "es", inGame: true, defCo: "X" });
  assert.equal((inGame.match(/class="sl-row"/g) || []).length, 3);
  assert.match(inGame, /Casa A · Día 3 · 99 monedas/);
  assert.match(inGame, /data-sl-load="1" >/); assert.match(inGame, /data-sl-load="2" disabled/);
  assert.match(inGame, /data-sl-save="1" >/);
  const title = slotsHtml(sl, { lang: "en", inGame: false });
  assert.match(title, /data-sl-save="1" disabled/); assert.match(title, new RegExp(SLOT_TEXT.en.noGame));
});

test("main wires slots to the pause menu and the title with the same safe rotation as Import", () => {
  const main = readFileSync("web/main.mjs", "utf8"), book = readFileSync("web/titlebook.mjs", "utf8");
  assert.match(main, /\$\("m-slots"\)\.onclick = \(\) => showSlots\(\)/);
  assert.match(main, /\$\("t-slots"\)\.onclick = \(\) => showSlots\(\)/);
  const fn = main.slice(main.indexOf("function showSlots()"), main.indexOf("function showCredits()"));
  assert.match(fn, /recoverRotations\(\)/); assert.match(fn, /restoreRotate\(localStorage, SAVE_KEY, cur, packed\)/);
  assert.match(fn, /confirm\(n2\(x\.confirmLoad/); assert.match(fn, /confirm\(n2\(x\.confirmDel/);
  assert.match(book, /entry\("t-slots"/); assert.match(book, /"slots": "Ranuras de guardado"/); assert.match(book, /"slots": "Save slots"/);
});
