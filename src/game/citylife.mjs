// Vida urbana dinamica (own design, flag-gated): per-class mood driven by how well the
// market covers each class's basket, and a weekly drift of neighbours in and out of the
// city bounded by the housing it actually has. Civic buildings with documented historical
// names (study source, HECHO-tagged only): the posito (municipal grain store) steadies
// staples through the grain crises, the hospital cares for the poor in hard times and
// the alhondiga keeps the grain trade orderly. Rents and mortality are NOT coded: the
// source marks them unverified. Flag OFF by default: with no g.citylife state every
// helper is a no-op and the game is unchanged. Numbers are our own tuning, written from
// first principles. No internal figure is ever shown to the player.
import { CLASSES, PER_1000, classShares } from "../sim/classes.mjs";
import { activeShocks } from "./shocks.mjs";
import { activeLevels, housePopBonus } from "./buildings.mjs";

/** Goods each class cares about, from the existing basket (weight > 0). */
const basket = (cls) => Object.keys(PER_1000).filter((good) => (PER_1000[good]?.[cls] ?? 0) > 0);
const BASKETS = Object.freeze(Object.fromEntries(CLASSES.map((c) => [c, Object.freeze(basket(c))])));
/** Staple foods: a city that cannot eat stays unhappy however fine the rest is. */
const STAPLES = Object.freeze(["grain", "fish", "meat", "olive_oil"]);

// Own tuning constants.
const START_MOOD = 60;        // a fresh city is content but not delighted
const MOOD_MEMORY = 12;       // days: mood moves 1/12 of the way to today's reading
const MOOD_NEUTRAL = 55;      // mean mood where the city neither gains nor loses people
const DRIFT_PER_WEEK = 0.004; // share of the population that moves per week at the extremes
const SHOCK_PENALTY = 15;     // mood target hit while any regional shock touches the city
const HUNGER_CAP = 35;        // mood target ceiling while staple coverage is poor
const HUNGER_LINE = 0.6;      // staple coverage below this counts as hunger
const GROWTH_MIN_FRACTION = 0.5; // a city can shrink at most to half its base population (people leave; no mortality is coded)
const ROOM_PER_HOUSE_LEVEL = 100; // newcomers each active house level can shelter (on top of the 50 hands it already staffs)
const POSITO_BUFFER = 0.1;    // staple coverage each active posito level adds to the reading (its stores fill the gap)
const POSITO_EMIGRATION_BRAKE = 0.5; // share of hunger emigration a posito absorbs (it feeds the city in a crisis)
const HOSPITAL_MOOD = 4;      // per active level, poor class only; doubles in hard times
const ALHONDIGA_MOOD = 3;     // per active level, middle class only (an orderly grain trade)

/** Effective inhabitants of a city: base population + hands from houses + drift from city life. */
export function citylifeExtra(g, cityId) { return g.citylife?.cities?.[cityId]?.extra ?? 0; }

/** Fresh state for a new game with the flag on. */
export function initCitylife(world) {
  const cities = {};
  for (const c of world.cities) cities[c.id] = { animo: { poor: START_MOOD, middle: START_MOOD, rich: START_MOOD }, extra: 0 };
  return { cities };
}

const coverageOf = (row, good) => { const e = row?.[good]; return e ? Math.min(1.5, e.stock / Math.max(1, e.target)) : 0; };

/** Weighted supply coverage of one class's basket (0 to 1.5) from the market rows. */
export function classCoverage(row, cls) {
  let num = 0, den = 0;
  for (const good of BASKETS[cls]) { const w = PER_1000[good][cls]; num += w * coverageOf(row, good); den += w; }
  return den ? num / den : 1;
}
/** Staple coverage as the city feels it: the posito's municipal stores count on top. */
const stapleCoverage = (g, cityId) => STAPLES.reduce((a, good) => a + coverageOf(g.market?.[cityId], good), 0) / STAPLES.length
  + POSITO_BUFFER * activeLevels(g, cityId, "posito");

/** Today's mood reading for one class before memory is applied (0-100). */
export function moodTarget(g, cityId, cls) {
  let target = Math.round(80 * Math.min(1.25, classCoverage(g.market?.[cityId], cls)));
  if (stapleCoverage(g, cityId) < HUNGER_LINE) target = Math.min(target, HUNGER_CAP);
  const hardTimes = activeShocks(g, cityId).length > 0;
  if (hardTimes) target = Math.max(0, target - SHOCK_PENALTY);
  if (g.citylife) { // civic buildings lift spirits; they never exist in a flag-off game
    if (cls === "poor") target = Math.min(100, target + HOSPITAL_MOOD * activeLevels(g, cityId, "hospital") * (hardTimes ? 2 : 1));
    if (cls === "middle") target = Math.min(100, target + ALHONDIGA_MOOD * activeLevels(g, cityId, "alhondiga"));
  }
  return target;
}

/** Mean mood weighted by the class mix of the city's effective population. */
export function meanMood(g, cityId) {
  const city = g.citylife?.cities?.[cityId]; if (!city) return null;
  const pop = (g.world.nodes[cityId]?.pop ?? 8000) + housePopBonus(g, cityId) + city.extra;
  const shares = classShares(Math.max(1, pop));
  return CLASSES.reduce((a, c) => a + shares[c] * city.animo[c], 0);
}

/** One day of city life: moods drift toward today's reading, and once a week neighbours
 *  arrive or leave with the mood, bounded by the housing the city actually has. */
export function citylifeDay(g) {
  const cl = g.citylife; if (!cl) return; // flag OFF: no state, no work, no change
  for (const c of g.world.cities) {
    const city = (cl.cities[c.id] ??= { animo: { poor: START_MOOD, middle: START_MOOD, rich: START_MOOD }, extra: 0 });
    for (const cls of CLASSES) city.animo[cls] += (moodTarget(g, c.id, cls) - city.animo[cls]) / MOOD_MEMORY;
    if (g.day % 7 === 0) { // weekly drift: content cities draw newcomers, miserable ones lose people
      const base = c.pop ?? 8000, room = activeLevels(g, c.id, "house") * ROOM_PER_HOUSE_LEVEL;
      let drift = Math.round((base + city.extra) * DRIFT_PER_WEEK * (meanMood(g, c.id) - MOOD_NEUTRAL) / (100 - MOOD_NEUTRAL));
      if (drift < 0 && stapleCoverage(g, c.id) < HUNGER_LINE) // a posito feeds the city through the crisis and slows the leaving
        drift = Math.round(drift * (1 - POSITO_EMIGRATION_BRAKE * Math.min(3, activeLevels(g, c.id, "posito")) / 3));
      const floor = -Math.round(base * GROWTH_MIN_FRACTION); // never below half the base population
      city.extra = Math.max(floor, Math.min(room, city.extra + drift)); // and never more newcomers than houses can shelter
    }
  }
}

/** Public read model for a later UI (flag ON only): mood words, never raw mechanics. */
export function moodWord(g, cityId) {
  const m = meanMood(g, cityId);
  if (m === null) return null;
  return m >= 75 ? "contenta" : m >= 55 ? "tranquila" : m >= 40 ? "inquieta" : "furiosa";
}
