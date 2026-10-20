// Reports and messages as HTML strings (no DOM access), so they can be tested. Text is escaped.
import { SHIP_TYPES } from "../sim/trade.mjs";
import { rankName, RESPECT_NAMES } from "./rankview.mjs";
import { dueNow, SETTLE_EVERY, OVERDRAFT_LIMIT, OVERDRAFT_RATE } from "../game/ledger.mjs";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const LT = {
  es: { reports: "Informes", messages: "Mensajes", close: "Cerrar", week: "Semana", day: "Día", ship: "Barco", cost: "Coste", upkeep: "Mantenimiento de la semana", carried: "Deuda anterior", interest: "Interés", loanInt: "Interés del préstamo", loanPrin: "Préstamo devuelto", crew: "Tripulación", guns: "Cañones", trade: "Comercio de la semana", good: "Mercancía", sold: "Vendido", profit: "Ganancia", paid: "Pagado", debt: "Pendiente", cashAfter: "Caja tras el pago",
    next: "Próximo pago", nextIn: "en {n} días", due: "A pagar ahora", none: "Aún no hay informes. El primero llega el día 7.", noMsg: "No hay mensajes.", markAll: "Marcar todo como leído",
    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" },
    msg: { report: "Informe semanal {week}: pagado {paid}{debt}", arrival: "El barco {ship} llegó a {city}.", order: "Tu {type} (barco {ship}) está listo en {city}.", event: "{txt}", info: "{txt}", loan: "Banco de {city}: recibiste {amt}. Interés {rate} % a la semana. Vence el día {dueDay}.", routeLeg: "Barco {ship}: vendió {qty} {good} en {city} por {amt} (ganancia {profit}).", routeStuck: "Barco {ship}: su ruta está parada en {city}, no pudo comprar {good} (sin caja o sin existencias). Reintenta cada día.", loanPaid: "Devolviste {amt} al banco.", loanDue: "Tu préstamo de {amt} vence el día {dueDay}. Devuélvelo antes o el banco lo cobrará de tu caja.", loanLate: "El banco cobró {amt} de tu caja por un préstamo vencido.", warn: "Mañana toca pagar el mantenimiento: {due}. En caja tienes {cash}. Si no alcanza, la caja quedará en negativo y pagará interés.", rank: "¡Ascenso! Ahora eres {rank}. El banco te permite pedir hasta {loanCap}.", respect: "Tu respeto en {city} ha subido de nivel.", debt: "Caja en negativo: debes {owed}. Cada semana se cobra un {rate} % de interés sobre esa deuda. Si pasa de {limit}, quiebras." }, debtTxt: ", pendiente {debt}", unreadWord: "sin leer" },
  en: { reports: "Reports", messages: "Messages", close: "Close", week: "Week", day: "Day", ship: "Ship", cost: "Cost", upkeep: "Upkeep this week", carried: "Debt carried over", interest: "Interest", loanInt: "Loan interest", loanPrin: "Loan repaid", crew: "Crew", guns: "Cannons", trade: "Trade this week", good: "Good", sold: "Sold", profit: "Profit", paid: "Paid", debt: "Still owed", cashAfter: "Cash after payment",
    next: "Next payment", nextIn: "in {n} days", due: "Due now", none: "No reports yet. The first one arrives on day 7.", noMsg: "No messages.", markAll: "Mark all read",
    types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Carrack" },
    msg: { report: "Weekly report {week}: paid {paid}{debt}", arrival: "Ship {ship} arrived at {city}.", order: "Your {type} (ship {ship}) is ready at {city}.", event: "{txt}", info: "{txt}", loan: "Bank of {city}: you received {amt}. Interest {rate}% a week. Due on day {dueDay}.", routeLeg: "Ship {ship}: sold {qty} {good} at {city} for {amt} (profit {profit}).", routeStuck: "Ship {ship}: its route is stalled at {city}, could not buy {good} (no cash or no stock). It retries every day.", loanPaid: "You paid back {amt} to the bank.", loanDue: "Your loan of {amt} falls due on day {dueDay}. Pay it back first or the bank will take it from your cash.", loanLate: "The bank took {amt} from your cash for a loan that fell due.", warn: "Upkeep is due tomorrow: {due}. You have {cash} in cash. If it is not enough, your cash goes negative and pays interest.", rank: "Promotion! You are now {rank}. The bank will lend you up to {loanCap}.", respect: "Your respect in {city} has risen a level.", debt: "Cash is negative: you owe {owed}. Every week {rate}% interest is charged on that debt. Past {limit}, you go bankrupt." }, debtTxt: ", still owed {debt}", unreadWord: "unread" },
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
    h += `<div class="card"><b>${t.week} ${r.week}</b> (${t.day} ${r.day})<table><tr><th>${t.ship}</th><th>${t.cost}</th><th>${t.crew}</th><th>${t.guns}</th></tr>` +
      r.lines.map((l) => `<tr><td>${esc(typeName(lang, l.type))} #${l.ship}</td><td>${fmt(l.cost)}</td><td>${l.wages ? fmt(l.wages) : "–"}</td><td>${l.cannons ? fmt(l.cannons) : "–"}</td></tr>`).join("") + `</table>` +
      `<small>${t.upkeep}: ${fmt(r.upkeep)}` + (r.carried ? ` · ${t.carried}: ${fmt(r.carried)}` : "") + (r.interest ? ` · ${t.interest}: ${fmt(r.interest)}` : "") + (r.loanInterest ? ` · ${t.loanInt}: ${fmt(r.loanInterest)}` : "") + (r.loanPrincipal ? ` · ${t.loanPrin}: ${fmt(r.loanPrincipal)}` : "") + ` · ${t.paid}: ${fmt(r.paid)}` + (r.debt ? ` · <b>${t.debt}: ${fmt(r.debt)}</b>` : "") + ` · ${t.cashAfter}: ${fmt(r.cashAfter)}</small>` + tradeTable(r, t, fmt, goodName) + `</div>`;
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
    k === "city" ? cityName(m.city) : k === "good" ? goodName(m.good) : k === "profit" ? fmt(m.profit ?? 0) : k === "type" ? typeName(lang, m.type) : k === "paid" ? fmt(m.paid ?? 0) : k === "due" ? fmt(m.due ?? 0) : k === "cash" ? fmt(m.cash ?? 0) : k === "amt" ? fmt(m.amt ?? 0) : k === "owed" ? fmt(m.owed ?? 0) : k === "limit" ? fmt(m.limit ?? OVERDRAFT_LIMIT) : k === "rate" ? String(m.rate ?? Math.round(OVERDRAFT_RATE * 100)) : k === "rank" ? rankName(lang, m.rank) : k === "loanCap" ? fmt(m.loanCap ?? 0) : k === "txt" ? txt : (m[k] ?? ""));
}
export function inboxHtml(g, lang, fmt, cityName, goodName) {
  const t = LT[lang], box = g.inbox ?? [];
  let h = `<h2>${t.messages}</h2>`;
  if (!box.length) return h + `<p>${t.noMsg}</p>`;
  h += `<p><button id="l-all">${t.markAll}</button></p>` + box.map((m) => `<div class="msg${m.read ? "" : " unread"}" data-msg="${m.id}">${m.read ? "" : "● "}<small>${t.day} ${m.day}</small> ${esc(messageText(m, lang, fmt, cityName, goodName))}</div>`).join("");
  return h;
}
export const badge = (label, n) => n > 0 ? `${label} (${n})` : label;
