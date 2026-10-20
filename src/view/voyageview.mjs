// The trade log tab: one row per voyage with what was sold on arrival and the profit. Pure HTML builder.
import { voyageLog, bestVoyage } from "../game/voyages.mjs";
const TX = {
  es: { empty: "Aún no has zarpado. Cada viaje aparecerá aquí con sus ventas y su beneficio.", day: "Día", route: "Ruta", sold: "Vendido", revenue: "Ingresos", profit: "Beneficio", best: "Mejor viaje", total: "Total" },
  en: { empty: "You have not sailed yet. Each voyage will show up here with its sales and profit.", day: "Day", route: "Route", sold: "Sold", revenue: "Revenue", profit: "Profit", best: "Best voyage", total: "Total" },
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function voyagesHtml(g, lang, fmt, cityName, limit = 15) {
  const x = TX[lang] ?? TX.en, all = voyageLog(g);
  if (!all.length) return `<p>${x.empty}</p>`;
  const rows = all.slice(0, limit), best = bestVoyage(g), tot = all.reduce((a, v) => a + v.profit, 0);
  const cls = (n) => (n < 0 ? ' style="color:#a33"' : n > 0 ? ' style="color:#2a6"' : "");
  return `<p>${x.best}: <b>${esc(cityName(best.from))} → ${esc(cityName(best.to))}</b> (${fmt(best.profit)}) · ${x.total}: <b${cls(tot)}>${fmt(tot)}</b></p>` +
    `<table><tr><th>${x.day}</th><th>${x.route}</th><th>${x.sold}</th><th>${x.revenue}</th><th>${x.profit}</th></tr>` +
    rows.map((v) => `<tr><td>${v.day}</td><td>${esc(cityName(v.from))} → ${esc(cityName(v.to))}</td><td>${fmt(v.sold)}</td><td>${fmt(v.revenue)}</td><td${cls(v.profit)}>${fmt(v.profit)}</td></tr>`).join("") + `</table>`;
}
