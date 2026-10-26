// Price alerts: while in a port you mark a good and a price, and a messenger brings word the day
// the market crosses it - so you know when to come back. One alert per good and port, a small cap,
// checked once a day against the real market. Plain data on g; save/load keeps them. No DOM here.
import { price } from "../sim/market.mjs";
import { post } from "./ledger.mjs";
import { GOOD_ES, GOOD_EN } from "./news.mjs";

export const ALERT_MAX = 8;

export const alertsOf = (g, city) => (g.priceAlerts ?? []).filter((a) => city === undefined || a.city === city);

/** Set (or replace) the alert for one good in one port. dir: "below" fires at <= price, "above" at >= price. */
export function setPriceAlert(g, city, good, dir, target) {
  if (!g.world.goods[good]) return { ok: false, reason: "unknown good" };
  if (!g.world.nodes[city]) return { ok: false, reason: "unknown port" };
  if (dir !== "below" && dir !== "above") return { ok: false, reason: "bad direction" };
  if (!Number.isFinite(target) || target <= 0) return { ok: false, reason: "bad price" };
  const list = (g.priceAlerts ??= []), old = list.findIndex((a) => a.city === city && a.good === good);
  if (old >= 0) list.splice(old, 1); // replacing, not stacking
  else if (list.length >= ALERT_MAX) return { ok: false, reason: "too many alerts" };
  const a = { id: `al:${city}:${good}`, city, good, dir, price: Math.round(target), sinceDay: g.day };
  list.push(a);
  return { ok: true, alert: a };
}
export function clearPriceAlert(g, city, good) {
  const list = g.priceAlerts ?? [], i = list.findIndex((a) => a.city === city && a.good === good);
  if (i < 0) return { ok: false, reason: "no alert" };
  list.splice(i, 1);
  return { ok: true };
}

/** Day-boundary check: each alert compares against today's market price, fires once and is spent. */
export function tickAlerts(g) {
  const fired = [];
  for (const a of [...(g.priceAlerts ?? [])]) {
    const e = g.market[a.city]?.[a.good];
    if (!e) continue;
    const p = price(g.world, e, a.good);
    if ((a.dir === "below" && p > a.price) || (a.dir === "above" && p < a.price)) continue;
    g.priceAlerts.splice(g.priceAlerts.indexOf(a), 1);
    fired.push({ ...a, now: p });
    const cName = g.world.nodes[a.city]?.name ?? a.city; // names the player reads, not raw keys
    post(g, "alert", { txt: a.dir === "below"
      ? { es: `Alerta: ${GOOD_ES[a.good] ?? a.good} en ${cName} bajó a ${p} (tu marca: ${a.price}).`, en: `Alert: ${GOOD_EN[a.good] ?? a.good} at ${cName} fell to ${p} (your mark: ${a.price}).` }
      : { es: `Alerta: ${GOOD_ES[a.good] ?? a.good} en ${cName} subió a ${p} (tu marca: ${a.price}).`, en: `Alert: ${GOOD_EN[a.good] ?? a.good} at ${cName} rose to ${p} (your mark: ${a.price}).` } });
  }
  return fired;
}
