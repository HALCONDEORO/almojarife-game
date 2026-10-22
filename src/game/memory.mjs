// City memory (living cities 5/8): a city remembers what you did when it was hungry.
// Grain brought into a starving port is a favor; grain carried out of one is a grievance.
// Memories fade slowly, and what is left nudges the city's respect for you (bounded) and
// feeds dockside talk. Bots' grain loads out of starving ports are remembered too (an
// ambient count; the same market scarcity bar judges everyone). Own design, pure, no DOM.
// Off unless g.cityMemory === true (no state keys at all in an off game: saves identical).
// The respect offset is the intended effect; recording itself moves no money and no prices.
// All thresholds below are own tuning knobs (inference, not historical figures).
export const MEMORY_GRAIN_SCARCE = 2; // target/stock ratio that makes a grain deed memorable (same bar as the pregón)
export const MEMORY_HALFLIFE = 180;   // days for a memory to halve its weight
export const MEMORY_REP_PER = 200;    // weighted grain units per respect point
export const MEMORY_REP_MAX = 5;      // the most memory can move respect, either way
export const MEMORY_GOSSIP_MIN = 50;  // weighted units below which the talk has faded
export const MEMORY_GOSSIP_DAYS = 20; // dockside does not repeat itself every day

/** Record a grain deed, whoever did it. kind: "favor" | "grievance" (yours) | "botGrievance" (ambient). Flag off: nothing stored. */
export function memoryDeed(g, cityId, kind, qty) {
  if (g?.cityMemory !== true || !(qty > 0)) return;
  const all = (g.memoryDeeds ??= {});
  const c = (all[cityId] ??= { favor: [], grievance: [], botGrievance: 0 });
  if (kind === "botGrievance") { c.botGrievance += qty; return; }
  c[kind].push({ day: g.day, qty });
  if (c[kind].length > 40) c[kind].shift(); // the oldest stories fall off the end
}
const weight = (day, now) => Math.pow(0.5, Math.max(0, now - day) / MEMORY_HALFLIFE);
const side = (g, list) => (list ?? []).reduce((a, d) => a + d.qty * weight(d.day, g.day), 0);
/** Weighted favor and grievance the city holds against/for you, right now. */
export function memoryOf(g, cityId) {
  const c = g?.cityMemory === true ? g.memoryDeeds?.[cityId] : null;
  return { favor: side(g, c?.favor), grievance: side(g, c?.grievance), bots: c?.botGrievance ?? 0 };
}
/** Bounded respect offset from memory, added inside repOf. Flag off: 0. */
export function memoryRep(g, cityId) {
  if (g?.cityMemory !== true) return 0;
  const m = memoryOf(g, cityId);
  return Math.max(-MEMORY_REP_MAX, Math.min(MEMORY_REP_MAX, Math.round((m.favor - m.grievance) / MEMORY_REP_PER)));
}
/** What dockside says about your past deeds, ES and EN, or null when the talk has faded
 *  or was told recently. Callers post it and stamp g.memoryGossip. */
export function memoryGossipLine(g, cityId) {
  if (g?.cityMemory !== true || g.over) return null;
  if (g.day - (g.memoryGossip?.[cityId] ?? -1e9) < MEMORY_GOSSIP_DAYS) return null;
  const m = memoryOf(g, cityId);
  if (Math.max(m.favor, m.grievance) < MEMORY_GOSSIP_MIN) return null;
  const name = g.world.nodes[cityId]?.name ?? g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
  const kind = m.favor >= m.grievance ? "favor" : "grievance";
  return { kind, txt: kind === "favor" ? {
    es: `En ${name} aún se habla del grano que trajiste cuando más falta hacía. Aquí no se olvida.`,
    en: `In ${name} they still talk of the grain you brought when it was sorely needed. Folk here do not forget.`,
  } : {
    es: `En ${name} no se ha olvidado el grano que te llevaste cuando el pan escaseaba.`,
    en: `${name} has not forgotten the grain you carried off when bread was short.`,
  } };
}
/** One line for the Ayuntamiento tab, or null when there is nothing to hold. */
export function memoryLine(g, cityId) {
  if (g?.cityMemory !== true) return null;
  const m = memoryOf(g, cityId);
  if (Math.max(m.favor, m.grievance) < MEMORY_GOSSIP_MIN) return null;
  const good = m.favor >= m.grievance;
  return { kind: good ? "favor" : "grievance", txt: good
    ? { es: "La ciudad te guarda buen recuerdo.", en: "The city remembers you kindly." }
    : { es: "La ciudad no te ha perdonado aquel grano.", en: "The city has not forgiven you that grain." } };
}
