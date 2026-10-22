// City crafts (living cities 8/8 in design order): a port that keeps shipping one good out
// earns a name for it - "Cadiz, ciudad de la sal". Exports are counted from real trades by
// EVERYONE (player, standing orders and bots buy through the same market), because the rule
// is the city's fame, not the buyer's. Own design, pure, no DOM. Off unless
// g.cityCrafts === true (no state keys at all in an off game: saves stay identical).
// Counting moves no money and no prices: it only watches trades that already happened.
// CRAFT_MIN_UNITS / CRAFT_MIN_LEAD are own tuning knobs (inference, not historical figures).
import { post } from "./ledger.mjs";
import { GOOD_ES, GOOD_EN } from "./news.mjs";

export const CRAFT_MIN_UNITS = 500; // lifetime units of one good bought at the port before it earns the name
export const CRAFT_MIN_LEAD = 2;    // and at least twice the next good, so the name means something

/** Record units bought at a port, whoever bought them. Flag off: nothing is stored. */
export function craftCount(g, cityId, good, qty) {
  if (g?.cityCrafts !== true || !good || !(qty > 0)) return;
  const c = (g.crafts ??= {});
  const slot = (c[cityId] ??= {});
  slot[good] = (slot[good] ?? 0) + qty;
  maybeTitle(g, cityId);
}

/** The good a city is famous for, once earned. The first title sticks for the game. */
export const craftTitle = (g, cityId) => g?.craftsTitle?.[cityId] ?? null;

function maybeTitle(g, cityId) {
  if ((g.craftsTitle ??= {})[cityId]) return; // a name, once earned, is not un-earned
  const slot = g.crafts?.[cityId] ?? {};
  const ranked = Object.entries(slot).sort((a, b) => b[1] - a[1]);
  const [best, second] = [ranked[0], ranked[1]];
  if (!best || best[1] < CRAFT_MIN_UNITS) return;
  if (second && best[1] < CRAFT_MIN_LEAD * second[1]) return;
  g.craftsTitle[cityId] = best[0];
  const name = g.world.nodes[cityId]?.name ?? g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
  post(g, "info", { city: cityId, txt: {
    es: `${name} se hace nombre: de sus muelles no para de salir ${GOOD_ES[best[0]] ?? best[0]}, y ya la llaman ciudad de ${GOOD_ES[best[0]] ?? best[0]}.`,
    en: `${name} is making a name for itself: ${GOOD_EN[best[0]] ?? best[0]} keeps leaving its docks, and folk already call it the ${GOOD_EN[best[0]] ?? best[0]} city.`,
  } });
}

/** One line for the Ayuntamiento tab, or null when the city has earned no name yet. */
export function craftLine(g, cityId) {
  if (g?.cityCrafts !== true) return null;
  const good = craftTitle(g, cityId);
  if (!good) return null;
  const name = g.world.nodes[cityId]?.name ?? g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
  return { good, txt: {
    es: `${name}, ciudad de ${GOOD_ES[good] ?? good}.`,
    en: `${name}, the ${GOOD_EN[good] ?? good} city.`,
  } };
}
