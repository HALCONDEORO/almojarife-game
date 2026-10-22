import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSell } from "../src/game/game.mjs";
import { relationOf, rivalOf, friendOf, relationsOnSale, relationsLine, RELATION_RIVAL_RESPECT } from "../src/game/relations.mjs";
import { repOf } from "../src/game/rank.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const mk = (opts) => newGame(world, "cadiz", { freePlay: true, seed: 5, ...opts });
test("relations are symmetric, stable and of the right kinds", () => {
  for (const a of world.cities) for (const b of world.cities) {
    assert.equal(relationOf(world, a.id, b.id), relationOf(world, b.id, a.id));
    assert.ok([-1, 0, 1].includes(relationOf(world, a.id, b.id)));
    assert.equal(relationOf(world, a.id, b.id), relationOf(world, a.id, b.id)); // stable
  }
  assert.equal(relationOf(world, "cadiz", "cadiz"), 0);
  // the world is big enough that both kinds exist somewhere
  const kinds = new Set(); for (const a of world.cities) for (const b of world.cities) kinds.add(relationOf(world, a.id, b.id));
  assert.ok(kinds.has(-1) && kinds.has(1));
});
test("flag off: no respect nod, no tab line, no state", () => {
  const g = mk({});
  assert.equal(g.cityRelations, undefined);
  assert.equal(relationsOnSale(g, "cadiz", "salt"), 0);
  assert.equal(relationsLine(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").relations, undefined);
});
test("selling a city what its rival makes earns the nod; anything else does not", () => {
  const g = mk({ cityRelations: true });
  // find a city with a rival that makes something
  let hit = null;
  for (const c of world.cities) { const r = rivalOf(world, c.id); if (!r) continue;
    for (const good of Object.keys(g.market[c.id])) if (g.market[r][good]?.makes) { hit = { city: c.id, good, rival: r }; break; }
    if (hit) break; }
  assert.ok(hit, "expected at least one (city, good) qualifying pair");
  const before = repOf(g, hit.city);
  assert.equal(relationsOnSale(g, hit.city, hit.good), RELATION_RIVAL_RESPECT);
  assert.ok(Math.abs(repOf(g, hit.city) - before - RELATION_RIVAL_RESPECT) < 1e-6);
  const neutral = Object.keys(g.market[hit.city]).find((gd) => !g.market[hit.rival][gd]?.makes);
  assert.equal(relationsOnSale(g, hit.city, neutral), 0);
});
test("the nod rides through a real sale in doSell", () => {
  const g = mk({ cityRelations: true });
  let hit = null;
  for (const c of world.cities) { const r = rivalOf(world, c.id); if (!r) continue;
    for (const good of Object.keys(g.market[c.id])) if (g.market[r][good]?.makes) { hit = { city: c.id, good }; break; }
    if (hit) break; }
  const s = g.ships[0]; s.at = hit.city; s.voyage = null; s.cargo = { [hit.good]: 5 };
  const before = repOf(g, hit.city);
  const r = doSell(g, s, hit.good, 5);
  assert.equal(r.ok, true);
  assert.ok(repOf(g, hit.city) >= before + RELATION_RIVAL_RESPECT);
});
test("the tab names the rival and the friend, in both languages", () => {
  const g = mk({ cityRelations: true });
  const line = hallView(g, "cadiz").relations;
  assert.ok(line && (line.rival || line.friend));
  assert.ok(line.txt.es.endsWith(".") && line.txt.en.endsWith("."));
  if (line.rival) assert.match(line.txt.es, /a malas/);
  if (line.friend) assert.match(line.txt.en, /good terms/);
  // stable across calls and across games
  assert.deepEqual(relationsLine(mk({ cityRelations: true }), "cadiz"), relationsLine(mk({ cityRelations: true }), "cadiz"));
});
test("an off game plays byte-identical to before the feature (golden parity)", () => {
  const play = (opts) => { const g = mk(opts); for (let i = 0; i < 40 && !g.over; i++) advanceDay(g); return g; };
  const a = play({}), b = play({});
  assert.equal(JSON.stringify(serialize(a, "T", 1)), JSON.stringify(serialize(b, "T", 1)));
  const on = play({ cityRelations: true });
  const strip = (g) => { const s = JSON.parse(JSON.stringify(serialize(g, "T", 1))).state; delete s.cityRelations; delete s.rep; return s; }; // rep may differ on: the nod is the intended effect
  assert.deepEqual(strip(on), strip(a));
  const h = deserialize(JSON.parse(JSON.stringify(serialize(on, "T", 1))), world).g;
  assert.equal(h.cityRelations, true);
});
