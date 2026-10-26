// A refused course change keeps its reason on the ship (ship.navError) and the voyage card
// shows it until a new order goes through (human playtest H27: the 2.5 s hint vanished and
// the player never learned why the right-click did nothing).
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doGoTo } from "../src/game/game.mjs";
import { voyageCardHtml } from "../src/view/voyagecard.mjs";

const w = loadWorld();
const mk = () => { const g = newGame(w); g.freeNav = true; return g; };
const seaPoint = () => { const wp = Object.values(w.waypoints)[3]; return [wp.lat, wp.lon]; };

test("a refused order stores its reason; internal and already-there refusals do not", () => {
  const g = mk(), s = g.ships[0];
  assert.equal(doGoTo(g, s, 50, -30).reason, "no sea there"); // far from every lane
  assert.equal(s.navError, "no sea there", "the refusal is kept on the ship");
  s.navError = undefined;
  const r = doGoTo(g, s, w.nodes[s.at].lat, w.nodes[s.at].lon); // the port it is in
  assert.equal(r.reason, "already there");
  assert.equal(s.navError, undefined, "a no-op order is not an error");
  const g2 = newGame(w), s2 = g2.ships[0];
  assert.equal(doGoTo(g2, s2, ...seaPoint()).reason, "off"); // flag off
  assert.equal(s2.navError, undefined, "internal refusals stay silent");
});

test("convoy and crew refusals store their reason; a successful order clears it", () => {
  const g = mk(), s = g.ships[0];
  s.convoy = "almojarife"; g.convoys = { almojarife: [s.id] };
  assert.equal(doGoTo(g, s, ...seaPoint()).reason, "convoy");
  assert.equal(s.navError, "convoy");
  delete s.convoy; delete g.convoys;
  s.crew = 0;
  assert.equal(doGoTo(g, s, ...seaPoint()).reason, "crew");
  assert.equal(s.navError, "crew");
  const g3 = mk(), s3 = g3.ships[0];
  s3.navError = "crew";
  assert.equal(doGoTo(g3, s3, ...seaPoint()).ok, true);
  assert.equal(s3.navError, undefined, "a course change that goes through clears the reason");
});

test("the voyage card shows the stored reason, at port and under way, es and en", () => {
  const es = voyageCardHtml({ id: 1, at: "cadiz", navError: "crew" }, { lang: "es", cityName: () => "Cádiz" });
  assert.match(es, /No pudo cambiar de rumbo: le falta tripulación/);
  const en = voyageCardHtml({ id: 1, voyage: { from: "a", to: "b", totalTicks: 10, ticksLeft: 5 }, navError: "no sea there" }, { lang: "en" });
  assert.match(en, /Could not change course: there is no navigable sea there/);
  const anchored = voyageCardHtml({ id: 1, voyage: { from: "a", to: "f-1", anchored: true, totalTicks: 10, ticksLeft: 5 }, navError: "convoy" }, { lang: "es" });
  assert.match(anchored, /navega en convoy/);
  const unknown = voyageCardHtml({ id: 1, at: "cadiz", navError: "mystery" }, { lang: "es" });
  assert.match(unknown, /esa orden no es posible ahora/, "an unknown reason falls back to the generic line");
  const clean = voyageCardHtml({ id: 1, at: "cadiz" }, { lang: "es" });
  assert.doesNotMatch(clean, /cambiar de rumbo/);
});
