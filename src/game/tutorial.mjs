// Progressive tutorial: it teaches one thing at a time and reveals the next only when the
// previous one is done - first a purchase, then a sale, then sailing, then a standing route,
// then a visit to the town council. Opt-in per game (newGame opts.tutorial === true); a game
// without it keeps no key, so saves stay identical. Progress is plain data on g.tut (it rides
// the save as-is). It can be skipped at any moment (skipTutorial); a skipped tutorial counts
// as finished: the mission arc stays hidden and frozen until the tutorial is done or skipped
// (owner decision, 25 Oct 2026). No DOM here.
//
// Save compatibility: an old save carries v1 progress ({bought,sold,sailed}, no v field).
// A v1 tutorial that was already complete stays complete (three steps was the whole tutorial
// then); a half-done v1 tutorial keeps its progress and continues into the new steps.

/** Start the tutorial on a game. v2 marks the five-step progressive format. */
export const initTutorial = (g) => { g.tut = { v: 2, bought: false, sold: false, sailed: false, routed: false, hall: false, skipped: false }; return g.tut; };

const live = (g) => { const t = g?.tut; return t !== null && typeof t === "object" && !Array.isArray(t) ? t : null; }; // a damaged save key (true, 5, "x", [], null) counts as tutorial off, never throws
const v2 = (t) => t.v === 2; // v2 knows the route and council steps; older data follows the original three steps

/** Record one successful player action: "buy", "sell", "sail", "route" or "hall". No-op when the tutorial is off, skipped or its data is damaged. */
let quiet = 0; // depth of automated trading (standing routes): it must not teach the tutorial for the player
/** Run automated trading without advancing the tutorial. */
export function quietly(fn) { quiet++; try { return fn(); } finally { quiet--; } }

export function tutorialNote(g, kind) {
  const t = live(g);
  if (!t || t.skipped === true || quiet > 0) return false;
  if (kind === "buy") t.bought = true;
  else if (kind === "sell" && t.bought === true) t.sold = true; // a sale only counts after the first purchase
  else if (kind === "sail" && t.sold === true) t.sailed = true; // sailing only counts after the sale
  else if (kind === "route" && v2(t) && t.sailed === true) t.routed = true; // a standing route only counts once under sail
  else if (kind === "hall" && v2(t) && t.routed === true) t.hall = true; // the council visit closes the tutorial
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
  return "done";
}

/** true while the tutorial is running (on, not done, not skipped): the mission arc stays hidden and frozen. */
export function tutorialActive(g) { const s = tutorialStep(g); return s !== null && s !== "done"; }

export const TUT_TEXT = {
  es: {
    buy: "Tutorial 1/5: compra un bien barato en el Mercado.",
    sell: "Tutorial 2/5: vende la carga donde escasee.",
    sail: "Tutorial 3/5: elige un puerto y zarpa (clic derecho).",
    route: "Tutorial 4/5: pon a tu barco una ruta automática (pestaña Ruta).",
    hall: "Tutorial 5/5: entra en el Ayuntamiento y conoce al concejo (pestaña Ayuntamiento).",
    done: "Tutorial completado. Tu casa comercial es tuya: gana monedas antes del plazo.",
  },
  en: {
    buy: "Tutorial 1/5: buy a cheap good at the Market.",
    sell: "Tutorial 2/5: sell the cargo where it is scarce.",
    sail: "Tutorial 3/5: pick a port and sail (right-click).",
    route: "Tutorial 4/5: give your ship a standing route (Route tab).",
    hall: "Tutorial 5/5: step into the Town hall and meet the council (Town hall tab).",
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
