// Lonja (exchange): the city's price-history hall. Presentation only: it reads the recorded price
// history (priceHistory/trendPct, 30 days kept) and draws one small chart per good. No simulation
// or save fields belong here. Opt-in experiment behind ?lonja=1.
import { quote, priceHistory, trendPct } from "../game/game.mjs";

export const lonjaEnabled = (search) => new URLSearchParams(search).get("lonja") !== "0"; // default ON (Marco 23/10); ?lonja=0 opts out

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TXT = {
  es: { title: "Lonja de {city}", lead: "Los corredores de la lonja llevan la cuenta de los precios de los últimos 30 días.",
    good: "Bien", price: "Precio", w1: "7 días", w4: "30 días", chart: "Últimos 30 días", noHist: "Sin cuenta suficiente todavía." },
  en: { title: "{city} exchange", lead: "The exchange brokers keep a tally of the last 30 days of prices.",
    good: "Good", price: "Price", w1: "7 days", w4: "30 days", chart: "Last 30 days", noHist: "Not enough tally yet." },
};

const pct = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + v + " %");

/** Small line chart (last 30 days) for one price series; empty string when there is nothing to draw. */
export function lonjaChart(series, w = 220, h = 56) {
  if (!series || series.length < 2) return "";
  const lo = Math.min(...series), hi = Math.max(...series), span = Math.max(1, hi - lo), n = series.length;
  const pts = series.map((v, i) => `${(i / (n - 1) * w).toFixed(1)},${(h - (v - lo) / span * (h - 6) - 3).toFixed(1)}`).join(" ");
  const last = series[n - 1], lx = w, ly = (h - (last - lo) / span * (h - 6) - 3).toFixed(1);
  return `<svg class="lonja-chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><polyline fill="none" stroke="#3d5246" stroke-width="1.6" points="${pts}"/><circle cx="${lx - 2}" cy="${ly}" r="2.4" fill="#3d5246"/></svg>`;
}

/** The exchange table for one port: current price, 7d/30d change and a chart per good. */
export function lonjaHtml(g, city, { lang = "es", fmt = String, goodLabel = (x) => x } = {}) {
  const c = TXT[lang] ?? TXT.es;
  let h = `<p><small>${esc(c.lead)}</small></p><table><thead><tr><th>${c.good}</th><th>${c.price}</th><th>${c.w1}</th><th>${c.w4}</th><th>${c.chart}</th></tr></thead><tbody>`;
  for (const gd of Object.keys(g.world.goods)) {
    const series = priceHistory(g, city, gd), chart = lonjaChart(series);
    h += `<tr><td>${goodLabel(gd)}</td><td>${fmt(quote(g, city, gd))}</td><td>${pct(trendPct(g, city, gd, 7))}</td><td>${pct(trendPct(g, city, gd, 29))}</td><td>${chart || `<small><i>${c.noHist}</i></small>`}</td></tr>`;
  }
  return h + `</tbody></table>`;
}
