// M1b: a simple AI trader. It looks at every (good, destination) pair it can reach,
// scores profit per day using current prices and sails the best one. Own design.
import { route } from "./world.mjs";
import { price } from "./market.mjs";
import { SHIP_TYPES, FEE, buy, sell, sail, cargoUsed, shipCapacity } from "./trade.mjs";
import { buyWeapon, buyGear } from "./armory.mjs";
import { WEAPON_TYPES, weaponCount, maxCannons, loadWeight, gearOf } from "./armament.mjs";

const CARRY_MIN_MARGIN = 1.08; // never sail for less than 8% gross margin (covers both fees)

function bestPlan(world, market, ship, cash, planningMarket = market, canVisit = () => true, scoreCandidate = null) {
  let best = null;
  const spec = SHIP_TYPES[ship.type];
  for (const dest of world.cities) {
    if (dest.id === ship.at || !canVisit(dest.id)) continue;
    const remote = planningMarket[dest.id];
    if (!remote) continue; // no information is not a view of the real remote market
    const r = route(world, ship.at, dest.id);
    if (!r) continue;
    const days = Math.max(1, Math.ceil(r.km / spec.kmPerDay));
    for (const good of Object.keys(world.goods)) {
      const here = market[ship.at][good], there = remote[good];
      if (!here || !there) continue; // old or partial reports need not contain every good
      if (here.stock <= 0) continue;
      const buyP = price(world, here, good) * (1 + FEE), sellP = price(world, there, good) * (1 - FEE);
      if (sellP / buyP < CARRY_MIN_MARGIN) continue;
      const qty = Math.max(0, Math.min(shipCapacity(ship), here.stock, Math.floor(cash / Math.ceil(buyP))));
      const rawScore = ((sellP - buyP) * qty) / (days + 1);
      const score = scoreCandidate ? scoreCandidate({dest:dest.id,good,score:rawScore}) : rawScore;
      if(!Number.isFinite(score)||score<0)continue;
      if (qty <= 0) continue;
      // Tie-break on destination id, then good id, so the choice never depends on iteration order.
      const better = !best || score > best.score ||
        (score === best.score && (dest.id < best.dest || (dest.id === best.dest && good < best.good)));
      if (better) best = { dest: dest.id, good, qty, score };
    }
  }
  return best;
}

/** Armory policy for a trader: same purchase rules as the player (buyWeapon, buyGear), list price at the port's armory.
 *  A trader arms only when the caller reports pirate risk for it (hooks.pirateRisk), and then only when rich (cash at least ARM_CASH_MUL x the price), keeps the load under ARM_WEIGHT_SHARE of its hold
 *  and mounts at most half the slots; it picks the best power per coin. Gear level 1 first, then weapons. */
export const ARM_CASH_MUL = 40, ARM_WEIGHT_SHARE = 0.1;
function armShip(trader, ship) {
  const g = { over: false }; // AI traders own no buildings: list price
  const cap = SHIP_TYPES[ship.type].capacity;
  if (gearOf(ship) < 1 && trader.cash >= ARM_CASH_MUL * 60 && loadWeight(ship) + Math.ceil((ship.crew ?? 0) * 0.1) <= ARM_WEIGHT_SHARE * cap) buyGear(g, ship, trader);
  if (weaponCount(ship) >= Math.ceil(maxCannons(ship) / 2)) return;
  const pick = Object.entries(WEAPON_TYPES).filter(([, w]) => trader.cash >= ARM_CASH_MUL * w.price && loadWeight(ship) + w.weight <= ARM_WEIGHT_SHARE * cap)
    .sort((a, b) => b[1].power / b[1].price - a[1].power / a[1].price || (a[0] < b[0] ? -1 : 1))[0];
  if (pick) buyWeapon(g, ship, pick[0], trader);
}

/** One decision for an idle ship. Mutates ship, market and trader. Returns what it did.
 *  Optional hooks let a harness apply player rules: feeMul(city) scales the market fee,
 *  onSale/onBuy report (city, good, scarcityBefore, revenue|cost) for reputation tracking.
 *  planningMarket() supplies private remembered/rumoured remote cells; canVisit(city) gates
 *  destinations by the trader's own chart. Neither hook reads the real remote market.
 *  Local execution still uses the shared live market, just like a player trade. */
export function aiStep(world, market, trader, ship, hooks = {}) {
  if (ship.voyage) return null;
  const fee = FEE * (hooks.feeMul?.(ship.at) ?? 1);
  for (const good of Object.keys(ship.cargo)) {
    const e = market[ship.at]?.[good];
    const scarcity = e ? e.target / Math.max(1, e.stock) : 0;
    const s = sell(world, market, ship, good, ship.cargo[good], fee);
    if (s.ok) { trader.cash += s.revenue; hooks.onSale?.(ship.at, good, scarcity, s.revenue); }
  }
  if (cargoUsed(ship) > 0) return null;
  if (hooks.pirateRisk?.(ship)) armShip(trader, ship); // bots arm only when a harness says their lane is dangerous: today nobody raids them, and arming them measurably inflated the NPC economy
  const planningMarket = hooks.planningMarket ? hooks.planningMarket() : market;
  const plan = bestPlan(world, market, ship, trader.cash, planningMarket ?? {}, hooks.canVisit, hooks.scoreCandidate);
  if (!plan) return null;
  const eb = market[ship.at]?.[plan.good];
  const scarcityB = eb ? eb.target / Math.max(1, eb.stock) : 0;
  const b = buy(world, market, ship, trader.cash, plan.good, plan.qty, fee);
  if (!b.ok) return null;
  trader.cash -= b.cost;
  hooks.onBuy?.(ship.at, plan.good, scarcityB, b.cost);
  sail(world, ship, plan.dest);
  return plan;
}
