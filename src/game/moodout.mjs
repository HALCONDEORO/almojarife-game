// Visible mood (living cities 2/8): the mood citylife already computes inside each city
// reaches the player as dockside talk and a line in the Ayuntamiento tab - words, never
// numbers. Own design, pure, no DOM. Off unless g.cityMoodOut === true (no state keys at
// all in an off game: saves stay identical). It needs the citylife flag ON to say anything:
// without mood state it stays silent. It moves no money, no prices; mood itself already
// treats humans and bots alike, this piece only narrates it.
import { post } from "./ledger.mjs";
import { moodWord } from "./citylife.mjs";

const WORDS = {
  contenta: { es: "contenta", en: "content" },
  tranquila: { es: "tranquila", en: "calm" },
  inquieta: { es: "inquieta", en: "uneasy" },
  furiosa: { es: "furiosa", en: "furious" },
};
const FLAVOR = {
  contenta: { es: "hay trabajo y el pan alcanza", en: "there is work and bread enough" },
  tranquila: { es: "los días pasan sin sobresaltos", en: "the days pass without alarm" },
  inquieta: { es: "se habla de precios y de estómagos vacíos", en: "the talk is of prices and empty stomachs" },
  furiosa: { es: "la rabia se masca en cada esquina", en: "anger is thick on every corner" },
};

/** One sentence on the city's temper, ES and EN, or null when there is no mood to read. */
export function moodOutLine(g, cityId) {
  if (g?.cityMoodOut !== true) return null;
  const w = moodWord(g, cityId);
  if (!w) return null; // citylife off: nothing to say
  const name = g.world.nodes[cityId]?.name ?? g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
  return { band: w, txt: {
    es: `En ${name} la gente está ${WORDS[w].es}: ${FLAVOR[w].es}.`,
    en: `The folk of ${name} are ${WORDS[w].en}: ${FLAVOR[w].en}.`,
  } };
}

/** Dockside talk on arrival: the city's temper the first time you see it, and afterwards
 *  only when it has changed since your last visit. One notice per change. Flag off: nothing. */
export function arrivalMood(g, at) {
  const line = moodOutLine(g, at);
  if (!line || g.over) return null;
  const seen = (g.moodSeen ??= {});
  if (seen[at] === line.band) return null;
  seen[at] = line.band;
  post(g, "info", { city: at, txt: line.txt });
  return line.band;
}
