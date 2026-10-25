// First-voyage tutorial: teaches one buy, one sale, then sailing. Opt-in per game (newGame opts.tutorial === true);
// a game without it keeps no key, so saves stay identical. Progress is plain data on g.tut. No DOM here.

/** Start the tutorial on a game. */
export const initTutorial = (g) => { g.tut = { bought: false, sold: false, sailed: false }; return g.tut; };

const live = (g) => { const t = g?.tut; return t !== null && typeof t === "object" && !Array.isArray(t) ? t : null; }; // a damaged save key (true, 5, "x", [], null) counts as tutorial off, never throws

/** Record one successful player action: "buy", "sell" or "sail". No-op when the tutorial is off or its data is damaged. */
let quiet = 0; // depth of automated trading (standing routes): it must not teach the tutorial for the player
/** Run automated trading without advancing the tutorial. */
export function quietly(fn) { quiet++; try { return fn(); } finally { quiet--; } }

export function tutorialNote(g, kind) {
  const t = live(g);
  if (!t || quiet > 0) return false;
  if (kind === "buy") t.bought = true;
  else if (kind === "sell" && t.bought === true) t.sold = true; // a sale only counts after the first purchase
  else if (kind === "sail" && t.sold === true) t.sailed = true; // sailing only counts after the sale
  else return false;
  return true;
}

/** Current step id: "buy", "sell", "sail" or "done". null when the tutorial is off or damaged. */
export function tutorialStep(g) {
  const t = live(g);
  if (!t) return null;
  return t.bought !== true ? "buy" : t.sold !== true ? "sell" : t.sailed !== true ? "sail" : "done";
}

export const TUT_TEXT = {
  es: {
    buy: "Tutorial 1/3: compra un bien barato en el Mercado.",
    sell: "Tutorial 2/3: vende la carga donde escasee.",
    sail: "Tutorial 3/3: elige un puerto y zarpa (clic derecho).",
    done: "Tutorial completado. Tu casa comercial es tuya: gana monedas antes del plazo.",
  },
  en: {
    buy: "Tutorial 1/3: buy a cheap good at the Market.",
    sell: "Tutorial 2/3: sell the cargo where it is scarce.",
    sail: "Tutorial 3/3: pick a port and sail (right-click).",
    done: "Tutorial complete. Your trading house is yours: earn coins before the deadline.",
  },
};

/** Hint line for the UI; unknown language falls back to Spanish. null when the tutorial is off. */
export function tutorialHint(g, lang = "es") {
  const s = tutorialStep(g);
  return s ? (TUT_TEXT[lang] ?? TUT_TEXT.es)[s] : null;
}

/** The line the UI shows while the tutorial runs; null when it is off, damaged or finished. */
export function tutorialLine(g, lang = "es") { return tutorialStep(g) === "done" ? null : tutorialHint(g, lang); }
