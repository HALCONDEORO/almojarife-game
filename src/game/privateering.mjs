// Letters of marque, phase 1b (docs/design/piracy-study.md, mechanic 1): attack a trader of the realm a letter names.
// A trader's realm is the realm of its home port in the current year (data/realms.json, every row sourced).
// Seeded and fought with the shared resolver (#233); loot is taken as plunder, then the quinto (one fifth of each
// good, Dialnet 58329) goes to the issuer and is gone from the game. Off unless g.marque === true.
// Own design, pure of the DOM. Prize-court rules (where the goods may be sold) are mechanic 2, a later PR.
import { seeded } from "../view/cityscene.mjs";
import { resolveBattle, applyBattle } from "./battle.mjs";
import { realmOf, sameMonarch, QUINTO } from "./marque.mjs";
import { usableLetter } from "./peace.mjs";
import { portRep } from "./reputation.mjs";
import { yearOf } from "./chronicle.mjs";
import { makeShip } from "../sim/trade.mjs";
import { post } from "./ledger.mjs";
import { chargePiracy } from "./justicewire.mjs";
import { shipCapacity, cargoUsed } from "../sim/trade.mjs";

export const traderRealm = (g, data, t) => (t?.home ? realmOf(data, t.home, yearOf(g.day, g.startYear)) : null);
const sameLane = (a, b) => !!a.voyage && !!b.voyage && ((a.voyage.from === b.voyage.from && a.voyage.to === b.voyage.to) || (a.voyage.from === b.voyage.to && a.voyage.to === b.voyage.from));

/** Traders at sea on the same lane as the ship whose realm a held letter names that is not suspended by a peace (mechanic 3; `peaces` is data/peaces.json, omitted = no treaties, and g.peace off = no peace at all). Index into g.ai. */
export function targetsFor(g, data, ship, peaces = {}, opts = {}) {
  if (g.marque !== true || g.over || !ship?.voyage || ship.sunk) return [];
  const out = [];
  (g.ai ?? []).forEach((t, i) => {
    const realm = traderRealm(g, data, t);
    if (realm && sameLane(ship, t.ship)) { if (usableLetter(g, data, peaces, realm)) out.push({ index: i, realm }); else if (opts.unlicensed === true && g.justice === true) out.push({ index: i, realm, unlicensed: true }); }
  });
  return out;
}
/** Units each good loses to the quinto: one fifth, rounded down per good. */
export const quintoUnits = (loot) => Object.fromEntries(Object.entries(loot).map(([k, q]) => [k, Math.floor(q * QUINTO)]));

/** Attack the chosen trader. One fight per ship and tick (a reload cannot reroll it). Returns { ok, report, kept, quinto } or { ok:false, reason }. */
export function attackTrader(g, data, shipId, aiIndex, peaces = {}, opts = {}) {
  if (g.marque !== true) return { ok: false, reason: "off" };
  const ship = g.ships.find((s) => s.id === shipId);
  if (!ship) return { ok: false, reason: "no ship" };
  const t = targetsFor(g, data, ship, peaces, opts).find((x) => x.index === aiIndex);
  if (!t) return { ok: false, reason: "no target" };
  const key = `${ship.id}:${aiIndex}`;
  if (g.attackTicks?.[key] === g.tick) return { ok: false, reason: "already fought" };
  (g.attackTicks ??= {})[key] = g.tick;
  const trader = g.ai[aiIndex], victim = trader.ship;
  const r = seeded(`marque-v1:${g.seed ?? 0}:${g.tick}:${ship.id}:${aiIndex}`), rolls = [r(), r(), r(), r()];
  const rep = resolveBattle(ship, victim, rolls, { finish: "plunder", freeHold: Math.max(0, shipCapacity(ship) - cargoUsed(ship)) });
  const hullBefore = ship.hull;
  applyBattle(ship, victim, rep);
  // The quinto leaves the hold and the game (it is paid to the issuer, a sink).
  const q = t.unlicensed ? {} : quintoUnits(rep.loot), kept = {}; // no letter, no issuer: no quinto, but the port charges the deed (justice flag)
  for (const [good, n] of Object.entries(rep.loot)) {
    const take = Math.min(n, q[good] ?? 0);
    if (take) { ship.cargo[good] -= take; if (!ship.cargo[good]) delete ship.cargo[good]; }
    kept[good] = n - take;
  }
  const lotGoods = Object.fromEntries(Object.entries(kept).filter(([, n]) => n > 0));
  if (Object.keys(lotGoods).length && !ship.sunk) (ship.prizeLots ??= []).push({ realm: t.realm, goods: lotGoods, day: g.day }); // tagged until a court settles it (mechanic 2)
  if (t.unlicensed && Object.keys(rep.loot).length) chargePiracy(g, trader.home, rep.loot);
  if (ship.sunk) { g.ships = g.ships.filter((s) => s !== ship); }
  if (victim.sunk) { trader.ship = makeShip(victim.id, victim.type, trader.home); } // a trader that goes down starts again from home
  const realmName = data.realms[t.realm].name;
  post(g, "marqueFight", { realm: t.realm, result: rep.result, txt: { es: `Combate contra un mercante de ${realmName.es}: ${rep.result}.`, en: `Fight against a ${realmName.en} trader: ${rep.result}.` } });
  return { ok: true, report: rep, kept, quinto: q, hullLost: Math.max(0, Math.round(hullBefore - ship.hull)) };
}

/** Units of a good on this ship that are still prize goods (never more than the hold has). */
export const prizeUnits = (ship, good) => Math.min(ship?.cargo?.[good] ?? 0, (ship?.prizeLots ?? []).reduce((a, l) => a + (l.goods[good] ?? 0), 0));
/** Prize goods may not be sold or stored until a court settles them (flag off: never locked). */
export const prizeLocked = (g, ship, good) => g?.marque === true ? prizeUnits(ship, good) : 0;

/** Prize court (mechanic 2): in port, each prize lot is settled or seized.
 *  - the port has no realm: no court here, the lot waits;
 *  - the port is the victim's realm, or shares its monarch: the lot is seized;
 *  - the port's reputation for the owner is below neutral (ill seen): the lot is seized;
 *  - otherwise the lot is released into the free cargo.
 *  Own design, inspired by Castile ordering captures made without a letter to be returned (Dialnet 58329)
 *  and by the English Admiralty court judging prizes (https://oajournals.fupress.net/index.php/bsfm-jems/article/download/12541/12109/18045). */
export function settlePrize(g, data, ship) {
  if (g.marque !== true) return { ok: false, reason: "off" };
  if (!ship || ship.voyage || !(ship.prizeLots?.length)) return { ok: false, reason: "nothing to settle" };
  const year = yearOf(g.day, g.startYear), here = realmOf(data, ship.at, year);
  if (!here) return { ok: false, reason: "no court" };
  const released = {}, seized = {};
  for (const lot of ship.prizeLots) {
    const bad = sameMonarch(data, here, lot.realm, year) || portRep(g, ship.at) < 0;
    for (const [good, n] of Object.entries(lot.goods)) {
      const have = Math.min(n, ship.cargo?.[good] ?? 0);
      if (!have) continue;
      if (bad) { ship.cargo[good] -= have; if (!ship.cargo[good]) delete ship.cargo[good]; seized[good] = (seized[good] ?? 0) + have; }
      else released[good] = (released[good] ?? 0) + have;
    }
  }
  delete ship.prizeLots;
  const n = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  post(g, "prizeCourt", { released, seized, txt: { es: n(seized) ? `El tribunal de presas se queda con ${n(seized)} unidades.` : `El tribunal de presas libera ${n(released)} unidades.`, en: n(seized) ? `The prize court seizes ${n(seized)} units.` : `The prize court releases ${n(released)} units.` } });
  return { ok: true, released, seized };
}
