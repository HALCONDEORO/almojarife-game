// Weekly settlement of running costs, reports and the message inbox. Pure game logic: no DOM.
// Ship upkeep is no longer taken every day. It builds up as "accrued" and is paid once a week (every SETTLE_EVERY days),
// so the player can plan prices against a known weekly cost. What cash cannot cover makes it negative (an overdraft) and costs interest every week; too deep means bankruptcy.
import { SHIP_TYPES } from "../sim/trade.mjs";
import { cannonUpkeep, splitCost } from "./crew.mjs";
import { loanInterest, processLoans } from "./bank.mjs";
export const SETTLE_EVERY = 7, MAX_REPORTS = 52, MAX_INBOX = 60;
// Cash may go negative (an overdraft). Each settlement charges OVERDRAFT_RATE of the deficit. Below -OVERDRAFT_LIMIT the house is bankrupt.
export const OVERDRAFT_RATE = 0.02, OVERDRAFT_LIMIT = 3000;
const r2 = (x) => Math.round(x * 100) / 100;
/** Interest the next settlement will charge on a negative balance. */
export const overdraftInterest = (g) => g.cash < 0 ? r2(-g.cash * OVERDRAFT_RATE) : 0;

/** Add one day of upkeep for a ship to the accrual book. */
export function accrueDay(g, ship) {
  const cost = SHIP_TYPES[ship.type].upkeepPerDay * (g.upkeepMul ?? 1);
  const a = (g.accrued ??= { ships: {}, debt: 0 });
  const gun = cannonUpkeep(ship);
  a.ships[ship.id] = (a.ships[ship.id] ?? 0) + cost + gun;
  if (gun) (a.cannons ??= {})[ship.id] = (a.cannons[ship.id] ?? 0) + gun;
}
export const accruedTotal = (g) => Object.values(g.accrued?.ships ?? {}).reduce((x, y) => x + y, 0);
/** What the next settlement will ask for (accrued upkeep, interest on an overdraft, and any debt from an old save). */
export const dueNow = (g) => {
  const debt = g.accrued?.debt ?? 0, cash = g.cash - debt; // old saves: the carried debt is folded into cash first
  const interest = cash < 0 ? r2(-cash * OVERDRAFT_RATE) : 0;
  return r2(accruedTotal(g) + debt + interest + loanInterest(g));
};

/** Put a message in the inbox (newest first). Kinds: report, arrival, event, order, info, warn, debt. */
export function post(g, kind, p = {}) {
  const box = (g.inbox ??= []);
  box.unshift({ id: (g.nextMsg = (g.nextMsg ?? 0) + 1), day: g.day, kind, read: false, ...p });
  if (box.length > MAX_INBOX) box.pop();
}
export const unread = (g) => (g.inbox ?? []).filter((m) => !m.read).length;
export function markRead(g, id) { const m = (g.inbox ?? []).find((x) => x.id === id); if (m) m.read = true; return !!m; }
export function markAllRead(g) { for (const m of g.inbox ?? []) m.read = true; }

/** The day before settlement: warn once if cash will not cover what is due (accrued so far, one more day, and any debt). Returns true if a warning was posted. */
export function warnLowCash(g) {
  if (!g.day || g.day % SETTLE_EVERY !== SETTLE_EVERY - 1) return false;
  const tomorrow = g.ships.reduce((x, s) => x + SHIP_TYPES[s.type].upkeepPerDay * (g.upkeepMul ?? 1), 0);
  const due = Math.round((dueNow(g) + tomorrow) * 100) / 100, cash = Math.round(Math.max(g.cash, 0) * 100) / 100;
  if (cash >= due) return false;
  post(g, "warn", { due, cash });
  return true;
}

/** If today is a settlement day, pay what can be paid, write the report and post a message. Returns the report or null. */
/** Trade log: average-cost basis per good, and this week's profit per good (last report keeps it). */
export function logBuy(g, good, qty, cost) {
  const b = ((g.basis ??= {})[good] ??= { qty: 0, cost: 0 });
  b.qty += qty; b.cost += cost;
}
export function logSell(g, good, qty, revenue) {
  const b = (g.basis ??= {})[good] ?? { qty: 0, cost: 0 };
  const used = Math.min(qty, b.qty), unit = b.qty > 0 ? b.cost / b.qty : 0, basis = unit * used;
  b.qty -= used; b.cost = Math.max(0, b.cost - basis);
  const w = ((g.weekTrade ??= {})[good] ??= { sold: 0, revenue: 0, profit: 0 });
  w.sold += qty; w.revenue += revenue; w.profit += revenue - basis;
}
function takeWeekTrades(g) {
  const out = Object.entries(g.weekTrade ?? {}).map(([good, w]) => ({ good, sold: w.sold, revenue: Math.round(w.revenue * 100) / 100, profit: Math.round(w.profit * 100) / 100 }));
  g.weekTrade = {};
  return out.sort((x, y) => y.profit - x.profit);
}
export function settleWeek(g) {
  if (!g.day || g.day % SETTLE_EVERY !== 0) return null;
  const a = (g.accrued ??= { ships: {}, debt: 0 });
  const lines = Object.entries(a.ships).map(([ship, cost]) => ({ ship: Number(ship), type: g.ships.find((s) => s.id === Number(ship))?.type ?? "?", cost: Math.round(cost * 100) / 100, ...splitCost(cost, a.cannons?.[ship] ?? 0) }));
  if (a.debt > 0) { g.cash -= a.debt; a.debt = 0; } // old saves: fold the carried debt into cash
  const week = accruedTotal(g), carried = g.cash < 0 ? r2(-g.cash) : 0, interest = overdraftInterest(g), lint = r2(loanInterest(g) + (g.weekLoanInterest ?? 0)), owed = r2(week + interest + lint);
  g.cash = r2(g.cash - owed);
  const principal = r2((processLoans(g, post) || 0) + (g.weekLoanPrincipal ?? 0)); g.weekLoanPrincipal = 0; g.weekLoanInterest = 0; // loans collected daily this week, plus any due today
  const debt = g.cash < 0 ? r2(-g.cash) : 0;
  const r = { week: g.day / SETTLE_EVERY, day: g.day, lines, upkeep: r2(week), interest, loanInterest: lint, loanPrincipal: principal, trades: takeWeekTrades(g), carried, paid: r2(owed + principal), debt, cashAfter: g.cash };
  a.ships = {}; a.cannons = {};
  (g.reports ??= []).unshift(r);
  if (g.reports.length > MAX_REPORTS) g.reports.pop();
  post(g, "report", { week: r.week, paid: r.paid, debt: r.debt });
  if (debt > 0) post(g, "debt", { owed: debt, rate: Math.round(OVERDRAFT_RATE * 100), limit: OVERDRAFT_LIMIT });
  return r;
}
