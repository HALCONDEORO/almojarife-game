// Town hall (ayuntamiento): the concejo that governs each port. Phase A1 of the design study
// docs/design/town-hall-mayor-taxes.md: names and presence only — no votes, no money moves.
// Deterministic per city: same port, same council, like the 3D layout ("3d:"+id in port3d.mjs).
// Same FNV-style hash as src/view/cityscene.mjs, duplicated so game logic stays view-free.
function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Period Castilian name pools (15th-16th c.): given names and house names.
const FIRST = ["Alonso", "Diego", "Fernando", "Rodrigo", "Juan", "Pedro", "Lope", "Íñigo", "García", "Fernán", "Gonzalo", "Sancho", "Álvaro", "Enrique", "Alfonso", "Ruy", "Gutierre", "Pero", "Martín", "Andrés", "Cristóbal", "Francisco", "Bartolomé", "Jerónimo"];
const LAST = ["de Aguilar", "de Guzmán", "de Sotomayor", "de Mendoza", "de la Cerda", "Ponce de León", "de Ribera", "de Villalobos", "de Cárdenas", "de Quesada", "de Torres", "de Montemayor", "de Zúñiga", "de Portocarrero", "de Bocanegra", "de Lepe", "de Espinosa", "de Salcedo", "de Villavicencio", "de Alarcón", "de Ocampo", "de Paredes", "de Niebla", "de Herrera"];
export const COUNCIL_SIZE = 4; // regidores besides the alcalde
/** The concejo of a port: one alcalde plus COUNCIL_SIZE regidores, all distinct. Pure. */
export function townCouncil(world, cityId) {
  const rnd = seeded("hall:" + cityId), used = new Set();
  const pick = () => { for (;;) { const n = FIRST[(rnd() * FIRST.length) | 0] + " " + LAST[(rnd() * LAST.length) | 0]; if (!used.has(n)) { used.add(n); return n; } } };
  const mayor = pick();
  const councillors = Array.from({ length: COUNCIL_SIZE }, pick);
  return { mayor, councillors };
}
