// Warehouse administrator: standing buy/sell orders per good in a port where the player
// owns a warehouse. Buys when the price is at or below a cap (up to a stock target) and
// sells when the price is at or above a floor (keeping a chosen stock). Runs once a day
// on the port's market slot. Trades move the market like manual ones and pay the market
// fee; a cash reserve the player sets is never spent. No DOM here.
import { price } from "../sim/market.mjs";
import { craftCount } from "./crafts.mjs";
import { FEE, ceil2, floor2 } from "../sim/trade.mjs";
import { whLocked } from "./whlock.mjs";
import { post } from "./ledger.mjs";
import { repOnBuy, repOnSale, scarcityOf, noteTrade } from "./reputation.mjs";
import { memoryDeed, MEMORY_GRAIN_SCARCE } from "./memory.mjs";
import { relationsOnSale } from "./relations.mjs";
import { addRespect } from "./rank.mjs";
import { recordSale } from "./voyages.mjs";
import { WHOLESALE_PURSE_BINDING, commerceOf, recordMarketPurchase, recordWholesaleSale } from "../sim/procurement.mjs";

export const stewardOf = (g, city) => g.warehouses?.[city]?.admin ?? null;
const GOOD_NAMES = {
  es: { grain: "trigo", fish: "pescado", esparto: "esparto", meat: "carne", pottery: "cerámica", legumes: "legumbres", leather: "cuero", salt: "sal", wool: "lana", iron: "hierro", ironware: "herrajes", bricks: "ladrillos", timber: "madera", cloth: "paño", olive_oil: "aceite", wine: "vino", silk: "seda", sugar: "azúcar", pepper: "pimienta", saffron: "azafrán", beer: "cerveza", soap: "jabón" },
  en: { grain: "grain", fish: "fish", esparto: "esparto", meat: "meat", pottery: "pottery", legumes: "legumes", leather: "leather", salt: "salt", wool: "wool", iron: "iron", ironware: "ironware", bricks: "bricks", timber: "timber", cloth: "cloth", olive_oil: "olive oil", wine: "wine", silk: "silk", sugar: "sugar", pepper: "pepper", saffron: "saffron", beer: "beer", soap: "soap" },
};
const whUsed = (w) => Object.values(w.goods).reduce((a, b) => a + b, 0);

/** Set or replace the standing order for one good. Returns {ok} or {ok:false, reason}. */
export function setStewardRule(g, city, good, rule, cap) {
  const w = g.warehouses?.[city];
  if (!w) return { ok: false, reason: "no warehouse here" };
  if (!g.world.goods[good]) return { ok: false, reason: "unknown good" };
  const src = rule ?? {};
  const r = { buyBelow: 0, buyTo: 0, sellAbove: 0, sellKeep: 0 };
  // whitelist: copy only own keys present (prototype-inherited values are ignored);
  // a key present but null/undefined/invalid fails validation below instead of defaulting to 0
  for (const k of ["buyBelow", "buyTo", "sellAbove", "sellKeep"]) if (Object.prototype.hasOwnProperty.call(src, k)) r[k] = src[k];
  for (const k of ["buyBelow", "buyTo", "sellAbove", "sellKeep"]) if (!Number.isFinite(r[k]) || r[k] < 0) return { ok: false, reason: "bad number" };
  r.buyTo = Math.floor(r.buyTo); r.sellKeep = Math.floor(r.sellKeep);
  if (r.buyBelow > 0 && !(r.buyTo > 0)) return { ok: false, reason: "buy needs a stock target" };
  if (r.buyTo > (cap ?? Infinity)) return { ok: false, reason: "target above warehouse capacity" };
  if (r.buyBelow > 0 && r.sellAbove > 0 && r.buyBelow >= r.sellAbove) return { ok: false, reason: "buy cap must stay below sell floor" }; // otherwise it churns and loses the fee both ways
  (w.admin ??= { rules: {}, reserve: 0 }).rules[good] = r;
  return { ok: true, rule: r };
}
export function clearStewardRule(g, city, good) {
  const a = stewardOf(g, city);
  if (!a?.rules[good]) return { ok: false, reason: "no rule" };
  delete a.rules[good];
  if (a.off) delete a.off[good];
  return { ok: true };
}
/** Reorder one standing order in the priority list (prioridad almacenero): the steward
   serves the rules in list order, so when cash, room or the port purse run short,
   the orders nearer the top are served first.
   - Final-index contract: dir -1 moves the rule one place earlier, +1 one place
     later. A local single-player game has no concurrent edits to race against, so
     a boundary or version contract would add nothing here (documented decision).
   - Membership, direction and bounds are validated: a move past either end fails
     explicitly ("already first" / "already last") and leaves the list untouched.
   - The relative order of the other entries is preserved; the rules object keeps
     its key order through JSON, so the list survives a save/load round-trip. */
export function moveStewardRule(g, city, good, dir) {
  const warehouse = g.warehouses?.[city];
  if (!warehouse) return { ok: false, reason: "no warehouse here" };
  const adm = warehouse.admin;
  if (!adm || !Object.prototype.hasOwnProperty.call(adm.rules, good)) return { ok: false, reason: "no rule" };
  if (dir !== -1 && dir !== 1) return { ok: false, reason: "bad direction" };
  const keys = Object.keys(adm.rules), from = keys.indexOf(good), to = from + dir;
  if (to < 0) return { ok: false, reason: "already first" };
  if (to >= keys.length) return { ok: false, reason: "already last" };
  keys.splice(from, 1);
  keys.splice(to, 0, good);
  adm.rules = Object.fromEntries(keys.map((key) => [key, adm.rules[key]]));
  return { ok: true, from, to };
}
/** Pause or resume one standing order (activar/desactivar mercancía): the enabled
   state lives apart from the numbers (w.admin.off), so pausing never rewrites the
   prices or amounts and resuming brings the order back exactly as it was.
   - Desired-state command, not a toggle: setting the state the order already has
     is accepted and reports changed:false (idempotent, as in the goods lock).
   - Strict boolean input: only true/false are accepted; numbers, strings and null
     are rejected, never decoded.
   - Old saves carry no off record and default to enabled, today's behavior. */
export function setStewardRuleEnabled(g, city, good, enabled) {
  if (enabled !== true && enabled !== false) return { ok: false, reason: "bad state" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  const adm = wh.admin;
  if (!adm || !Object.prototype.hasOwnProperty.call(adm.rules, good)) return { ok: false, reason: "no rule" };
  const was = !adm.off?.[good];
  if (was === enabled) return { ok: true, enabled, changed: false };
  if (enabled) delete adm.off[good];
  else (adm.off ??= {})[good] = true;
  return { ok: true, enabled, changed: true };
}
/** Cash the administrator must leave untouched. */
export function setStewardReserve(g, city, amount) {
  const w = g.warehouses?.[city];
  if (!w || !Number.isFinite(amount) || amount < 0) return { ok: false, reason: "bad amount" };
  const normalized = Math.floor(amount);
  if (amount > 0 && normalized === 0) return { ok: false, reason: "bad amount" }; // a positive reserve must survive normalization (setPriceAlert pattern)
  (w.admin ??= { rules: {}, reserve: 0 }).reserve = normalized;
  return { ok: true };
}

/** One market slot for one port: run every standing order of its warehouse. */
export function stewardTick(g, city, cap) { // skipcq: JS-R1005 - pre-existing complexity; this PR adds one lock guard, extraction is out of scope
  const w = g.warehouses?.[city], a = w?.admin;
  if (!a || g.over) return null;
  if ((g.shocks ?? []).some((s) => s.type === "port_closed" && s.city === city && s.untilDay > g.day)) return null; // a closed port trades nothing (shocks.mjs state, read duck-typed)
  const did = [];
  for (const [good, r] of Object.entries(a.rules)) {
    if (a.off?.[good]) continue; // a paused order keeps its numbers but is not served
    const e = g.market[city]?.[good];
    if (!e) continue;
    // Sell first: it frees room and cash for the buy side.
    if (r.sellAbove > 0 && !whLocked(w, good)) { // a locked good never leaves the store, not even on a standing order
      const have = w.goods[good] ?? 0, can = have - r.sellKeep;
      if (can > 0) {
        let n = 0, revenue = 0; // unit n+1 joins the market at stock+n+1 and fetches that price, as in trade.sell
        const purse = WHOLESALE_PURSE_BINDING ? commerceOf(g.market[city]) : null; // standing orders cannot draw more than the purse holds
        const cashCents = purse ? Math.round(purse.cash * 100) : 0; // integer cents, like trade.sell
        let revenueCents = 0;
        while (n < can) { const p = price(g.world, { ...e, stock: e.stock + n + 1 }, good); if (p < r.sellAbove) break; const unit = floor2(p * (1 - FEE)); if (purse && revenueCents + Math.round(unit * 100) > cashCents) break; revenueCents += Math.round(unit * 100); revenue += unit; n++; }
        if (n > 0) {
          const scarcity = scarcityOf(e); // shortage BEFORE the sale, as in doSell
          e.stock += n;
          const had = w.goods[good], paid = w.basis?.[good] ?? 0, spent = n === had ? paid : Math.round(paid * n / had);
          w.goods[good] = had - n; if (w.basis) w.basis[good] = paid - spent;
          if (!w.goods[good]) { delete w.goods[good]; if (w.basis) delete w.basis[good]; }
          g.cash += revenue;
          noteTrade(g, city); // a standing-order sale keeps the name alive like a manual one
          repOnSale(g, city, scarcity, revenue); // standing orders earn (and lose) reputation like manual trades
          if (good === "grain" && scarcity >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "favor", n); // relief into a starving port is remembered
          relationsOnSale(g, city, good, n, revenue); // a standing-order sale earns the rival nod like a manual one
          if (addRespect(g, city, revenue)) post(g, "respect", { city }); // and the house earns respect, as in doSell
          const docked = g.ships.find((sh) => sh.at === city && !sh.voyage); // the goods arrived by ship: the sale counts for its voyage
          if (docked) recordSale(g, docked, n, revenue, revenue - spent);
          recordWholesaleSale(g.market[city], good, n, revenue); // telemetry: the port's purse paid for the goods
          did.push({ good, sold: n, revenue });
        }
      }
    }
    if (r.buyBelow > 0 && r.buyTo > 0) {
      const room = cap - whUsed(w), want = r.buyTo - (w.goods[good] ?? 0);
      let budget = Math.floor(g.cash - (a.reserve ?? 0));
      if (room > 0 && want > 0 && budget > 0) {
        const maxN = Math.min(want, room, e.stock); // fixed before the loop: e.stock shrinks as we buy
        let n = 0, cost = 0;
        while (n < maxN) {
          const unit = price(g.world, e, good);
          if (unit > r.buyBelow) break;
          const charged = ceil2(unit * (1 + FEE));
          if (cost + charged > budget) break;
          cost += charged; e.stock -= 1; n++;
        }
        if (n > 0) {
          craftCount(g, city, good, n); // the steward's standing orders ship goods out like any buyer
          g.cash -= cost;
          noteTrade(g, city);
          repOnBuy(g, city, scarcityOf(e), cost); // post-buy scarcity, as in doBuy
          if (good === "grain" && scarcityOf(e) >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "grievance", n); // hauling grain out of a starving port is remembered too
          w.goods[good] = (w.goods[good] ?? 0) + n;
          (w.basis ??= {})[good] = (w.basis[good] ?? 0) + cost;
          recordMarketPurchase(g.market[city], good, n, cost, e.stock + n); // telemetry: the port's purse received the payment
          did.push({ good, bought: n, cost });
        }
      }
    }
  }
  const cityName = g.world.nodes[city]?.name ?? city;
  for (const d of did) {
    const ges = GOOD_NAMES.es[d.good] ?? d.good, gen = GOOD_NAMES.en[d.good] ?? d.good;
    const txt = d.sold
      ? { es: `El administrador vendió ${d.sold} de ${ges} en ${cityName} por ${d.revenue}.`, en: `The steward sold ${d.sold} ${gen} in ${cityName} for ${d.revenue}.` }
      : { es: `El administrador compró ${d.bought} de ${ges} en ${cityName} por ${d.cost}.`, en: `The steward bought ${d.bought} ${gen} in ${cityName} for ${d.cost}.` };
    post(g, "steward", { city, txt });
  }
  return did.length ? did : null;
}
