// Letters of marque, phase 1b (docs/design/piracy-study.md, mechanic 1): attack a trader of the realm a letter names.
// A trader's realm is the realm of its home port in the current year (data/realms.json, every row sourced).
// Seeded and fought with the shared resolver (#233); loot is taken as plunder, then the quinto (one fifth of each
// good, Dialnet 58329) goes to the issuer and is gone from the game. Off unless g.marque === true.
// Own design, pure of the DOM. Prize-court rules (where the goods may be sold) are mechanic 2, a later PR.
import { seeded } from "../view/cityscene.mjs";
import { resolveBattle, applyBattle } from "./battle.mjs";
import { realmOf, activeLetter, QUINTO } from "./marque.mjs";
import { yearOf } from "./chronicle.mjs";
import { makeShip } from "../sim/trade.mjs";
import { post } from "./ledger.mjs";
import { shipCapacity } from "../sim/trade.mjs";

export const traderRealm = (g, data, t) => (t?.home ? realmOf(data, t.home, yearOf(g.day, g.startYear)) : null);
const sameLane = (a, b) => !!a.voyage && !!b.voyage && ((a.voyage.from === b.voyage.from && a.voyage.to === b.voyage.to) || (a.voyage.from === b.voyage.to && a.voyage.to === b.voyage.from));

/** Traders at sea on the same lane as the ship whose realm a held letter names. Index into g.ai. */
export function targetsFor(g, data, ship) {
  if (g.marque !== true || g.over || !ship?.voyage || ship.sunk) return [];
  const out = [];
  (g.ai ?? []).forEach((t, i) => {
    const realm = traderRealm(g, data, t);
    if (realm && sameLane(ship, t.ship) && activeLetter(g, realm)) out.push({ index: i, realm });
  });
  return out;
}
/** Units each good loses to the quinto: one fifth, rounded down per good. */
export const quintoUnits = (loot) => Object.fromEntries(Object.entries(loot).map(([k, q]) => [k, Math.floor(q * QUINTO)]));

/** Attack the chosen trader. One fight per ship and tick (a reload cannot reroll it). Returns { ok, report, kept, quinto } or { ok:false, reason }. */
export function attackTrader(g, data, shipId, aiIndex) {
  if (g.marque !== true) return { ok: false, reason: "off" };
  const ship = g.ships.find((s) => s.id === shipId);
  if (!ship) return { ok: false, reason: "no ship" };
  const t = targetsFor(g, data, ship).find((x) => x.index === aiIndex);
  if (!t) return { ok: false, reason: "no target" };
  const key = `${ship.id}:${aiIndex}`;
  if (g.attackTicks?.[key] === g.tick) return { ok: false, reason: "already fought" };
  (g.attackTicks ??= {})[key] = g.tick;
  const trader = g.ai[aiIndex], victim = trader.ship;
  const r = seeded(`marque-v1:${g.seed ?? 0}:${g.tick}:${ship.id}:${aiIndex}`), rolls = [r(), r(), r(), r()];
  const rep = resolveBattle(ship, victim, rolls, { finish: "plunder", freeHold: shipCapacity(ship) });
  const hullBefore = ship.hull;
  applyBattle(ship, victim, rep);
  // The quinto leaves the hold and the game (it is paid to the issuer, a sink).
  const q = quintoUnits(rep.loot), kept = {};
  for (const [good, n] of Object.entries(rep.loot)) {
    const take = Math.min(n, q[good] ?? 0);
    if (take) { ship.cargo[good] -= take; if (!ship.cargo[good]) delete ship.cargo[good]; }
    kept[good] = n - take;
  }
  if (ship.sunk) { g.ships = g.ships.filter((s) => s !== ship); }
  if (victim.sunk) { trader.ship = makeShip(victim.id, victim.type, trader.home); } // a trader that goes down starts again from home
  const realmName = data.realms[t.realm].name;
  post(g, "marqueFight", { realm: t.realm, result: rep.result, txt: { es: `Combate contra un mercante de ${realmName.es}: ${rep.result}.`, en: `Fight against a ${realmName.en} trader: ${rep.result}.` } });
  return { ok: true, report: rep, kept, quinto: q, hullLost: Math.max(0, Math.round(hullBefore - ship.hull)) };
}
