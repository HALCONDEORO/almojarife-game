// Rank and respect text (ES/EN) and the "House" panel. No game rules here.
import { RANKS, RESPECT, nextRank, respectIndex, repOf, loanCapFor, heldRank, ensureRep } from "../game/rank.mjs";
export const RANK_NAMES = {
  es: { peddler: "Buhonero", trader: "Comerciante", merchant: "Mercader", shipowner: "Naviero", magnate: "Magnate", alderman: "Regidor", patrician: "Patricio" },
  en: { peddler: "Peddler", trader: "Trader", merchant: "Merchant", shipowner: "Shipowner", magnate: "Magnate", alderman: "Alderman", patrician: "Patrician" },
};
export const RESPECT_NAMES = {
  es: { stranger: "Desconocido", known: "Conocido", trusted: "De confianza", honoured: "Honrado" },
  en: { stranger: "Stranger", known: "Known", trusted: "Trusted", honoured: "Honoured" },
};
const T = {
  es: { title: "Tu casa comercial", rank: "Rango", worth: "Patrimonio", next: "Siguiente rango: {r}, te faltan {m}.", top: "Has llegado a lo más alto.", perks: "Ventajas", perk: "Tope de préstamos del banco: {c}.", toll: "Peaje de puerto: de confianza paga la mitad, honrado pasa gratis.", ladder: "Escalera de rangos", from: "desde", respect: "Respeto por ciudad", none: "Aún no has vendido en ningún puerto.", info: "El rango sube con tu patrimonio y no se pierde. El respeto crece al vender en una ciudad (1 punto por cada 100 monedas vendidas)." },
  en: { title: "Your trading house", rank: "Rank", worth: "Net worth", next: "Next rank: {r}, you need {m} more.", top: "You have reached the top.", perks: "Perks", perk: "Bank loan cap: {c}.", toll: "Port toll: trusted pays half, honoured passes free.", ladder: "Rank ladder", from: "from", respect: "Respect by city", none: "You have not sold in any port yet.", info: "Rank rises with your net worth and is never lost. Respect grows when you sell in a city (1 point per 100 coins sold)." },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const rankName = (lang, id) => RANK_NAMES[lang]?.[id] ?? id;
export function houseHtml(g, lang, worth, fmt, cityName, loanBase = 5000) {
  const t = T[lang], i = heldRank(g), n = nextRank(worth, i), cities = Object.keys(ensureRep(g)).map((c) => [c, repOf(g, c)]).sort((a, b) => b[1] - a[1]);
  let h = `<h3>${t.title}</h3><p>${t.rank}: <b>${rankName(lang, RANKS[i].id)}</b> · ${t.worth}: <b>${fmt(worth)}</b></p>`;
  h += `<p>${n ? t.next.replace("{r}", rankName(lang, n.rank.id)).replace("{m}", fmt(n.missing)) : t.top}</p>`;
  h += `<p><b>${t.perks}:</b> ${t.perk.replace("{c}", fmt(loanCapFor(g, loanBase)))} ${t.toll}</p><p><small>${t.info}</small></p>`;
  h += `<p><b>${t.ladder}:</b> ` + RANKS.map((r, k) => (k === i ? `<b>[${rankName(lang, r.id)}]</b>` : rankName(lang, r.id)) + ` (${t.from} ${fmt(r.from)})`).join(" → ") + `</p>`;
  h += `<h4>${t.respect}</h4>` + (cities.length ? `<table>` + cities.map(([c, pts]) => `<tr><td>${esc(cityName(c))}</td><td>${RESPECT_NAMES[lang][RESPECT[respectIndex(pts)].id]}</td><td>${Math.floor(pts)}</td></tr>`).join("") + `</table>` : `<p><i>${t.none}</i></p>`);
  return h;
}
