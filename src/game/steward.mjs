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
const whUsed = (wh) => Object.values(wh.goods).reduce((acc, qty) => acc + qty, 0);

/** Set or replace the standing order for one good (configuración de mercancías).
   The contract, named once: prices are coins per unit of the good, compared
   against the market price BEFORE the port fee; buyTo and sellKeep are units of
   the good. A 0 on a side disables that side only; the order's enabled state
   lives apart, in admin.off (see setStewardRuleEnabled). Every field is
   validated before anything is written, so a rejected configuration never
   leaves a half-applied order behind; re-setting an existing good replaces the
   numbers in place and keeps its position in the priority list.
   Returns {ok} or {ok:false, reason}. */
export function setStewardRule(g, city, good, rule, cap) {
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  if (!g.world.goods[good]) return { ok: false, reason: "unknown good" };
  const src = rule ?? {};
  const next = { buyBelow: 0, buyTo: 0, sellAbove: 0, sellKeep: 0 };
  // whitelist: copy only own keys present (prototype-inherited values are ignored);
  // a key present but null/undefined/invalid fails validation below instead of defaulting to 0
  for (const key of ["buyBelow", "buyTo", "sellAbove", "sellKeep"]) if (Object.prototype.hasOwnProperty.call(src, key)) next[key] = src[key];
  for (const key of ["buyBelow", "buyTo", "sellAbove", "sellKeep"]) if (!Number.isFinite(next[key]) || next[key] < 0) return { ok: false, reason: "bad number" };
  next.buyTo = Math.floor(next.buyTo) + 0; next.sellKeep = Math.floor(next.sellKeep) + 0; next.buyBelow += 0; next.sellAbove += 0; // +0 normalizes a signed zero away
  if (next.buyBelow > 0 && !(next.buyTo > 0)) return { ok: false, reason: "buy needs a stock target" };
  if (next.buyTo > (cap ?? Infinity)) return { ok: false, reason: "target above warehouse capacity" };
  if (next.buyBelow > 0 && next.sellAbove > 0 && next.buyBelow >= next.sellAbove) return { ok: false, reason: "buy cap must stay below sell floor" }; // otherwise it churns and loses the fee both ways
  (wh.admin ??= { rules: {}, reserve: 0 }).rules[good] = next;
  return { ok: true, rule: next };
}
export function clearStewardRule(g, city, good) {
  const adm = stewardOf(g, city);
  if (!adm?.rules[good]) return { ok: false, reason: "no rule" };
  delete adm.rules[good];
  if (adm.off) delete adm.off[good];
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
/** Dismiss the administrator: remove the whole automation record (every standing
   order, the paused markers and the coin reserve) in one explicit command
   (ciclo del almacenero). Lifecycle facts, established for this game and
   documented where the contract asks: there is no hiring step and no fee - the
   administrator comes free with the warehouse, so there is no cost to check or
   refund; no scheduled work exists to cancel, because the orders run inline in
   the day tick; and the goods in the store are never touched. Re-hiring is just
   setting orders again. A dismiss with nothing to dismiss fails explicitly
   ("nothing to dismiss"), so a stale or repeated removal has a defined outcome. */
export function dismissSteward(g, city) {
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  const adm = wh.admin;
  const rules = adm ? Object.keys(adm.rules).length : 0;
  const paused = adm?.off ? Object.keys(adm.off).length : 0;
  if (!adm || (rules === 0 && paused === 0 && !(adm.reserve > 0))) return { ok: false, reason: "nothing to dismiss" };
  const reserve = adm.reserve ?? 0;
  delete wh.admin;
  return { ok: true, rules, reserve };
}
/** Cash the administrator must leave untouched. */
export function setStewardReserve(g, city, amount) {
  const wh = g.warehouses?.[city];
  if (!wh || !Number.isFinite(amount) || amount < 0) return { ok: false, reason: "bad amount" };
  const normalized = Math.floor(amount);
  if (amount > 0 && normalized === 0) return { ok: false, reason: "bad amount" }; // a positive reserve must survive normalization (setPriceAlert pattern)
  (wh.admin ??= { rules: {}, reserve: 0 }).reserve = normalized;
  return { ok: true };
}

/** One market slot for one port: run every standing order of its warehouse. */
export function stewardTick(g, city, cap) { // skipcq: JS-R1005 - pre-existing complexity; this PR adds one lock guard, extraction is out of scope
  const wh = g.warehouses?.[city], adm = wh?.admin;
  if (!adm || g.over) return null;
  if ((g.shocks ?? []).some((shock) => shock.type === "port_closed" && shock.city === city && shock.untilDay > g.day)) return null; // a closed port trades nothing (shocks.mjs state, read duck-typed)
  const did = [];
  for (const [good, rule] of Object.entries(adm.rules)) {
    if (adm.off?.[good]) continue; // adm paused order keeps its numbers but is not served
    const entry = g.market[city]?.[good];
    if (!entry) continue;
    // Sell first: it frees room and cash for the buy side.
    if (rule.sellAbove > 0 && !whLocked(wh, good)) { // a locked good never leaves the store, not even on a standing order
      const have = wh.goods[good] ?? 0, can = have - rule.sellKeep;
      if (can > 0) {
        let sold = 0, revenue = 0, feeCents = 0; // unit sold+1 joins the market at stock+sold+1 and fetches that price, as in trade.sell
        const purse = WHOLESALE_PURSE_BINDING ? commerceOf(g.market[city]) : null; // standing orders cannot draw more than the purse holds
        const cashCents = purse ? Math.round(purse.cash * 100) : 0; // integer cents, like trade.sell
        let revenueCents = 0;
        while (sold < can) { const px = price(g.world, { ...entry, stock: entry.stock + sold + 1 }, good); if (px < rule.sellAbove) break; const unit = floor2(px * (1 - FEE)); if (purse && revenueCents + Math.round(unit * 100) > cashCents) break; revenueCents += Math.round(unit * 100); revenue += unit; feeCents += Math.round((px - unit) * 100); sold++; }
        if (sold > 0) {
          const scarcity = scarcityOf(entry); // shortage BEFORE the sale, as in doSell
          entry.stock += sold;
          const had = wh.goods[good], paid = wh.basis?.[good] ?? 0, spent = sold === had ? paid : Math.round(paid * sold / had);
          wh.goods[good] = had - sold; if (wh.basis) wh.basis[good] = paid - spent;
          if (!wh.goods[good]) { delete wh.goods[good]; if (wh.basis) delete wh.basis[good]; }
          g.cash += revenue;
          noteTrade(g, city); // a standing-order sale keeps the name alive like a manual one
          repOnSale(g, city, scarcity, revenue); // standing orders earn (and lose) reputation like manual trades
          if (good === "grain" && scarcity >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "favor", sold); // relief into a starving port is remembered
          relationsOnSale(g, city, good, sold, revenue); // a standing-order sale earns the rival nod like a manual one
          if (addRespect(g, city, revenue)) post(g, "respect", { city }); // and the house earns respect, as in doSell
          const docked = g.ships.find((sh) => sh.at === city && !sh.voyage); // the goods arrived by ship: the sale counts for its voyage
          if (docked) recordSale(g, docked, sold, revenue, revenue - spent);
          recordWholesaleSale(g.market[city], good, sold, revenue); // telemetry: the port's purse paid for the goods
          did.push({ good, sold, revenue, fee: feeCents / 100 }); // fee: the port's cut of the committed sale
        }
      }
    }
    if (rule.buyBelow > 0 && rule.buyTo > 0) {
      const room = cap - whUsed(wh), want = rule.buyTo - (wh.goods[good] ?? 0);
      const budget = Math.floor(g.cash - (adm.reserve ?? 0));
      if (room > 0 && want > 0 && budget > 0) {
        const maxN = Math.min(want, room, entry.stock); // fixed before the loop: entry.stock shrinks as we buy
        let bought = 0, cost = 0, feeCents = 0;
        while (bought < maxN) {
          const unit = price(g.world, entry, good);
          if (unit > rule.buyBelow) break;
          const charged = ceil2(unit * (1 + FEE));
          if (cost + charged > budget) break;
          cost += charged; feeCents += Math.round((charged - unit) * 100); entry.stock -= 1; bought++;
        }
        if (bought > 0) {
          craftCount(g, city, good, bought); // the steward's standing orders ship goods out like any buyer
          g.cash -= cost;
          noteTrade(g, city);
          repOnBuy(g, city, scarcityOf(entry), cost); // post-buy scarcity, as in doBuy
          if (good === "grain" && scarcityOf(entry) >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "grievance", bought); // hauling grain out of a starving port is remembered too
          wh.goods[good] = (wh.goods[good] ?? 0) + bought;
          (wh.basis ??= {})[good] = (wh.basis[good] ?? 0) + cost;
          recordMarketPurchase(g.market[city], good, bought, cost, entry.stock + bought); // telemetry: the port's purse received the payment
          did.push({ good, bought, cost, fee: feeCents / 100 }); // fee: the port's cut inside the committed cost
        }
      }
    }
  }
  const cityName = g.world.nodes[city]?.name ?? city;
  for (const row of did) {
    const ges = GOOD_NAMES.es[row.good] ?? row.good, gen = GOOD_NAMES.en[row.good] ?? row.good;
    const txt = row.sold
      ? { es: `El administrador vendió ${row.sold} de ${ges} en ${cityName} por ${row.revenue} (tasa ${row.fee}).`, en: `The steward sold ${row.sold} ${gen} in ${cityName} for ${row.revenue} (fee ${row.fee}).` }
      : { es: `El administrador compró ${row.bought} de ${ges} en ${cityName} por ${row.cost} (tasa ${row.fee}).`, en: `The steward bought ${row.bought} ${gen} in ${cityName} for ${row.cost} (fee ${row.fee}).` };
    post(g, "steward", { city, txt });
  }
  return did.length ? did : null;
}
