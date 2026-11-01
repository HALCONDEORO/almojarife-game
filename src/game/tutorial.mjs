// Progressive tutorial: it teaches one thing at a time and reveals the next only when the
// previous one is done - first a purchase, then a profitable sale, then sailing, then a shipyard inspection (legacy saves keep their standing route),
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
// v3 adds the contract step. v4 replaces the route with a shipyard visit or a paid repair.
// Existing v1-v3 progress is not migrated or reset.

/** Start v4: shipyard inspection replaces the standing route. Legacy tutorials keep their own rules. */
export const initTutorial = (g) => { g.tut = { v: 4, reviewed: false, bought: false, sold: false, sailed: false, routed: false, hall: false, contract: false, skipped: false }; return g.tut; };

const live = (g) => { const t = g?.tut; return t !== null && typeof t === "object" && !Array.isArray(t) ? t : null; }; // a damaged save key (true, 5, "x", [], null) counts as tutorial off, never throws
const v2 = (t) => t.v === 2 || t.v === 3 || t.v === 4; // v2+ knows the route and council steps; older data follows the original three steps
const v3 = (t) => t.v === 3 || t.v === 4; // v3 closes with a council contract; older data keeps its own last step

/** Record one successful player action (sales pass the result with profit and spent): "buy", "sell", "sail", "route", "yard", "hall" or "contract". No-op when the tutorial is off, skipped or its data is damaged. */
let quiet = 0; // depth of automated trading (standing routes): it must not teach the tutorial for the player
/** Run automated trading without advancing the tutorial. */
export function quietly(fn) { quiet++; try { return fn(); } finally { quiet--; } }

export function tutorialNote(g, kind, trade = {}) {
  const t = live(g);
  if (!t || t.skipped === true || quiet > 0) return false;
  if (kind === "buy") t.bought = true;
  else if (kind === "sell" && t.bought === true && (!v2(t) || (Number.isFinite(trade.profit) && trade.profit > 0 && Number.isFinite(trade.spent) && trade.spent > 0))) t.sold = true; // v2 needs an actual gain on known paid cargo
  else if (kind === "sail" && (t.sold === true || (v2(t) && t.bought === true))) t.sailed = true; // keep a real voyage made while carrying the first purchase
  else if (kind === "route" && t.v !== 4 && v2(t) && t.sold === true && t.sailed === true) t.routed = true; // a standing route only counts once under sail
  else if (kind === "yard" && t.v === 4 && t.sold === true && t.sailed === true) t.reviewed = true;
  else if (kind === "hall" && v2(t) && (t.v === 4 ? t.reviewed === true : t.routed === true)) t.hall = true; // the council visit opens the last step
  else if (kind === "contract" && v3(t) && t.hall === true) t.contract = true; // taking a council contract closes the tutorial
  else return false;
  return true;
}

/** Inspect a sound ship only in its open port. Damaged hulls use a normal paid repair order. */
export function reviewTutorialHull(g, ship, city) {
  if (g.over || !ship || ship.voyage || !city || ship.at !== city || !((ship.hull ?? 100) >= 100)) return false;
  return tutorialNote(g, "yard");
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

/** Current step id: "buy", "sell", "sail", "route", "yard", "hall", "contract" or "done". null when the tutorial is off or damaged. */
export function tutorialStep(g) {
  const t = live(g);
  if (!t || t.skipped === true) return t ? "done" : null;
  if (t.bought !== true) return "buy";
  if (t.sold !== true) return "sell";
  if (t.sailed !== true) return "sail";
  if (!v2(t)) return "done"; // a complete v1 tutorial is complete, full stop
  if (t.v === 4 ? t.reviewed !== true : t.routed !== true) return t.v === 4 ? "yard" : "route";
  if (t.hall !== true) return "hall";
  if (!v3(t)) return "done"; // a v2 tutorial ends at the council visit, as it always did
  if (t.contract !== true) return "contract";
  return "done";
}

/** true while the tutorial is running (on, not done, not skipped): the mission arc stays hidden and frozen. */
export function tutorialActive(g) { const s = tutorialStep(g); return s !== null && s !== "done"; }

export const TUT_TEXT = {
  es: {
    buy: "compra un bien barato en el Mercado de la ciudad.",
    sell: "zarpa a un puerto donde escasee (clic derecho) y vende la carga con beneficio en el Mercado de la ciudad.",
    sail: "elige un puerto y zarpa (clic derecho).",
    yard: "visita el Astillero con tu barco: revisa el casco y, si está dañado, encarga su reparación al precio indicado.",
    route: "pon a tu barco una ruta automática (botón Barcos en la ciudad).",
    hall: "entra en el Ayuntamiento y conoce al concejo (pestaña Ayuntamiento).",
    contract: "acepta un encargo del concejo (pestaña Ayuntamiento).",
    done: "Tutorial completado. Tu casa comercial es tuya: gana monedas antes del plazo.",
  },
  en: {
    buy: "buy a cheap good at the city Market.",
    sell: "sail to a port where it is scarce (right-click) and sell the cargo at a profit at the city Market.",
    sail: "pick a port and sail (right-click).",
    yard: "visit the Shipyard with your docked ship: inspect the hull and, if damaged, order repairs at the quoted price.",
    route: "give your ship a standing route (Ships button in the city).",
    hall: "step into the Town hall and meet the council (Town hall tab).",
    contract: "accept a council contract (Town hall tab).",
    done: "Tutorial complete. Your trading house is yours: earn coins before the deadline.",
  },
};

/** Step number of each step id. */
const TUT_NUM = { buy: 1, sell: 2, sail: 3, route: 4, yard: 4, hall: 5, contract: 6 };
/** Step total for the save's tutorial version: v1 had 3 steps, v2 had 5, v3 and v4 have 6. */
const TUT_TOTAL = (t) => (v3(t) ? 6 : v2(t) ? 5 : 3);

/** Hint line for the UI, with the "Tutorial n/N: " prefix for the save's own version;
 *  unknown language falls back to Spanish. null when the tutorial is off. */
export function tutorialHint(g, lang = "es") {
  const s = tutorialStep(g);
  if (!s) return null;
  const body = (TUT_TEXT[lang] ?? TUT_TEXT.es)[s];
  if (s === "done") return body;
  return "Tutorial " + TUT_NUM[s] + "/" + TUT_TOTAL(live(g)) + ": " + body;
}

/** The line the UI shows while the tutorial runs; null when it is off, damaged, skipped or finished. */
export function tutorialLine(g, lang = "es") { return tutorialStep(g) === "done" ? null : tutorialHint(g, lang); }
