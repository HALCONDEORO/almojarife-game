// La almoneda: the town auction (docs/design/town-industry-and-auctions.md piece 3).
// One general mechanism, one lot per city and auction day for now: a town-industry
// establishment (piece 1) that changes hands under piece-2 rules - production and hands
// move with it, never duplicate. Houses, ships, permits and goods lots plug into the same
// table later (own lot kinds with their own valuations).
//
// Everyone plays by the same rules: the player and the named neighbours bid a single
// maximum; the highest bid wins and pays one coin above the second-highest (never above
// his own maximum). NPC valuations are deterministic from world data and the day - no
// rolls at runtime, no purses the player does not have, no bidding the player up for fun.
// Own design and own numbers throughout. Off unless the game has the town-industry flag.
import { seeded } from "../view/cityscene.mjs"; // same FNV-style hash the concejo uses (council.mjs precedent)
import { BUILDING_TYPES } from "./buildings.mjs";
import { RECIPES } from "../sim/recipes.mjs";
import { townIndustry, buyEstablishment, salesOf } from "./townindustry.mjs";
import { creditCaja } from "./council.mjs";
import { townCouncil } from "./townhall.mjs";
import { post } from "./ledger.mjs";

export const AUCTION_EVERY = 7; // one almoneda per city and week, staggered like the concejo meetings
/** The city's weekly auction day offset inside the AUCTION_EVERY cycle. Deterministic per city. */
export const auctionOffset = (cityId) => Math.floor(seeded("almoneda:" + cityId)() * AUCTION_EVERY);
export const isAuctionDay = (cityId, day) => day % AUCTION_EVERY === auctionOffset(cityId);
export const nextAuctionDay = (cityId, day) => {
  const wait = (auctionOffset(cityId) - (day % AUCTION_EVERY) + AUCTION_EVERY) % AUCTION_EVERY;
  return day + (wait === 0 ? AUCTION_EVERY : wait); // today's table is already up: name the next one
};

/** Replacement-cost valuation of an establishment: the materials of its recipe at base prices
 *  plus the builder's fee, per level, times a market margin. Own tuning, documented as such. */
export const VALUE_MARGIN = 1.25;
export function establishmentValue(world, est) {
  const spec = BUILDING_TYPES[est?.type];
  if (!spec) return null;
  const materials = Object.entries(RECIPES[spec.recipe]).reduce((a, [good, qty]) => a + qty * (world.goods[good]?.base ?? 0), 0);
  return Math.round((materials + spec.fee) * est.level * VALUE_MARGIN);
}
/** The reserve price: below this the town withdraws the lot instead of giving it away. */
export const reserveOf = (value) => Math.round(value * 0.6);

/** The establishment on the block today: one unsold, building-kind works, chosen deterministically
 *  among those available (so the same good does not always come up first). null off day or sold out. */
export function lotOfDay(g, cityId) {
  if (g.townIndustry !== true || !isAuctionDay(cityId, g.day)) return null;
  const sales = salesOf(g, cityId);
  const gone = new Set([...sales.ids, ...(sales.gone ?? [])]);
  const available = townIndustry(g.world, cityId).filter((e) => e.kind === "building" && BUILDING_TYPES[e.type] && !gone.has(e.id));
  if (!available.length) return null;
  const pick = Math.floor(seeded(`lot:${cityId}:${g.day}`)() * available.length);
  const est = available[pick];
  const value = establishmentValue(g.world, est);
  return { kind: "establishment", est, value, reserve: reserveOf(value) };
}

/** The named neighbours bidding today, each with his maximum. Deterministic from city, day and
 *  lot: same day, same table. A neighbour bids between 70% and 115% of the valuation and sits
 *  out below the reserve. Names come from the port's concejo table; the seller never bids
 *  (you do not buy back your own works). */
export function biddersOf(g, cityId, lot) {
  const rnd = seeded(`bidders:${cityId}:${g.day}:${lot.est.id}`);
  const council = townCouncil(g.world, cityId, g.day);
  const people = [...council.councillors, council.mayor]
    .filter((n) => lot.est.owner.kind !== "townsfolk" || n !== lot.est.owner.name);
  const bids = [];
  for (const name of people) {
    const factor = 0.7 + rnd() * 0.45; // 0.70 to 1.15 of the valuation
    const max = Math.round(lot.value * factor);
    if (max >= lot.reserve) bids.push({ who: name, max });
  }
  return bids;
}

/** Resolve the day's auction with the player's maximum bid. Returns what happened, view-ready.
 *  Side effects only on a decided sale: the winner takes the works (the player via
 *  buyEstablishment, which moves production share and hands; a neighbour takes it off the
 *  market, the town keeps its share). The seller is paid: the concejo's chest when the works
 *  were municipal, the neighbour's own pocket otherwise (not simulated). */
export function bidAuction(g, cityId, playerMax) {
  if (g.townIndustry !== true) return { ok: false, reason: "off" };
  if (g.over) return { ok: false, reason: "game over" };
  const lot = lotOfDay(g, cityId);
  if (!lot) return { ok: false, reason: "no auction today" };
  if (!Number.isSafeInteger(playerMax) || playerMax < 0) return { ok: false, reason: "bad bid" };
  const bids = [...biddersOf(g, cityId, lot), { who: "player", max: playerMax }];
  bids.sort((a, b) => b.max - a.max || (a.who < b.who ? -1 : 1));
  for (let i = 0; i < bids.length; i++) { // the lot goes to the highest bidder who can settle
    const top = bids[i], second = bids[i + 1];
    if (top.max < lot.reserve) return { ok: true, outcome: "withdrawn", lot }; // nobody meets the reserve: the town keeps it
    const price = Math.min(top.max, Math.max(lot.reserve, (second?.max ?? lot.reserve - 1) + 1));
    if (top.who !== "player") {
      const sales = ((g.townSales ??= Object.create(null))[cityId] ??= { jobs: 0, ids: [], gone: [] });
      (sales.gone ??= []).push(lot.est.id);
      if (lot.est.owner.kind === "council") creditCaja(g, cityId, price);
      post(g, "info", { city: cityId, txt: {
        es: `Almoneda en ${cityId}: ${top.who} se lleva ${lot.est.type} (nivel ${lot.est.level}) por ${price} monedas.`,
        en: `Auction in ${cityId}: ${top.who} takes the ${lot.est.type} (level ${lot.est.level}) for ${price} coins.`,
      } });
      return { ok: true, outcome: "lost", winner: top.who, price, lot };
    }
    if (g.cash >= price) {
      const r = buyEstablishment(g, cityId, lot.est.id, price);
      if (!r.ok) return r;
      return { ok: true, outcome: "won", price, lot };
    }
    post(g, "info", { city: cityId, txt: { // his max was a promise his purse cannot keep: the bid leaves the table
      es: `Tu puja en la almoneda de ${cityId} queda sin efecto: no tienes ${price} monedas.`,
      en: `Your bid at the ${cityId} auction is void: you do not have ${price} coins.`,
    } });
  }
  return { ok: true, outcome: "withdrawn", lot };
}

/** The player's standing maximum for today's table in a port. He sets it while the lot is on
 *  the block (that same day); the hammer falls at the day boundary. Refuses off day, bad bids
 *  and tables that are already over. */
export function placeBid(g, cityId, playerMax) {
  if (g.townIndustry !== true) return { ok: false, reason: "off" };
  if (!isAuctionDay(cityId, g.day) || !lotOfDay(g, cityId)) return { ok: false, reason: "no auction today" };
  if (!Number.isSafeInteger(playerMax) || playerMax < 0) return { ok: false, reason: "bad bid" };
  if (playerMax > g.cash) return { ok: false, reason: "no cash", cost: playerMax }; // you cannot promise coins you do not have
  ((g.townBids ??= Object.create(null))[cityId]) = playerMax;
  return { ok: true };
}
/** Day-boundary hook (game.mjs dayTick): every port whose almoneda meets today brings its lot
 *  down. The player bids through placeBid during the day; absent a bid he sits the table out.
 *  No-op with the flag off or on any other day. */
export function almonedaDay(g) {
  if (g.townIndustry !== true) return;
  for (const c of g.world.cities) {
    if (!isAuctionDay(c.id, g.day)) continue;
    const max = g.townBids?.[c.id] ?? 0;
    if (g.townBids) delete g.townBids[c.id];
    bidAuction(g, c.id, max);
  }
}
