// Price news from passing ships: on arrival, dockside talk tells of one good that is dear or cheap
// in a port the player already knows. Text only: real market intel still comes from being there
// or from a paid rumour, so the news quotes a rounded figure and never writes into g.intel.
// Pure game logic: no DOM.
import { seeded } from "../view/cityscene.mjs";
import { post } from "./ledger.mjs";
import { isLive } from "./intel.mjs";
import { price } from "../sim/market.mjs";
export const NEWS_CHANCE = 0.7, NEWS_DEVIATION = 0.15;
export const GOOD_ES = { grain: "el trigo", wine: "el vino", olive_oil: "el aceite", sugar: "el azúcar", wool: "la lana", dried_fish: "el pescado seco", salt: "la sal", timber: "la madera", iron: "el hierro", cloth: "el paño", silk: "la seda", pepper: "la pimienta" };
/** Fair price: what the entry would charge at its target stock. */
export const fairPrice = (world, e, good) => price(world, { ...e, stock: e.target }, good);
/** Maybe post one price-news line on arrival at `at`. Returns {city, good, dear, price} or null. */
export function arrivalNews(g, at) {
  if (g.over) return null;
  const rnd = seeded(`news:${g.seed ?? 0}:${g.day}:${at}`);
  if (rnd() >= NEWS_CHANCE) return null;
  const known = Object.keys(g.intel ?? {}).filter((c) => c !== at && !isLive(g, c) && g.market[c]);
  if (!known.length) return null; // nothing to tell about ports you never heard of
  const city = known[Math.floor(rnd() * known.length)], cName = g.world.cities.find((c) => c.id === city)?.name ?? city;
  const goods = Object.keys(g.market[city]), good = goods[Math.floor(rnd() * goods.length)];
  const e = g.market[city][good], now = price(g.world, e, good), fair = fairPrice(g.world, e, good);
  const dev = (now - fair) / fair;
  if (!isFinite(dev) || Math.abs(dev) < NEWS_DEVIATION) return null; // only real news travels
  const dear = dev > 0, about = Math.round(now / 5) * 5, gEs = GOOD_ES[good] ?? good;
  const txt = dear
    ? { es: `Marineros de paso por ${cName} dicen que ${gEs} está caro allí: lo pagan a unas ${about} monedas.`, en: `Sailors passing through ${cName} say ${good} is dear there: it fetches about ${about} coins.` }
    : { es: `Marineros de paso por ${cName} dicen que ${gEs} está barato allí: apenas lo pagan a ${about} monedas.`, en: `Sailors passing through ${cName} say ${good} is cheap there: it barely fetches ${about} coins.` };
  post(g, "news", { txt });
  return { city, good, dear, price: now };
}
