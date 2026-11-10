// Read-only port price comparison and indicative best trades for the right-hand card.
// Prices of other ports come only from what the player knows (live where a ship or warehouse is, else the last visit or a bought rumour),
// with their age; nothing here reveals hidden market data and nothing changes the game.
import { price } from "../sim/market.mjs";
import { route } from "../sim/world.mjs";
import { FEE, SHIP_TYPES } from "../sim/trade.mjs";
import { ticksForKm, TICKS_PER_DAY } from "../sim/clock.mjs";
import { dailyUpkeep } from "../game/crew.mjs";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** The `n` ports nearest to `city` by sea route length. */
export function nearestPorts(world, city, n = 3) {
  return world.cities.filter((c) => c.id !== city)
    .map((c) => ({ id: c.id, km: route(world, city, c.id)?.km ?? Infinity })).filter((x) => Number.isFinite(x.km))
    .sort((a, b) => a.km - b.km || (a.id < b.id ? -1 : 1)).slice(0, n);
}
/** Known price of a good in another port: { price, days, exact } or null when the player knows nothing about it. */
export function knownPrice(g, city, good) {
  const i = g.intel?.[city], cell = i?.cells?.[good];
  if (!cell) return null;
  return { price: price(g.world, cell, good), days: g.day - i.day, exact: !!i.exact };
}
/** Where the docked ship's hold earns most: for each good aboard, the best port by net profit —
 *  the sale after fees, minus what the cargo cost (ship.basis) and the upkeep of the days at sea.
 *  Read-only: only known prices are used (live here, intel elsewhere), nothing hidden is revealed. */
export function holdDeals(g, ship, { feeMul = 1, neighbours = ship ? nearestPorts(g.world, ship.at) : [] } = {}) {
  if (!ship || ship.voyage || !ship.at || !ship.cargo) return [];
  const type = SHIP_TYPES[ship.type]; if (!type) return [];
  const f = FEE * feeMul, upkeepPerDay = dailyUpkeep(ship, type.upkeepPerDay * (g.upkeepMul ?? 1)).total;
  const deals = [];
  for (const [good, qty] of Object.entries(ship.cargo)) {
    if (!(qty > 0)) continue;
    const basis = ship.basis?.[good] ?? 0;
    let best = null;
    for (const dest of [{ id: ship.at, km: 0 }, ...neighbours]) {
      const known = dest.km === 0
        ? (g.market[ship.at]?.[good] ? { price: price(g.world, g.market[ship.at][good], good), days: 0, exact: true } : null)
        : knownPrice(g, dest.id, good);
      if (!known) continue;
      const travelDays = dest.km === 0 ? 0 : ticksForKm(dest.km, type.kmPerDay) / TICKS_PER_DAY;
      const revenue = known.price * (1 - f) * qty, net = revenue - basis - upkeepPerDay * travelDays;
      if (!best || net > best._net) best = { good, qty, city: dest.id, sell: known.price, travelDays: Math.round(travelDays * 10) / 10, net: Math.round(net), days: known.days, exact: known.exact, _net: net };
    }
    if (best) { delete best._net; deals.push(best); }
  }
  return deals.sort((a, b) => b.net - a.net || (a.good < b.good ? -1 : 1)).slice(0, 5);
}
export function portData(g, city, { feeMul = 1, neighbours = nearestPorts(g.world, city), ...opts } = {}) {
  const f = FEE * feeMul, goods = Object.keys(g.world.goods);
  const rows = goods.filter((good) => g.market[city]?.[good]).map((good) => {
    const here = price(g.world, g.market[city][good], good);
    return { good, here, others: neighbours.map((n) => ({ city: n.id, km: n.km, ...(knownPrice(g, n.id, good) ?? { price: null }) })) };
  });
  const best = [];
  for (const r of rows) for (const o of r.others) {
    if (o.price == null) continue;
    const margin = o.price * (1 - f) - r.here * (1 + f);
    if (margin > 0) best.push({ good: r.good, buy: r.here, sellCity: o.city, sell: o.price, margin: Math.round(margin * 10) / 10, days: o.days, exact: o.exact, km: o.km });
  }
  best.sort((a, b) => b.margin - a.margin || (a.good < b.good ? -1 : 1));
  const ship = opts.ship;
  return { city, neighbours, rows, best: best.slice(0, 5), hold: ship && ship.at === city ? holdDeals(g, ship, { feeMul, neighbours }) : [] };
}
const ageTxt = (o, en) => (o.exact ? "" : ` <small>(${en ? `${o.days} d ago` : `hace ${o.days} d`})</small>`);
export function portHtml(d, { lang = "es", cityName = (x) => x, goodName = (x) => x } = {}) {
  const en = lang === "en";
  if (!d) return `<p>${en ? "The selected ship is at sea. Prices show when it is docked." : "El barco seleccionado está en el mar. Los precios salen cuando esté en puerto."}</p>`;
  const head = `<tr><th>${en ? "Good" : "Bien"}</th><th>${esc(cityName(d.city))}</th>${d.neighbours.map((n) => `<th>${esc(cityName(n.id))}</th>`).join("")}</tr>`;
  const body = d.rows.map((r) => `<tr><td>${esc(goodName(r.good))}</td><td><b>${r.here}</b></td>${r.others.map((o) => `<td>${o.price == null ? "—" : `${o.price}${ageTxt(o, en)}`}</td>`).join("")}</tr>`).join("");
  const hold = d.hold?.length ? `<h3>${en ? "From your hold" : "Desde tu bodega"}</h3><ol class="port-hold">${d.hold.map((h) => `<li><b>${esc(goodName(h.good))}</b> ×${h.qty}: ${en ? "best in" : "mejor en"} <b>${esc(cityName(h.city))}</b> ${en ? "at" : "a"} ${h.sell}${ageTxt(h, en)} · ${en ? "net" : "neto"} <b>${h.net >= 0 ? "+" : ""}${h.net}</b></li>`).join("")}</ol><p class="port-note">${en ? "Net of what the cargo cost and the upkeep of the days at sea; known prices only." : "Neto de lo que costó la carga y del mantenimiento de los días en el mar; solo precios conocidos."}</p>` : "";
  return `<h3>${en ? "Prices here and in the 3 nearest ports" : "Precios aquí y en los 3 puertos más cercanos"}</h3><table class="port-prices">${head}${body}</table><p class="port-note">${en ? "— means unknown: visit the port or buy a rumour." : "— significa desconocido: visita el puerto o compra un rumor."}</p>${hold}`;
}
export function tradesHtml(d, { lang = "es", cityName = (x) => x, goodName = (x) => x } = {}) {
  const en = lang === "en";
  if (!d) return `<p>${en ? "The selected ship is at sea." : "El barco seleccionado está en el mar."}</p>`;
  const rows = d.best.length ? d.best.map((b) => `<li><b>${esc(goodName(b.good))}</b>: ${en ? "buy here at" : "compra aquí a"} ${b.buy}, ${en ? "sell in" : "vende en"} ${esc(cityName(b.sellCity))} ${en ? "at" : "a"} ${b.sell}${ageTxt(b, en)} · <b>+${b.margin}</b> ${en ? "per unit after fees" : "por unidad tras tasas"}</li>`).join("") : `<li>${en ? "No profitable trade is known from here. Visit more ports to learn their prices." : "Ahora no se conoce ningún negocio rentable desde aquí. Visita más puertos para saber sus precios."}</li>`;
  return `<h3>${en ? "Best trades from" : "Mejores negocios desde"} ${esc(cityName(d.city))}</h3><ol class="port-trades">${rows}</ol><p class="port-note">${en ? "Indicative: prices move as you trade, and the amount you can carry limits the gain." : "Orientativo: los precios se mueven al comerciar y la carga limita la ganancia."}</p>`;
}
