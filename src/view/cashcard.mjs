// Read-only money and routes summary for the chart view. Debt and routes come from game state; nothing is computed here that the game does not already know.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function routeLabel(route, cityName = (x) => x) {
  if (!route) return "";
  if (Array.isArray(route.stops)) return route.stops.map((s) => cityName(s.city)).join(" → ");
  if (route.a && route.b) return `${cityName(route.a)} ⇄ ${cityName(route.b)}`;
  return "";
}
export function cashCardHtml({ lang = "es", owed = 0, ships = [], selected = null, cityName = (x) => x, fmtM = (x) => String(x) } = {}) {
  const en = lang === "en", row = (h) => `<div class="cc-row">${h}</div>`;
  const withRoute = ships.filter((s) => s.route).length;
  const sel = selected?.route ? routeLabel(selected.route, cityName) : "";
  const rows = [
    row(`${en ? "Debt" : "Deuda"}: ${owed > 0 ? esc(fmtM(owed)) : en ? "none" : "ninguna"}`),
    row(`${en ? "Auto routes" : "Rutas automáticas"}: ${withRoute}/${ships.length}`),
    sel ? row(`${en ? "This ship" : "Este barco"}: ${esc(sel)}`) : "",
  ];
  return `<div class="cc-head"><b>${en ? "Finances and routes" : "Deudas y rutas"}</b></div>` + rows.join("");
}
