// Manual save slots. The autosave (almojarife.save.v1) is untouched; slots hold named copies the
// player writes and loads on purpose. Pure: the store (localStorage-like) and the validator are passed in.
export const SLOT_COUNT = 3;
export const slotKey = (n) => `almojarife.save.slot.${n}`;
const okSlot = (n) => Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT;

/** Raw text of a slot, or null when empty or storage fails. */
export function readSlot(store, n) {
  if (!okSlot(n)) return null;
  try { return store.getItem(slotKey(n)); } catch { return null; }
}

/** Summary of every slot: { n, state: "empty" | "ok" | "corrupt", house, day, cash }. unpack(raw) throws on a bad save. */
export function listSlots(store, unpack) {
  const out = [];
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const raw = readSlot(store, n);
    if (raw == null) { out.push({ n, state: "empty" }); continue; }
    try {
      const r = unpack(raw);
      out.push({ n, state: "ok", house: r.company ?? "", day: r.g?.day, cash: r.g?.cash });
    } catch { out.push({ n, state: "corrupt" }); }
  }
  return out;
}

/** Write raw into a slot after checking it is a valid save. Throws (leaving the old slot intact) when it is not or storage is full. */
export function writeSlot(store, n, raw, isValid = () => true) {
  if (!okSlot(n)) throw new Error("bad slot");
  if (!isValid(raw)) throw new Error("invalid save");
  store.setItem(slotKey(n), raw);
  if (store.getItem(slotKey(n)) !== raw) throw new Error("write not verified");
}

export function clearSlot(store, n) {
  if (!okSlot(n)) return false;
  try { store.removeItem(slotKey(n)); return true; } catch { return false; }
}
