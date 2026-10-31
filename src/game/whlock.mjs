// Warehouse goods lock (bloqueo de mercancías): a per-good hold that keeps a good from
// leaving a port warehouse until the player lifts it. Own design on the P4 storekeeper
// lock contract ("bloqueo almacenero"; research notes, not a documented mechanic).
// - One named purpose for now: "outflow" blocks every VOLUNTARY removal of the good -
//   the steward's standing sale, a manual market sale from the store, the warehouse
//   leg of a combined hold+store sale, taking it aboard, and construction works
//   drawing materials from the store (they buy at the market instead). Inflow
//   (steward buys, manual storing) stays open. The contract warns that the study's
//   two masks are not proven to mean buy and sell, so no buy/sell split is adopted.
//   Out of scope, declared: forced removals do NOT respect the lock - unpaid debts,
//   seizures and bankruptcy take what they must; the lock holds the owner's own
//   flows, it is not a legal shield.
// - Commands carry a desired state, not a toggle: setWarehouseLock(..., true) is
//   idempotent, and the outcome is applied or rejected synchronously. A local
//   single-player game has no asynchronous delivery, so there is no pending state and
//   no generation or version to check (documented decision where the contract asks).
// - The boolean input rule is strict: only true/false are accepted; numbers, strings
//   and null are rejected, never decoded.
// - State rides on the warehouse (g.warehouses[city].locks), so old saves carry no
//   locks and load unchanged. Setting one good's lock never touches other goods, the
//   steward's rules or the watch.
// No DOM here.

/** Lock purposes this block supports. */
export const LOCK_TYPES = ["outflow"];

/** The warehouse's lock record for one good, or null. */
export const whLockOf = (g, city, good) => g.warehouses?.[city]?.locks?.[good] ?? null;

/** Is the good's outflow locked in this warehouse object? */
export const whLocked = (wh, good) => Boolean(wh?.locks?.[good]?.outflow);

/** Set the desired state of one lock. Returns {ok, locked} or {ok:false, reason}. */
export function setWarehouseLock(g, city, good, type, desired) {
  if (g.over) return { ok: false, reason: "game over" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  if (!g.world.goods?.[good]) return { ok: false, reason: "unknown good" };
  if (!LOCK_TYPES.includes(type)) return { ok: false, reason: "unknown lock type" };
  if (typeof desired !== "boolean") return { ok: false, reason: "bad flag" };
  const locks = (wh.locks ??= {});
  if (desired) locks[good] = { ...locks[good], [type]: true };
  else if (locks[good]) { delete locks[good][type]; if (!Object.keys(locks[good]).length) delete locks[good]; }
  if (!Object.keys(locks).length) delete wh.locks; // a lock-free warehouse saves like a fresh one
  return { ok: true, locked: desired };
}
