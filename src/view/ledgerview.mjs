// Reports and messages as HTML strings (no DOM access), so they can be tested. Text is escaped.
import { SHIP_TYPES } from "../sim/trade.mjs";
import { rankName, RESPECT_NAMES } from "./rankview.mjs";
import { msgClass, groupNotices } from "./msgclass.mjs";
import { dueNow, SETTLE_EVERY, OVERDRAFT_LIMIT, OVERDRAFT_RATE } from "../game/ledger.mjs";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const LT = {
  es: { household: "Tributo a la ciudad", negMargin: "Margen negativo 3+ días", reports: "Informes", messages: "Mensajes", close: "Cerrar", week: "Semana", day: "Día", ship: "Barco", cost: "Coste", upkeep: "Mantenimiento de la semana", tolls: "Peajes de puerto", carried: "Deuda anterior", interest: "Interés", loanInt: "Interés del préstamo", loanPrin: "Préstamo devuelto", crew: "Salarios de tripulación (monedas)", captain: "Capitán", guns: "Cañones", trade: "Comercio de la semana", good: "Mercancía", sold: "Vendido", profit: "Ganancia", paid: "Pagado", debt: "Pendiente", cashAfter: "Caja tras el pago",
    next: "Próximo pago", nextIn: "en {n} días", due: "A pagar ahora", none: "Aún no hay informes. El primero llega el día 7.", noMsg: "No hay mensajes.", markAll: "Marcar todo como leído",
    chronTitle: "Crónica de la casa", chronYear: "Año", chronOpen: "en curso", chronCash: "Caja", chronWorth: "Patrimonio", chronShips: "Barcos", chronRank: "Rango", chronTrade: "Ganancia comercial", chronUpkeep: "Mantenimiento", chronBest: "Mejor mercancía", chronNone: "La crónica de cada año se cierra el último día del año: aquí verás cómo le fue a la casa.",
    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" },
    msg: { report: "Informe semanal {week}: pagado {paid}{debt}", arrival: "El barco {ship} llegó a {city}.", order: "Tu {type} (barco {ship}) está listo en {city}.", event: "{txt}", info: "{txt}", loan: "Banco de {city}: recibiste {amt}. Interés {rate} % a la semana. Vence el día {dueDay}.", routeLeg: "Barco {ship}: vendió {qty} {good} en {city} por {amt} (ganancia {profit}).", routeStuck: "Barco {ship}: su ruta está parada en {city}, no pudo comprar {good} (sin caja o sin existencias). Reintenta cada día.", routeRepair: "Barco {ship}: su ruta reparó el casco en {city} por {cost}.", routeRepairSkip: "Barco {ship}: su ruta quiere reparar el casco ({hull} %) en {city} pero el freno de caja no llega (cuesta {cost}). Sigue navegando desgastado.", bldMargin: "Tu taller en {city} ({plot}) lleva 3 días con margen negativo ({margin} por lote): no produce nada mientras tanto. Cambia de receta, revisa precios o páralo desde su ficha.", loanPaid: "Devolviste {amt} al banco.", loanDue: "Tu préstamo de {amt} vence el día {dueDay}. Devuélvelo antes o el banco lo cobrará de tu caja.", loanLate: "El banco cobró {amt} de tu caja por un préstamo vencido.", loanSeized: "El banco de {city} embargó {units} unidades de tus bienes en el puerto por {amt} al vencer un préstamo.", warn: "Mañana toca pagar el mantenimiento: {due}. En caja tienes {cash}. Si no alcanza, la caja quedará en negativo y pagará interés.", contractAccept: "Encargo aceptado en {city}: entrega {qty} de {good} antes del día {dueDay}.", contractDone: "Encargo cumplido en {city}: {qty} de {good} entregadas. El concejo paga la prima acordada: {reward}.", contractFailed: "Encargo fallido en {city}: solo entregaste {delivered} de {qty} de {good} a tiempo. El concejo lo recuerda.", bankrupt: "Quiebra: el banco embargó tu mercancía y tus edificios (recuperado {recovered}) y condonó el resto de la deuda ({forgiven}). Empiezas de nuevo solo con tus barcos.", rank: "¡Ascenso! Ahora eres {rank}. El banco te permite pedir hasta {loanCap}.", respect: "Tu respeto en {city} ha subido de nivel.", debt: "Caja en negativo: debes {owed}. Cada semana se cobra un {rate} % de interés sobre esa deuda. Si pasa de {limit}, quiebras.", halt: "Un edificio tuyo en {city} ({plot}) se ha parado por falta de caja para mantenimiento y salarios: no produce ni acumula gastos; se reactiva solo cuando vuelve a haber caja (o reactívalo en su ficha).", restart: "Tu edificio en {city} ({plot}) ha vuelto a funcionar: hay caja de nuevo para mantenimiento y salarios." }, debtTxt: ", pendiente {debt}", unreadWord: "sin leer" },
  en: { household: "City tribute", negMargin: "Negative margin 3+ days", reports: "Reports", messages: "Messages", close: "Close", week: "Week", day: "Day", ship: "Ship", cost: "Cost", upkeep: "Upkeep this week", tolls: "Port tolls", carried: "Debt carried over", interest: "Interest", loanInt: "Loan interest", loanPrin: "Loan repaid", crew: "Crew wages (coins)", captain: "Captain", guns: "Cannons", trade: "Trade this week", good: "Good", sold: "Sold", profit: "Profit", paid: "Paid", debt: "Still owed", cashAfter: "Cash after payment",
    next: "Next payment", nextIn: "in {n} days", due: "Due now", none: "No reports yet. The first one arrives on day 7.", noMsg: "No messages.", markAll: "Mark all read",
    chronTitle: "House chronicle", chronYear: "Year", chronOpen: "in progress", chronCash: "Cash", chronWorth: "Net worth", chronShips: "Ships", chronRank: "Rank", chronTrade: "Trade profit", chronUpkeep: "Upkeep", chronBest: "Best good", chronNone: "Each year's chronicle closes on the last day of the year: here you will see how the house fared.",
    types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Carrack" },
    msg: { report: "Weekly report {week}: paid {paid}{debt}", arrival: "Ship {ship} arrived at {city}.", order: "Your {type} (ship {ship}) is ready at {city}.", event: "{txt}", info: "{txt}", loan: "Bank of {city}: you received {amt}. Interest {rate}% a week. Due on day {dueDay}.", routeLeg: "Ship {ship}: sold {qty} {good} at {city} for {amt} (profit {profit}).", routeStuck: "Ship {ship}: its route is stalled at {city}, could not buy {good} (no cash or no stock). It retries every day.", routeRepair: "Ship {ship}: its route repaired the hull at {city} for {cost}.", routeRepairSkip: "Ship {ship}: its route wants a hull repair ({hull}%) at {city} but the cash brake does not cover it (costs {cost}). It keeps sailing worn.", bldMargin: "Your workshop in {city} ({plot}) has run at a negative margin for 3 days ({margin} a batch): it produces nothing meanwhile. Switch recipe, check prices, or halt it from its card.", loanPaid: "You paid back {amt} to the bank.", loanDue: "Your loan of {amt} falls due on day {dueDay}. Pay it back first or the bank will take it from your cash.", loanLate: "The bank took {amt} from your cash for a loan that fell due.", loanSeized: "The bank of {city} seized {units} units of your goods in port, worth {amt}, when a loan fell due.", warn: "Upkeep is due tomorrow: {due}. You have {cash} in cash. If it is not enough, your cash goes negative and pays interest.", contractAccept: "Contract accepted in {city}: deliver {qty} of {good} before day {dueDay}.", contractDone: "Contract fulfilled in {city}: {qty} of {good} delivered. The council pays the agreed premium: {reward}.", contractFailed: "Contract lapsed in {city}: you only delivered {delivered} of {qty} of {good} in time. The council remembers.", bankrupt: "Bankruptcy: the bank seized your goods and buildings (recovered {recovered}) and wrote off the rest of the debt ({forgiven}). You start over with just your ships.", rank: "Promotion! You are now {rank}. The bank will lend you up to {loanCap}.", respect: "Your respect in {city} has risen a level.", debt: "Cash is negative: you owe {owed}. Every week {rate}% interest is charged on that debt. Past {limit}, you go bankrupt.", halt: "One of your buildings in {city} ({plot}) has halted for lack of cash for upkeep and wages: it produces nothing and accrues no costs; it restarts on its own when there is cash again (or restart it from its card).", restart: "Your building in {city} ({plot}) is running again: cash covers its upkeep and wages once more." }, debtTxt: ", still owed {debt}", unreadWord: "unread" },
};
export const daysToSettle = (day) => SETTLE_EVERY - (day % SETTLE_EVERY || 0) || SETTLE_EVERY;
const typeName = (l, k) => LT[l].types[k] ?? (Object.hasOwn(SHIP_TYPES, k) ? k : "?");
/** The reports screen: what comes next, then the last weeks, newest first. */
export function reportsHtml(g, lang, fmt, goodName = (k) => k) {
  const t = LT[lang], n = daysToSettle(g.day);
  let h = `<h2>${t.reports}</h2><p>${t.next}: <b>${t.nextIn.replace("{n}", n)}</b> · ${t.due}: <b>${fmt(dueNow(g))}</b></p>`;
  const rs = g.reports ?? [];
  if (!rs.length) return h + `<p>${t.none}</p>`;
  for (const r of rs.slice(0, 12)) {
    h += `<div class="card"><b>${t.week} ${r.week}</b> (${t.day} ${r.day})<table><tr><th>${t.ship}</th><th>${t.cost}</th><th>${t.crew}</th><th>${t.guns}</th><th>${t.captain}</th></tr>` +
      r.lines.map((l) => `<tr><td>${esc(typeName(lang, l.type))} ${l.ship}</td><td>${fmt(l.cost)}</td><td>${l.wages ? fmt(l.wages) : "–"}</td><td>${l.cannons ? fmt(l.cannons) : "–"}</td><td>${l.captain ? fmt(l.captain) : "–"}</td></tr>`).join("") + `</table>` +
      `<small>${t.upkeep}: ${fmt(r.upkeep)}` + (r.carried ? ` · ${t.carried}: ${fmt(r.carried)}` : "") + (r.tolls ? ` · ${t.tolls}: ${fmt(r.tolls)}` : "") + (r.interest ? ` · ${t.interest}: ${fmt(r.interest)}` : "") + (r.household ? ` · ${t.household}: ${fmt(r.household)}` : "") + (r.loanInterest ? ` · ${t.loanInt}: ${fmt(r.loanInterest)}` : "") + (r.loanPrincipal ? ` · ${t.loanPrin}: ${fmt(r.loanPrincipal)}` : "") + ` · ${t.paid}: ${fmt(r.paid)}` + (r.debt ? ` · <b>${t.debt}: ${fmt(r.debt)}</b>` : "") + (r.negMargin?.length ? ` · <b>${t.negMargin}: ${r.negMargin.map(esc).join(", ")}</b>` : "") + ` · ${t.cashAfter}: ${fmt(r.cashAfter)}</small>` + tradeTable(r, t, fmt, goodName) + `</div>`;
  }
  return h;
}
function tradeTable(r, t, fmt, goodName) {
  if (!r.trades?.length) return "";
  const total = r.trades.reduce((a, x) => a + x.profit, 0);
  return `<table><caption>${t.trade}</caption><tr><th>${t.good}</th><th>${t.sold}</th><th>${t.profit}</th></tr>` +
    r.trades.map((x) => `<tr><td>${esc(goodName(x.good))}</td><td>${x.sold}</td><td>${x.profit < 0 ? "<b>" + fmt(x.profit) + "</b>" : fmt(x.profit)}</td></tr>`).join("") +
    `<tr><td colspan="2"><b>Total</b></td><td><b>${fmt(total)}</b></td></tr></table>`;
}
/** One inbox line as plain text. */
export function messageText(m, lang, fmt, cityName = (x) => x, goodName = (x) => x) {
  const t = LT[lang], tpl = t.msg[m.kind] ?? t.msg.info;
  const txt = typeof m.txt === "object" ? (m.txt?.[lang] ?? "") : (m.txt ?? "");
  return tpl.replace("{debt}", m.debt ? t.debtTxt.replace("{debt}", fmt(m.debt)) : "").replace(/\{(\w+)\}/g, (_, k) =>
    k === "city" ? cityName(m.city) : k === "good" ? goodName(m.good) : k === "profit" ? fmt(m.profit ?? 0) : k === "type" ? typeName(lang, m.type) : k === "paid" ? fmt(m.paid ?? 0) : k === "due" ? fmt(m.due ?? 0) : k === "cash" ? fmt(m.cash ?? 0) : k === "amt" ? fmt(m.amt ?? 0) : k === "margin" ? fmt(m.margin ?? 0) : k === "owed" ? fmt(m.owed ?? 0) : k === "limit" ? fmt(m.limit ?? OVERDRAFT_LIMIT) : k === "rate" ? String(m.rate ?? Math.round(OVERDRAFT_RATE * 100)) : k === "rank" ? rankName(lang, m.rank) : k === "loanCap" ? fmt(m.loanCap ?? 0) : k === "txt" ? txt : (m[k] ?? ""));
}
export function inboxHtml(g, lang, fmt, cityName, goodName) {
  const t = LT[lang], en = lang === "en", box = g.inbox ?? [];
  const text = (m) => messageText(m, lang, fmt, cityName, goodName);
  const acts = box.filter((m) => msgClass(m) === "action"), notices = box.filter((m) => msgClass(m) === "notice");
  let h = `<h2>${t.messages}</h2>`;
  if (!acts.length && !notices.length) return h + `<p>${t.noMsg}</p>`;
  h += `<p><button id="l-all">${t.markAll}</button></p>`;
  const line = (m) => `<div class="msg${m.read ? "" : " unread"}" data-msg="${m.id}">${m.read ? "" : "● "}<small>${t.day} ${m.day}</small> ${esc(text(m))}</div>`;
  h += `<h3>${en ? "For you" : "Para ti"}</h3>` + (acts.length ? acts.map(line).join("") : `<p><small>${en ? "Nothing needs your attention." : "Nada requiere tu atención."}</small></p>`);
  if (notices.length) {
    const groups = groupNotices(notices, text);
    const row = (e) => {
      const unread = "", days = e.oldest === e.day ? `${t.day} ${e.day}` : `${t.day} ${e.oldest}-${e.day}`;
      if (e.kind === "routeLeg") return `<div class="msg">${unread}<small>${days}</small> ${en ? `Ship ${e.first.ship}: ${e.n} route sale${e.n > 1 ? "s" : ""}, profit ${fmt(e.profit)}` : `Barco ${e.first.ship}: ${e.n} venta${e.n > 1 ? "s" : ""} de ruta, ganancia ${fmt(e.profit)}`}</div>`;
      return `<div class="msg" data-msg="${e.ids[0]}">${unread}<small>${days}</small> ${esc(text(e.first))}${e.n > 1 ? ` <b>×${e.n}</b>` : ""}</div>`;
    };
    h += `<details class="msg-notices"><summary><b>${en ? "Notices" : "Avisos"} (${notices.length})</b> <small>${en ? "grouped, nothing to do" : "agrupados, sin nada que hacer"}</small></summary>${groups.map(row).join("")}</details>`;
  }
  return h + `<p><small>${en ? "Weekly reports are in Reports." : "Los informes semanales están en Informes."}</small></p>`;
}
export const badge = (label, n) => n > 0 ? `${label} (${n})` : label;

/** The house chronicle: the open year first (running totals), then the closed years, newest first. */
export function chronicleHtml(g, lang, fmt, goodName = (k) => k) {
  const t = LT[lang];
  const row = (e, open) => `<div class="card"><b>${t.chronYear} ${e.year}${open ? ` (${t.chronOpen})` : ""}</b><br><small>` +
    `${t.chronCash}: ${fmt(e.cash0)} → ${open ? "…" : fmt(e.cash1)} · ${t.chronWorth}: ${fmt(e.worth0)} → ${open ? "…" : fmt(e.worth1)} · ${t.chronShips}: ${e.ships0} → ${open ? "…" : e.ships1}` +
    (!open && e.rank0 && e.rank1 && e.rank0 !== e.rank1 ? ` · ${t.chronRank}: ${rankName(lang, e.rank0)} → ${rankName(lang, e.rank1)}` : "") +
    `<br>${t.chronTrade}: ${fmt(e.trade)} · ${t.chronUpkeep}: ${fmt(e.upkeep)}` + (e.tolls ? ` · ${t.tolls}: ${fmt(e.tolls)}` : "") + (e.interest ? ` · ${t.interest}: ${fmt(e.interest)}` : "") +
    (e.bestGood ? `<br>${t.chronBest}: ${esc(goodName(e.bestGood.good))} (+${fmt(e.bestGood.profit)})` : "") + `</small></div>`;
  let h = `<h3>${t.chronTitle}</h3>`;
  if (g.chronBook) h += row(g.chronBook, true);
  const rows = (g.chronicle ?? []).map((e) => row(e, false)).join("");
  return h + rows + (!g.chronBook && !rows ? `<p>${t.chronNone}</p>` : "");
}
