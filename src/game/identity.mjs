// City identity: every port has its own character, read from what it is - the trades it
// works, its size, its temper - so two ports never feel the same. Own design, pure, no DOM.
// Off unless g.cityIdentity === true (no state keys at all in an off game: saves stay identical).
// First piece of the living-city series: flavor only. It moves no money, no prices, no
// reputation, and it treats every player the same way, human or bot, because it acts on no one.
// The trait rules below are our own reading of what would mark a port's character; the pop
// threshold for "orgullosa" is a tuning knob (inference, not a historical figure).
import { post } from "./ledger.mjs";
import { seeded } from "../view/cityscene.mjs";

export const TRAITS = Object.freeze({
  marinera:     { es: "marinera",     en: "seafaring" },
  comercial:    { es: "comercial",    en: "trading" },
  trabajadora:  { es: "trabajadora",  en: "hardworking" },
  devota:       { es: "devota",       en: "devout" },
  orgullosa:    { es: "orgullosa",    en: "proud" },
  hospitalaria: { es: "hospitalaria", en: "welcoming" },
  recelosa:     { es: "recelosa",     en: "wary" },
  festiva:      { es: "festiva",      en: "festive" },
});
const SEA_TRADES = ["fish", "salt"]; // a port that lives off the sea
export const POP_PROUD = 25000; // a city this big looks down on the rest (own tuning knob)

/** The two traits of a city: what it works (from its trades) and its temper (from its size,
 *  or a stable draw keyed on the city id, so a city's character never changes between games). */
export function cityTraits(world, cityId) {
  const c = world.cities.find((x) => x.id === cityId);
  if (!c) return [];
  const makes = c.makes ?? [], needs = c.needs ?? [];
  let work;
  if (makes.some((g) => SEA_TRADES.includes(g))) work = "marinera";
  else if (makes.length >= 3) work = "trabajadora";
  else if (needs.length >= 4) work = "comercial";
  else work = seeded(`identity:work:${cityId}`)() < 0.5 ? "comercial" : "trabajadora";
  let temper;
  if ((c.pop ?? 0) >= POP_PROUD) temper = "orgullosa";
  else {
    const pool = ["devota", "hospitalaria", "recelosa", "festiva"];
    temper = pool[Math.floor(seeded(`identity:temper:${cityId}`)() * pool.length)];
  }
  return [work, temper];
}

// How each trait reads aloud, in game language. No numbers, no internals.
const FLAVOR = {
  marinera:     { es: "huele a sal y a pescado",                    en: "smells of salt and fish" },
  comercial:    { es: "sus muelles no paran de cargar y descargar", en: "its docks never stop loading and unloading" },
  trabajadora:  { es: "el martilleo de sus talleres no descansa",   en: "the hammering of its workshops never rests" },
  devota:       { es: "las campanas marcan el paso del día",        en: "church bells mark the hours of the day" },
  orgullosa:    { es: "sus vecinos la tienen por la mejor del mundo", en: "its people hold it to be the finest in the world" },
  hospitalaria: { es: "al forastero se le trata como de la casa",   en: "a stranger is treated like one of their own" },
  recelosa:     { es: "al forastero se le mira dos veces",          en: "a stranger gets a second, careful look" },
  festiva:      { es: "cualquier día es bueno para la fiesta",      en: "any day is a good day for a feast" },
};

/** One sentence of city character, ES and EN, for notices and the Ayuntamiento tab. */
export function identityLine(world, cityId) {
  const [work, temper] = cityTraits(world, cityId);
  if (!work) return null;
  const name = world.cities.find((x) => x.id === cityId)?.name ?? cityId;
  return { traits: [work, temper], txt: {
    es: `${name} es una ciudad ${TRAITS[work].es} y ${TRAITS[temper].es}: ${FLAVOR[work].es}, y ${FLAVOR[temper].es}.`,
    en: `${name} is a ${TRAITS[work].en}, ${TRAITS[temper].en} city: ${FLAVOR[work].en}, and ${FLAVOR[temper].en}.`,
  } };
}

/** Greet the player's ship with the city's character the first time it docks there. One
 *  notice per city and game; flag off: nothing at all. Returns the traits shown, or null. */
export function arrivalIdentity(g, at) {
  if (g?.cityIdentity !== true || g.over) return null;
  const seen = (g.identitySeen ??= {});
  if (seen[at]) return null;
  const line = identityLine(g.world, at);
  if (!line) return null;
  seen[at] = true;
  post(g, "info", { city: at, txt: line.txt });
  return line.traits;
}
