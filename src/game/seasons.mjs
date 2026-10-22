// Visible seasons (living cities 4/8): the calendar already moves harvests and prices;
// this piece lets the player FEEL the year turn. When the season changes and your ship is
// in a port, dockside talk says so, in game language, and names the local goods whose
// season is at hand (what the market already does with SEASON_PEAK, said aloud, no numbers).
// Own design, pure, no DOM. Off unless g.citySeasons === true (no state keys at all in an
// off game: saves stay identical). It moves no money, no prices; the seasons themselves
// already work the same for humans and bots.
import { post } from "./ledger.mjs";
import { seasonOf, SEASON_PEAK } from "../sim/market.mjs";
import { GOOD_ES, GOOD_EN } from "./news.mjs";

const SEASON_ES = { winter: "el invierno", spring: "la primavera", summer: "el verano", autumn: "el otoño" };
const SEASON_EN = { winter: "winter", spring: "spring", summer: "summer", autumn: "autumn" };
const FLAVOR = {
  winter: { es: "las travesías se hacen duras y la lumbre vale oro", en: "crossings turn hard and firewood is worth gold" },
  spring: { es: "los campos se desperezan y el puerto se llena de planes", en: "the fields stir and the port fills with plans" },
  summer: { es: "el sol aprieta y el agua sabe a gloria", en: "the sun bears down and water tastes like glory" },
  autumn: { es: "cae la tarde temprano y huele a cosecha", en: "evening falls early and the air smells of harvest" },
};
const PEAK_WINDOW = 45; // days each side of a good's peak when its season is "at hand" (own tuning)

/** Goods the port makes whose peak season is at hand this day (at most two, for one breath of text). */
export function inSeason(world, cityId, day) {
  const c = world.cities.find((x) => x.id === cityId);
  if (!c) return [];
  const near = (peak) => { const d = Math.abs(day - peak) % 365; return Math.min(d, 365 - d) <= PEAK_WINDOW; };
  return (c.makes ?? []).filter((good) => SEASON_PEAK[good] !== undefined && near(SEASON_PEAK[good])).slice(0, 2);
}

/** One notice per season change and game, told at the first port your ship is docked in.
 *  At sea for months? You hear it when you next make port. Flag off: nothing at all. */
export function seasonsTick(g) {
  if (g?.citySeasons !== true || g.over) return null;
  const docked = (g.ships ?? []).find((s) => s.at && !s.voyage);
  if (!docked) return null;
  const season = seasonOf(g.day);
  const seen = (g.seasonSeen ??= {});
  if (seen.season === season) return null;
  seen.season = season;
  const name = g.world.nodes[docked.at]?.name ?? g.world.cities.find((c) => c.id === docked.at)?.name ?? docked.at;
  const goods = inSeason(g.world, docked.at, g.day);
  const es = goods.length ? ` Es tiempo ${`de ${goods.map((x) => GOOD_ES[x] ?? x).join(" y ")}`.replace(/^de el /, "del ")}.` : "";
  const en = goods.length ? ` It is ${goods.map((x) => GOOD_EN[x] ?? x).join(" and ")} season.` : "";
  post(g, "info", { city: docked.at, txt: {
    es: `Llega ${SEASON_ES[season]} a ${name}: ${FLAVOR[season].es}.${es}`,
    en: `${SEASON_EN[season][0].toUpperCase()}${SEASON_EN[season].slice(1)} comes to ${name}: ${FLAVOR[season].en}.${en}`,
  } });
  return { season, city: docked.at, goods };
}
