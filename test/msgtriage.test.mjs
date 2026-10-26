import test from "node:test";
import assert from "node:assert/strict";
import { msgClass, actionUnread, groupNotices } from "../src/view/msgclass.mjs";
import { inboxHtml, messageText } from "../src/view/ledgerview.mjs";
import { inbox2dHtml } from "../src/view/ui2d.mjs";
const fmt = (x) => String(Math.round(x));
const mk = (kind, id, extra = {}) => ({ id, day: id, kind, read: false, ...extra });
const box = () => [
  mk("warn", 9, { due: 26, cash: 5 }), mk("routeStuck", 8, { ship: 1, city: "cadiz", good: "grain" }),
  ...[1, 2, 3, 4].map((i) => mk("routeLeg", 20 + i, { ship: 1, city: "sevilla", good: "grain", qty: 10, amt: 100, profit: 10 })),
  mk("arrival", 30, { ship: 1, city: "cadiz" }), mk("arrival", 31, { ship: 1, city: "cadiz" }),
  mk("info", 32, { txt: { es: "Festival en Cádiz.", en: "Festival in Cádiz." } }), mk("info", 33, { txt: { es: "Festival en Cádiz.", en: "Festival in Cádiz." } }), mk("council", 34, { txt: { es: "El concejo pide trigo.", en: "x" } }), mk("council", 35, { txt: { es: "El concejo pide trigo.", en: "x" } }),
  mk("report", 7, { week: 1, paid: 5 }), mk("news", 6, { txt: { es: "x", en: "x" } }),
];
test("kinds are triaged: actionable, notice, log", () => {
  for (const k of ["warn", "debt", "loanDue", "bankrupt", "routeStuck", "halt", "rank", "order"]) assert.equal(msgClass({ kind: k }), "action", k);
  for (const k of ["arrival", "routeLeg", "pregon", "alert", "report"]) assert.equal(msgClass({ kind: k }), "log", k);
  for (const k of ["event", "council", "shock", "news", "info", "respect", "unknownFuture"]) assert.equal(msgClass({ kind: k }), "notice", k);
  assert.equal(msgClass({ kind: "info", topic: "calamity" }), "action"); assert.equal(msgClass({ kind: "info", topic: "justice" }), "action");
  assert.equal(msgClass({ kind: "report", debt: 12 }), "action");
});
test("the header count only counts unread actionable messages", () => {
  const g = { inbox: box() }; assert.equal(actionUnread(g), 2);
  g.inbox[0].read = true; assert.equal(actionUnread(g), 1);
});
test("identical notices collapse with a count; route sales sum per ship", () => {
  const g = groupNotices(box().filter((m) => msgClass(m) === "notice"), (m) => messageText(m, "es", fmt));
  assert.equal(g.length, 3); // festival x2, council x2, news x1
  assert.deepEqual(g.map((e) => e.n).sort(), [1, 2, 2]);
  const legs = groupNotices(box().filter((m) => m.kind === "routeLeg"), () => "");
  assert.equal(legs.length, 1); assert.equal(legs[0].n, 4); assert.equal(legs[0].profit, 40);
});
test("inbox html: Para ti first, notices collapsed with ×N, no weekly report lines, ES and EN", () => {
  const es = inboxHtml({ inbox: box(), day: 40 }, "es", fmt, (x) => x, (x) => x);
  assert.match(es, /Para ti/); assert.match(es, /<details class="msg-notices">/); assert.match(es, /Festival en Cádiz\. <b>×2<\/b>/);
  assert.doesNotMatch(es, /ventas? de ruta/); assert.doesNotMatch(es, /llegó a/); assert.doesNotMatch(es, /Informe semanal/);
  assert.ok(es.indexOf("Para ti") < es.indexOf("<details"));
  assert.match(inboxHtml({ inbox: box() }, "en", fmt, (x) => x, (x) => x), /For you/);
  assert.match(inboxHtml({ inbox: [mk("report", 1, { week: 1, paid: 1 })] }, "es", fmt, (x) => x, (x) => x), /No hay mensajes/);
});
test("styled inbox uses the same triage", () => {
  const h = inbox2dHtml({ inbox: box() }, "es", fmt, (x) => x, (x) => x);
  assert.match(h, /2 sin leer/); assert.match(h, /×2/); assert.doesNotMatch(h, /Informe semanal/);
});
