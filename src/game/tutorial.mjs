// First-voyage tutorial: teaches one buy, one sale, then sailing. Opt-in per game (newGame opts.tutorial === true);
// a game without it keeps no key, so saves stay identical. Progress is plain data on g.tut. No DOM here.
export const TUT_STEPS = ["buy", "sell", "sail", "done"];

/** Start the tutorial on a game. */
export const initTutorial = (g) => { g.tut = { bought: false, sold: false, sailed: false }; return g.tut; };

/** Record one successful player action: "buy", "sell" or "sail". No-op when the tutorial is off. */
export function tutorialNote(g, kind) {
  const t = g.tut;
  if (!t) return false;
  if (kind === "buy") t.bought = true;
  else if (kind === "sell" && t.bought) t.sold = true; // a sale only counts after the first purchase
  else if (kind === "sail" && t.sold) t.sailed = true; // sailing only counts after the sale
  else return false;
  return true;
}

/** Current step id: "buy", "sell", "sail" or "done". null when the tutorial is off. */
export function tutorialStep(g) {
  const t = g.tut;
  if (!t) return null;
  return !t.bought ? "buy" : !t.sold ? "sell" : !t.sailed ? "sail" : "done";
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
