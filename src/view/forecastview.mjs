// 7-day wind and storm outlook for the ports of the selected ship's route (or the port it is in).
import { forecast } from "../sim/weather.mjs";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ARROWS = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]; // wind FROM dir: 0 = north wind, blows south
const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"], COMPASS_EN = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function forecastPorts(ship) {
  const r = ship?.route, ids = r ? (Array.isArray(r.stops) ? r.stops.map((s) => s.city) : [r.a, r.b]) : [ship?.at];
  return [...new Set(ids.filter(Boolean))].slice(0, 3);
}
export function forecastData(g, world, ship) {
  return forecastPorts(ship).map((id) => {
    const c = world.cities.find((x) => x.id === id);
    return c ? { city: id, days: forecast(c.lat, c.lon, g.day, g.seed ?? 0, 7) } : null;
  }).filter(Boolean);
}
const force = (f) => (f < 0.34 ? 1 : f < 0.67 ? 2 : 3);
export function forecastHtml(rows, { lang = "es", cityName = (x) => x } = {}) {
  if (!rows?.length) return "";
  const en = lang === "en", names = en ? COMPASS_EN : COMPASS;
  const body = rows.map((r) => `<div class="fc-port"><b>${esc(cityName(r.city))}</b><div class="fc-days">${r.days.map((d, i) => {
    const k = Math.round(d.dir / 45) % 8, lbl = `${names[k]} ${en ? "force" : "fuerza"} ${force(d.force)}${d.storm ? (en ? ", storm" : ", tormenta") : ""}`;
    return `<span class="fc-day${d.storm ? " fc-storm" : ""}" title="${esc(lbl)}"><i>${i === 0 ? (en ? "Today" : "Hoy") : "+" + i}</i>${d.storm ? "⛈" : ARROWS[k]}<small>${names[k]} ${force(d.force)}</small></span>`;
  }).join("")}</div></div>`).join("");
  return `<div class="nc-title"><b>${en ? "7-day outlook" : "Previsión a 7 días"}</b></div>${body}`;
}
