// Read-only list of what the player is waiting on: price alerts set in ports and the concejos' pregones, each with how long it has stood.
// A pregón has no end date of its own; it stands while the port's store is still short, which is only checked where the player has live data.
import { price } from "../sim/market.mjs";
import { isLive } from "../game/intel.mjs";
import { PREGON_CRIT, PREGON_COOLDOWN } from "../game/pregon.mjs";
import { scarcityOf } from "../game/reputation.mjs";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function noticeData(g, { maxPregones = 3 } = {}) {
  const alerts = (g.priceAlerts ?? []).map((a) => {
    const live = isLive(g, a.city), cell = live ? g.market[a.city]?.[a.good] : g.intel?.[a.city]?.cells?.[a.good];
    return { city: a.city, good: a.good, dir: a.dir, mark: a.price, since: g.day - (a.sinceDay ?? g.day), now: cell ? price(g.world, cell, a.good) : null, live };
  });
  const pregones = (g.inbox ?? []).filter((m) => m.kind === "pregon" && m.city && m.good && g.day - m.day <= PREGON_COOLDOWN).slice(0, maxPregones).map((m) => {
    const live = isLive(g, m.city), cell = g.market?.[m.city]?.[m.good];
    return { city: m.city, good: m.good, age: g.day - m.day, standing: live && cell ? scarcityOf(cell) >= PREGON_CRIT : null };
  });
  return { alerts, pregones };
}
const ago = (n, en) => (n <= 0 ? (en ? "today" : "hoy") : en ? `${n} d ago` : `hace ${n} d`);
export function noticeHtml(d, { lang = "es", cityName = (x) => x, goodName = (x) => x } = {}) {
  if (!d || (!d.alerts.length && !d.pregones.length)) return "";
  const en = lang === "en", row = (h) => `<div class="nc-row">${h}</div>`;
  const rows = [
    ...d.alerts.map((a) => row(`${en ? "Alert" : "Alerta"}: ${esc(goodName(a.good))} ${en ? "in" : "en"} ${esc(cityName(a.city))} ${a.dir === "below" ? (en ? "at or below" : "a ≤") : (en ? "at or above" : "a ≥")} ${a.mark}${a.now == null ? "" : ` · ${en ? "now" : "ahora"} ${a.now}${a.live ? "" : en ? " (old data)" : " (dato antiguo)"}`} · ${en ? "set" : "puesta"} ${ago(a.since, en)}`)),
    ...d.pregones.map((p) => row(`${en ? "Proclamation" : "Pregón"}: ${esc(cityName(p.city))} ${en ? "calls for" : "pide"} ${esc(goodName(p.good))} · ${ago(p.age, en)} · ${p.standing === null ? (en ? "no recent data" : "sin datos recientes") : p.standing ? (en ? "still short" : "sigue escaso") : en ? "no longer short" : "ya no escasea"}`)),
  ];
  return `<div class="nc-head"><b>${en ? "Alerts and proclamations" : "Avisos y pregones"}</b></div>` + rows.join("");
}
