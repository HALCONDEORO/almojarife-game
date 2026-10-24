// The town's own industry, made visible (docs/design/town-industry-and-auctions.md).
// Every city produces goods from day one (src/sim/market.mjs regenerates stock for the goods
// the city "makes"), and most of its people work the town's own economy (TOWN_JOBS_SHARE in
// buildings.mjs). Until now that industry existed only as numbers. This module derives, from
// world data alone, the roster of establishments behind it: which workshops, farms and trade
// houses each port has, how big they are, how many hands they employ and who owns them.
//
// Representation, not simulation: the roster changes NO number of the market model. Each
// establishment is sized so that the roster's total average output per (city, good) matches
// the abstract production rate the market already uses (rate * 2 units/day, seasons averaging
// 1). An establishment is always a legal building (a type from PRODUCERS at level 1-3, or a
// representation-only type below), so a later piece can sell one at auction by MOVING its
// share of production to the buyer - never by adding production on top.
//
// Pure and deterministic: same world data, same roster in every save, like the town council.
// Own design and own numbers throughout; nothing taken from any other game.
import { PRODUCERS, JOBS_PER_LEVEL, producerRate } from "./buildings.mjs";
import { townCouncil } from "./townhall.mjs";

/** Processor outputs per batch (src/sim/recipes.mjs OUTPUTS: every production recipe yields 2). */
const PROCESSOR_YIELD = 2;

/** Good -> building type that produces it, inverted from PRODUCERS (single source of truth). */
export const GOOD_TO_TYPE = Object.freeze(Object.fromEntries(
  Object.entries(PRODUCERS).map(([type, def]) => [def.output, type])
));

/** Goods a city can "make" that no buildable type produces get a representation-only type:
 *  the tannery dresses the hides the ranches bring in; the trading house (casa de contratación)
 *  is the dockside factor who lands overseas goods. These are NOT player-buildable and appear
 *  in no BUILDING_TYPES table; they exist so the roster can show where luxury goods come from
 *  without pretending a production chain the model does not have. Own names and numbers. */
export const REP_TYPES = Object.freeze({
  tannery: Object.freeze({ es: "Curtiduría", en: "Tannery", jobs: 6, outPerLevel: 2 }),
  trading_post: Object.freeze({ es: "Casa de contratación", en: "Trading house", jobs: 4, outPerLevel: 2 }),
});
export const GOOD_TO_REP_TYPE = Object.freeze({
  leather: "tannery",
  sugar: "trading_post", pepper: "trading_post", silk: "trading_post", saffron: "trading_post",
});

/** The industry type behind a made good: a buildable type, a representation-only type, or null. */
export function industryTypeOf(good) {
  if (GOOD_TO_TYPE[good]) return { kind: "building", type: GOOD_TO_TYPE[good] };
  if (GOOD_TO_REP_TYPE[good]) return { kind: "rep", type: GOOD_TO_REP_TYPE[good] };
  return null; // a good with no industry mapping: callers list it as unmapped, never guess
}

/** Average daily output of one establishment at a level, matching the building semantics:
 *  producers run their batch pattern averaged over days and seasons average to 1 (market.mjs). */
export function levelOutput(kind, type, level) {
  if (!(level >= 1 && level <= 3)) return 0;
  if (kind === "rep") return REP_TYPES[type].outPerLevel * level;
  const def = PRODUCERS[type];
  if (!def) return 0;
  const perBatch = def.primary ? def.yield : PROCESSOR_YIELD;
  return perBatch * producerRate(type, level);
}

/** Hands one establishment employs, same table the player's buildings use (own tuning for rep types). */
export function levelJobs(kind, type, level) {
  if (kind === "rep") return REP_TYPES[type].jobs * level;
  return (JOBS_PER_LEVEL[type] ?? 0) * level;
}

/** The abstract average daily production the market already gives a city for one of its goods:
 *  makeMarket sets rate = max(1, round(pop / 1000)) and tickMarketCity adds rate * 2 * seasonMul
 *  per day; seasonMul averages exactly 1 over the year (cosine over 365 days). */
export function abstractDailyOutput(city) {
  return Math.max(1, Math.round(city.pop / 1000)) * 2;
}

/** Split an output target into establishment levels 3..1 (largest first, deterministic).
 *  The sum lands in [target, target + out(level 1)): never below the abstract production. */
function splitLevels(kind, type, target) {
  const levels = [];
  let remaining = target;
  for (const level of [3, 2, 1]) {
    const out = levelOutput(kind, type, level);
    while (out > 0 && remaining >= out) { levels.push(level); remaining -= out; }
  }
  if (remaining > 0) levels.push(1); // the last house covers the fraction
  return levels;
}

/** Ownership, own design: where a good supports three or more establishments, the concejo keeps
 *  the first one (the municipal salina, the pósito's own works); everything else belongs to the
 *  port's named neighbours - the regidores and the alcalde from the existing concejo table
 *  (townhall.mjs), round-robin, so the same few families hold most of the trade, like any port.
 *  Small ports with one or two works per good are all private: the concejo stays a minority
 *  everywhere. Deterministic by construction; no rolls. */
function ownerOf(i, count, council) {
  const people = [...council.councillors, council.mayor];
  if (count >= 3 && i === 0) return { kind: "council", name: null }; // null name: the UI says "El concejo"
  return { kind: "townsfolk", name: people[(count >= 3 ? i - 1 : i) % people.length] };
}

/** The full roster of one city's industry. `city` is the world.cities entry ({id, pop, makes}).
 *  Returns [] for an unknown or industry-less city. Each entry:
 *  { id, city, good, kind, type, level, jobs, avgOut, share, owner:{kind,name} }
 *  share is the fraction of the good's abstract production this establishment accounts for;
 *  shares of one (city, good) always sum to exactly 1. */
export function townIndustry(world, cityId) {
  const city = world?.cities?.find((c) => c.id === cityId);
  if (!city || !Array.isArray(city.makes)) return [];
  const council = townCouncil(world, cityId);
  const roster = [];
  for (const good of city.makes) {
    const ind = industryTypeOf(good);
    if (!ind) continue; // unmapped good: skipped, never invented (tests pin the mapped set)
    const levels = splitLevels(ind.kind, ind.type, abstractDailyOutput(city));
    const outs = levels.map((l) => levelOutput(ind.kind, ind.type, l));
    const total = outs.reduce((a, b) => a + b, 0);
    levels.forEach((level, i) => {
      roster.push({
        id: `${cityId}:${good}:${i}`,
        city: cityId,
        good,
        kind: ind.kind,
        type: ind.type,
        level,
        jobs: levelJobs(ind.kind, ind.type, level),
        avgOut: outs[i],
        share: outs[i] / total,
        owner: ownerOf(i, levels.length, council),
      });
    });
  }
  return roster;
}

/** Per-good aggregate of the roster, for views: one row per made good. */
export function industrySummary(world, cityId) {
  const byGood = new Map();
  for (const e of townIndustry(world, cityId)) {
    const row = byGood.get(e.good) ?? { good: e.good, kind: e.kind, type: e.type, establishments: 0, levels: 0, jobs: 0, avgOut: 0, owners: new Set() };
    row.establishments++; row.levels += e.level; row.jobs += e.jobs; row.avgOut += e.avgOut;
    row.owners.add(e.owner.kind === "council" ? "council" : e.owner.name);
    byGood.set(e.good, row);
  }
  return [...byGood.values()].map((r) => ({ ...r, owners: r.owners.size }));
}

/** Total hands the roster employs in a city. Bound checked in tests against the town's own
 *  90% jobs share: the visible industry must fit inside the economy it represents. */
export function townIndustryJobs(world, cityId) {
  return townIndustry(world, cityId).reduce((a, e) => a + e.jobs, 0);
}
