// Opt-in presentation for the Almacén (store tab) and Banco (bank tab) windows. Presentation only: it adds a heading and figures
// around the existing controls, which keep their ids and data attributes. No simulation or save fields belong here.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TXT = {
  es: { whTitle: "Almacén", whLead: "Tu depósito en {city}: lo que guardas aquí no ocupa bodega y espera a tu vuelta.", whUnits: "Guardado", whHold: "En el barco", whKinds: "Clases de mercancía", whNone: "Aún no tienes almacén en este puerto.",
    bankTitle: "Banco", bankLead: "El banco de {city} presta a la casa mercantil y cobra por semanas.", bankRoom: "Crédito disponible", bankOwed: "Debes", bankRate: "Interés", bankLoans: "Préstamos abiertos" },
  en: { whTitle: "Warehouse", whLead: "Your store in {city}: goods kept here take no hold space and wait for your return.", whUnits: "Stored", whHold: "On the ship", whKinds: "Kinds of goods", whNone: "You have no warehouse in this port yet.",
    bankTitle: "Bank", bankLead: "The bank of {city} lends to the trading house and charges by the week.", bankRoom: "Credit available", bankOwed: "You owe", bankRate: "Interest", bankLoans: "Open loans" },
};
const tile = (label, value) => `<div class="ui2d-store-tile"><small>${esc(label)}</small><b>${esc(value)}</b></div>`;
/** Heading and figures for the warehouse tab. v: { city, hasWarehouse, stored (units), onShip (units), kinds }. */
export function warehouseHeader2d(lang, v, fmt = String) {
  const c = TXT[lang] ?? TXT.es;
  return `<div class="ui2d-store-head"><span aria-hidden="true">▣</span><div><h3>${c.whTitle}</h3><p>${esc(c.whLead.replace("{city}", v.city))}</p></div></div>` +
    (v.hasWarehouse ? `<div class="ui2d-store-tiles">${tile(c.whUnits, fmt(v.stored))}${tile(c.whHold, fmt(v.onShip))}${tile(c.whKinds, fmt(v.kinds))}</div>` : `<p class="ui2d-store-note">${c.whNone}</p>`);
}
/** Heading and figures for the bank tab. v: { city, room, owed, ratePct, loans }. */
export function bankHeader2d(lang, v, fmt = String) {
  const c = TXT[lang] ?? TXT.es;
  return `<div class="ui2d-store-head"><span aria-hidden="true">◎</span><div><h3>${c.bankTitle}</h3><p>${esc(c.bankLead.replace("{city}", v.city))}</p></div></div>` +
    `<div class="ui2d-store-tiles">${tile(c.bankRoom, fmt(v.room))}${tile(c.bankOwed, fmt(v.owed))}${tile(c.bankRate, v.ratePct + " %")}${tile(c.bankLoans, fmt(v.loans))}</div>`;
}
/** Wrap the existing controls: the content keeps its own markup. */
export const store2dWrap = (kind, header, inner) => `<section class="ui2d-store ui2d-${kind}">${header}<div class="ui2d-store-body">${inner}</div></section>`;
export const store2dWindowClass = (tab) => (tab === "store" ? "ui2d-store-window" : tab === "bank" ? "ui2d-bank-window" : "");
