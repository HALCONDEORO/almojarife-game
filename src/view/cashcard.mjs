// Read-only money and routes summary for the chart view. Debt and routes come from game state; nothing is computed here that the game does not already know.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function routeLabel(route, cityName = (x) => x) {
  if (!route) return "";
  if (Array.isArray(route.stops)) return route.stops.map((s) => cityName(s.city)).join(" → ");
  if (route.a && route.b) return `${cityName(route.a)} ⇄ ${cityName(route.b)}`;
  return "";
}
/** Read-only finance summary from state the game already keeps: the soonest loan due day, the next weekly settlement and what it will take,
 *  and last week's trading profit per day (null until the first weekly report exists). Nothing here changes the economy. */
export function financeSummary(g, { settleEvery = 7, dueNow = 0 } = {}) {
  const loans = g?.loans ?? [], day = g?.day ?? 0;
  const next = loans.filter((l) => l.left > 0).reduce((m, l) => (m === null || l.due < m ? l.due : m), null);
  const trades = g?.reports?.[0]?.trades;
  const profit = Array.isArray(trades) ? trades.reduce((x, t) => x + (t.profit ?? 0), 0) / settleEvery : null;
  return { loanDueIn: next === null ? null : Math.max(0, next - day), settleIn: settleEvery - (day % settleEvery || settleEvery) || settleEvery, dueNow, profitPerDay: profit };
}
const inDays = (n, en) => (n === 0 ? (en ? "today" : "hoy") : en ? `in ${n} day${n === 1 ? "" : "s"}` : `en ${n} día${n === 1 ? "" : "s"}`);
export function cashCardHtml({ lang = "es", owed = 0, ships = [], selected = null, cityName = (x) => x, fmtM = (x) => String(x), fin = null, stats = null } = {}) {
  const en = lang === "en", row = (h) => `<div class="cc-row">${h}</div>`;
  const withRoute = ships.filter((s) => s.route).length;
  const sel = selected?.route ? routeLabel(selected.route, cityName) : "", saved = !selected?.route && selected?.lastRoute ? routeLabel(selected.lastRoute, cityName) : "";
  const rows = [
    row(`${en ? "Debt" : "Deuda"}: ${owed > 0 ? esc(fmtM(owed)) : en ? "none" : "ninguna"}${owed > 0 && fin?.loanDueIn != null ? ` (${en ? "next due" : "vence"} ${inDays(fin.loanDueIn, en)})` : ""}`),
    fin ? row(`${en ? "Next settlement" : "Próxima liquidación"}: ${inDays(fin.settleIn, en)}${fin.dueNow > 0 ? ` · ${en ? "owed so far" : "acumulado"} ${esc(fmtM(fin.dueNow))}` : ""}`) : "",
    fin ? row(`${en ? "Profit per day" : "Beneficio por día"}: ${fin.profitPerDay == null ? (en ? "after the first weekly report" : "tras el primer informe semanal") : `${fin.profitPerDay >= 0 ? "+" : ""}${esc(fmtM(Math.round(fin.profitPerDay * 10) / 10))} (${en ? "last week" : "semana pasada"})`}`) : "",
    row(`${en ? "Auto routes" : "Rutas automáticas"}: ${withRoute}/${ships.length}`),
    sel ? row(`${en ? "This ship" : "Este barco"}: ${esc(sel)}`) : "",
    sel && stats ? row(stats.laps > 0 ? `${en ? "Laps" : "Vueltas"}: ${stats.laps} · ${en ? "profit per lap" : "beneficio por vuelta"}: ${stats.perLap >= 0 ? "+" : ""}${esc(fmtM(stats.perLap))}` : `${en ? "Laps" : "Vueltas"}: 0 · ${en ? "profit per lap after the first" : "beneficio por vuelta tras la primera"}`) : "",
    !sel && saved ? row(`${en ? "Saved route" : "Ruta guardada"}: ${esc(saved)} <button type="button" id="route-repeat" class="vc-open">${en ? "Repeat route" : "Repetir ruta"}</button>`) : "",
  ];
  return `<div class="cc-head"><b>${en ? "Finances and routes" : "Finanzas y rutas"}</b></div>` + rows.join("");
}
