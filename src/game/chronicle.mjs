// The house chronicle: on New Year's Day the open year closes into a stored summary the player keeps.
// Weekly totals fold in straight from the settlement reports, so the chronicle and the reports always agree.
// Pure game logic: no DOM. `snap` is a snapshot of the house {cash, worth, ships, rank} taken by the caller.
import { START_YEAR } from "../sim/clock.mjs";
export const YEAR_DAYS = 365, CHRON_MAX = 12;
const r2 = (x) => Math.round(x * 100) / 100;
/** Calendar year of a game day (day 0 is 1 January of START_YEAR). */
export const yearOf = (day) => START_YEAR + Math.floor(day / YEAR_DAYS);
/** The open year book (lazy): a snapshot of how the year started plus the running totals. */
export function openYear(g, snap) {
  return (g.chronBook ??= { year: yearOf(g.day), cash0: snap.cash, worth0: snap.worth, ships0: snap.ships, rank0: snap.rank ?? null, upkeep: 0, tolls: 0, interest: 0, trade: 0, goods: {} });
}
/** Fold one weekly settlement report into the open year; call right after settleWeek. */
export function chronicleWeek(g, report, snap) {
  if (!report) return null;
  const b = openYear(g, snap);
  b.upkeep = r2(b.upkeep + (report.upkeep ?? 0));
  b.tolls = r2(b.tolls + (report.tolls ?? 0));
  b.interest = r2(b.interest + (report.interest ?? 0) + (report.loanInterest ?? 0));
  for (const t of report.trades ?? []) {
    b.trade = r2(b.trade + t.profit);
    b.goods[t.good] = r2((b.goods[t.good] ?? 0) + t.profit);
  }
  return b;
}
/** Close the book when the calendar year flips; call once per day after g.day++. Returns the closed entry or null. */
export function chronicleTick(g, snap) {
  const b = openYear(g, snap), y = yearOf(g.day);
  if (b.year === y) return null;
  const best = Object.entries(b.goods).sort((x, z) => z[1] - x[1])[0];
  const e = { year: b.year, cash0: r2(b.cash0), cash1: r2(snap.cash), worth0: r2(b.worth0), worth1: r2(snap.worth), ships0: b.ships0, ships1: snap.ships, rank0: b.rank0, rank1: snap.rank ?? null, upkeep: b.upkeep, tolls: b.tolls, interest: b.interest, trade: b.trade, bestGood: best && best[1] > 0 ? { good: best[0], profit: best[1] } : null };
  (g.chronicle ??= []).unshift(e);
  if (g.chronicle.length > CHRON_MAX) g.chronicle.pop();
  delete g.chronBook;
  openYear(g, snap);
  return e;
}
