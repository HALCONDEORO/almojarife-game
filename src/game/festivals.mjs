// City festivals (living cities 3/8): every city keeps its own festival day, drawn from its
// name and stable forever. On that day the city drinks (demand for wine and beer doubles in
// the daily market recompute - the price movement everyone sees, humans and bots alike, is
// the emergent part) and, with citylife ON, the mood lifts a little. If your ship is docked
// there you hear about it, once per year, in game language. Own design, pure, no DOM.
// Off unless g.cityFestivals === true (no state keys at all in an off game: saves identical).
// FESTIVAL_GOODS / FESTIVAL_DEMAND / FESTIVAL_JOY are own tuning knobs (inference).
import { post } from "./ledger.mjs";
import { seeded } from "../view/cityscene.mjs";

export const FESTIVAL_GOODS = Object.freeze(["wine", "beer"]); // what a celebration drinks
export const FESTIVAL_DEMAND = 2;  // festival-day demand of the festival goods
export const FESTIVAL_JOY = 8;     // one-day mood lift, only where citylife runs

/** The city's own day of the year (1..365), stable across games: drawn from the city id. */
export function festivalDay(world, cityId) { return 1 + Math.floor(seeded(`festival:${cityId}`)() * 365); }

/** Is the given day the city's festival? Day 0 is the first day of the year. */
export const isFestivalDay = (g, cityId, day) => g?.cityFestivals === true && (day % 365) + 1 === festivalDay(g.world, cityId);
export const isFestival = (g, cityId) => isFestivalDay(g, cityId, g.day);

/** Demand multiplier for the daily market recompute: festival goods only, on the day only.
 *  Takes the market's own day (the day the tick belongs to), so the thirst lands on the
 *  festival day exactly, not on whatever g.day the boundary crossing is showing. */
export const festivalDemandMul = (g, cityId, good, day = g.day) => (isFestivalDay(g, cityId, day) && FESTIVAL_GOODS.includes(good) ? FESTIVAL_DEMAND : 1);

/** Day work: the celebrating cities lift their mood (citylife ON only), and a docked ship
 *  gets one notice per city and year. Flag off: nothing at all. */
export function festivalsTick(g) {
  if (g?.cityFestivals !== true || g.over) return;
  const year = Math.floor(g.day / 365);
  const done = (g.festivalDone ??= {}); // the lift lands once per city and year, however often the tick is re-run
  for (const c of g.world.cities) {
    if (!isFestival(g, c.id) || done[c.id] === year) continue;
    done[c.id] = year;
    const cl = g.citylife?.cities?.[c.id];
    if (cl) for (const cls of Object.keys(cl.animo)) cl.animo[cls] = Math.min(100, cl.animo[cls] + FESTIVAL_JOY);
  }
  const docked = (g.ships ?? []).find((s) => s.at && !s.voyage);
  if (!docked || !isFestival(g, docked.at)) return;
  const seen = (g.festivalSeen ??= {});
  if (seen[docked.at] === year) return;
  seen[docked.at] = year;
  const name = g.world.nodes[docked.at]?.name ?? g.world.cities.find((c) => c.id === docked.at)?.name ?? docked.at;
  post(g, "info", { city: docked.at, txt: {
    es: `Hoy es la fiesta de ${name}: vino y cerveza a raudales, y nadie trabaja que no sea de alegría.`,
    en: `Today is ${name}'s festival: wine and beer flow freely, and nobody works but for joy.`,
  } });
}

/** One line for the Ayuntamiento tab: when the city's festival falls, in game language. */
export function festivalLine(g, cityId) {
  if (g?.cityFestivals !== true) return null;
  const name = g.world.nodes[cityId]?.name ?? g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
  const day = festivalDay(g.world, cityId);
  return { day, txt: {
    es: `La fiesta de ${name} se celebra el día ${day} del año.`,
    en: `${name}'s festival falls on day ${day} of the year.`,
  } };
}
