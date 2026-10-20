// Ranks, power and respect. Pure game logic: no DOM.
// Rank comes from net worth (the richer your house, the higher your standing). Respect is kept per city and grows when you trade there.
// Own design: the ladder, names, numbers and perks are original. Perks are small and clear: a higher loan cap and, with respect, cheaper loans.
export const LOAN_MAX_BASE = 5000; // same as LOAN_MAX in bank.mjs (kept here to avoid a circular import; a test checks they match)
export const RANKS = [
  { id: "peddler", from: 0 }, { id: "trader", from: 3000 }, { id: "merchant", from: 8000 }, { id: "shipowner", from: 20000 },
  { id: "magnate", from: 50000 }, { id: "alderman", from: 120000 }, { id: "patrician", from: 300000 },
];
// Respect levels in a city, by points. One point per 100 coins of goods you sell there.
export const RESPECT = [{ id: "stranger", from: 0 }, { id: "known", from: 20 }, { id: "trusted", from: 100 }, { id: "honoured", from: 400 }];
export const REP_PER_COINS = 100;
export const rankIndex = (worth) => { let i = 0; RANKS.forEach((r, k) => { if (worth >= r.from) i = k; }); return i; };
export const rankOf = (worth) => RANKS[rankIndex(worth)];
/** The next rank and how many coins are missing, or null at the top. */
export const nextRank = (worth, held = 0) => { const i = Math.max(rankIndex(worth), held) + 1; return i < RANKS.length ? { rank: RANKS[i], missing: Math.ceil(RANKS[i].from - worth) } : null; };
/** Loan cap: +50% of the base cap for every rank above the first. */
export const loanCapFor = (g, base) => Math.round(base * (1 + 0.5 * heldRank(g)));
// Respect is stored as whole coins sold (no floating point); points are coins / REP_PER_COINS.
// Saves from before this change stored points (coins / 100). repV 2 marks coins; older data is converted once, and bad values (NaN, negative) are dropped.
export function ensureRep(g) {
  if (g.repV === 2 && g.rep) return g.rep;
  const old = g.rep ?? {}, fix = g.repV === 2 ? 1 : REP_PER_COINS, out = {};
  for (const [c, v] of Object.entries(old)) { const n = Number(v); if (Number.isFinite(n) && n > 0) out[c] = Math.round(n * fix); }
  g.rep = out; g.repV = 2;
  return out;
}
/** Rank index kept in range; a damaged value counts as 0. */
export const heldRank = (g) => { const i = Number(g.rankIdx); return Number.isInteger(i) && i >= 0 && i < RANKS.length ? i : 0; };
export const repOf = (g, city) => (ensureRep(g)[city] ?? 0) / REP_PER_COINS;
export const respectIndex = (pts) => { let i = 0; RESPECT.forEach((r, k) => { if (pts >= r.from) i = k; }); return i; };
export const respectOf = (g, city) => RESPECT[respectIndex(repOf(g, city))];
/** Sale of `revenue` coins in `city`: adds respect points. Returns true if the respect level rose. */
export function addRespect(g, city, revenue) {
  const before = respectIndex(repOf(g, city));
  ensureRep(g)[city] = (g.rep[city] ?? 0) + Math.max(0, Math.round(revenue));
  return respectIndex(repOf(g, city)) > before;
}
/** Update the rank from net worth. It only goes up (a bad week does not take a title away). Returns the new rank if it rose. */
export function updateRank(g, worth, post = () => {}) {
  const i = rankIndex(worth), had = g.rankIdx ?? 0;
  if (i > had) { g.rankIdx = i; post(g, "rank", { rank: RANKS[i].id, loanCap: loanCapFor(g, LOAN_MAX_BASE) }); return RANKS[i]; }
  g.rankIdx ??= had;
  return null;
}
