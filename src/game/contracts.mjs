// Town-council contracts (encargos del concejo): a port short of a good posts a public order -
// bring N units before day D and the council pays a premium on top of the market price you got
// for selling them there. Selling into the port counts automatically while the contract is active.
// Letting one lapse costs a little reputation: you gave your word to the town.
// Own design; inspired by the contract boards of the genre, not copied from any of them. No DOM here.
import { seeded } from "../view/cityscene.mjs";
import { post } from "./ledger.mjs";
import { addRespect } from "./rank.mjs";
import { addRep, scarcityOf } from "./reputation.mjs";

export const CONTRACT_MAX_ACTIVE = 3; // how many promises a house can keep at once
export const CONTRACT_CHANCE = 0.5; // weekly odds that a port posts an offer
export const CONTRACT_SCARCITY_MIN = 1.1; // only goods the port is actually short of
export const CONTRACT_BONUS_MIN = 0.2, CONTRACT_BONUS_SPAN = 0.15; // premium over base value, on completion
export const CONTRACT_DAYS_MIN = 30, CONTRACT_DAYS_SPAN = 30; // time to deliver
export const CONTRACT_RESPECT_COINS = 1500; // completion respect, in sale-equivalent coins (15 points)
export const CONTRACT_REP = 6, CONTRACT_FAIL_REP = -4; // reputation moves on completion / lapse

const book = (g) => (g.contracts ??= { offers: {}, active: [], done: 0, failed: 0 });
export const offerOf = (g, city) => book(g).offers[city] ?? null;
export const activeContracts = (g) => book(g).active;

/** Weekly roll, one offer per port at most. Deterministic by seed+day+city, like shocks and wind. */
export function rollContracts(g) {
  const b = book(g);
  for (const c of g.world.cities) {
    const r = seeded(`contract-v1:${g.seed ?? 0}:${g.day}:${c.id}`);
    if (r() >= CONTRACT_CHANCE) continue; // the old offer stands until accepted or replaced by a later roll
    const cands = Object.entries(g.market[c.id] ?? {}).filter(([, e]) => e.needs && !e.makes && scarcityOf(e) > CONTRACT_SCARCITY_MIN);
    if (!cands.length) { delete b.offers[c.id]; continue; }
    const [good] = cands[Math.floor(r() * cands.length)];
    const qty = Math.max(10, Math.round((c.pop / 1000) * (2 + r() * 2))); // scaled to the town's size
    const reward = Math.round(qty * g.world.goods[good].base * (CONTRACT_BONUS_MIN + r() * CONTRACT_BONUS_SPAN));
    b.offers[c.id] = { id: `${c.id}:${g.day}`, good, qty, reward, dueDay: g.day + CONTRACT_DAYS_MIN + Math.floor(r() * CONTRACT_DAYS_SPAN) };
  }
}

/** Take the port's standing offer. Needs a ship docked there (you hear it in the harbour) and a free slot. */
export function acceptContract(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  const b = book(g), offer = b.offers[city];
  if (!offer) return { ok: false, reason: "no offer" };
  if (offer.dueDay < g.day) { delete b.offers[city]; return { ok: false, reason: "offer expired" }; } // a lapsed order cannot be taken
  if (!g.ships.some((s) => !s.voyage && s.at === city)) return { ok: false, reason: "no ship here" };
  if (b.active.length >= CONTRACT_MAX_ACTIVE) return { ok: false, reason: "too many" };
  b.active.push({ ...offer, city, delivered: 0 });
  delete b.offers[city];
  post(g, "contractAccept", { city, good: offer.good, qty: offer.qty, dueDay: offer.dueDay });
  return { ok: true };
}

/** Sales into the port count towards its active contract. Completion pays the premium, respect and reputation. */
export function contractOnSale(g, city, good, qty) {
  const b = g.contracts;
  if (!b) return;
  const k = b.active.findIndex((x) => x.city === city && x.good === good);
  if (k < 0) return;
  const ct = b.active[k];
  if (ct.dueDay < g.day) return; // past its due day: sales no longer count and no premium is paid (the daily lapse removes it)
  ct.delivered = Math.min(ct.qty, ct.delivered + qty);
  if (ct.delivered >= ct.qty) {
    b.active.splice(k, 1);
    b.done++;
    g.cash += ct.reward;
    if (addRespect(g, city, CONTRACT_RESPECT_COINS)) post(g, "respect", { city });
    addRep(g, city, CONTRACT_REP);
    post(g, "contractDone", { city, good, qty: ct.qty, reward: ct.reward });
  }
}

/** Daily: a contract past its due day lapses and the town remembers; stale offers are taken down. */
export function expireContracts(g) {
  const b = g.contracts;
  if (!b) return;
  for (const [city, o] of Object.entries(b.offers ?? {})) if (o.dueDay < g.day) delete b.offers[city]; // stale offers leave the board
  for (let i = b.active.length - 1; i >= 0; i--) {
    const ct = b.active[i];
    if (ct.dueDay < g.day) {
      b.active.splice(i, 1);
      b.failed++;
      addRep(g, ct.city, CONTRACT_FAIL_REP);
      post(g, "contractFailed", { city: ct.city, good: ct.good, qty: ct.qty, delivered: ct.delivered });
    }
  }
}
