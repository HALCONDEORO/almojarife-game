import test from "node:test";
import assert from "node:assert/strict";
import { newCampaign, campaignEvent, campaignTick, campaignSteps, missionView, campaignShapeOk } from "../src/game/campaigns.mjs";

const H = (over = {}) => {
  const posts = [];
  return { posts,
    post: (g, k, p) => posts.push([k, p?.txt?.en ?? ""]),
    addRespect: (g, c, n) => { (g.respectLog ??= []).push([c, n]); },
    repOf: over.repOf ?? (() => 0), netWorth: over.netWorth ?? (() => 0) };
};
const base = () => ({ day: 1, market: { cadiz: {}, sevilla: {}, malaga: {} }, ships: [], buildings: {}, warehouses: {}, profile: { home: "cadiz" }, cash: 0 });
const fresh = () => { const g = base(); g.campaign = newCampaign(); return g; };
/** m1 done by hand, so the branches (m2, s1, s2) may activate. */
const seeded = () => { const g = fresh(); g.campaign.missions["m1-oficio"] = { step: 5, count: 0, done: true, failed: false }; return g; };

test("partial quantities accumulate per step and the count resets when the step advances", () => {
  const g = fresh(), h = H();
  campaignEvent(g, { kind: "buy", good: "salt", qty: 20 }, h);
  campaignEvent(g, { kind: "buy", good: "salt", qty: 15 }, h);
  assert.deepEqual(campaignSteps(g), [false, false, false, false, false], "35 of 40 is not enough");
  campaignEvent(g, { kind: "buy", good: "salt", qty: 10 }, h);
  assert.deepEqual(g.campaign.missions["m1-oficio"], { step: 1, count: 0, done: false, failed: false }, "45 >= 40 advances and zeroes the count");
  campaignEvent(g, { kind: "sail" }, h);
  campaignEvent(g, { kind: "arrive", city: "sevilla" }, h);
  campaignEvent(g, { kind: "sell", good: "salt", qty: 39, city: "sevilla" }, h);
  assert.deepEqual(campaignSteps(g), [true, true, true, false, false], "the earlier 40 salt do not count toward the sale");
  campaignEvent(g, { kind: "sell", good: "salt", qty: 1, city: "sevilla" }, h);
  assert.deepEqual(campaignSteps(g), [true, true, true, true, false]);
});

test("steps are strict about kind, good and city; fractional quantities count as zero", () => {
  const g = fresh(), h = H();
  assert.equal(campaignEvent(g, { kind: "sell", good: "salt", qty: 40, city: "cadiz" }, h), false, "a sell never fills a buy step");
  campaignEvent(g, { kind: "buy", good: "wool", qty: 40 }, h);
  campaignEvent(g, { kind: "buy", good: "salt", qty: 39.5 }, h);
  assert.deepEqual(g.campaign.missions["m1-oficio"], { step: 0, count: 0, done: false, failed: false }, "wrong good and non-integer qty add nothing");
  campaignEvent(g, { kind: "buy", good: "salt", qty: 40 }, h);
  campaignEvent(g, { kind: "sail" }, h);
  campaignEvent(g, { kind: "arrive", city: "malaga" }, h);
  assert.deepEqual(campaignSteps(g), [true, true, false, false, false], "the wrong arrival city does not count");
});

test("the deadline bites after its day, never on it; a failed mission stops listening", () => {
  const g = fresh(), h = H();
  g.day = 60; campaignTick(g, h);
  assert.equal(g.campaign.missions["m1-oficio"].failed, false, "day 60 is still inside the deadline");
  g.day = 61; campaignTick(g, h);
  const st = g.campaign.missions["m1-oficio"];
  assert.equal(st.failed, true);
  assert.ok(h.posts.some(([, t]) => t.startsWith("Day 60 arrived with no sale")), "the failed text is posted");
  assert.equal(campaignEvent(g, { kind: "buy", good: "salt", qty: 40 }, h), false, "a failed mission ignores events");
  assert.equal(st.step, 0);
  assert.equal(missionView(g, "en", h)[0].daysLeft, null, "no countdown on a failed mission");
});

test("completing M1 pays its reward and activates the whole branch with their intros", () => {
  const g = fresh(), h = H();
  for (const e of [{ kind: "buy", good: "salt", qty: 40 }, { kind: "sail" }, { kind: "arrive", city: "sevilla" }, { kind: "sell", good: "salt", qty: 40, city: "sevilla" }, { kind: "readReport" }]) campaignEvent(g, e, h);
  assert.equal(g.campaign.missions["m1-oficio"].done, true);
  assert.equal(g.cash, 300, "the reward coins arrive once");
  assert.deepEqual(g.respectLog, [["sevilla", 5]]);
  assert.deepEqual([...g.campaign.active].sort(), ["m1-oficio", "m2-nombre", "s1-gremio", "s2-caja"], "branches are the missions requiring the same parent");
  assert.equal(h.posts.length, 4, "done text plus three intros");
});

test("missions are offered only when their requirements are done, never on day one", () => {
  const g = fresh(), h = H();
  campaignTick(g, h);
  assert.deepEqual(g.campaign.active, ["m1-oficio"]);
  assert.equal(h.posts.length, 0, "nothing is re-offered");
});

test("respectPorts counts distinct market ports at or above the bar and pays out on completion", () => {
  let rep = {};
  const g = seeded(), h = H({ repOf: (gg, c) => rep[c] ?? 0 });
  campaignTick(g, h); // activates the branch with no port over the bar
  assert.equal(g.campaign.missions["m2-nombre"].done, false);
  rep = { sevilla: 25, malaga: 20 };
  assert.equal(missionView(g, "en", h).find((x) => x.id === "m2-nombre").progress, "2/2", "malaga at exactly 20 counts");
  campaignTick(g, h);
  assert.equal(g.campaign.missions["m2-nombre"].done, true);
  assert.equal(g.cash, 400);
  assert.deepEqual(g.respectLog, [["cadiz", 3]], "a 'home' reward lands in the profile's home port");
});

test("respectPorts progress counts only the ports that reach the bar", () => {
  const g = seeded(), h = H({ repOf: (g, c) => ({ sevilla: 25 }[c] ?? 0) });
  campaignTick(g, h);
  const v = missionView(g, "en", h).find((x) => x.id === "m2-nombre");
  assert.equal(v.progress, "1/2");
  assert.equal(v.stepLabel, "Respect 20 in 2 different ports");
  assert.equal(g.campaign.missions["m2-nombre"].done, false, "one port is not two");
});

test("the home-port condition resolves 'home' through the profile", () => {
  const g = seeded(), h = H({ repOf: (g, c) => (c === "cadiz" ? 25 : 0) });
  campaignTick(g, h); campaignTick(g, h);
  assert.equal(g.campaign.missions["s1-gremio"].done, true, "respect 20 at cadiz, the home port");
  assert.equal(g.cash, 200, "s1 pays coins, not respect");
  assert.equal(g.respectLog, undefined);
});

test("the worth condition completes at exactly the bar", () => {
  const g = seeded(), h = H({ netWorth: () => 10000 });
  campaignTick(g, h); campaignTick(g, h);
  assert.equal(g.campaign.missions["s2-caja"].done, true, "exactly 10,000 is enough");
  assert.equal(g.cash, 0, "s2 pays respect, not coins");
  assert.deepEqual(g.respectLog, [["cadiz", 5]]);
});

test("the mission view fills placeholders, counts the days and falls back to Spanish", () => {
  const g = fresh(), h = H();
  const en = missionView(g, "en", h);
  assert.equal(en.length, 1);
  assert.equal(en[0].stepLabel, "Buy 40 salt");
  assert.equal(en[0].progress, "0/40");
  assert.equal(en[0].daysLeft, 59, "day 1 against a day-60 deadline");
  const fr = missionView(g, "fr", h);
  assert.equal(fr[0].title, "La prueba del oficio", "unknown languages fall back to Spanish");
  assert.equal(fr[0].stepLabel, "Compra 40 de sal");
});

test("done missions show no label and no countdown", () => {
  const g = fresh(), h = H();
  for (const e of [{ kind: "buy", good: "salt", qty: 40 }, { kind: "sail" }, { kind: "arrive", city: "sevilla" }, { kind: "sell", good: "salt", qty: 40, city: "sevilla" }, { kind: "readReport" }]) campaignEvent(g, e, h);
  const v = missionView(g, "en", h).find((x) => x.id === "m1-oficio");
  assert.equal(v.done, true);
  assert.equal(v.stepLabel, "");
  assert.equal(v.daysLeft, null);
});

test("odd states stay quiet: no campaign, unknown ids, bad shapes", () => {
  assert.deepEqual(missionView(base(), "en", H()), []);
  const g = fresh();
  assert.deepEqual(campaignSteps(g, "no-such-mission"), []);
  assert.equal(campaignShapeOk({ active: "m1" }), false);
  assert.equal(campaignShapeOk(g.campaign), true);
});
