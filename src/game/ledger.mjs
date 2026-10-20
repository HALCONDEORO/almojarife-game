// Weekly settlement of running costs, reports and the message inbox. Pure game logic: no DOM.
// Ship upkeep is no longer taken every day. It builds up as "accrued" and is paid once a week (every SETTLE_EVERY days),
// so the player can plan prices against a known weekly cost. Unpaid money carries over as debt (no interest).
import { SHIP_TYPES } from "../sim/trade.mjs";
export const SETTLE_EVERY = 7, MAX_REPORTS = 52, MAX_INBOX = 60;

/** Add one day of upkeep for a ship to the accrual book. */
export function accrueDay(g, ship) {
  const cost = SHIP_TYPES[ship.type].upkeepPerDay * (g.upkeepMul ?? 1);
  const a = (g.accrued ??= { ships: {}, debt: 0 });
  a.ships[ship.id] = (a.ships[ship.id] ?? 0) + cost;
}
export const accruedTotal = (g) => Object.values(g.accrued?.ships ?? {}).reduce((x, y) => x + y, 0);
/** What the next settlement will ask for (accrued upkeep plus debt carried over). */
export const dueNow = (g) => accruedTotal(g) + (g.accrued?.debt ?? 0);

/** Put a message in the inbox (newest first). Kinds: report, arrival, event, order, info. */
export function post(g, kind, p = {}) {
  const box = (g.inbox ??= []);
  box.unshift({ id: (g.nextMsg = (g.nextMsg ?? 0) + 1), day: g.day, kind, read: false, ...p });
  if (box.length > MAX_INBOX) box.pop();
}
export const unread = (g) => (g.inbox ?? []).filter((m) => !m.read).length;
export function markRead(g, id) { const m = (g.inbox ?? []).find((x) => x.id === id); if (m) m.read = true; return !!m; }
export function markAllRead(g) { for (const m of g.inbox ?? []) m.read = true; }

/** If today is a settlement day, pay what can be paid, write the report and post a message. Returns the report or null. */
export function settleWeek(g) {
  if (!g.day || g.day % SETTLE_EVERY !== 0) return null;
  const a = (g.accrued ??= { ships: {}, debt: 0 });
  const lines = Object.entries(a.ships).map(([ship, cost]) => ({ ship: Number(ship), type: g.ships.find((s) => s.id === Number(ship))?.type ?? "?", cost: Math.round(cost * 100) / 100 }));
  const week = accruedTotal(g), owed = week + a.debt, paid = Math.min(Math.max(g.cash, 0), owed);
  g.cash -= paid;
  const debt = Math.round((owed - paid) * 100) / 100;
  const r = { week: g.day / SETTLE_EVERY, day: g.day, lines, upkeep: Math.round(week * 100) / 100, carried: Math.round(a.debt * 100) / 100, paid: Math.round(paid * 100) / 100, debt, cashAfter: Math.round(g.cash * 100) / 100 };
  a.ships = {}; a.debt = debt;
  (g.reports ??= []).unshift(r);
  if (g.reports.length > MAX_REPORTS) g.reports.pop();
  post(g, "report", { week: r.week, paid: r.paid, debt: r.debt });
  return r;
}
