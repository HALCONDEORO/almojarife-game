// Read-only navigation preview. Match departure/redirect math without issuing orders.
import { planTrip } from '../game/freenav.mjs';
import { travelEstimate } from './nav.mjs';
import { playerTravelTicks } from '../game/traveltime.mjs';
import { heldNow } from '../game/justicewire.mjs';
import { legWindFactor } from '../sim/weather.mjs';
import { SHIP_TYPES } from '../sim/trade.mjs';
import { TICKS_PER_DAY } from '../sim/clock.mjs';
import { seeded } from './cityscene.mjs';

export function previewWind(g, ship, from, to, point) {
  if (ship.voyage) return ship.voyage.wind ?? 1;
  const a = g.world.cities.find(c => c.id === from);
  const b = point ?? g.world.cities.find(c => c.id === to);
  if (a && b) return legWindFactor(a, b, g.day, g.seed ?? 0);
  return 0.8 + 0.4 * seeded(`wind-v1:${g.seed ?? 0}:${g.tick}:${ship.id}:${from}>${to}`)();
}

/** Port is an explored port ID; point uses the same 48-screen-px port snapping as orders. */
export function routePreview(g, ship, { port = null, lat, lon } = {}) {
  const fail = reason => ({ ok: false, reason });
  if (!ship || !g?.ships?.includes(ship) || g.over || !SHIP_TYPES[ship.type]) return fail('unavailable');
  if (port && !g.world.cities.some(c => c.id === port)) return fail('unavailable');
  const convoy = ship.convoy && g.convoys?.[ship.convoy];
  if (convoy && ship.voyage) return fail('convoy');
  if (!ship.voyage && heldNow(g, ship)) return fail('held');
  if (g.freeNav !== true && !port) return fail('port only');
  if (g.freeNav !== true && ship.voyage) return fail('at sea');
  let plan;
  if (g.freeNav === true) {
    const dest = port ? g.world.nodes[port] : { lat, lon };
    plan = planTrip(g.world, ship, dest.lat, dest.lon);
    if (!plan.ok) return plan;
  } else {
    plan = travelEstimate(g.world, ship, port, previewWind(g, ship, ship.at, port));
    if (!plan.ok) return plan;
    plan = { ...plan, to: port, toPort: true, pts: {} };
  }
  let ticks;
  if (!ship.voyage && plan.toPort) {
    const members = convoy ? convoy.ships.map(id => g.ships.find(s => s.id === id)) : [ship];
    if (members.some(s => !s || s.voyage || s.at !== ship.at || heldNow(g, s))) return fail('convoy');
    const estimates = members.map(s => travelEstimate(g.world, s, plan.to, previewWind(g, s, s.at, plan.to)));
    if (estimates.some(e => !e.ok)) return fail('crew');
    ticks = Math.max(...estimates.map(e => e.ticks));
  } else {
    if (convoy) return fail('convoy');
    // doGoTo's open-sea/redirect path intentionally has no extra hull factor.
    const wind = previewWind(g, ship, ship.at, plan.to, { lat, lon });
    ticks = playerTravelTicks(plan.km, SHIP_TYPES[ship.type].kmPerDay, ship, wind);
    if (ticks === null) return fail('crew');
  }
  return { ok: true, path: plan.path, pts: plan.pts ?? {}, to: plan.to, toPort: plan.toPort,
    ticks, days: Math.ceil(ticks / TICKS_PER_DAY), km: Math.round(plan.km) };
}

export function previewText(preview, { lang = 'es', destination = '' } = {}) {
  if (!preview.ok) {
    if (preview.reason === 'no sea there' || preview.reason === 'no route') return lang === 'es' ? 'Sin ruta navegable cerca.' : 'No navigable route nearby.';
    if (preview.reason === 'port only') return lang === 'es' ? 'Elige un puerto para ver la ruta.' : 'Choose a port to preview its route.';
    return lang === 'es' ? 'Ese barco no puede cambiar de rumbo ahora.' : 'That ship cannot change course now.';
  }
  return `${destination || (lang === 'es' ? 'Mar abierto' : 'Open sea')} · ${preview.days} ${lang === 'es' ? 'días' : 'days'} · ${preview.km} km`;
}
