// Message triage for the inbox view. Pure view logic: the simulation still posts every message.
// action: needs the player (stays on top, counts as unread). notice: informative (grouped, collapsed).
// log: lives in Reports, not in the inbox.
export const ACTION_KINDS = new Set(["warn", "debt", "loanDue", "loanLate", "loanSeized", "bankrupt", "routeStuck", "halt", "contractAccept", "contractFailed", "order", "rank"]);
export const LOG_KINDS = new Set(["arrival", "routeLeg", "pregon", "alert", "report"]);
const ACTION_TOPICS = new Set(["calamity", "justice"]);
// Arrivals and route sales live in Reports, pregones and price alerts in the Avisos y pregones card, the weekly report in Reports
// (it only shows up here when it carries debt). Calamities and court rulings need the player.
export const msgClass = (m) => ACTION_KINDS.has(m.kind) || (m.kind === "info" && ACTION_TOPICS.has(m.topic)) || (m.kind === "report" && m.debt > 0) ? "action" : LOG_KINDS.has(m.kind) ? "log" : "notice";
/** Unread messages that need the player; this is the number the header shows. */
export const actionUnread = (g) => (g.inbox ?? []).filter((m) => !m.read && msgClass(m) === "action").length;
/** Notices grouped: identical lines become one with a count; route sales become one line per ship. */
export function groupNotices(list, text) {
  const out = [], byKey = new Map();
  for (const m of list) {
    const key = m.kind === "routeLeg" ? `leg:${m.ship}` : `${m.kind}|${text(m)}`;
    let e = byKey.get(key);
    if (!e) { e = { key, kind: m.kind, first: m, n: 0, day: m.day, oldest: m.day, profit: 0, unread: false, ids: [] }; byKey.set(key, e); out.push(e); }
    e.n++; e.oldest = Math.min(e.oldest, m.day); e.day = Math.max(e.day, m.day); e.profit += m.profit ?? 0; e.unread ||= !m.read; e.ids.push(m.id);
  }
  return out;
}
