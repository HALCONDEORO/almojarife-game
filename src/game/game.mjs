import { initOrigin } from "./origin.mjs";
import {regionalHousePlan,regionalRivalStep} from "./rivalhouses.mjs";
// M2 playable slice: game state and player actions on top of the M1 sim. No DOM here, so it is testable.
import { setRoute, setRouteAdv, clearRoute, repeatRoute, routeStats, processRoutes } from "./routes.mjs";
import { takeLoan, repayLoan, loansOwed, loanRoom } from "./bank.mjs";
import { addRespect, updateRank, rankOf, repOf } from "./rank.mjs";
import { RANKS } from "./rank.mjs";
import { chronicleWeek, chronicleTick } from "./chronicle.mjs";
import { buyCannon as buyCannonShip, buyWeapon as buyWeaponShip, repairGuns as repairGunsShip, wearGuns, hireCrew as hireCrewShip, dismissCrew as dismissCrewShip, speedFactor } from "./crew.mjs";
export const buyCannon = buyCannonShip, buyWeapon = buyWeaponShip, repairGuns = repairGunsShip, hireCrew = hireCrewShip, dismissCrew = dismissCrewShip;
import { openVoyage, recordSale } from "./voyages.mjs";
import { chargeToll, tollsDue } from "./tolls.mjs";
import { processLoans } from "./bank.mjs";
const r2d = (x) => Math.round(x * 100) / 100;
import { accrueDay, settleWeek, warnLowCash, accruedTotal, post, logBuy, logSell, OVERDRAFT_LIMIT } from "./ledger.mjs";
import { route } from "../sim/world.mjs";
import { freeId, locate, planTrip } from "./freenav.mjs";
import { ticksForKm } from "../sim/clock.mjs";
import { makeMarket, tickMarket, tickMarketCity, price } from "../sim/market.mjs";
import { previewSell, makeShip, tickShip, sailTick, sail, buy, sell, sellStored, SHIP_TYPES, cargoUsed, shipCapacity, FEE } from "../sim/trade.mjs";
import { seaWearDay, hullSpeedFactor, hullWarning } from "./seawear.mjs";
import { TICKS_PER_DAY as CLOCK_TICKS_PER_DAY, TICKS_PER_HOUR, START_YEAR } from "../sim/clock.mjs";
import { captainSpeed } from "./captains.mjs";
import { gainXp } from "./captainxp.mjs";
import { seeded } from "../view/cityscene.mjs";
import { legWindFactor } from "../sim/weather.mjs";
import { rollEvent } from "./events.mjs";
import { tickShocks, portClosed } from "./shocks.mjs";
import { tickAlerts } from "./alerts.mjs";
import { initTutorial, tutorialNote, quietly } from "./tutorial.mjs";
import { rollContracts, expireContracts, contractOnSale } from "./contracts.mjs";
import { defaultProfile } from "./profile.mjs";
import { refreshIntel, knownMarket, buyRumor as buyRumorIntel, RUMOR_PRICE } from "./intel.mjs";
import { arrivalNews } from "./news.mjs";
import { arrivalPregon } from "./pregon.mjs";
import { arrivalIdentity } from "./identity.mjs";
import { arrivalMood } from "./moodout.mjs";
import { seasonsTick } from "./seasons.mjs";
import { craftCount } from "./crafts.mjs";
import { memoryDeed, memoryGossipLine, MEMORY_GRAIN_SCARCE } from "./memory.mjs";
import { relationsOnSale } from "./relations.mjs";
import { growthTick, growthMul } from "./growth.mjs";
import { festivalsTick, festivalDemandMul } from "./festivals.mjs";
import { seasonOf } from "../sim/market.mjs";
import { councilDay, creditCaja } from "./council.mjs";
import { almonedaDay } from "./almoneda.mjs"; // the weekly town auction (flag-gated inside)
import { householdWeek } from "./household.mjs";
import { tickContacts } from "./contacts.mjs";
import { isDiscovered, refreshDiscovery, startingChart, discover } from "./fog.mjs";
import {automaticEncounter} from "./encounterdaily.mjs";
import { tickBuildings, accrueBuildings, workshopTick, housePopBonus, houseClassPop, warehouseCapBonus, BUILDING_TYPES } from "./buildings.mjs";
import { initCitylife, citylifeDay, citylifeExtra } from "./citylife.mjs";
import { initPlague, plagueWeek, plaguePopMul } from "./plague.mjs";
import { initWalls, tickWalls, accrueWalls, wallsKeptLevel, WALL_POP } from "./walls.mjs";
import { initTowers, tickTowers, accrueTowers } from "./towers.mjs";
import { initCalamities, calamityWeek, calamityDemandMul } from "./calamities.mjs";
import { stewardTick } from "./steward.mjs";
import { aiStep } from "../sim/ai.mjs";
import { prizeLocked } from "./privateering.mjs";
import { feeMul, repairMul, repOnBuy, repOnSale, scarcityOf, noteTrade, decayRep } from "./reputation.mjs";
export { feeMul } from "./reputation.mjs"; // the UI previews with the same fee the port will charge
import { npcPlan } from "../sim/npcplan.mjs";
import { newCampaign, campaignEvent, campaignTick } from "./campaigns.mjs";
import { arrivalJustice, dailyJustice, heldNow } from "./justicewire.mjs";
import { embargoOn, embargoNotice, GRAIN } from "./embargo.mjs";
import { withLegumes, withPottery } from "../sim/optional_goods.mjs";

export const HISTORY_DAYS = 30;
/** Append today's price of every good in every port; keep the last HISTORY_DAYS. */
export function recordPrices(world, market, hist) {
  for (const [city, goods] of Object.entries(market))
    for (const [good, e] of Object.entries(goods)) {
      const a = ((hist[city] ??= {})[good] ??= []);
      a.push(price(world, e, good));
      if (a.length > HISTORY_DAYS) a.shift();
    }
}
/** Price history of one good in one port (oldest first); [] for saves from before history existed. */
export function priceHistory(g, city, good) { return g.hist?.[city]?.[good] ?? []; }
/** Change over the last `days` days, as a whole percent; null if there is not enough history. */
export function trendPct(g, city, good, days = 7) {
  const a = priceHistory(g, city, good);
  if (a.length <= days) return null;
  const old = a[a.length - 1 - days];
  return old ? Math.round((a[a.length - 1] - old) / old * 100) : null;
}
export const START_CASH = 2000, GOAL_CASH = 50000, DEADLINE_DAYS = 365, CARAVEL_PRICE = 3000, WARMUP_DAYS = 60;
/** Ticks per game day (10 per hour). The tick is the simulation unit; the day stays the accounting unit. See docs/design/time-model.md. */
export const TICKS_PER_DAY = CLOCK_TICKS_PER_DAY;

/** A game seed is an integer 0..2^32-1; anything else (including none) means 0, so tests and simulations stay reproducible.
 *  The web client passes a fresh random seed for every new game; it is saved with the game and shown in the menu. */
export const normalizeSeed = (n) => (Number.isSafeInteger(n) && n >= 0 && n <= 0xFFFFFFFF ? n : 0);
export function newGame(world, start = "cadiz", opts = {}) {
  if (opts.pottery === undefined || opts.pottery === true) world = withPottery(world); // optional processor good and kiln, default ON (owner order 23/10); pass false/1 to disable
  if (opts.legumes === undefined || opts.legumes === true) world = withLegumes(world); // optional staple, default ON (owner order 23/10); pass false/1 to disable
  const ids = world.cities.map((c) => c.id);
  // Opt-in research option only. Production defaults stay exactly three traders.
  const houses = opts.npcCompetition !== "planned" && opts.regionalRivals !== false && opts.regionalRivals !== 1 ? regionalHousePlan(world,normalizeSeed(opts.seed)) : null;
  const origins = houses ? houses.map(h=>h.home) : opts.npcCompetition === "planned" ? npcPlan(world).ports.flatMap(r=>Array(r.count).fill(r.city)) : Array.from({length:3},(_,i)=>ids[(i*3+1)%ids.length]);
  const ai = origins.map((at, i) => ({ cash: 2000, home: at, ship: makeShip(100 + i, i % 2 ? "caravel" : "cog", at) })); // home: where the trader started; its realm decides if a letter of marque covers it
  if(houses)ai.forEach((bot,i)=>{bot.house=houses[i];});
  const market = makeMarket(world), hist = {};
  for (let d = 0; d < WARMUP_DAYS; d++) { tickMarket(market, d - WARMUP_DAYS, world); for (const t of ai) { for (let i = 0; i < TICKS_PER_DAY && t.ship.voyage; i++) if (sailTick(t.ship)) break; tickShip(t.ship); if(houses)regionalRivalStep({world,market,day:d-WARMUP_DAYS,tick:d*TICKS_PER_DAY,seed:normalizeSeed(opts.seed),regionalRivals:true},t);else aiStep(world, market, t, t.ship); } recordPrices(world, market, hist); } // so prices differ from day 0
  const g = { world, day: 0, tick: 0, cash: START_CASH + (opts.cash ?? 0), market, hist, ships: [makeShip(1, "cog", start)], ai, nextId: 2, log: [], over: null, warehouses: {}, offices: [], upkeepMul: opts.upkeepMul ?? 1, freePlay: !!opts.freePlay, noGoal: !!opts.noGoal, seed: normalizeSeed(opts.seed), startYear: START_YEAR, credit: opts.credit === undefined || opts.credit === true, ...(opts.foreclosure === undefined || opts.foreclosure === true ? { foreclosure: true } : {}), ...(opts.freeNav === true ? { freeNav: true } : {}), legumes: opts.legumes === undefined || opts.legumes === true, pottery: opts.pottery === undefined || opts.pottery === true, pirateFight: opts.pirateFight === undefined || opts.pirateFight === true, marque: opts.marque === undefined || opts.marque === true, ...(opts.household !== false && opts.household !== 1 ? { household: true } : {}), profile: opts.profile ?? { ...defaultProfile(), home: start }, eventsOn: !!opts.events, pending: null, campaign: opts.freePlay ? null : (opts.campaign === undefined ? newCampaign() : opts.campaign) }; // campaign mode starts the mission arc; free play and tests can opt out // saves always carry a profile (pre-launch saves are not kept)
  if (opts.justice !== false) g.justice = true;
  if (opts.peace !== false) g.peace = true;
  if (opts.pardon !== false) g.pardon = true;
  if (opts.embargo !== false) g.embargo = true;
  if(houses)g.regionalRivals=true;
  if (opts.citylife !== false && opts.citylife !== 1) g.citylife = initCitylife(world); // city-life flag, ON by default (owner order 24/10 12:08: every flag ships ON); false/1 keeps an off game with no key (saves stay identical)
  if (opts.captainXp !== false && opts.captainXp !== 1) g.captainXp = true; // captain-experience flag, ON by default (owner order 24/10 12:08: every flag ships ON); false/1 keeps an off game with no key (saves stay identical)
  if (opts.plague !== false && opts.plague !== 1) g.plague = initPlague(); // plague flag, ON by default (owner order 24/10 12:08: every flag ships ON); false/1 keeps an off game with no key (saves stay identical)
  if (opts.walls !== false && opts.walls !== 1) g.walls = initWalls(); // walls flag, ON by default: only false or 1 turns it off (an off game keeps no key, saves stay identical)
  if (opts.towers !== false && opts.towers !== 1) g.towers = initTowers(); // towers flag, ON by default (owner order 24/10 12:08: every flag ships ON): only false or 1 turns it off (an off game keeps no key, saves stay identical)
  if (opts.cityIdentity !== false) g.cityIdentity = true; // city-identity flag, ON by default: no key in an off game (saves stay identical)
  if (opts.cityMoodOut !== false) g.cityMoodOut = true; // visible-mood flag, ON by default: no key in an off game
  if (opts.citySeasons !== false) { g.citySeasons = true; g.seasonSeen = { season: seasonOf(0) }; } // seasons flag: day one knows its season, no false 'arrival' notice
  if (opts.cityCrafts !== false) g.cityCrafts = true; // city-crafts flag, ON by default: no key in an off game
  if (opts.cityFestivals !== false) g.cityFestivals = true; // city-festivals flag, ON by default: no key in an off game
  if (opts.cityMemory !== false) g.cityMemory = true; // city-memory flag, ON by default: no key in an off game
  if (opts.cityRelations !== false) g.cityRelations = true; // city-relations flag, ON by default: no key in an off game
  if (opts.cityGrowth !== false) g.cityGrowth = true; // city-growth flag, ON by default: no key in an off game
  if (opts.townIndustry !== false && opts.townIndustry !== 1) g.townIndustry = true; // town-industry flag, ON by default (same owner order as citylife: every flag ships ON); false/1 keeps an off game with no key, saves stay identical (docs/design/town-industry-and-auctions.md)
  if (opts.cityIdentity !== false) arrivalIdentity(g, start); // home port introduces itself on day one
  if (opts.calamities !== false && opts.calamities !== 1) g.calamities = initCalamities(); // calamities flag, ON by default
  if (opts.tutorial === true) initTutorial(g); // first-voyage tutorial, any difficulty; OFF by default: no key in an off game (saves stay identical)
  refreshIntel(g);
  startingChart(g, start); // a new trader knows his home coast
  if (opts.originConnections === true) initOrigin(g); // new-profile starts only; never replayed by save loading
  return g;
}
const say = (g, key, p = {}) => { g.log.unshift({ day: g.day, key, ...p }); if (g.log.length > 30) g.log.pop(); };
export const botWorth = (g, t) => t.cash + Object.entries(t.ship?.cargo ?? {}).reduce((w, [k, q]) => w + q * g.world.goods[k].base, 0) + (t.ship ? shipValue(t.ship) : 0); // a bot house counts its ship too
export const houseWorth = (g) => netWorth(g) + g.ships.reduce((w, s) => w + shipValue(s), 0); // tribute base: the same as a bot (cash + cargo + ships), net of debts
export function netWorth(g) {
  let w = g.cash - accruedTotal(g) - tollsDue(g) - loansOwed(g); // upkeep owed but not yet settled counts against you
  for (const s of g.ships) for (const [good, q] of Object.entries(s.cargo)) w += q * g.world.goods[good].base;
  for (const wh of Object.values(g.warehouses ?? {})) for (const [good, q] of Object.entries(wh.goods)) w += q * g.world.goods[good].base; // goods in warehouses count
  return w;
}
/** Free play bankruptcy: the bank seizes cargo, warehouse stock and buildings, sells them at half value,
 * writes off whatever debt remains (loans included), and the trader starts over with just his ships. */
export const MISSION = { post, addRespect, repOf, netWorth }; // mission engine hooks (post from ledger, respect from rank)
export function resolveBankruptcy(g) {
  let recovered = 0;
  // Seize like a sale to zero: drop the cargo key AND its cost basis, the same cleanup a real sale does.
  const seize = (hold, goodsKey) => { const goods = hold?.[goodsKey]; for (const [good, q] of Object.entries(goods ?? {})) if (q > 0) { recovered += q * g.world.goods[good].base / 2; delete goods[good]; if (hold.basis) delete hold.basis[good]; } };
  for (const s of g.ships ?? []) seize(s, "cargo");
  for (const wh of Object.values(g.warehouses ?? {})) seize(wh, "goods");
  for (const plots of Object.values(g.buildings ?? {})) for (const [plotId, b] of Object.entries(plots))
    { recovered += (BUILDING_TYPES[b.type]?.fee ?? 0) * (b.level ?? 1) / 2; delete plots[plotId]; }
  const forgiven = Math.max(0, Math.round(-g.cash + loansOwed(g) - recovered));
  g.cash = Math.max(0, Math.round(g.cash + recovered));
  g.loans = [];
  g.bankruptcies = (g.bankruptcies ?? 0) + 1;
  post(g, "bankrupt", { recovered: Math.round(recovered), forgiven });
}
/** Optional per-day hooks registered by the host (data files are loaded by the caller, never by game.mjs). Empty by default: a game with no hooks is unchanged. */
export const DAILY_HOOKS = [];
/** The work of one day boundary: markets, AI traders, ships, upkeep; then check the end. */
function dayTick(g) {
  almonedaDay(g); // the hammer falls at the END of the auction day, before the calendar turns: the player bids while the lot is on the block (flag off: nothing)
  g.day++;
  for (const t of g.ai) { tickShip(t.ship); const plan = regionalRivalStep(g,t); if (plan?.bought) { craftCount(g, t.ship.at, plan.good, plan.bought); if (plan.good === "grain" && scarcityOf(g.market[t.ship.at]?.grain ?? { target: 1, stock: 1 }) >= MEMORY_GRAIN_SCARCE) memoryDeed(g, t.ship.at, "botGrievance", plan.bought); } } // aiStep no-ops at sea; arrivals act on their own tick
  // price history is recorded per port at its market slot (marketTick), not in one midnight pulse
  for (const s of g.ships) {
    if (s.voyage) { // armament and hull wear at sea, once per day; hull wear is weather-coupled for player ships (docs/design/hull-wear-rebalance.md)
      wearGuns(s);
      const before = s.hull ?? 100;
      if (seaWearDay(g, s)) { const w = hullWarning(before, s); if (w) { g.log.unshift({ day: g.day, key: "event", txt: w, ship: s.id }); if (g.log.length > 30) g.log.pop(); post(g, "event", { txt: w, ship: s.id }); } }
      else tickShip(s); // anchored or voyage-less edge: keep the old charge model
    }
    accrueDay(g, s);
  }
  const buildingCommit = accrueBuildings(g); // active buildings add their daily upkeep to the weekly book
  const wallCommit = accrueWalls(g, buildingCommit) ?? buildingCommit; // walls share today's cash budget with buildings (flag off: nothing)
  accrueTowers(g, wallCommit); // towers share the same daily cash budget after walls (flag off: nothing)
  citylifeDay(g); // city life: no-ops unless the flag created its state at newGame (OFF = untouched)
  if (g.day % 7 === 0) plagueWeek(g, post); // weekly plague roll: no-ops without the plague flag
  seasonsTick(g); // the year turns out loud when your ship is in port (flag off: nothing)
  festivalsTick(g); // a docked ship hears the city's festival (flag off: nothing)
  if (g.day % 7 === 0) calamityWeek(g, post); // weekly calamity roll: no-ops without the calamities flag
  decayRep(g); // reputation fades in ports not traded in for a month
  councilDay(g); // the concejos collect their sisas, pay the watch and vote taxes on meeting days
  processRoutes(g, { doBuy: (...a) => quietly(() => doBuy(...a)), doSell: (...a) => quietly(() => doSell(...a)), doSail: (...a) => quietly(() => doSail(...a)), doRepair: (s) => quietly(() => repairShip(g, s)), repairQuote: (s) => repairPrice(g, s) }); // ships with a standing route act on the day they are docked
  g.weekLoanPrincipal = r2d((g.weekLoanPrincipal ?? 0) + processLoans(g, post)); // loans fall due on their day, not at the next weekly settlement
  warnLowCash(g);
  dailyJustice(g); // flag off: nothing
  for (const h of DAILY_HOOKS) h(g);
  campaignTick(g, MISSION);
  const chronSnap = () => ({ cash: g.cash, worth: netWorth(g), ships: g.ships.length, rank: RANKS[g.rankIdx ?? 0]?.id ?? null });
  chronicleWeek(g, settleWeek(g), chronSnap()); // fold the weekly settlement into the open chronicle year
  chronicleTick(g, chronSnap()); // closes the year book on New Year's Day
  const hc = householdWeek(g, houseWorth, botWorth); // optional tribute (flag off): same weekly charge for the player and the bots, paid to their home port
  if (hc && g.reports?.[0]?.day === g.day) { g.reports[0].household = hc; g.reports[0].cashAfter = g.cash; } // the weekly line shows the tribute, so its cash-after figure must include it
  updateRank(g, netWorth(g), post);
  if (g.cash < -OVERDRAFT_LIMIT) { if (g.freePlay) resolveBankruptcy(g); else { g.over = "lose"; g.overReason = "bankrupt"; } }
  expireContracts(g); // a council contract past its due day lapses
  if (g.day % 7 === 0) rollContracts(g); // town councils post their weekly offers
  rollEvent(g);
  tickShocks(g); // regional shocks expire (market restored) and maybe a new one starts
  tickContacts(g); // hired contacts send their inexact price reports (presence re-wins the port below)
  tickAlerts(g); // price alerts compare against today's market and fire once
  deliverOrders(g);
  refreshIntel(g);
  if (!g.freePlay && !g.noGoal) { // free play and open-ended games have no deadline and no goal: the world just goes on (noGoal keeps bankruptcy and the campaign)
    if (g.cash - loansOwed(g) >= GOAL_CASH) g.over = "win"; // borrowed money does not count towards the goal
    else if (!g.over && g.day >= DEADLINE_DAYS) g.over = "lose";
  }
}
/** Arrival of a player's ship on its exact tick: the current day's sea wear (as under the day model), tolls, log and ledger. */
function arrive(g, s) {
  wearGuns(s); seaWearDay(g, s, true); // the arrival day counts as a day at sea (weather at the arrival position), charged now instead of at the boundary
  chargeToll(g, s, s.at); say(g, "arrive", { ship: s.id, city: s.at }); post(g, "arrival", { ship: s.id, city: s.at });
  arrivalJustice(g, s); // flag off or no data: nothing
  gainXp(g, s, "navigation"); // flag off: nothing
  arrivalNews(g, s.at); // dockside talk: price news from passing ships
  arrivalPregon(g, s.at); // the concejo cries its needs when stores run empty
  arrivalIdentity(g, s.at); // first docking: the port shows its character (flag off: nothing)
  arrivalMood(g, s.at); // dockside talk: how the city feels (flag off: nothing)
  { const gossip = memoryGossipLine(g, s.at); if (gossip) { (g.memoryGossip ??= {})[s.at] = g.day; post(g, "info", { city: s.at, txt: gossip.txt }); } } // the city recalls your deeds (flag off: nothing)
  campaignEvent(g, { kind: "arrive", city: s.at }, MISSION);
}
/** Advance one whole day: step ticks to the next day boundary (same as the old daily step, including its progress reset). Stops early when one of the player's ships arrives, so no day work runs before the player can act. */
export function advanceDay(g) {
  if (g.over || g.pending || g.encounterReport) return; // an event waits for the player's choice
  const target = (Math.floor(g.tick / TICKS_PER_DAY) + 1) * TICKS_PER_DAY;
  do {
    const atSea = new Set(g.ships.filter((s) => s.voyage).map((s) => s.id));
    advanceTick(g);
    if (atSea.size && g.ships.some((s) => atSea.has(s.id) && !s.voyage)) break; // a ship of yours just arrived
  } while (g.tick < target && !g.over && !g.pending && !g.encounterReport);
}
/** The slot inside the day at which port i ticks its market (P3-style stagger: updates spread through the day). */
export const marketSlot = (world, i) => Math.floor(i * TICKS_PER_DAY / world.cities.length);
/** Ports whose daily market tick is this tick run it now, with their own day count (bit-identical per port to a daily tick). */
function marketTick(g) {
  const slot = g.tick % TICKS_PER_DAY, day = Math.ceil(g.tick / TICKS_PER_DAY), n = g.world.cities.length;
  g.world.cities.forEach((c, i) => {
    if (marketSlot(g.world, i) !== slot) return;
    const houseCls = houseClassPop(g, c.id), houseClsTotal = houseCls.poor + houseCls.middle + houseCls.rich;
    for (const [good, e] of Object.entries(g.market[c.id])) {
      const muls = plaguePopMul(g, c.id) * festivalDemandMul(g, c.id, good, day) * growthMul(g, c.id) * calamityDemandMul(g, c.id, good);
      e.pop = Math.round(((c.pop ?? 8000) + housePopBonus(g, c.id) + citylifeExtra(g, c.id) + WALL_POP * wallsKeptLevel(g, c.id)) * muls);
      e.classExtra = houseClsTotal ? { poor: houseCls.poor * muls, middle: houseCls.middle * muls, rich: houseCls.rich * muls } : null; // same scale as e.pop, so mixed + typed = everyone, per good
    } // houses and city life first; a plague shuts people in; a festival doubles the thirst for its goods on its market day; a growing city eats more (flags off: x1)
    growthTick(g, c.id); // a fed city swells, a hungry one shrinks (flag off: nothing)
    tickMarketCity(g.market[c.id], day, g.world);
    workshopTick(g, c.id); // workshops produce with the fresh prices of their own port's tick
    stewardTick(g, c.id, warehouseCap(g, c.id)); // standing warehouse orders run on the fresh prices
    const hist = (g.hist ??= {});
    for (const [good, e] of Object.entries(g.market[c.id])) {
      const a = ((hist[c.id] ??= {})[good] ??= []);
      a.push(price(g.world, e, good));
      if (a.length > HISTORY_DAYS) a.shift();
    }
  });
}
/** Advance one tick: ships move continuously and arrive on the exact tick; staggered markets tick at their slot; day work runs only at a day boundary. */
export function advanceTick(g) {
  if (g.over || g.pending || g.encounterReport) return; // an event waits for the player's choice
  g.tick++;
  for (const s of g.ships) if (sailTick(s)) arrive(g, s);
  for (const c of refreshDiscovery(g)) say(g, "discovered", { city: c }); // the chart fills in as ships sail
  for (const t of g.ai) if (sailTick(t.ship)) { tickShip(t.ship, true); const plan = regionalRivalStep(g,t); if (plan?.bought) { craftCount(g, t.ship.at, plan.good, plan.bought); if (plan.good === "grain" && scarcityOf(g.market[t.ship.at]?.grain ?? { target: 1, stock: 1 }) >= MEMORY_GRAIN_SCARCE) memoryDeed(g, t.ship.at, "botGrievance", plan.bought); } } // AI traders act (and pay the arrival day's wear) on their own arrival tick
  if (!g.over) for (const s of g.ships) if (s.voyage) automaticEncounter(g, s, g.world); // one seeded roll per tick at sea; a pirate decision stops time; the weather field turns a roll inside a storm cell into that storm
  marketTick(g);
  tickBuildings(g); // construction finishes on its exact tick
  tickWalls(g); // wall works finish on their exact tick (flag off: nothing)
  tickTowers(g); // tower works finish on their exact tick (flag off: nothing)
  if (g.tick % TICKS_PER_DAY === 0) dayTick(g);
}
export function waitUntilArrival(g, ship) {
  let n = 0;
  while (ship.voyage && !ship.voyage.anchored && !g.over && !g.pending && !g.encounterReport && n++ < 400) advanceDay(g);
}
export function doBuy(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  if (portClosed(g, ship.at)) return { ok: false, reason: "port closed" };
  if (good === GRAIN && embargoOn(g, ship.at)) { embargoNotice(g, ship.at); return { ok: false, reason: "embargo" }; } // the council keeps its grain at home (flag off: never)
  const f = FEE * feeMul(g, ship.at);
  const r = buy(g.world, g.market, ship, g.cash, good, qty, f);
  // Reputation uses the scarcity AFTER the purchase: re-buying the unit you just sold into a shortage
  // recreates the shortage and costs back the same points - the sell/rebuy farming loop nets zero.
  if (r.ok) { craftCount(g, ship.at, good, r.qty); if (good === "grain" && scarcityOf(g.market[ship.at].grain) >= MEMORY_GRAIN_SCARCE) memoryDeed(g, ship.at, "grievance", r.qty); noteTrade(g, ship.at); g.cash -= r.cost; creditCaja(g, ship.at, Math.round(r.cost * f / (1 + f) * 100) / 100); repOnBuy(g, ship.at, scarcityOf(g.market[ship.at][good]), r.cost); logBuy(g, good, r.qty, r.cost); say(g, "buy", { qty: r.qty, good, sum: r.cost }); campaignEvent(g, { kind: "buy", good, qty: r.qty, city: ship.at }, MISSION); }
  if (r.ok) tutorialNote(g, "buy");
  return r;
}
export function doSell(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  if (prizeLocked(g, ship, good) > 0 && qty > (ship.cargo?.[good] ?? 0) - prizeLocked(g, ship, good)) return { ok: false, reason: "prize" }; // prize goods wait for a court (flag off: never)
  if (portClosed(g, ship.at)) return { ok: false, reason: "port closed" };
  const scarcity = scarcityOf(g.market[ship.at]?.[good] ?? { stock: 1, target: 1 });
  const f = FEE * feeMul(g, ship.at);
  const r = sell(g.world, g.market, ship, good, qty, f);
  if (r.ok) { noteTrade(g, ship.at); if (good === "grain" && scarcity >= MEMORY_GRAIN_SCARCE) memoryDeed(g, ship.at, "favor", r.qty); relationsOnSale(g, ship.at, good, r.qty, r.revenue); g.cash += r.revenue; creditCaja(g, ship.at, Math.round(r.revenue * f / (1 - f) * 100) / 100); repOnSale(g, ship.at, scarcity, r.revenue); recordSale(g, ship, r.qty, r.revenue, logSell(g, good, r.qty, r.revenue)); contractOnSale(g, ship.at, good, r.qty); /* council contracts count every unit sold into the port */ if (addRespect(g, ship.at, r.revenue)) post(g, "respect", { city: ship.at }); say(g, "sell", { qty: r.qty, good, sum: r.revenue }); campaignEvent(g, { kind: "sell", good, qty: r.qty, city: ship.at }, MISSION); if (g.cash - loansOwed(g) >= GOAL_CASH && !g.over && !g.freePlay && !g.noGoal) g.over = "win"; } // victory is checked right after a sale
  if (r.ok) tutorialNote(g, "sell", r);
  return r;
}
/** Sell from the port warehouse into the local market: same market effects as a hold sale (fee, respect,
 *  council contract, the port's purse), minus the ship-only ones (prizes, the ship's own record). */
export function doSellStored(g, city, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  if (portClosed(g, city)) return { ok: false, reason: "port closed" };
  const w = warehouseOf(g, city);
  if (!w) return { ok: false, reason: "no warehouse here" };
  const scarcity = scarcityOf(g.market[city]?.[good] ?? { stock: 1, target: 1 });
  const f = FEE * feeMul(g, city);
  const r = sellStored(g.world, g.market, city, w, good, qty, f);
  if (r.ok) { noteTrade(g, city); if (good === "grain" && scarcity >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "favor", r.qty); relationsOnSale(g, city, good, r.qty, r.revenue); g.cash += r.revenue; creditCaja(g, city, Math.round(r.revenue * f / (1 - f) * 100) / 100); repOnSale(g, city, scarcity, r.revenue); logSell(g, good, r.qty, r.revenue); /* the warehouse sale counts in the weekly trade ledger and lowers the book cost, exactly like a hold sale */ contractOnSale(g, city, good, r.qty); /* council contracts count warehouse sales too */ if (addRespect(g, city, r.revenue)) post(g, "respect", { city }); say(g, "sell", { qty: r.qty, good, sum: r.revenue }); campaignEvent(g, { kind: "sell", good, qty: r.qty, city }, MISSION); /* campaign sell missions advance with store sales too */ if (g.cash - loansOwed(g) >= GOAL_CASH && !g.over && !g.freePlay && !g.noGoal) g.over = "win"; }
  if (r.ok) tutorialNote(g, "sell", r);
  return r;
}
/** One sale click that empties the hold first and then the port warehouse, as a single transaction:
 *  one fee (computed before any respect gain), one effects pass, and a total that matches previewSellCombined(). */
export function doSellCombined(g, ship, good, qty, store) {
  if (g.over) return { ok: false, reason: "game over" };
  const city = ship.at;
  if (portClosed(g, city)) return { ok: false, reason: "port closed" };
  const have = ship.cargo[good] ?? 0, stored = store?.goods?.[good] ?? 0;
  if (prizeLocked(g, ship, good) > 0 && qty > have - prizeLocked(g, ship, good) + stored) return { ok: false, reason: "prize" }; // prize goods wait for a court (flag off: never)
  qty = Math.min(qty, have + stored);
  if (qty <= 0) return { ok: false, reason: "nothing to sell" };
  const scarcity = scarcityOf(g.market[city]?.[good] ?? { stock: 1, target: 1 });
  const f = FEE * feeMul(g, city); // one fee for the whole click: respect must not move the price mid-sale
  const r1 = Math.min(qty, have) > 0 ? sell(g.world, g.market, ship, good, Math.min(qty, have), f) : { ok: true, qty: 0, revenue: 0, profit: 0, spent: 0 };
  let r2 = { ok: true, qty: 0, revenue: 0, profit: 0, spent: 0 };
  if (r1.ok && qty - r1.qty > 0 && stored > 0) r2 = sellStored(g.world, g.market, city, store, good, qty - r1.qty, f);
  const n = (r1.ok ? r1.qty : 0) + (r2.ok ? r2.qty : 0);
  if (n <= 0) return r1.ok ? r2 : r1;
  const revenue = Math.round(((r1.ok ? r1.revenue : 0) + (r2.ok ? r2.revenue : 0)) * 100) / 100;
  const r = { ok: true, qty: n, revenue, profit: Math.round(((r1.profit ?? 0) + (r2.profit ?? 0)) * 100) / 100, spent: Math.round(((r1.spent ?? 0) + (r2.spent ?? 0)) * 100) / 100 }; /* profit/spent across both parts: the tutorial sell step needs a real gain */
  noteTrade(g, city); if (good === "grain" && scarcity >= MEMORY_GRAIN_SCARCE) memoryDeed(g, city, "favor", n); relationsOnSale(g, city, good, n, revenue); g.cash += revenue; creditCaja(g, city, Math.round(revenue * f / (1 - f) * 100) / 100); repOnSale(g, city, scarcity, revenue); if (r1.ok && r1.qty > 0) recordSale(g, ship, r1.qty, r1.revenue, r1.profit); /* the voyage record only tracks the hold part */ logSell(g, good, n, revenue); /* one ledger entry for the combined sale */ contractOnSale(g, city, good, n); /* council contracts count warehouse sales too */ if (addRespect(g, city, revenue)) post(g, "respect", { city }); say(g, "sell", { qty: n, good, sum: revenue }); campaignEvent(g, { kind: "sell", good, qty: n, city }, MISSION); if (g.cash - loansOwed(g) >= GOAL_CASH && !g.over && !g.freePlay && !g.noGoal) g.over = "win"; // victory is checked right after a sale
  tutorialNote(g, "sell", r);
  return r;
}
/** Free navigation (flag g.freeNav): send a ship, docked or already sailing, to any navigable point of the sea or to a port. The ship only moves along sea lanes. */
/** Wind for a fresh leg: the regional weather field when both ends have a fix (ports and chart clicks), else the old flat roll. Same 0.8-1.2 range either way. */
function legWind(g, ship, from, toId, lat, lon) {
  const a = g.world.cities.find((c) => c.id === from);
  const b = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : g.world.cities.find((c) => c.id === toId);
  if (a && b) return legWindFactor(a, b, g.day, g.seed ?? 0);
  return 0.8 + 0.4 * seeded(`wind-v1:${g.seed ?? 0}:${g.tick}:${ship.id}:${from}>${toId}`)();
}

export function doGoTo(g, ship, lat, lon) {
  if (g.freeNav !== true) return { ok: false, reason: "off" };
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.ships?.includes(ship)) return { ok: false, reason: "foreign ship" };
  // A refused course change leaves its reason on the ship (the voyage card shows it until a new order succeeds).
  const refuse = (reason) => { ship.navError = reason; return { ok: false, reason }; };
  const convoy = ship.convoy && g.convoys?.[ship.convoy];
  if (convoy && ship.voyage) return refuse("convoy"); // no mid-leg convoy course changes
  if (speedFactor(ship) <= 0) return refuse("crew");
  const docked = !ship.voyage;
  if (docked && heldNow(g, ship)) return refuse("held");
  const plan = planTrip(g.world, ship, lat, lon);
  if (!plan.ok) return plan.reason === "already there" ? plan : refuse(plan.reason);
  if (convoy) {
    if (!plan.toPort) return refuse("convoy"); // a convoy needs one port destination, never open sea
    const r = sailConvoy(g, convoy.id, plan.to, { doSail });
    if (!r.ok) return refuse(r.reason);
    delete ship.navError;
    return { ...r, toPort: true };
  }
  delete ship.navError; // a course change that goes through clears the last refusal
  if (docked && plan.toPort) return doSail(g, ship, plan.to); // a port from a port: the ordinary departure, all its checks
  // Leg origin: the port when docked, the ship's own position when at sea or anchored, so the diary and the panel never name a port the ship is no longer in.
  const pos = docked ? null : locate(g.world, ship);
  const from = docked ? ship.at : pos?.id ?? (pos ? freeId(pos.lat, pos.lon) : (ship.voyage.from ?? ship.at)); // at a lane node the place IS that port/waypoint
  // Wind is rolled when a ship leaves port; changing course at sea keeps the wind it already had (no re-roll fishing).
  const wind = docked ? legWind(g, ship, from, plan.to, lat, lon) : (ship.voyage.wind ?? 1);
  const spec = SHIP_TYPES[ship.type], mul = speedFactor(ship) * captainSpeed(ship);
  const ticks = Math.max(1, Math.round(ticksForKm(plan.km, spec.kmPerDay) / (mul * wind)));
  const prevSailLogged = ship.voyage?.sailLogged === true;
  ship.voyage = { from, to: plan.to, ticksLeft: ticks, totalTicks: ticks, path: plan.path, km: plan.km, wind, pts: plan.pts, ...(plan.toPort ? {} : { free: true }), sailLogged: prevSailLogged };
  say(g, "sail", { ship: ship.id, city: plan.to, hours: Math.max(1, Math.round(ticks / TICKS_PER_HOUR)) });
  if (plan.toPort) {
    // Ledger: the ship's open entry is retargeted only while nothing closed it - no sale booked
    // and no docking at its port (ship.at is still the port the leg left from); a closed leg earns its own entry.
    const last = (g.voyages ?? []).find((v) => v.ship === ship.id); // openVoyage prepends: first match is the ship's latest entry
    if (last && last.sold === 0 && last.to !== ship.at) { last.from = from; last.to = plan.to; }
    else openVoyage(g, ship, from, plan.to);
    // Chart: ordering into a port sighted up close puts it on the chart at once.
    if (discover(g, plan.to)) say(g, "discovered", { city: plan.to });
    // Missions: a port-bound outing logs one sail event; rerouting keeps the one already logged.
    if (!ship.voyage.sailLogged) { campaignEvent(g, { kind: "sail", to: plan.to }, MISSION); ship.voyage.sailLogged = true; }
  }
  tutorialNote(g, "sail"); // free navigation counts as sailing for the tutorial
  return { ok: true, ticks, km: Math.round(plan.km), toPort: plan.toPort };
}
export function doSail(g, ship, to) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.at !== undefined && !ship.voyage && speedFactor(ship) <= 0) return { ok: false, reason: "crew" }; // below the minimum crew a ship cannot leave port
  if (heldNow(g, ship)) return { ok: false, reason: "held" }; // the court keeps the ship in port
  const from = ship.at;
  // Per-leg wind from the regional field (seeded by day and leg ends), so replays and save/load keep the same weather.
  const wind = legWind(g, ship, from, to);
  const r = sail(g.world, ship, to, { speedMul: speedFactor(ship) * captainSpeed(ship) * hullSpeedFactor(ship.hull), wind }); // a damaged hull sails slower from the first tick
  if (r.ok) openVoyage(g, ship, from, to);
  if (r.ok) say(g, "sail", { ship: ship.id, city: to, hours: Math.max(1, Math.round(r.ticks / TICKS_PER_HOUR)) });
  if (r.ok) campaignEvent(g, { kind: "sail", to }, MISSION);
  if (r.ok && ship.voyage) ship.voyage.sailLogged = true; // this outing already logged its departure; reroutes will not log again
  if (r.ok) tutorialNote(g, "sail");
  return r;
}
/** Buy a second ship (caravel) at the port where ship[0] is docked. */
export function buyCaravel(g, at) {
  if (g.over) return { ok: false, reason: "game over" };
  if (g.cash < CARAVEL_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= CARAVEL_PRICE;
  const s = makeShip(g.nextId++, "caravel", at, g.ships);
  g.ships.push(s); say(g, "caravel", { city: at });
  return { ok: true, ship: s };
}
export const SELL_RATE = 0.6, REPAIR_PER_POINT = 4;
/** Order a new ship at the shipyard of the port where a ship of yours is docked. It is delivered after buildDays. */
export function orderShip(g, type, at) {
  const t = SHIP_TYPES[type];
  if (g.over) return { ok: false, reason: "game over" };
  if (!t || !Object.hasOwn(SHIP_TYPES, type)) return { ok: false, reason: "unknown type" };
  if (!g.ships.some((s) => !s.voyage && s.at === at)) return { ok: false, reason: "no ship here" };
  if (g.cash < t.price) return { ok: false, reason: "no cash" };
  g.cash -= t.price;
  (g.orders ??= []).push({ type, at, readyDay: g.day + t.buildDays });
  say(g, "ordered", { city: at, type });
  return { ok: true, readyDay: g.day + t.buildDays };
}
/** Deliver finished orders (called every day). */
export function deliverOrders(g) {
  for (const o of [...(g.orders ?? [])]) {
    if (o.readyDay > g.day) continue;
    g.orders.splice(g.orders.indexOf(o), 1);
    const s = makeShip(g.nextId++, o.type, o.at, g.ships); g.ships.push(s); say(g, "built", { city: o.at, type: o.type, ship: s.id }); post(g, "order", { city: o.at, type: o.type, ship: s.id });
  }
}
export const repairCost = (ship) => Math.ceil((100 - (ship.hull ?? 100)) * REPAIR_PER_POINT);
export const repairPrice = (g, ship) => Math.ceil(repairCost(ship) * repairMul(g, ship.at)); // reputation discounts the shipyard bill
/** `at` (optional) is the port the player is acting from: a ship can only be repaired where it is docked. Omitted by automatic routes, which act on their own docked ship. */
export function repairShip(g, ship, at) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (at !== undefined && ship.at !== at) return { ok: false, reason: "not in this port" };
  const c = repairPrice(g, ship);
  if (c <= 0) return { ok: false, reason: "no damage" };
  if (g.cash < c) return { ok: false, reason: "no cash" };
  g.cash -= c; ship.hull = 100; return { ok: true, cost: c };
}
export const PRIZE_SELL_RATE = 0.4; // a captured pirate ship resells below the cared-for rate
export const shipValue = (ship) => Math.round(SHIP_TYPES[ship.type].price * (ship.prize ? PRIZE_SELL_RATE : SELL_RATE) * (0.5 + 0.5 * (ship.hull ?? 100) / 100));
export function sellShip(g, ship) {
  if(g.over||!g.ships.includes(ship))return {ok:false,reason:"not an active owned ship"};
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (g.ships.length <= 1) return { ok: false, reason: "last ship" };
  if (cargoUsed(ship) > 0) return { ok: false, reason: "hold not empty" };
  const v = shipValue(ship); g.cash += v; g.ships.splice(g.ships.indexOf(ship), 1);
  removeFromConvoy(g, ship); // a sold ship leaves its convoy (posted); a single hull is no convoy
  return { ok: true, value: v };
}
export const WAREHOUSE_PRICE = 1500, WAREHOUSE_CAP = 300;
/** Storage cap at a port: the base warehouse plus each active warehouse-building level (design doc piece 5). */
export const warehouseCap = (g, city) => WAREHOUSE_CAP + warehouseCapBonus(g, city);
const whUsed = (w) => Object.values(w.goods).reduce((a, b) => a + b, 0);
export const warehouseOf = (g, city) => g.warehouses?.[city] ?? null;
/** Buy a warehouse in the port where a ship is docked. One per port. */
export function buyWarehouse(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  if(!g.ships.some(s=>s.at===city&&!s.voyage))return {ok:false,reason:"no ship here"};
  g.warehouses ??= {};
  if (g.warehouses[city]) return { ok: false, reason: "already owned" };
  if (g.cash < WAREHOUSE_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= WAREHOUSE_PRICE; g.warehouses[city] = { goods: {} }; refreshIntel(g); say(g, "warehouse", { city });
  return { ok: true };
}
/** Move goods from the ship's hold into the warehouse of the port where it is docked. */
export function storeGoods(g, ship, good, qty) {
  if (prizeLocked(g, ship, good) > 0 && qty > (ship.cargo?.[good] ?? 0) - prizeLocked(g, ship, good)) return { ok: false, reason: "prize" };
  if(!g.ships.includes(ship))return {ok:false,reason:"not owned"};
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), ship.cargo[good] ?? 0, warehouseCap(g, ship.at) - whUsed(w));
  if (!(qty > 0)) return { ok: false, reason: "nothing to store" };
  const had=ship.cargo[good],paid=ship.basis?.[good]??0,transferred=qty===had?paid:Math.round(paid*qty/had);
  if(ship.basis)ship.basis[good]=paid-transferred;
  (w.basis??={})[good]=(w.basis[good]??0)+transferred;
  ship.cargo[good] -= qty; if (!ship.cargo[good]){delete ship.cargo[good];if(ship.basis)delete ship.basis[good];}
  w.goods[good] = (w.goods[good] ?? 0) + qty;
  return { ok: true, qty };
}
/** Move goods from the warehouse into the hold (limited by the free room). */
export function takeGoods(g, ship, good, qty) {
  if(!g.ships.includes(ship))return {ok:false,reason:"not owned"};
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), w.goods[good] ?? 0, Math.max(0, shipCapacity(ship) - cargoUsed(ship)));
  if (!(qty > 0)) return { ok: false, reason: "nothing to take" };
  const had=w.goods[good],paid=w.basis?.[good]??0,transferred=qty===had?paid:Math.round(paid*qty/had);
  if(w.basis)w.basis[good]=paid-transferred;
  (ship.basis??={})[good]=(ship.basis[good]??0)+transferred;
  w.goods[good] -= qty; if (!w.goods[good]){delete w.goods[good];if(w.basis)delete w.basis[good];}
  ship.cargo[good] = (ship.cargo[good] ?? 0) + qty;
  return { ok: true, qty };
}
export function quote(g, city, good) { return price(g.world, g.market[city][good], good); }
export { cargoUsed, SHIP_TYPES };
/** A tavern rumour also puts the named port on the chart: now the trader knows where it is. */
export function buyRumor(g, city, at) {
  const r = buyRumorIntel(g, city, at);
  if (r.ok && discover(g, city)) say(g, "discovered", { city });
  if (r.ok) say(g, "rumor", { city, at, price: RUMOR_PRICE });
  return r;
}
export { RUMOR_PRICE, isLive } from "./intel.mjs";
export { isDiscovered } from "./fog.mjs";

/**
 * Where would the whole hold sell best at today's prices? One row per other port, best first:
 * {city, revenue, profit, days}. Prices at arrival will differ; this is a guide, not a promise.
 */
export function bestPorts(g, ship) {
  if (ship.voyage || Object.keys(ship.cargo).length === 0) return [];
  const rows = [], { market: km, age } = knownMarket(g);
  for (const c of g.world.cities) {
    if (c.id === ship.at || !km[c.id]) continue; // unknown port: no price
    const r = route(g.world, ship.at, c.id);
    if (!r) continue;
    const there = { ...ship, at: c.id, voyage: null };
    let revenue = 0, profit = 0, any = false;
    for (const [good, q] of Object.entries(ship.cargo)) {
      const p = previewSell(g.world, km, there, good, q, FEE * feeMul(g, c.id));
      if (p.qty) { revenue += p.revenue; profit += p.profit; any = true; }
    }
    if (any) rows.push({ city: c.id, age: age[c.id].days, exact: age[c.id].exact, revenue, profit, days: Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay)) });
  }
  return rows.sort((a, b) => b.revenue - a.revenue);
}

/** Bank: borrow at a port where one of your ships is docked. */
export const borrow = (g, city, amount) => takeLoan(g, city, amount, netWorth(g), post);
export const repay = (g, id, amount) => repayLoan(g, id, amount, post);
export const bankRoom = (g, city) => loanRoom(g, netWorth(g), city); // pass the port: the lender of that port sets the terms
export { loansOwed };
export { setRoute, setRouteAdv, clearRoute, repeatRoute, routeStats };
import { removeFromConvoy, sailConvoy } from "./convoys.mjs";
export { formConvoy, leaveConvoy, disbandConvoy, sailConvoy, escortOf, convoyOf, removeFromConvoy } from "./convoys.mjs";
