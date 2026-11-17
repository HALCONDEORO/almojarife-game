// Presentation grouping; classification is shared with inbox retention.
import { msgClass } from "../game/msgclass.mjs";
export { ACTION_KINDS, LOG_KINDS, msgClass } from "../game/msgclass.mjs";
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
