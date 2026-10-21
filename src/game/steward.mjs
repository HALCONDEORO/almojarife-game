// Warehouse administrator: standing buy/sell orders per good in a port where the player
// owns a warehouse. Buys when the price is at or below a cap (up to a stock target) and
// sells when the price is at or above a floor (keeping a chosen stock). Runs once a day
// on the port's market slot. Trades move the market like manual ones and pay the market
// fee; a cash reserve the player sets is never spent. No DOM here.
import { price } from "../sim/market.mjs";
import { FEE } from "../sim/trade.mjs";
import { post } from "./ledger.mjs";
import { repOnBuy, repOnSale, scarcityOf } from "./reputation.mjs";
import { addRespect } from "./rank.mjs";
import { recordSale } from "./voyages.mjs";

export const stewardOf = (g, city) => g.warehouses?.[city]?.admin ?? null;
const GOOD_NAMES = {
  es: { grain: "trigo", dried_fish: "pescado seco", salt: "sal", wool: "lana", iron: "hierro", timber: "madera", cloth: "paño", olive_oil: "aceite", wine: "vino", silk: "seda", sugar: "azúcar", pepper: "pimienta" },
  en: { grain: "grain", dried_fish: "dried fish", salt: "salt", wool: "wool", iron: "iron", timber: "timber", cloth: "cloth", olive_oil: "olive oil", wine: "wine", silk: "silk", sugar: "sugar", pepper: "pepper" },
};
const whUsed = (w) => Object.values(w.goods).reduce((a, b) => a + b, 0);

/** Set or replace the standing order for one good. Returns {ok} or {ok:false, reason}. */
export function setStewardRule(g, city, good, rule, cap) {
  const w = g.warehouses?.[city];
  if (!w) return { ok: false, reason: "no warehouse here" };
  if (!g.world.goods[good]) return { ok: false, reason: "unknown good" };
  const r = { buyBelow: 0, buyTo: 0, sellAbove: 0, sellKeep: 0, ...rule };
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
  return { ok: true };
}
/** Cash the administrator must leave untouched. */
export function setStewardReserve(g, city, amount) {
  const w = g.warehouses?.[city];
  if (!w || !Number.isFinite(amount) || amount < 0) return { ok: false, reason: "bad amount" };
  (w.admin ??= { rules: {}, reserve: 0 }).reserve = Math.floor(amount);
  return { ok: true };
}

/** One market slot for one port: run every standing order of its warehouse. */
export function stewardTick(g, city, cap) {
  const w = g.warehouses?.[city], a = w?.admin;
  if (!a || g.over) return null;
  if ((g.shocks ?? []).some((s) => s.type === "port_closed" && s.city === city && s.untilDay > g.day)) return null; // a closed port trades nothing (shocks.mjs state, read duck-typed)
  const did = [];
  for (const [good, r] of Object.entries(a.rules)) {
    const e = g.market[city]?.[good];
    if (!e) continue;
    // Sell first: it frees room and cash for the buy side.
    if (r.sellAbove > 0) {
      const have = w.goods[good] ?? 0, can = have - r.sellKeep;
      if (can > 0) {
        let n = 0, revenue = 0; // unit n+1 joins the market at stock+n+1 and fetches that price, as in trade.sell
        while (n < can) { const p = price(g.world, { ...e, stock: e.stock + n + 1 }, good); if (p < r.sellAbove) break; revenue += Math.floor(p * (1 - FEE)); n++; }
        if (n > 0) {
          const scarcity = scarcityOf(e); // shortage BEFORE the sale, as in doSell
          e.stock += n;
          const had = w.goods[good], paid = w.basis?.[good] ?? 0, spent = Math.round(paid * n / had);
          w.goods[good] = had - n; if (w.basis) w.basis[good] = paid - spent;
          if (!w.goods[good]) { delete w.goods[good]; if (w.basis) delete w.basis[good]; }
          g.cash += revenue;
          repOnSale(g, city, scarcity, revenue); // standing orders earn (and lose) reputation like manual trades
          if (addRespect(g, city, revenue)) post(g, "respect", { city }); // and the house earns respect, as in doSell
          const docked = g.ships.find((sh) => sh.at === city && !sh.voyage); // the goods arrived by ship: the sale counts for its voyage
          if (docked) recordSale(g, docked, n, revenue, revenue - spent);
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
          const charged = Math.ceil(unit * (1 + FEE));
          if (cost + charged > budget) break;
          cost += charged; e.stock -= 1; n++;
        }
        if (n > 0) {
          g.cash -= cost;
          repOnBuy(g, city, scarcityOf(e), cost); // post-buy scarcity, as in doBuy
          w.goods[good] = (w.goods[good] ?? 0) + n;
          (w.basis ??= {})[good] = (w.basis[good] ?? 0) + cost;
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
