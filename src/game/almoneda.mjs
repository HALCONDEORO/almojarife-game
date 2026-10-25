// La almoneda: the town auction (docs/design/town-industry-and-auctions.md pieces 3-4).
// One general mechanism, several lot kinds per city and auction day: a town-industry
// establishment (piece 1) that changes hands under piece-2 rules - production and hands
// move with it, never duplicate - plus generated lots (piece 4): used ships and town
// houses, each on its own seeded cadence - plus piece-5 lots: seized/surplus goods and
// building permits, each with its own valuation and settlement. Lot ids follow the establishment
// shape `city:kind:n` so a won house keys g.buildings exactly like a bought works.
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
import { isDiscovered } from "./fog.mjs";
import { makeShip, SHIP_TYPES } from "../sim/trade.mjs";
import { hasOffice, warehouseCapBonus } from "./buildings.mjs";
import { price } from "../sim/market.mjs";

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
  return { kind: "establishment", id: est.id, est, value, reserve: reserveOf(value), seller: est.owner };
}

// ---- More lot kinds: used ships and town houses (owner direction 24 Oct: "subastas de todo tipo",
// houses, ships, factories, permits). Establishments keep their weekly table; generated lots come up
// at their own staggered cadence so no roster drains and the same port does not sell the same hulk twice.
export const SHIP_EVERY = 4, HOUSE_EVERY = 2; // cycles of AUCTION_EVERY days: a ship about monthly, a house about fortnightly
export const shipCycleOffset = (cityId) => Math.floor(seeded("almoneda-ship:" + cityId)() * SHIP_EVERY);
export const houseCycleOffset = (cityId) => Math.floor(seeded("almoneda-house:" + cityId)() * HOUSE_EVERY);
const cycleOf = (day) => Math.floor(day / AUCTION_EVERY);
/** Who sells a generated lot: the concejo about half the time (an old hulk, a repossessed house), a named
 *  neighbour otherwise. Deterministic per city, kind and cycle. */
function generatedSeller(world, cityId, cycle, kind) {
  if (seeded(`almseller:${kind}:${cityId}:${cycle}`)() < 0.5) return { kind: "council" };
  const council = townCouncil(world, cityId, cycle * AUCTION_EVERY);
  const people = [...council.councillors, council.mayor];
  return { kind: "townsfolk", name: people[Math.floor(seeded(`almsellern:${kind}:${cityId}:${cycle}`)() * people.length)] };
}

/** A used ship the seller puts on the block: hull worn 55-90%, priced off the hull-proportional
 *  new price with a used-market discount. Own tuning, documented as such. */
export const SHIP_HULL_RANGE = [55, 90], SHIP_VALUE_MUL = 0.95;
export function shipLotValue(type, hull) {
  if (!SHIP_TYPES[type] || !Number.isInteger(hull) || hull < 1 || hull > 100) return null;
  return Math.max(1, Math.round(SHIP_TYPES[type].price * (hull / 100) * SHIP_VALUE_MUL));
}
/** The most valuable ship lot that can ever come up (hull at the top of the range). */
export const maxShipLotValue = () => Math.max(...Object.keys(SHIP_TYPES).map((t) => shipLotValue(t, SHIP_HULL_RANGE[1])));
export function shipLotOfDay(g, cityId) {
  if (g.townIndustry !== true || !isAuctionDay(cityId, g.day)) return null;
  const cycle = cycleOf(g.day);
  if (cycle % SHIP_EVERY !== shipCycleOffset(cityId)) return null;
  const rnd = seeded(`shiplot:${cityId}:${g.day}`);
  const types = Object.keys(SHIP_TYPES);
  const type = types[Math.floor(rnd() * types.length)];
  const hull = SHIP_HULL_RANGE[0] + Math.floor(rnd() * (SHIP_HULL_RANGE[1] - SHIP_HULL_RANGE[0] + 1));
  const value = shipLotValue(type, hull);
  return { kind: "ship", id: `${cityId}:ship:${g.day}`, ship: { type, hull }, value, reserve: reserveOf(value), seller: generatedSeller(g.world, cityId, cycle, "ship"), // id shaped city:kind:n like the establishment roster
    name: { es: `${type} de segunda mano (casco ${hull}%)`, en: `used ${type} (hull ${hull}%)` } };
}

/** A town house on the block, level 1-3, valued by the same replacement-cost rule as the works. */
export const maxHouseLotValue = (world) => establishmentValue(world, { type: "house", level: 3 });
export function houseLotOfDay(g, cityId) {
  if (g.townIndustry !== true || !isAuctionDay(cityId, g.day)) return null;
  const cycle = cycleOf(g.day);
  if (cycle % HOUSE_EVERY !== houseCycleOffset(cityId)) return null;
  const rnd = seeded(`houselot:${cityId}:${g.day}`);
  const level = 1 + Math.floor(rnd() * 3);
  const value = establishmentValue(g.world, { type: "house", level });
  return { kind: "house", id: `${cityId}:house:${g.day}`, house: { level }, value, reserve: reserveOf(value), seller: generatedSeller(g.world, cityId, cycle, "house"), // a won house lands in g.buildings under this key: the buildings-tab plotId guards expect city:-prefixed keys (as bought works have)
    name: { es: `casa de vecinos (nivel ${level})`, en: `town house (level ${level})` } };
}

// ---- Piece 5: goods lots and building permits (same owner direction: "permisos lo que se te ocurra").
// A goods lot is seized or surplus stock the seller puts on the block, priced off the live local
// quote with an auction discount; it settles into the winner's warehouse in this port. A building
// permit is a municipal paper that pays the plot price of one solar here, redeemed at buyPlot.
export const GOODS_EVERY = 6, PERMIT_EVERY = 5; // cycles: goods about every six weeks, a permit about every five
export const goodsCycleOffset = (cityId) => Math.floor(seeded("almoneda-goods:" + cityId)() * GOODS_EVERY);
export const permitCycleOffset = (cityId) => Math.floor(seeded("almoneda-permit:" + cityId)() * PERMIT_EVERY);

/** Base warehouse capacity, mirroring WAREHOUSE_CAP in game.mjs (which imports this module, so it
 *  cannot be imported back; test/almoneda.test.mjs pins the two equal so a drift fails the suite). */
const WAREHOUSE_BASE_CAP = 300;
export const GOODS_QTY_RANGE = [10, 60], GOODS_VALUE_MUL = 0.9; // own tuning, documented as such
/** Spanish names for the goods table (engine-side, like the post() precedent); EN humanizes the id. */
const GOODS_ES = { grain: "grano", fish: "pescado", meat: "carne", salt: "sal", olive_oil: "aceite de oliva", beer: "cerveza", wine: "vino", sugar: "az\u00facar", pepper: "pimienta", saffron: "azafr\u00e1n", silk: "seda", cloth: "tela", leather: "cuero", soap: "jab\u00f3n", timber: "madera", bricks: "ladrillos", iron: "hierro", ironware: "ferreter\u00eda", wool: "lana", esparto: "esparto", legumes: "legumbres", pottery: "cer\u00e1mica" };
export function goodsLotOfDay(g, cityId) {
  if (g.townIndustry !== true || !isAuctionDay(cityId, g.day)) return null;
  const cycle = cycleOf(g.day);
  if (cycle % GOODS_EVERY !== goodsCycleOffset(cityId)) return null;
  const city = g.world.cities.find((c) => c.id === cityId);
  const makes = (city?.makes ?? []).filter((good) => g.world.goods[good] && g.market?.[cityId]?.[good]);
  if (!makes.length) return null;
  const rnd = seeded(`goodslot:${cityId}:${g.day}`);
  const good = makes[Math.floor(rnd() * makes.length)];
  const qty = GOODS_QTY_RANGE[0] + Math.floor(rnd() * (GOODS_QTY_RANGE[1] - GOODS_QTY_RANGE[0] + 1));
  const unit = price(g.world, g.market[cityId][good], good);
  const value = Math.max(1, Math.round(qty * unit * GOODS_VALUE_MUL));
  return { kind: "goods", id: `${cityId}:goods:${g.day}`, goods: { good, qty }, value, reserve: reserveOf(value), seller: generatedSeller(g.world, cityId, cycle, "goods"),
    name: { es: `${qty} de ${GOODS_ES[good] ?? good}`, en: `${qty} of ${good.replaceAll("_", " ")}` } };
}
/** The most valuable goods lot that can ever come up (top qty at the 3x price clamp). */
export const maxGoodsLotValue = (world) => Math.round(GOODS_QTY_RANGE[1] * 3 * Math.max(...Object.values(world.goods).map((x) => x.base)) * GOODS_VALUE_MUL);

/** A permit is valued like a canonical mid-size plot: the plotPrice formula with area 100 and the
 *  standard type multiplier, on this port's population. The actual solar the winner picks may be
 *  smaller or larger; the auction price is the assessed value of the paper, not of one plot. */
export const PERMIT_PLOT_AREA = 100;
export const permitLotValue = (world, cityId) => Math.round(150 + (world.nodes?.[cityId]?.pop ?? 8000) * 0.02 + PERMIT_PLOT_AREA * 2);
export const maxPermitLotValue = (world) => Math.round(150 + Math.max(...world.cities.map((c) => c.pop)) * 0.02 + PERMIT_PLOT_AREA * 2);
export function permitLotOfDay(g, cityId) {
  if (g.townIndustry !== true || !isAuctionDay(cityId, g.day)) return null;
  const cycle = cycleOf(g.day);
  if (cycle % PERMIT_EVERY !== permitCycleOffset(cityId)) return null;
  const value = permitLotValue(g.world, cityId);
  return { kind: "permit", id: `${cityId}:permit:${g.day}`, value, reserve: reserveOf(value), seller: generatedSeller(g.world, cityId, cycle, "permit"),
    name: { es: "permiso de obra municipal", en: "municipal building permit" } };
}

/** Every lot on the block today: the establishment table plus whatever generated kinds meet their cadence. */
export function lotsOfDay(g, cityId) {
  return [lotOfDay(g, cityId), shipLotOfDay(g, cityId), houseLotOfDay(g, cityId), goodsLotOfDay(g, cityId), permitLotOfDay(g, cityId)].filter(Boolean);
}
export const sellerOf = (lot) => lot.seller ?? lot.est?.owner ?? { kind: "council" }; // the UI reads the seller the same way the engine does
/** Short lot description for the hammer notices. */
function lotDesc(lot, lang) {
  if (lot.kind === "ship") return lang === "en" ? `the ${lot.ship.type} (hull ${lot.ship.hull}%)` : `la ${lot.ship.type} (casco ${lot.ship.hull}%)`;
  if (lot.kind === "house") return lang === "en" ? `the house (level ${lot.house.level})` : `la casa (nivel ${lot.house.level})`;
  if (lot.kind === "goods") return lang === "en" ? `the goods lot (${lot.name.en})` : `el lote de mercanc\u00edas (${lot.name.es})`;
  if (lot.kind === "permit") return lang === "en" ? "the building permit" : "el permiso de obra";
  return lang === "en" ? `the ${lot.est.type} (level ${lot.est.level})` : `${lot.est.type} (nivel ${lot.est.level})`;
}

/** The named neighbours bidding today, each with his maximum. Deterministic from city, day and
 *  lot: same day, same table. A neighbour bids between 70% and 115% of the valuation and sits
 *  out below the reserve. Names come from the port's concejo table; the seller never bids
 *  (you do not buy back your own works). */
export function biddersOf(g, cityId, lot) {
  const rnd = seeded(`bidders:${cityId}:${g.day}:${lot.id}`);
  const council = townCouncil(g.world, cityId, g.day);
  const seller = sellerOf(lot);
  const people = [...council.councillors, council.mayor]
    .filter((n) => seller.kind !== "townsfolk" || n !== seller.name);
  const bids = [];
  for (const name of people) {
    const factor = 0.7 + rnd() * 0.45; // 0.70 to 1.15 of the valuation
    const max = Math.round(lot.value * factor);
    if (max >= lot.reserve) bids.push({ who: name, max });
  }
  return bids;
}

/** The winner settles the lot he took, per kind. Only called with the hammer decided.
 *  Establishments move under piece-2 rules; a ship is delivered moored at the auction port; a house
 *  lands in g.buildings like any transferred works (office required, then it lives by the player's
 *  rules). A council sale credits the chest: roster sales under hallAlmoneda (finite bound in
 *  council.test), generated lots under hallAlmonedaGen with their own cadence bound. */
function settle(g, cityId, lot, price) {
  if (lot.kind === "establishment") return buyEstablishment(g, cityId, lot.est.id, price);
  if (g.cash < price) return { ok: false, reason: "no cash", cost: price };
  if (lot.kind === "ship") {
    g.cash -= price;
    const s = makeShip(g.nextId++, lot.ship.type, cityId);
    s.hull = lot.ship.hull;
    g.ships.push(s);
    if (sellerOf(lot).kind === "council") { creditCaja(g, cityId, price); (g.hallAlmonedaGen ??= {})[cityId] = (g.hallAlmonedaGen[cityId] ?? 0) + price; }
    post(g, "info", { city: cityId, txt: {
      es: `Ganas la almoneda de ${cityId}: una ${lot.ship.type} (casco ${lot.ship.hull}%) por ${price} monedas. Ya es tuya y amarra en este puerto.`,
      en: `You win the ${cityId} auction: a ${lot.ship.type} (hull ${lot.ship.hull}%) for ${price} coins. She is yours, moored in this port.`,
    } });
    return { ok: true };
  }
  if (lot.kind === "house") {
    if (!hasOffice(g, cityId)) return { ok: false, reason: "office required" };
    g.cash -= price;
    ((g.buildings ??= {})[cityId] ??= {})[lot.id] = { type: "house", level: lot.house.level, state: "active", plotType: "house", paidPlot: 0, fromTown: lot.id, produced: 0 }; // plain object: save round-trip fidelity (walls.mjs convention)
    if (sellerOf(lot).kind === "council") { creditCaja(g, cityId, price); (g.hallAlmonedaGen ??= {})[cityId] = (g.hallAlmonedaGen[cityId] ?? 0) + price; }
    post(g, "info", { city: cityId, txt: {
      es: `Ganas la almoneda de ${cityId}: una casa de vecinos (nivel ${lot.house.level}) por ${price} monedas. Sus inquilinos engordan la demanda del puerto.`,
      en: `You win the ${cityId} auction: a town house (level ${lot.house.level}) for ${price} coins. Its tenants add to the port's demand.`,
    } });
    return { ok: true };
  }
  if (lot.kind === "goods") {
    const w = g.warehouses?.[cityId];
    const used = w ? Object.values(w.goods).reduce((a, b) => a + b, 0) : 0;
    if (!w || used + lot.goods.qty > WAREHOUSE_BASE_CAP + warehouseCapBonus(g, cityId)) return { ok: false, reason: "no warehouse room" };
    g.cash -= price;
    w.goods[lot.goods.good] = (w.goods[lot.goods.good] ?? 0) + lot.goods.qty;
    (w.basis ??= {})[lot.goods.good] = (w.basis[lot.goods.good] ?? 0) + price; // what these units cost, so the ledger's profit math stays honest
    if (sellerOf(lot).kind === "council") { creditCaja(g, cityId, price); (g.hallAlmonedaGen ??= {})[cityId] = (g.hallAlmonedaGen[cityId] ?? 0) + price; }
    post(g, "info", { city: cityId, txt: {
      es: `Ganas la almoneda de ${cityId}: ${lot.name.es} por ${price} monedas. Ya esta en tu almacen de este puerto.`,
      en: `You win the ${cityId} auction: ${lot.name.en} for ${price} coins. It is in your warehouse in this port.`,
    } });
    return { ok: true };
  }
  if (lot.kind === "permit") {
    g.cash -= price;
    (g.almonedaPermits ??= {})[cityId] = (g.almonedaPermits[cityId] ?? 0) + 1; // plain object: save round-trip fidelity
    if (sellerOf(lot).kind === "council") { creditCaja(g, cityId, price); (g.hallAlmonedaGen ??= {})[cityId] = (g.hallAlmonedaGen[cityId] ?? 0) + price; }
    post(g, "info", { city: cityId, txt: {
      es: `Ganas la almoneda de ${cityId}: un permiso de obra por ${price} monedas. Paga el solar de tu proxima construccion en este puerto.`,
      en: `You win the ${cityId} auction: a building permit for ${price} coins. It pays the plot of your next building in this port.`,
    } });
    return { ok: true };
  }
  return { ok: false, reason: "unknown lot" };
}

/** Resolve one lot with the player's maximum bid. Returns what happened, view-ready.
 *  Side effects only on a decided sale: the winner takes the lot (the player via settle, which
 *  moves cash and the goods; a neighbour takes it off the market). The seller is paid: the
 *  concejo's chest when the lot was municipal, the neighbour's own pocket otherwise (not simulated). */
export function bidAuction(g, cityId, playerMax, lotId) {
  if (g.townIndustry !== true) return { ok: false, reason: "off" };
  if (g.over) return { ok: false, reason: "game over" };
  const lots = lotsOfDay(g, cityId);
  const lot = lotId ? lots.find((l) => l.id === lotId) : (lots.find((l) => l.kind === "establishment") ?? lots[0]); // legacy callers mean the establishment table
  if (!lot) return { ok: false, reason: "no auction today" };
  if (!Number.isSafeInteger(playerMax) || playerMax < 0) return { ok: false, reason: "bad bid" };
  const bids = [...biddersOf(g, cityId, lot), { who: "player", max: playerMax }];
  bids.sort((a, b) => b.max - a.max || (a.who < b.who ? -1 : 1));
  for (let i = 0; i < bids.length; i++) { // the lot goes to the highest bidder who can settle
    const top = bids[i], second = bids[i + 1];
    if (top.max < lot.reserve) return { ok: true, outcome: "withdrawn", lot }; // nobody meets the reserve: the town keeps it
    const price = Math.min(top.max, Math.max(lot.reserve, (second?.max ?? lot.reserve - 1) + 1));
    if (top.who !== "player") {
      if (lot.kind === "establishment") {
        const sales = ((g.townSales ??= {})[cityId] ??= { jobs: 0, ids: [], gone: [] }); // plain object: the JSON save round-trip returns plain objects (walls.mjs convention)
        (sales.gone ??= []).push(lot.est.id);
      }
      if (lot.kind === "establishment" && sellerOf(lot).kind === "council") { // municipal proceeds to the concejo's chest, counted apart so the tax band stays a tax band
        creditCaja(g, cityId, price);
        (g.hallAlmoneda ??= {})[cityId] = (g.hallAlmoneda[cityId] ?? 0) + price;
      } // generated lots won by a neighbour move no chest money: neighbour coins are not simulated, so crediting the concejo would mint phantom income (only the player's real coins count, in settle)
      const tell = lot.kind === "establishment" ? (isDiscovered(g, cityId) || playerMax > 0) : playerMax > 0; // generated lots cry their result only at a table the player joined: the weekly ship and house would double the home port's inbox noise for an idle player (MAX_INBOX eviction is a real failure mode)
      if (tell) post(g, "info", { city: cityId, txt: { // you hear the hammer where you know the town or sat at the table; a far port you have never charted stays silent
        es: `Almoneda en ${cityId}: ${top.who} se lleva ${lotDesc(lot, "es")} por ${price} monedas.`,
        en: `Auction in ${cityId}: ${top.who} takes ${lotDesc(lot, "en")} for ${price} coins.`,
      } });
      return { ok: true, outcome: "lost", winner: top.who, price, lot };
    }
    const r = settle(g, cityId, lot, price);
    if (r.ok) return { ok: true, outcome: "won", price, lot };
    post(g, "info", { city: cityId, txt: r.reason === "office required" ? { // his max was a promise he cannot keep: the bid leaves the table and the next bidder comes up
      es: `Tu puja en la almoneda de ${cityId} queda sin efecto: necesitas una oficina comercial en este puerto.`,
      en: `Your bid at the ${cityId} auction is void: you need a trading office in this port.`,
    } : r.reason === "no warehouse room" ? {
      es: `Tu puja en la almoneda de ${cityId} queda sin efecto: no tienes un almacen con sitio en este puerto.`,
      en: `Your bid at the ${cityId} auction is void: you have no warehouse room in this port.`,
    } : {
      es: `Tu puja en la almoneda de ${cityId} queda sin efecto: no tienes ${price} monedas.`,
      en: `Your bid at the ${cityId} auction is void: you do not have ${price} coins.`,
    } });
  }
  return { ok: true, outcome: "withdrawn", lot };
}

/** The player's standing maximum for one lot on today's table in a port. He sets it while the lot is
 *  on the block (that same day); the hammer falls at the day boundary. Refuses off day, bad bids and
 *  tables that are already over. Bids are kept per lot; a bare number from an old save means the
 *  establishment table. */
export function placeBid(g, cityId, playerMax, lotId) {
  if (g.townIndustry !== true) return { ok: false, reason: "off" };
  const lots = lotsOfDay(g, cityId);
  const lot = lotId ? lots.find((l) => l.id === lotId) : (lots.find((l) => l.kind === "establishment") ?? lots[0]);
  if (!lot) return { ok: false, reason: "no auction today" };
  if (!Number.isSafeInteger(playerMax) || playerMax < 0) return { ok: false, reason: "bad bid" };
  if (playerMax > g.cash) return { ok: false, reason: "no cash", cost: playerMax }; // you cannot promise coins you do not have
  const cur = g.townBids?.[cityId];
  const map = { ...(typeof cur === "object" && cur !== null ? cur : {}), [lot.id]: playerMax }; // plain object: save round-trip fidelity
  if (typeof cur === "number" && lot.kind !== "establishment") { // a legacy bare number is the establishment table's bid: carry it, never drop it silently
    const est = lots.find((l) => l.kind === "establishment");
    if (est && map[est.id] === undefined) map[est.id] = cur;
  }
  (g.townBids ??= {})[cityId] = map;
  return { ok: true };
}
/** Day-boundary hook (game.mjs dayTick): every port whose almoneda meets today brings its lots down,
 *  one hammer per lot. The player bids through placeBid during the day; absent a bid he sits the
 *  table out. No-op with the flag off or on any other day. */
export function almonedaDay(g) {
  if (g.townIndustry !== true) return;
  for (const c of g.world.cities) {
    const lots = lotsOfDay(g, c.id);
    if (!lots.length) continue;
    const raw = g.townBids?.[c.id];
    for (const lot of lots) {
      const max = typeof raw === "number" ? (lot.kind === "establishment" ? raw : 0) : (raw?.[lot.id] ?? 0); // legacy bare number: the establishment table only
      bidAuction(g, c.id, max, lot.id);
    }
    if (g.townBids) delete g.townBids[c.id];
  }
}
