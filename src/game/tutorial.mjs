// Progressive tutorial: it teaches one thing at a time and reveals the next only when the
// previous one is done - first a purchase, then a profitable sale, then sailing, then a standing route,
// then a visit to the town council, then taking a council contract. Opt-in per game (newGame opts.tutorial === true); a game
// without it keeps no key, so saves stay identical. Progress is plain data on g.tut (it rides
// the save as-is). It can be skipped at any moment (skipTutorial); a skipped tutorial counts
// as finished: the mission arc stays hidden and frozen until the tutorial is done or skipped
// (owner decision, 25 Oct 2026). No DOM here.
//
// Save compatibility: an old save carries v1 progress ({bought,sold,sailed}, no v field).
// A v1 tutorial that was already complete stays complete (three steps was the whole tutorial
// then); a half-done v1 tutorial keeps its original three-step rules.
// v2 remembers a voyage after buying, even before the profitable sale at its destination.
// v3 adds the contract step; v1 and v2 games keep their own last step, exactly as before.

/** Start the tutorial on a game. v3 marks the six-step progressive format (a council contract closes it). */
export const initTutorial = (g) => { g.tut = { v: 3, bought: false, sold: false, sailed: false, routed: false, hall: false, contract: false, skipped: false }; return g.tut; };

const live = (g) => { const t = g?.tut; return t !== null && typeof t === "object" && !Array.isArray(t) ? t : null; }; // a damaged save key (true, 5, "x", [], null) counts as tutorial off, never throws
const v2 = (t) => t.v === 2 || t.v === 3; // v2+ knows the route and council steps; older data follows the original three steps
const v3 = (t) => t.v === 3; // v3 closes with a council contract; older data keeps its own last step

/** Record one successful player action (sales pass the result with profit and spent): "buy", "sell", "sail", "route" or "hall". No-op when the tutorial is off, skipped or its data is damaged. */
let quiet = 0; // depth of automated trading (standing routes): it must not teach the tutorial for the player
/** Run automated trading without advancing the tutorial. */
export function quietly(fn) { quiet++; try { return fn(); } finally { quiet--; } }

export function tutorialNote(g, kind, trade = {}) {
  const t = live(g);
  if (!t || t.skipped === true || quiet > 0) return false;
  if (kind === "buy") t.bought = true;
  else if (kind === "sell" && t.bought === true && (!v2(t) || (Number.isFinite(trade.profit) && trade.profit > 0 && Number.isFinite(trade.spent) && trade.spent > 0))) t.sold = true; // v2 needs an actual gain on known paid cargo
  else if (kind === "sail" && (t.sold === true || (v2(t) && t.bought === true))) t.sailed = true; // keep a real voyage made while carrying the first purchase
  else if (kind === "route" && v2(t) && t.sold === true && t.sailed === true) t.routed = true; // a standing route only counts once under sail
  else if (kind === "hall" && v2(t) && t.routed === true) t.hall = true; // the council visit opens the last step
  else if (kind === "contract" && v3(t) && t.hall === true) t.contract = true; // taking a council contract closes the tutorial
  else return false;
  return true;
}

/** Skip the rest of the tutorial (the player's choice, one click, always available while it runs).
 *  Returns true when an active tutorial was skipped; false when there was nothing to skip. */
export function skipTutorial(g) {
  const t = live(g);
  if (!t || t.skipped === true || tutorialStep(g) === "done") return false;
  t.skipped = true;
  return true;
}

/** Restart a finished or skipped tutorial from step one (the player's choice in Settings > Help).
 *  While it runs again, the mission arc hides and freezes exactly as on a first run.
 *  Returns true when there was a tutorial to restart; false when it is running, off or damaged. */
export function restartTutorial(g) {
  const t = live(g);
  if (!t || tutorialActive(g)) return false;
  initTutorial(g);
  return true;
}

/** Current step id: "buy", "sell", "sail", "route", "hall" or "done". null when the tutorial is off or damaged. */
export function tutorialStep(g) {
  const t = live(g);
  if (!t || t.skipped === true) return t ? "done" : null;
  if (t.bought !== true) return "buy";
  if (t.sold !== true) return "sell";
  if (t.sailed !== true) return "sail";
  if (!v2(t)) return "done"; // a complete v1 tutorial is complete, full stop
  if (t.routed !== true) return "route";
  if (t.hall !== true) return "hall";
  if (!v3(t)) return "done"; // a v2 tutorial ends at the council visit, as it always did
  if (t.contract !== true) return "contract";
  return "done";
}

/** true while the tutorial is running (on, not done, not skipped): the mission arc stays hidden and frozen. */
export function tutorialActive(g) { const s = tutorialStep(g); return s !== null && s !== "done"; }

export const TUT_TEXT = {
  es: {
    buy: "Tutorial 1/6: compra un bien barato en el Mercado de la ciudad.",
    sell: "Tutorial 2/6: zarpa a un puerto donde escasee (clic derecho) y vende la carga con beneficio en el Mercado de la ciudad.",
    sail: "Tutorial 3/6: elige un puerto y zarpa (clic derecho).",
    route: "Tutorial 4/6: pon a tu barco una ruta automática (botón Barcos en la ciudad).",
    hall: "Tutorial 5/6: entra en el Ayuntamiento y conoce al concejo (pestaña Ayuntamiento).",
    contract: "Tutorial 6/6: acepta un encargo del concejo (pestaña Ayuntamiento) y entrégalo a tiempo.",
    done: "Tutorial completado. Tu casa comercial es tuya: gana monedas antes del plazo.",
  },
  en: {
    buy: "Tutorial 1/6: buy a cheap good at the city Market.",
    sell: "Tutorial 2/6: sail to a port where it is scarce (right-click) and sell the cargo at a profit at the city Market.",
    sail: "Tutorial 3/6: pick a port and sail (right-click).",
    route: "Tutorial 4/6: give your ship a standing route (Ships button in the city).",
    hall: "Tutorial 5/6: step into the Town hall and meet the council (Town hall tab).",
    contract: "Tutorial 6/6: accept a council contract (Town hall tab) and deliver it on time.",
    done: "Tutorial complete. Your trading house is yours: earn coins before the deadline.",
  },
};

/** Hint line for the UI; unknown language falls back to Spanish. null when the tutorial is off. */
export function tutorialHint(g, lang = "es") {
  const s = tutorialStep(g);
  return s ? (TUT_TEXT[lang] ?? TUT_TEXT.es)[s] : null;
}

/** The line the UI shows while the tutorial runs; null when it is off, damaged, skipped or finished. */
export function tutorialLine(g, lang = "es") { return tutorialStep(g) === "done" ? null : tutorialHint(g, lang); }
