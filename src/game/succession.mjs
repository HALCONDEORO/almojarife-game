// Succession phase 1 of docs/design/hermandad.md: pure rules, zero effect. Nothing imports this module yet, so no game changes.
// The persona (the merchant who ages and dies) is separate from the company (cash, ships, buildings, rank), which persists.
export const MAX_GENERATIONS = 3, GENERATION_YEARS = 40;
export const INHERITANCE_CUT = 0.1;      // share of the estate lost on succession (taxes, disputes); the cut is destroyed, not given to anyone
export const REPUTATION_KEPT = 0.5;      // share of reputation and brotherhood standing that passes to the heir
export const TRAITS = ["prudent", "bold", "thrifty", "sociable", "seafarer"];
/** A persona: birth year, a generation number (1 = founder) and traits. No money here: money belongs to the company. */
export const newPersona = (birthYear, generation = 1, traits = []) => ({ birthYear, generation, traits: [...traits] });
export const ageAt = (persona, year) => year - persona.birthYear;
/** The founder retires at about 40 years of play; the exact year is fixed at creation so it is saved and reproducible. */
export const retireYear = (persona) => persona.birthYear + 20 + GENERATION_YEARS;
export const canSucceed = (persona) => persona.generation < MAX_GENERATIONS;
/** Heir traits come from the game seed RNG (rng.next() in [0,1)): one inherited from the parent when any, one new; never more than 2. */
export function makeHeir(parent, year, rng) {
  if (!canSucceed(parent)) return null;
  const inherited = parent.traits.length ? [parent.traits[Math.floor(rng.next() * parent.traits.length)]] : [];
  const pool = TRAITS.filter((t) => !inherited.includes(t));
  const fresh = pool[Math.floor(rng.next() * pool.length)];
  return newPersona(year - 20, parent.generation + 1, [...inherited, fresh]);
}
/** Money-neutral split in explicit integer cents (1 coin = 100 cents). lost = ceil(cut) but never more than the estate, so kept >= 0 and kept + lost === estate exactly. */
export function inherit(estateCents) {
  if (!Number.isSafeInteger(estateCents) || estateCents < 0) throw new RangeError("inherit: estate must be a non-negative integer number of cents");
  const lostCents = Math.min(estateCents, Math.ceil(estateCents * INHERITANCE_CUT));
  return { keptCents: estateCents - lostCents, lostCents };
}
/** Prestige (rank, brotherhood standing) is never negative; it passes with a cut and never rises. */
export function passPrestige(value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("passPrestige: prestige must be a finite number >= 0");
  return Math.floor(value * REPUTATION_KEPT);
}
/** Reputation is signed. Good name passes with the cut; a bad name passes in full (an heir does not start clean from a scandal). Never rises in magnitude of good, never improves bad. */
export function passReputation(value) {
  if (!Number.isFinite(value)) throw new RangeError("passReputation: reputation must be finite");
  return value >= 0 ? Math.floor(value * REPUTATION_KEPT) : Math.ceil(value);
}
