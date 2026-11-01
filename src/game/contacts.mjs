// Port contacts (informantes): a local you hire in a port sends you its market prices every
// CONTACT_EVERY days for CONTACT_REPORTS reports, then retires. Figures are inexact, and a share
// of reports come out plain wrong (the paid risk of false information) - the inbox never says which.
// Presence stays the best information: the daily exact intel refresh runs after this, so a port
// with your ship or warehouse always ends the day exact. Pure game logic: no DOM.
import { seeded } from "../view/cityscene.mjs";
import { post } from "./ledger.mjs";
export const CONTACT_PRICE = 150, CONTACT_MAX = 4, CONTACT_EVERY = 7, CONTACT_REPORTS = 4;
export const CONTACT_ERROR = 0.15, CONTACT_FALSE_ERROR = 0.45, CONTACT_FALSE_CHANCE = 0.1;
export const contactsOf = (g) => g.contacts ?? [];
/** Hire the local contact of the port where the hiring ship is docked. */
export function hireContact(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === city)) return { ok: false, reason: "unknown city" };
  if (!g.intel?.[city]) return { ok: false, reason: "unknown port" }; // you only know who to ask in a port you know
  if (!g.ships.some((s) => !s.voyage && s.at === city)) return { ok: false, reason: "no ship here" };
  if (contactsOf(g).some((c) => c.city === city)) return { ok: false, reason: "already hired" };
  if (contactsOf(g).length >= CONTACT_MAX) return { ok: false, reason: "too many contacts" };
  if (g.cash < CONTACT_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= CONTACT_PRICE;
  (g.contacts ??= []).push({ city, hiredDay: g.day, reports: 0, nextDay: g.day + CONTACT_EVERY });
  return { ok: true };
}
export function fireContact(g, city) {
  const i = contactsOf(g).findIndex((c) => c.city === city);
  if (i < 0) return { ok: false, reason: "no contact" };
  g.contacts.splice(i, 1);
  return { ok: true };
}
/** Day work: due reports land in the intel book as inexact snapshots; retired contacts say goodbye. */
export function tickContacts(g) {
  const name = (id) => g.world.cities.find((c) => c.id === id)?.name ?? id;
  for (const c of [...contactsOf(g)]) {
    if (g.day < c.nextDay) continue;
    const rnd = seeded(`contact:${g.seed ?? 0}:${c.city}:${g.day}`);
    const wrong = rnd() < CONTACT_FALSE_CHANCE, err = wrong ? CONTACT_FALSE_ERROR : CONTACT_ERROR;
    const cells = Object.fromEntries(Object.entries(g.market[c.city]).map(([k, e]) => [k, { ...structuredClone(e), stock: Math.max(0, Math.round(e.stock * (1 + (rnd() * 2 - 1) * err))) }]));
    (g.intel ??= {})[c.city] = { day: g.day, exact: false, cells };
    c.reports++; c.nextDay += CONTACT_EVERY;
    post(g, "info", { txt: { es: `Tu informante en ${name(c.city)} envía precios nuevos (imprecisos).`, en: `Your contact in ${name(c.city)} sends new (inexact) prices.` } });
    if (c.reports >= CONTACT_REPORTS) {
      g.contacts = contactsOf(g).filter((x) => x !== c);
      post(g, "info", { txt: { es: `Tu informante en ${name(c.city)} se retira: puedes contratar a otro en su taberna.`, en: `Your contact in ${name(c.city)} retires: you can hire another at his tavern.` } });
    }
  }
}
