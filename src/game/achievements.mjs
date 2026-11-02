// Achievements: milestones of the trading house, unlocked once. Pure game logic: no DOM.
// Own design: the catalogue, names and conditions are original (docs/BACKLOG.md asks for own wording).
// Conditions only read the state; the unlocked set rides along in the save with the rest of the game
// (gamesave serializes it whole), so saves from before achievements gain the key on their first day tick.
import { post } from "./ledger.mjs";
import { heldRank, repOf, respectIndex, RESPECT } from "./rank.mjs";
import { bestVoyage } from "./voyages.mjs";

export const ACHIEVEMENTS = [
  { id: "first_sale", es: { name: "Primer trueque", desc: "Tu primera venta cerró en puerto." }, en: { name: "First trade", desc: "Your first sale closed in port." }, test: (game) => (game.salesMade ?? 0) > 0 }, // a counter stamped only by the three real sale paths (doSell/doSellStored/doSellCombined); respect alone - origins, works, contracts, campaign rewards - never counts
  { id: "profit_voyage", es: { name: "Viaje redondo", desc: "Un viaje tuyo volvió con ganancia." }, en: { name: "Round voyage", desc: "One of your voyages came home in profit." }, test: (game) => (bestVoyage(game)?.profit ?? 0) > 0 },
  { id: "second_ship", es: { name: "Más velas", desc: "Tu casa ya tiene dos barcos." }, en: { name: "More sails", desc: "Your house now owns two ships." }, test: (game) => (game.ships ?? []).length >= 2 },
  { id: "first_convoy", es: { name: "En buena compañía", desc: "Formaste tu primer convoy." }, en: { name: "In good company", desc: "You formed your first convoy." }, test: (game) => Object.keys(game.convoys ?? {}).length >= 1 },
  { id: "first_warehouse", es: { name: "Techo y llave", desc: "Levantaste tu primer almacén." }, en: { name: "Roof and key", desc: "You raised your first warehouse." }, test: (game) => Object.keys(game.warehouses ?? {}).length >= 1 },
  { id: "first_office", es: { name: "Sello en puerto", desc: "Abriste una oficina fuera de tu casa." }, en: { name: "A seal abroad", desc: "You opened an office away from home." }, test: (game) => (game.offices ?? []).length >= 1 },
  { id: "first_building", es: { name: "Obra propia", desc: "Un edificio tuyo entró en servicio." }, en: { name: "Your own works", desc: "A building of yours entered service." }, test: (game) => Object.values(game.buildings ?? {}).some((plots) => Object.values(plots ?? {}).some((bld) => bld?.state === "active" && bld?.type)) },
  { id: "worth_10k", es: { name: "Casa próspera", desc: "Tu patrimonio llegó a 10.000 monedas." }, en: { name: "Prosperous house", desc: "Your net worth reached 10,000 coins." }, test: (game, worth) => (worth ?? -Infinity) >= 10000 },
  { id: "worth_50k", es: { name: "Casa poderosa", desc: "Tu patrimonio llegó a 50.000 monedas." }, en: { name: "Powerful house", desc: "Your net worth reached 50,000 coins." }, test: (game, worth) => (worth ?? -Infinity) >= 50000 },
  { id: "first_rank", es: { name: "Nuevo título", desc: "Ascendiste de rango por primera vez." }, en: { name: "A new title", desc: "You rose in rank for the first time." }, test: (game) => heldRank(game) >= 1 },
  { id: "honoured_port", es: { name: "Voz en el concejo", desc: "Un puerto te honra por tu comercio." }, en: { name: "A voice on the council", desc: "A port honours you for your trade." }, test: (game) => (game.world?.cities ?? []).some((city) => respectIndex(repOf(game, city.id)) >= RESPECT.length - 1) },
];

/** Achievements state, created on demand: saves from before achievements get it here. */
export function ensureAchievements(game) {
  const state = (game.achievements ??= {});
  return (state.unlocked ??= {});
}
/** Daily evaluation: every milestone that newly holds unlocks once and posts the news.
 * `worth` is netWorth(game), passed by the caller so this module never imports game.mjs (no cycle). */
export function achievementsTick(game, worth = null) {
  const unlocked = ensureAchievements(game);
  for (const ach of ACHIEVEMENTS) {
    if (unlocked[ach.id] != null) continue;
    let passed = false;
    try { passed = Boolean(ach.test(game, worth)); } catch { passed = false; } // a damaged save must never break the day
    if (!passed) continue;
    unlocked[ach.id] = game.day ?? 0;
    post(game, "info", { topic: "achievement", txt: { es: `Logro: ${ach.es.name}. ${ach.es.desc}`, en: `Achievement: ${ach.en.name}. ${ach.en.desc}` } });
  }
  return unlocked;
}
