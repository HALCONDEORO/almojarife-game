// Convoys with escort (approved mechanic 2/7, an idea from classic trading games):
// 2-5 owned ships group up, sail to the same port at the pace of the slowest hull,
// and when pirates strike a member at sea the whole group's armament answers (escort bonus).
// Pure game logic, no DOM. The normal sail/encounter rules still apply, so winds, fees and choices stay.
import { weaponPower } from "./crew.mjs";
import { post } from "./ledger.mjs";

export const CONVOY_MIN = 2, CONVOY_MAX = 5;

/** The convoy record a ship belongs to, or null. */
export const convoyOf = (g, ship) => (ship?.convoy && g.convoys?.[ship.convoy]) || null;

/** Escort firepower backing a ship: the armament of the other convoy members sailing the same leg. */
export function escortOf(g, ship) {
  const cv = convoyOf(g, ship);
  if (!cv || !ship.voyage) return 0;
  let sum = 0;
  for (const id of cv.ships) {
    if (id === ship.id) continue;
    const mate = g.ships.find((s) => s.id === id);
    if (mate?.voyage && mate.voyage.from === ship.voyage.from && mate.voyage.to === ship.voyage.to) sum += weaponPower(mate);
  }
  return sum;
}

/** Group 2-5 docked owned ships into a convoy. */
export function formConvoy(g, shipIds, name = "") {
  if (g.over) return { ok: false, reason: "game over" };
  if (!Array.isArray(shipIds)) return { ok: false, reason: "bad ships" };
  const ids = [...new Set(shipIds)];
  if (ids.length < CONVOY_MIN || ids.length > CONVOY_MAX) return { ok: false, reason: "bad size" };
  const ships = [];
  for (const id of ids) {
    const s = g.ships.find((x) => x.id === id);
    if (!s) return { ok: false, reason: "not your ship" };
    if (s.voyage) return { ok: false, reason: "at sea" }; // convoys form in port, not mid-voyage
    if (convoyOf(g, s)) return { ok: false, reason: "already grouped" };
    ships.push(s);
  }
  const seq = (g.convoySeq = (g.convoySeq ?? 0) + 1), id = "cv" + seq;
  const cv = { id, name: String(name || "").trim().slice(0, 30) || "Convoy " + seq, ships: ids, since: g.day };
  (g.convoys ??= {})[id] = cv;
  for (const s of ships) s.convoy = id;
  post(g, "convoyFormed", { convoy: id, name: cv.name, ships: ids });
  return { ok: true, convoy: cv };
}

/** Take one ship out; a convoy reduced to a single hull disbands itself. */
export function leaveConvoy(g, shipId) {
  const s = g.ships.find((x) => x.id === shipId);
  const cv = convoyOf(g, s);
  if (!cv) return { ok: false, reason: "no convoy" };
  if (s.voyage) return { ok: false, reason: "at sea" }; // you cannot desert the group mid-voyage
  cv.ships = cv.ships.filter((x) => x !== shipId);
  delete s.convoy;
  post(g, "convoyLeft", { convoy: cv.id, ship: shipId });
  if (cv.ships.length < CONVOY_MIN) { const [last] = cv.ships; const ls = g.ships.find((x) => x.id === last); if (ls) delete ls.convoy; delete g.convoys[cv.id]; post(g, "convoyDisbanded", { convoy: cv.id }); }
  return { ok: true };
}

/** Dissolve the whole group (ships must be in port). */
export function disbandConvoy(g, id) {
  const cv = g.convoys?.[id];
  if (!cv) return { ok: false, reason: "no convoy" };
  for (const sid of cv.ships) { const s = g.ships.find((x) => x.id === sid); if (s?.voyage) return { ok: false, reason: "at sea" }; }
  for (const sid of cv.ships) { const s = g.ships.find((x) => x.id === sid); if (s) delete s.convoy; }
  delete g.convoys[id];
  post(g, "convoyDisbanded", { convoy: id });
  return { ok: true };
}

/** Sail the whole convoy to one port: every member leaves together and the slowest sets the pace. */
export function sailConvoy(g, id, to, ops) {
  const cv = g.convoys?.[id];
  if (!cv) return { ok: false, reason: "no convoy" };
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.nodes[to]) return { ok: false, reason: "bad port" };
  const ships = cv.ships.map((sid) => g.ships.find((x) => x.id === sid));
  if (ships.some((s) => !s || s.voyage)) return { ok: false, reason: "at sea" };
  if (ships.some((s) => s.at !== ships[0].at)) return { ok: false, reason: "scattered" }; // regroup in one port first
  if (ships[0].at === to) return { ok: false, reason: "already there" };
  for (const s of ships) { const r = ops.doSail(g, s, to); if (!r.ok) return r; }
  let slow = 0;
  for (const s of ships) slow = Math.max(slow, s.voyage.ticksLeft);
  for (const s of ships) { s.voyage.ticksLeft = slow; s.voyage.totalTicks = Math.max(s.voyage.totalTicks ?? slow, slow); }
  post(g, "convoySailed", { convoy: id, to, ships: cv.ships.slice() });
  return { ok: true, ships: cv.ships.slice(), to };
}
