// Reports and messages as HTML strings (no DOM access), so they can be tested. Text is escaped.
import { SHIP_TYPES } from "../sim/trade.mjs";
import { dueNow, SETTLE_EVERY } from "../game/ledger.mjs";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const LT = {
  es: { reports: "Informes", messages: "Mensajes", close: "Cerrar", week: "Semana", day: "Día", ship: "Barco", cost: "Coste", upkeep: "Mantenimiento de la semana", carried: "Deuda anterior", interest: "Interés", loanInt: "Interés del préstamo", paid: "Pagado", debt: "Pendiente", cashAfter: "Caja tras el pago",
    next: "Próximo pago", nextIn: "en {n} días", due: "A pagar ahora", none: "Aún no hay informes. El primero llega el día 7.", noMsg: "No hay mensajes.", markAll: "Marcar todo como leído",
    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" },
    msg: { report: "Informe semanal {week}: pagado {paid}{debt}", arrival: "El barco {ship} llegó a {city}.", order: "Tu {type} (barco {ship}) está listo en {city}.", event: "{txt}", info: "{txt}", loan: "Banco de {city}: recibiste {amt}. Interés {rate} % a la semana. Vence el día {dueDay}.", loanPaid: "Devolviste {amt} al banco.", loanDue: "Tu préstamo de {amt} vence el día {dueDay}. Devuélvelo antes o el banco lo cobrará de tu caja.", loanLate: "El banco cobró {amt} de tu caja por un préstamo vencido.", warn: "Mañana toca pagar el mantenimiento: {due}. En caja tienes {cash}. Si no alcanza, la caja quedará en negativo y pagará interés.", debt: "Caja en negativo: debes {owed}. Cada semana se cobra un {rate} % de interés sobre esa deuda. Si pasa de {limit}, quiebras." }, debtTxt: ", pendiente {debt}", unreadWord: "sin leer" },
  en: { reports: "Reports", messages: "Messages", close: "Close", week: "Week", day: "Day", ship: "Ship", cost: "Cost", upkeep: "Upkeep this week", carried: "Debt carried over", interest: "Interest", loanInt: "Loan interest", paid: "Paid", debt: "Still owed", cashAfter: "Cash after payment",
    next: "Next payment", nextIn: "in {n} days", due: "Due now", none: "No reports yet. The first one arrives on day 7.", noMsg: "No messages.", markAll: "Mark all read",
    types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Carrack" },
    msg: { report: "Weekly report {week}: paid {paid}{debt}", arrival: "Ship {ship} arrived at {city}.", order: "Your {type} (ship {ship}) is ready at {city}.", event: "{txt}", info: "{txt}", loan: "Bank of {city}: you received {amt}. Interest {rate}% a week. Due on day {dueDay}.", loanPaid: "You paid back {amt} to the bank.", loanDue: "Your loan of {amt} falls due on day {dueDay}. Pay it back first or the bank will take it from your cash.", loanLate: "The bank took {amt} from your cash for a loan that fell due.", warn: "Upkeep is due tomorrow: {due}. You have {cash} in cash. If it is not enough, your cash goes negative and pays interest.", debt: "Cash is negative: you owe {owed}. Every week {rate}% interest is charged on that debt. Past {limit}, you go bankrupt." }, debtTxt: ", still owed {debt}", unreadWord: "unread" },
};
export const daysToSettle = (day) => SETTLE_EVERY - (day % SETTLE_EVERY || 0) || SETTLE_EVERY;
const typeName = (l, k) => LT[l].types[k] ?? (Object.hasOwn(SHIP_TYPES, k) ? k : "?");
/** The reports screen: what comes next, then the last weeks, newest first. */
export function reportsHtml(g, lang, fmt) {
  const t = LT[lang], n = daysToSettle(g.day);
  let h = `<h2>${t.reports}</h2><p>${t.next}: <b>${t.nextIn.replace("{n}", n)}</b> · ${t.due}: <b>${fmt(dueNow(g))}</b></p>`;
  const rs = g.reports ?? [];
  if (!rs.length) return h + `<p>${t.none}</p>`;
  for (const r of rs.slice(0, 12)) {
    h += `<div class="card"><b>${t.week} ${r.week}</b> (${t.day} ${r.day})<table><tr><th>${t.ship}</th><th>${t.cost}</th></tr>` +
      r.lines.map((l) => `<tr><td>${esc(typeName(lang, l.type))} #${l.ship}</td><td>${fmt(l.cost)}</td></tr>`).join("") + `</table>` +
      `<small>${t.upkeep}: ${fmt(r.upkeep)}` + (r.carried ? ` · ${t.carried}: ${fmt(r.carried)}` : "") + (r.interest ? ` · ${t.interest}: ${fmt(r.interest)}` : "") + (r.loanInterest ? ` · ${t.loanInt}: ${fmt(r.loanInterest)}` : "") + ` · ${t.paid}: ${fmt(r.paid)}` + (r.debt ? ` · <b>${t.debt}: ${fmt(r.debt)}</b>` : "") + ` · ${t.cashAfter}: ${fmt(r.cashAfter)}</small></div>`;
  }
  return h;
}
/** One inbox line as plain text. */
export function messageText(m, lang, fmt, cityName = (x) => x) {
  const t = LT[lang], tpl = t.msg[m.kind] ?? t.msg.info;
  const txt = typeof m.txt === "object" ? (m.txt?.[lang] ?? "") : (m.txt ?? "");
  return tpl.replace("{debt}", m.debt ? t.debtTxt.replace("{debt}", fmt(m.debt)) : "").replace(/\{(\w+)\}/g, (_, k) =>
    k === "city" ? cityName(m.city) : k === "type" ? typeName(lang, m.type) : k === "paid" ? fmt(m.paid ?? 0) : k === "due" ? fmt(m.due ?? 0) : k === "cash" ? fmt(m.cash ?? 0) : k === "amt" ? fmt(m.amt ?? 0) : k === "owed" ? fmt(m.owed ?? 0) : k === "limit" ? fmt(m.limit ?? 0) : k === "rate" ? String(m.rate ?? 0) : k === "txt" ? txt : (m[k] ?? ""));
}
export function inboxHtml(g, lang, fmt, cityName) {
  const t = LT[lang], box = g.inbox ?? [];
  let h = `<h2>${t.messages}</h2>`;
  if (!box.length) return h + `<p>${t.noMsg}</p>`;
  h += `<p><button id="l-all">${t.markAll}</button></p>` + box.map((m) => `<div class="msg${m.read ? "" : " unread"}" data-msg="${m.id}">${m.read ? "" : "● "}<small>${t.day} ${m.day}</small> ${esc(messageText(m, lang, fmt, cityName))}</div>`).join("");
  return h;
}
export const badge = (label, n) => n > 0 ? `${label} (${n})` : label;
