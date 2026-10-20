// Events at sea, driven by data (world.events in data/world.json). Own design.
// Pure game logic: no DOM. The page shows g.pending as a choice box and calls resolveEvent.
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { post } from "./ledger.mjs";
import { seeded } from "../view/cityscene.mjs";
export const EVENT_CHANCE = 0.07; // per day, per player ship at sea, while nothing is pending
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Plain-English problems with an events list (empty list = fine). */
export function validateEvents(list, textKeys = ["es", "en"]) {
  const errs = [], ids = new Set();
  if (!Array.isArray(list)) return ["events must be a list"];
  for (const e of list) {
    if (!e.id || ids.has(e.id)) errs.push(`event ${e.id ?? "?"}: missing or duplicate id`); ids.add(e.id);
    if (!(e.weight > 0)) errs.push(`event ${e.id}: weight must be positive`);
    for (const k of ["title", "text"]) for (const l of textKeys) if (!e[k]?.[l]) errs.push(`event ${e.id}: ${k} missing "${l}"`);
    if (!Array.isArray(e.choices) || e.choices.length < 1) { errs.push(`event ${e.id}: needs at least one choice`); continue; }
    for (const c of e.choices) {
      for (const l of textKeys) if (!c.label?.[l]) errs.push(`event ${e.id}/${c.id}: label missing "${l}"`);
      const sum = (c.outcomes ?? []).reduce((a, o) => a + o.p, 0);
      if (!c.outcomes?.length || Math.abs(sum - 1) > 1e-6) errs.push(`event ${e.id}/${c.id}: outcome chances must add up to 1 (got ${sum})`);
      for (const o of c.outcomes ?? []) {
        for (const l of textKeys) if (!o.text?.[l]) errs.push(`event ${e.id}/${c.id}: outcome text missing "${l}"`);
        for (const k of Object.keys(o.effects ?? {})) if (!["cash", "cargoLossPct", "days"].includes(k)) errs.push(`event ${e.id}/${c.id}: unknown effect "${k}"`);
      }
    }
  }
  return errs;
}
/** Maybe start an event for a player ship at sea. Sets g.pending and returns it, or null. */
export function rollEvent(g) {
  const list = g.world.events ?? [];
  if (!g.eventsOn || g.pending || g.encounterReport || !list.length || g.over) return null; // off unless the game was started with events
  for (const ship of g.ships) {
    if (!ship.voyage) continue;
    const r = seeded(`ev:${g.day}:${ship.id}:${g.seed ?? 0}`);
    if (r() >= EVENT_CHANCE) continue;
    const ok = list.filter((e) => !["pirates","storm"].includes(e.id) && (e.minDay ?? 0) <= g.day);
    const total = ok.reduce((a, e) => a + e.weight, 0);
    if (!total) return null;
    let x = r() * total, pick = ok[ok.length - 1];
    for (const e of ok) { x -= e.weight; if (x < 0) { pick = e; break; } }
    g.pending = { event: pick.id, ship: ship.id, day: g.day };
    return g.pending;
  }
  return null;
}
export const pendingEvent = (g) => g.pending && g.pending.event!=='sea-pirates' ? { ...g.world.events.find((e) => e.id === g.pending.event), ship: g.pending.ship } : null;
/** Apply a choice. Returns {ok, text:{es,en}, effects} and clears g.pending. */
export function resolveEvent(g, choiceId) {
  if (!g.pending) return { ok: false, reason: "no event" };
  const ev = g.world.events.find((e) => e.id === g.pending.event), choice = ev?.choices.find((c) => c.id === choiceId);
  if (!choice) return { ok: false, reason: "no such choice" };
  const ship = g.ships.find((s) => s.id === g.pending.ship);
  const r = seeded(`out:${g.pending.day}:${g.pending.ship}:${choiceId}:${g.seed ?? 0}`);
  let x = r(), out = choice.outcomes[choice.outcomes.length - 1];
  for (const o of choice.outcomes) { x -= o.p; if (x < 0) { out = o; break; } }
  const fx = out.effects ?? {}, done = {};
  if (fx.cash) { const before = g.cash; g.cash = Math.max(0, g.cash + fx.cash); done.cash = g.cash - before; }
  if (fx.cargoLossPct && ship) {
    let lost = 0;
    for (const [good, q] of Object.entries(ship.cargo)) {
      const l = Math.min(q, Math.ceil(q * fx.cargoLossPct / 100)); lost += l;
      ship.cargo[good] -= l;
      if (ship.basis?.[good] != null) ship.basis[good] = Math.round(ship.basis[good] * (ship.cargo[good] / q));
      if (!ship.cargo[good]) { delete ship.cargo[good]; if (ship.basis) delete ship.basis[good]; }
    }
    done.cargoLost = lost;
  }
  if (fx.days && ship?.voyage) {
    const v = ship.voyage, old = v.ticksLeft, nd = clamp(v.ticksLeft + fx.days * TICKS_PER_DAY, 1, 99 * TICKS_PER_DAY);
    done.days = (nd - old) / TICKS_PER_DAY; v.ticksLeft = nd; if (v.totalTicks != null) v.totalTicks = Math.max(v.totalTicks + nd - old, nd);
  }
  g.log.unshift({ day: g.day, key: "event", txt: out.text, ship: g.pending.ship }); if (g.log.length > 30) g.log.pop();
  post(g, "event", { txt: out.text, ship: g.pending.ship });
  g.pending = null;
  return { ok: true, text: out.text, effects: done };
}
