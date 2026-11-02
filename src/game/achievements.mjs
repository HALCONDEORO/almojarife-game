// Achievements: milestones of the trading house, unlocked once. Pure game logic: no DOM.
// Own design: the catalogue, names and conditions are original (docs/BACKLOG.md asks for own wording).
// Conditions only read the state; the unlocked set rides along in the save with the rest of g
// (gamesave serializes g whole), so saves from before achievements gain g.achievements on their first day tick.
import { post } from "./ledger.mjs";
import { heldRank, repOf, respectIndex, RESPECT } from "./rank.mjs";
import { bestVoyage } from "./voyages.mjs";

export const ACHIEVEMENTS = [
  { id: "first_sale", es: { name: "Primer trueque", desc: "Tu primera venta cerró en puerto." }, en: { name: "First trade", desc: "Your first sale closed in port." }, test: (g) => (g.voyages ?? []).some((v) => v.sold > 0) },
  { id: "profit_voyage", es: { name: "Viaje redondo", desc: "Un viaje tuyo volvió con ganancia." }, en: { name: "Round voyage", desc: "One of your voyages came home in profit." }, test: (g) => (bestVoyage(g)?.profit ?? 0) > 0 },
  { id: "second_ship", es: { name: "Más velas", desc: "Tu casa ya tiene dos barcos." }, en: { name: "More sails", desc: "Your house now owns two ships." }, test: (g) => (g.ships ?? []).length >= 2 },
  { id: "first_convoy", es: { name: "En buena compañía", desc: "Formaste tu primer convoy." }, en: { name: "In good company", desc: "You formed your first convoy." }, test: (g) => Object.keys(g.convoys ?? {}).length >= 1 },
  { id: "first_warehouse", es: { name: "Techo y llave", desc: "Levantaste tu primer almacén." }, en: { name: "Roof and key", desc: "You raised your first warehouse." }, test: (g) => Object.keys(g.warehouses ?? {}).length >= 1 },
  { id: "first_office", es: { name: "Sello en puerto", desc: "Abriste una oficina fuera de tu casa." }, en: { name: "A seal abroad", desc: "You opened an office away from home." }, test: (g) => (g.offices ?? []).length >= 1 },
  { id: "first_building", es: { name: "Obra propia", desc: "Un edificio tuyo entró en servicio." }, en: { name: "Your own works", desc: "A building of yours entered service." }, test: (g) => Object.values(g.buildings ?? {}).some((plots) => Object.values(plots ?? {}).some((b) => b?.state === "active" && b?.type)) },
  { id: "worth_10k", es: { name: "Casa próspera", desc: "Tu patrimonio llegó a 10.000 monedas." }, en: { name: "Prosperous house", desc: "Your net worth reached 10,000 coins." }, test: (g, w) => (w ?? -Infinity) >= 10000 },
  { id: "worth_50k", es: { name: "Casa poderosa", desc: "Tu patrimonio llegó a 50.000 monedas." }, en: { name: "Powerful house", desc: "Your net worth reached 50,000 coins." }, test: (g, w) => (w ?? -Infinity) >= 50000 },
  { id: "first_rank", es: { name: "Nuevo título", desc: "Ascendiste de rango por primera vez." }, en: { name: "A new title", desc: "You rose in rank for the first time." }, test: (g) => heldRank(g) >= 1 },
  { id: "honoured_port", es: { name: "Voz en el concejo", desc: "Un puerto te honra por tu comercio." }, en: { name: "A voice on the council", desc: "A port honours you for your trade." }, test: (g) => (g.world?.cities ?? []).some((c) => respectIndex(repOf(g, c.id)) >= RESPECT.length - 1) },
];

/** Achievements state, created on demand: saves from before achievements get it here. */
export function ensureAchievements(g) {
  const a = (g.achievements ??= {});
  return (a.unlocked ??= {});
}
/** Daily evaluation: every milestone that newly holds unlocks once and posts the news.
 * `worth` is netWorth(g), passed by the caller so this module never imports game.mjs (no cycle). */
export function achievementsTick(g, worth = null) {
  const unlocked = ensureAchievements(g);
  for (const ach of ACHIEVEMENTS) {
    if (unlocked[ach.id] != null) continue;
    let ok = false;
    try { ok = !!ach.test(g, worth); } catch { ok = false; } // a damaged save must never break the day
    if (!ok) continue;
    unlocked[ach.id] = g.day ?? 0;
    post(g, "info", { topic: "achievement", txt: { es: `Logro: ${ach.es.name}. ${ach.es.desc}`, en: `Achievement: ${ach.en.name}. ${ach.en.desc}` } });
  }
  return unlocked;
}
