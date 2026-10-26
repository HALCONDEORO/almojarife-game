// Rank and respect text (ES/EN) and the "House" panel. No game rules here.
import { RANKS, RESPECT, nextRank, respectIndex, repOf, loanCapFor, heldRank, ensureRep } from "../game/rank.mjs";
import { REP_TIERS, repTierIndex, portRep, REP_FEE_MUL, REP_REPAIR_MUL } from "../game/reputation.mjs";
export const RANK_NAMES = {
  es: { peddler: "Buhonero", trader: "Comerciante", merchant: "Mercader", shipowner: "Naviero", magnate: "Magnate", alderman: "Regidor", patrician: "Patricio" },
  en: { peddler: "Peddler", trader: "Trader", merchant: "Merchant", shipowner: "Shipowner", magnate: "Magnate", alderman: "Alderman", patrician: "Patrician" },
};
export const RESPECT_NAMES = {
  es: { stranger: "Desconocido", known: "Conocido", trusted: "De confianza", honoured: "Honrado" },
  en: { stranger: "Stranger", known: "Known", trusted: "Trusted", honoured: "Honoured" },
};
export const REP_NAMES = {
  es: { illseen: "Mal visto", neutral: "Neutral", appreciated: "Apreciado", esteemed: "Estimado", renowned: "Renombrado" },
  en: { illseen: "Ill-seen", neutral: "Neutral", appreciated: "Appreciated", esteemed: "Esteemed", renowned: "Renowned" },
};
const T = {
  es: { title: "Tu casa comercial", rank: "Rango", worth: "Patrimonio", next: "Siguiente rango: {r}, te faltan {m}.", top: "Has llegado a lo más alto.", perks: "Ventajas", perk: "Tope de préstamos del banco: {c}.", toll: "Peaje de puerto: de confianza paga la mitad, honrado pasa gratis.", ladder: "Escalera de rangos", from: "desde", respect: "Respeto por ciudad", none: "Aún no has vendido en ningún puerto.", info: "El rango sube con tu patrimonio y no se pierde. El respeto crece al vender en una ciudad (1 punto por cada 100 monedas vendidas).", reputation: "Reputación por puerto", repNone: "Aún ningún puerto te conoce.", repInfo: "La reputación sube al vender lo que falta en un puerto y baja al acaparar lo escaso. Mueve la tasa de mercado (de +50% si eres mal visto a -75% si eres renombrado) y el precio del astillero (hasta -20%).", repFee: "tasa", repRepair: "astillero" },
  en: { title: "Your trading house", rank: "Rank", worth: "Net worth", next: "Next rank: {r}, you need {m} more.", top: "You have reached the top.", perks: "Perks", perk: "Bank loan cap: {c}.", toll: "Port toll: trusted pays half, honoured passes free.", ladder: "Rank ladder", from: "from", respect: "Respect by city", none: "You have not sold in any port yet.", info: "Rank rises with your net worth and is never lost. Respect grows when you sell in a city (1 point per 100 coins sold).", reputation: "Reputation by port", repNone: "No port knows you yet.", repInfo: "Reputation rises when you sell what a port lacks and falls when you buy up what is scarce. It moves the market fee (from +50% when ill-seen to -75% when renowned) and the shipyard bill (down to -20%).", repFee: "fee", repRepair: "shipyard" },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const rankName = (lang, id) => RANK_NAMES[lang]?.[id] ?? id;
export function houseHtml(g, lang, worth, fmt, cityName, loanBase = 5000) {
  const t = T[lang], i = heldRank(g), n = nextRank(worth, i), cities = Object.keys(ensureRep(g)).map((c) => [c, repOf(g, c)]).sort((a, b) => b[1] - a[1]);
  const from = RANKS[i].from, pct = n ? Math.max(0, Math.min(100, Math.round(((worth - from) / (n.rank.from - from)) * 100))) : 100;
  // Hero: rank and net worth first, then the bar to the next rank.
  let h = `<div class="of"><section class="of-hero"><h3>${t.title}</h3><div class="of-big"><span><small>${t.rank}</small><b>${rankName(lang, RANKS[i].id)}</b></span><span><small>${t.worth}</small><b>${fmt(worth)}</b></span></div>`;
  h += `<div class="of-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${t.next.replace("{r}", n ? rankName(lang, n.rank.id) : "").replace("{m}", n ? fmt(n.missing) : "")}"><i style="width:${pct}%"></i></div>`;
  h += `<p class="of-next">${n ? t.next.replace("{r}", rankName(lang, n.rank.id)).replace("{m}", fmt(n.missing)) : t.top}</p></section>`;
  // Rank ladder as steps: reached, current, ahead.
  h += `<ol class="of-steps" aria-label="${t.ladder}">` + RANKS.map((r, k) => `<li class="${k < i ? "done" : k === i ? "now" : "ahead"}"${k === i ? ' aria-current="step"' : ""}><b>${rankName(lang, r.id)}</b><small>${t.from} ${fmt(r.from)}</small></li>`).join("") + `</ol>`;
  // Perks as cards.
  h += `<div class="of-perks"><div class="of-card"><small>${t.perks}</small>${t.perk.replace("{c}", `<b>${fmt(loanCapFor(g, loanBase))}</b>`)}</div><div class="of-card"><small>${t.perks}</small>${t.toll}</div></div>`;
  h += `<details class="of-help"><summary>?</summary><p>${t.info}</p></details>`;
  h += `<h4>${t.respect}</h4>` + (cities.length ? `<table class="of-table">` + cities.map(([c, pts]) => `<tr><td>${esc(cityName(c))}</td><td>${RESPECT_NAMES[lang][RESPECT[respectIndex(pts)].id]}</td><td class="num">${Math.floor(pts)}</td></tr>`).join("") + `</table>` : `<p class="of-empty">${t.none}</p>`);
  const reps = Object.keys(g.portRep ?? {}).map((c) => [c, portRep(g, c)]).filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  h += `<h4>${t.reputation}</h4>` + (reps.length ? `<table class="of-table">` + reps.map(([c, v]) => { const k = repTierIndex(v); return `<tr><td>${esc(cityName(c))}</td><td>${REP_NAMES[lang][REP_TIERS[k].id]}</td><td class="num">${Math.round(v)}</td><td><small>${t.repFee} ${Math.round(REP_FEE_MUL[k] * 100)}% · ${t.repRepair} ${Math.round(REP_REPAIR_MUL[k] * 100)}%</small></td></tr>`; }).join("") + `</table><details class="of-help"><summary>?</summary><p>${t.repInfo}</p></details>` : `<p class="of-empty">${t.repNone}</p>`);
  return h + `</div>`;
}
