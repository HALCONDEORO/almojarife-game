// Own-design allocation. Counts are gameplay choices, not historical merchant counts.
export const NPC_CAP = 48;
/** Plan NPCs, without mutating world or game state. historical is an optional verified population table. */
export function npcPlan(world, { historical = {}, cap = NPC_CAP } = {}) {
  if (!Number.isSafeInteger(cap) || cap < 0 || cap > NPC_CAP) throw new Error('NPC cap must be an integer from 0 to 48');
  const ids = new Set(world.cities.map((c) => c.id));
  if (ids.size !== world.cities.length) throw new Error('duplicate city ids');
  const rows = world.cities.map((c) => {
    const h = historical[c.id] ?? c.pop1500;
    // Malaga's single-source 1500 figure is pending cross-check, so do not use it for balance.
    const verified = c.id !== 'malaga' && Number.isFinite(h) && h > 0;
    const population = verified ? h : c.pop;
    if (!Number.isFinite(population) || population <= 0) throw new Error('invalid population: ' + c.id);
    // Distance to the first sea waypoint is a local-access proxy, not historical port capacity.
    const edges = world.adj?.[c.id] ?? [];
    const accessKm = edges.length ? Math.min(...edges.map((e) => e.km)) : null;
    const access = accessKm === null ? 0 : 1 / (1 + accessKm / 50);
    const makes = new Set(c.makes).size, needs = new Set(c.needs).size;
    const demand = needs / Math.max(1, Object.keys(world.goods).length);
    const score = Math.sqrt(population / 5000) + 0.25 * makes + 0.25 * needs + access + demand;
    const desired = Math.min(6, Math.max(1, Math.ceil(score)));
    return { city: c.id, population, populationBasis: verified ? 'historical estimate' : 'design fallback, history unknown', accessKm, score, desired, count: 0 };
  }).sort((a,b) => a.city.localeCompare(b.city));
  // First cover ports equally. If there are more ports than slots, deterministic score order wins.
  const priority = [...rows].sort((a,b) => b.score - a.score || a.city.localeCompare(b.city));
  let left = cap;
  for (const r of priority) if (left > 0) { r.count++; left--; }
  while (left > 0) {
    const eligible = rows.filter((r) => r.count < r.desired).sort((a,b) => b.score/(b.count+1) - a.score/(a.count+1) || a.city.localeCompare(b.city));
    if (!eligible.length) break;
    eligible[0].count++; left--;
  }
  return { cap, total: cap-left, ports: rows };
}
