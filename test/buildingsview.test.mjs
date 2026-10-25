// Buildings tab view rows: states, progress, per-type effect lines, offers and quotes. Pure module tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buyPlot, startConstruction, buildingAt, BUILDING_TYPES, PRODUCERS, CIVIC_BUILDINGS } from "../src/game/buildings.mjs";
import { buildingsRows, plotOffers, plotViewState, buildOffers, upgradeOffer, cityEffects, parseBldAct, buildingLabel, whyText } from "../src/view/buildingsview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 };
const funded = () => newGame(world, "cadiz", { cash: 30000 });

test("empty city: no rows, no bonuses", () => {
  const g = funded();
  assert.deepEqual(buildingsRows(g, "cadiz"), []);
  assert.deepEqual(cityEffects(g, "cadiz"), { pop: world.nodes.cadiz.pop ?? 8000, popBonus: 0, capBonus: 0, jobs: 0, free: Math.max(0, (world.nodes.cadiz.pop ?? 8000) - Math.round((world.nodes.cadiz.pop ?? 8000) * 0.9)), staffing: 1 });
});

test("a bare plot row has state plot, no upkeep; a construction row carries progress and ready day", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  let [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "plot"); assert.equal(row.type, null); assert.equal(row.upkeep, 0);
  const s = startConstruction(g, "cadiz", PLOT.id, "workshop");
  assert.ok(s.ok);
  [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "construction"); assert.equal(row.nextLevel, 1);
  assert.equal(row.readyDay, Math.ceil(s.readyTick / 240));
  assert.ok(row.progress >= 0 && row.progress < 1);
  advanceDay(g); advanceDay(g);
  [row] = buildingsRows(g, "cadiz");
  assert.ok(row.progress > 0.2, `progress after 2 of 5 days: ${row.progress}`);
});

test("active rows expose per-type effects: workshop rate and margin, house pop, warehouse cap", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT); startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 2; delete b.nextLevel; delete b.readyTick;
  const [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "active"); assert.equal(row.upkeep, BUILDING_TYPES.workshop.upkeep * 2);
  assert.equal(row.rate, 1); assert.equal(row.produced, 0);
  assert.ok(row.margin !== null && Number.isFinite(row.margin));
  buyPlot(g, "cadiz", { id: "cadiz:8", type: "house", w: 3, d: 4 }); startConstruction(g, "cadiz", "cadiz:8", "house");
  const h = buildingAt(g, "cadiz", "cadiz:8"); h.state = "active"; h.level = 3; delete h.nextLevel; delete h.readyTick;
  const rows = buildingsRows(g, "cadiz");
  assert.equal(rows.find((r) => r.plotId === "cadiz:8").popBonus, 150);
  assert.equal(cityEffects(g, "cadiz").popBonus, 150);
});

test("plot offers exclude owned plots and come cheapest first", () => {
  const g = funded();
  const layout = [{ id: "cadiz:1", type: "house", w: 5, d: 5 }, { id: "cadiz:2", type: "workshop", w: 2, d: 2 }, { id: "cadiz:3", type: "warehouse", w: 6, d: 6 }];
  buyPlot(g, "cadiz", layout[1]);
  const offers = plotOffers(world, g, "cadiz", layout);
  assert.deepEqual(offers.map((o) => o.id), ["cadiz:1", "cadiz:3"]); // owned cadiz:2 is out; cheaper first
  assert.ok(offers[0].price <= offers[1].price);
  assert.ok(offers.every((o) => Number.isSafeInteger(o.price) && o.price > 0));
});

test("build offers quote every type on an empty plot; producers quote only where the city makes the good; upgrade offer quotes the next full level", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  const offers = buildOffers(g, "cadiz", PLOT.id);
  assert.equal(offers.length, Object.keys(BUILDING_TYPES).filter((t) => (!PRODUCERS[t] || g.world.goods[PRODUCERS[t].output]) && (!CIVIC_BUILDINGS.includes(t) || g.citylife)).length); // one entry per offered type, refused ones carry their reason; a type whose optional good is not in the game (pottery) is not offered, nor a civic type with the city-life flag off
  for (const t of ["house", "workshop", "warehouse", "saltworks", "fishery"]) { // cadiz makes salt and fish
    const o = offers.find((x) => x.type === t);
    assert.ok(o.ok && o.days === BUILDING_TYPES[t].buildDays && o.cost > 0, t + " quotes");
  }
  for (const t of ["oil_mill", "vineyard", "farm", "pasture", "sawmill", "mine"]) {
    const o = offers.find((x) => x.type === t);
    assert.equal(o.ok, false); assert.equal(o.reason, "good not producible in this city");
  }
  assert.equal(upgradeOffer(g, "cadiz", PLOT.id), null); // nothing built yet
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 1; delete b.nextLevel; delete b.readyTick;
  const up = upgradeOffer(g, "cadiz", PLOT.id);
  assert.ok(up.ok); assert.equal(up.level, 2);
  assert.equal(up.days, BUILDING_TYPES.workshop.buildDays * 2);
  b.level = 3;
  const maxed = upgradeOffer(g, "cadiz", PLOT.id);
  assert.equal(maxed.ok, false); assert.equal(maxed.reason, "max level");
});

test("parseBldAct: the armed-action wiring, including upgrade carrying its type", () => {
  assert.deepEqual(parseBldAct("buy|cadiz:7"), { kind: "buy", plotId: "cadiz:7" });
  assert.deepEqual(parseBldAct("build|cadiz:7|house"), { kind: "build", plotId: "cadiz:7", type: "house" });
  assert.deepEqual(parseBldAct("upgrade|cadiz:7|workshop"), { kind: "upgrade", plotId: "cadiz:7", type: "workshop" }); // the upgrade arm must carry the type: startConstruction needs it
  assert.equal(parseBldAct("upgrade|cadiz:7"), null); // without the type the confirm would no-op (review defect)
  assert.equal(parseBldAct("build|cadiz:7|castle"), null);
  assert.equal(parseBldAct(""), null);
  assert.equal(parseBldAct(null), null);
  // end to end: an armed upgrade parses and startConstruction accepts it
  const g = funded();
  buyPlot(g, "cadiz", PLOT); startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 1; delete b.nextLevel; delete b.readyTick;
  const a = parseBldAct(`upgrade|${PLOT.id}|workshop`);
  const r = startConstruction(g, "cadiz", a.plotId, a.type);
  assert.ok(r.ok); assert.equal(r.level, 2);
});

test("buildingLabel: short floating names for the 3D view", () => {
  const t = { bldTypes: { house: "Casa", workshop: "Taller", warehouse: "Almacén" }, bldState: { plot: "solar" } };
  assert.equal(buildingLabel(t, { type: null }), "solar");
  assert.equal(buildingLabel(t, { type: "house", state: "active", level: 1 }), "Casa");
  assert.equal(buildingLabel(t, { type: "house", state: "active", level: 2 }), "Casa 2");
  assert.equal(buildingLabel(t, { type: "workshop", state: "construction", nextLevel: 3 }), "Taller (3)");
  const en = { bldTypes: { warehouse: "Warehouse" }, bldState: { plot: "empty plot" } };
  assert.equal(buildingLabel(en, { type: null }), "empty plot");
  assert.equal(buildingLabel(en, { type: "warehouse", state: "active", level: 1 }), "Warehouse");
});

test("single-plot view state: an empty cache is loading (a 3D click must trigger the plots load), a populated cache finds the buy offer", () => {
  const g = funded();
  assert.deepEqual(plotViewState({}, world, g, "cadiz", "cadiz:7"), { kind: "loading" });
  assert.equal(plotViewState({ cadiz: "error" }, world, g, "cadiz", "cadiz:7").kind, "error");
  const st = plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:7");
  assert.equal(st.kind, "offer");
  assert.equal(st.offer.id, "cadiz:7");
  assert.equal(plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:99").kind, "none");
  const r = buyPlot(g, "cadiz", PLOT);
  assert.ok(r.ok);
  assert.equal(plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:7").kind, "owned");
});

test("whyText translates a known build-offer reason and falls back to the raw reason for unknown ones", () => {
  const t = { bldWhy: { "office required": "necesitas una oficina comercial en este puerto" } };
  assert.equal(whyText(t, "office required"), "necesitas una oficina comercial en este puerto");
  assert.equal(whyText(t, "plot not owned"), "plot not owned");
  assert.equal(whyText({}, "max level"), "max level");
});

test("both locales translate every build/upgrade offer reason the game can emit", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const locales = src.match(/bldWhy: \{[^}]*\}/g);
  assert.equal(locales.length, 2);
  const reasons = ["office required", "respect required", "good not producible in this city"];
  for (const l of locales) for (const r of reasons) assert.ok(l.includes(`"${r}"`), `missing ${r} in ${l.slice(0, 40)}`);
});

test("cityEffects reports the port's employment: jobs, free citizens and staffing", () => {
  const g = newGame(world);
  g.buildings = { cadiz: { "cadiz:1": { type: "workshop", level: 2, state: "active" }, "cadiz:2": { type: "house", level: 1, state: "active" } } };
  const eff = cityEffects(g, "cadiz");
  const pop = world.nodes.cadiz.pop ?? 8000;
  assert.equal(eff.jobs, 16, "two workshop levels want 16 workers");
  assert.equal(eff.free, Math.max(0, pop + 50 - Math.round(pop * 0.9)), "the house feeds the pool");
  assert.equal(eff.staffing, 1, "a real port staffs this easily");
  const g2 = newGame(world); // no houses: a hamlet cannot staff the workshop
  g2.buildings = { cadiz: { "cadiz:1": { type: "workshop", level: 2, state: "active" } } };
  const node = g2.world.nodes.cadiz, orig = node.pop;
  try { node.pop = 60; const short = cityEffects(g2, "cadiz"); assert.equal(short.free, 6, "60 vecinos menos 54 del pueblo"); assert.ok(short.staffing < 1 && short.staffing > 0, "a hamlet runs short-staffed"); }
  finally { node.pop = orig; }
});

test("active rows carry the workers they hire", () => {
  const g = newGame(world);
  g.buildings = { cadiz: { "cadiz:1": { type: "mine", level: 2, state: "active" }, "cadiz:2": { type: "house", level: 3, state: "active" } } };
  const rows = buildingsRows(g, "cadiz");
  assert.equal(rows.find((r) => r.plotId === "cadiz:1").jobs, 20, "mine level 2 hires 20");
  assert.equal(rows.find((r) => r.plotId === "cadiz:2").jobs, 0, "houses hire nobody");
});

test("the buildings tab carries the employment strings in both languages", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.equal((src.match(/bldJobsLine:/g) || []).length, 2, "ES and EN");
  assert.equal((src.match(/bldJobsShort:/g) || []).length, 2);
  assert.ok(src.includes("eff.staffing < 1"), "short-staffing warning rendered");
});

test("bldSummaryCard: an active producer shows rate, margin (red when negative), produced, upkeep and workers", async () => {
  const { bldSummaryCard, BW } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { workshop: "Taller" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)" };
  const g = newGame(world, "cadiz", { cash: 30000 });
  g.buildings = { cadiz: { "cadiz:7": { type: "workshop", level: 1, state: "active", produced: 12 } } };
  const r = buildingsRows(g, "cadiz")[0];
  const html = bldSummaryCard(t, r, "es", (n) => String(n));
  assert.ok(html.includes("bwcard"), "card wrapper");
  assert.ok(html.includes("Taller"), "building name");
  assert.ok(html.includes("activo"), "state line");
  assert.ok(html.includes('aria-label="' + BW.es.rate.replace("{r}", r.rate)), "rate cell with full label");
  assert.ok(html.includes(BW.es.margin.replace("{m}", String(r.margin))), "margin label");
  if (r.margin < 0) assert.ok(html.includes("bwc-bad"), "negative margin flagged red");
  assert.ok(html.includes(BW.es.upkeep.replace("{u}", String(r.upkeep))), "upkeep label");
  assert.ok(html.includes(BW.es.jobs.replace("{j}", r.jobs)), "jobs label");
  const { BWL } = await import("../src/view/buildingsview.mjs");
  assert.ok(html.includes('class="bwc-lab">' + BWL.es.margin + "<"), "visible margin caption");
  assert.ok(html.includes('class="bwc-lab">' + BWL.es.upkeep + "<"), "visible upkeep caption");
  assert.ok(html.includes('class="bwc-lab">' + BWL.es.jobs + "<"), "visible jobs caption");
  assert.ok(!html.includes("undefined") && !html.includes("NaN"), "no raw holes");
});

test("bldSummaryCard: a construction row shows works state with percent and no running stats", async () => {
  const { bldSummaryCard } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { warehouse: "Almacén" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)" };
  const g = newGame(world, "cadiz", { cash: 30000 });
  const started = startConstruction(buyPlot(g, "cadiz", PLOT).ok ? g : g, "cadiz", PLOT.id, "warehouse");
  assert.equal(started.ok, true);
  const r = buildingsRows(g, "cadiz").find((x) => x.plotId === PLOT.id);
  const html = bldSummaryCard(t, r, "es", (n) => String(n));
  assert.ok(html.includes("en obras"), "works state");
  assert.ok(/listo el día \d+ \(\d+%\)/.test(html), "ready day and percent");
  assert.ok(!/class="bwc-stat[ "]/.test(html), "no running stats while under construction");
});

test("bldSummaryCard: halted and house/warehouse/dock rows render their own stats, in English too", async () => {
  const { bldSummaryCard, BW } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { house: "Casa", warehouse: "Almacén", dock: "Muelle" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)" };
  const tEn = { bldTypes: { house: "House", warehouse: "Warehouse", dock: "Dock" }, bldState: { plot: "plot", construction: "under construction", active: "active", halted: "halted", fire: "fire" }, bldReady: "ready on day {d} ({p}%)" };
  const g = newGame(world, "cadiz", { cash: 30000 });
  g.buildings = { cadiz: {
    "cadiz:1": { type: "house", level: 2, state: "active" },
    "cadiz:2": { type: "warehouse", level: 1, state: "active", halted: "cash" },
    "cadiz:3": { type: "dock", level: 1, state: "active" },
  } };
  const rows = buildingsRows(g, "cadiz");
  const house = bldSummaryCard(t, rows.find((x) => x.type === "house"), "es", (n) => String(n));
  assert.ok(house.includes(BW.es.pop.replace("{n}", "100")), "house shows its inhabitants");
  const wh = bldSummaryCard(t, rows.find((x) => x.type === "warehouse"), "es", (n) => String(n));
  assert.ok(wh.includes("parado"), "halted state visible");
  assert.ok(!/class="bwc-stat[ "]/.test(wh), "a halted building shows no running stats");
  const dock = bldSummaryCard(tEn, rows.find((x) => x.type === "dock"), "en", (n) => String(n));
  assert.ok(dock.includes("Dock"), "English name");
  assert.ok(dock.includes(BW.en.toll.replace("{n}", rows.find((x) => x.type === "dock").tollCut)), "dock toll cut, English label");
  const { BWL: BWLE } = await import("../src/view/buildingsview.mjs");
  assert.ok(dock.includes('class="bwc-lab">' + BWLE.en.toll + "<"), "visible English toll caption");
  assert.ok(!dock.includes("undefined") && !dock.includes("NaN"));
});

test("bldChipInner: icon + name + state, red when halted, percent when under construction", async () => {
  const { bldChipInner } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { workshop: "Taller", warehouse: "Almacén", dock: "Muelle" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)" };
  const tEn = { bldTypes: { dock: "Dock" }, bldState: { plot: "plot", construction: "under construction", active: "active", halted: "halted", fire: "fire" }, bldReady: "ready on day {d} ({p}%)" };
  const g = newGame(world, "cadiz", { cash: 30000 });
  g.buildings = { cadiz: {
    "cadiz:1": { type: "workshop", level: 1, state: "active", produced: 5 },
    "cadiz:2": { type: "warehouse", level: 1, state: "active", halted: true },
    "cadiz:3": { type: "dock", level: 1, state: "active" },
    "cadiz:4": { type: "warehouse", level: 0, state: "construction", nextLevel: 1, readyTick: g.tick + 96 },
  } };
  const rows = buildingsRows(g, "cadiz");
  const ws = bldChipInner(t, rows.find((x) => x.plotId === "cadiz:1"), "es", null);
  assert.ok(ws.includes("bldchip") && ws.includes("Taller") && ws.includes("activo"), "active chip: name and state");
  assert.ok(!ws.includes("bldchip-bad"), "active chip is not flagged");
  const wh = bldChipInner(t, rows.find((x) => x.plotId === "cadiz:2"), "es", null);
  assert.ok(wh.includes("bldchip-bad") && wh.includes("parado"), "halted chip is red with state");
  const con = bldChipInner(t, rows.find((x) => x.plotId === "cadiz:4"), "es", null);
  assert.ok(/en obras \d+%/.test(con), "works chip shows its percent");
  const dk = bldChipInner(tEn, rows.find((x) => x.plotId === "cadiz:3"), "en", null);
  assert.ok(dk.includes("Dock") && dk.includes("active"), "English chip");
  assert.ok(!dk.includes("undefined") && !dk.includes("NaN"), "no raw holes");
});

test("bldOfferCard: a processor card shows drawing, investment, running costs and labeled base production", async () => {
  const { bldOfferCard, bldOfferGroup, BO } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { workshop: "Taller" }, goods: { cloth: "paño", wool: "lana", timber: "madera", bricks: "ladrillos", ironware: "hierro forjado" } };
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  const offer = buildOffers(g, "cadiz", PLOT.id).find((o) => o.ok && o.type === "workshop");
  const html = bldOfferCard(t, offer, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(html, /bldoffer-name">Taller</);
  assert.match(html, new RegExp(String(offer.cost)));
  assert.match(html, /5 días de obra/);
  assert.match(html, /mano de obra 300/); // labor fee = spec fee x level
  assert.match(html, /mantenim\. 3\/día · salarios 8\/día/); // upkeep + JOBS_PER_LEVEL.workshop(8) x WAGE(1)
  assert.match(html, /≈1\/día de media/); // average rate 0.5 batches/day x 2 cloth - labeled average, never a max (peak days make more)
  assert.match(html, /gasta ≈2\/día de media/);   // 0.5 batches/day x 4 wool
  assert.ok(!html.includes("según temporada")); // processors are not seasonal
  assert.equal(bldOfferGroup("workshop"), "workshop");
  assert.ok(BO.es.groups.workshop && BO.en.groups.workshop);
});

test("bldOfferCard: a seasonal primary labels the season; house/warehouse/dock reuse their effect lines", async () => {
  const { bldOfferCard, bldOfferGroup } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { farm: "Granja", house: "Casa", warehouse: "Almacén", dock: "Muelle" }, bldFxH: "+{n} habitantes", bldFxS: "+{n} de depósito", bldFxD: "-{n}% de peaje para tus barcos", goods: { grain: "grano", timber: "madera", bricks: "ladrillos", ironware: "hierro forjado" } };
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  const offers = buildOffers(g, "cadiz", PLOT.id);
  const farmOffer = { type: "farm", ok: true, level: 1, cost: 700, materials: 500, fee: 200, days: 4, upkeep: 2, affordable: true, imported: false }; // cadiz grows no grain; a fabricated ok row exercises the primary branch
  const farm = bldOfferCard(t, farmOffer, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(farm, /≈2\/día de media/); // 0.5 batches/day x 4 grain
  assert.match(farm, /según temporada/); // grain is a seasonal good (SEASON_PEAK)
  assert.equal(bldOfferGroup("farm"), "primary");
  const house = bldOfferCard(t, offers.find((o) => o.ok && o.type === "house"), "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(house, /\+50 habitantes/);
  assert.equal(bldOfferGroup("house"), "own");
  const wh = bldOfferCard(t, offers.find((o) => o.ok && o.type === "warehouse"), "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(wh, /\+300 de depósito/);
  const dock = bldOfferCard(t, offers.find((o) => o.ok && o.type === "dock"), "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(dock, /-50% de peaje/); // DOCK_TOLL_DISCOUNT[1]
});

test("bldOfferCard: English strings, escaping, and decimals stay with the caller's fmt", async () => {
  const { bldOfferCard, bldOfferGroup } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { ranch: 'Rancho "viejo"' }, goods: { meat: "carne", leather: "cuero", kid_meat: "cordero", timber: "madera", bricks: "ladrillos", ironware: "hierro forjado" } };
  const o = { type: "ranch", ok: true, level: 1, cost: 1234.5, materials: 1000.5, fee: 250, days: 4, upkeep: 2, affordable: true, imported: { timber: 3 } };
  const html = bldOfferCard(t, o, "en", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(html, /≈1\/day on average/); // 0.5 x 2 meat
  assert.match(html, /≈0\.5\/day on average/); // byproducts at the same average rate
  assert.match(html, /partly imported/); // imported quantities > 0
  assert.match(html, /upkeep 2\/day · wages 6\/day/);
  assert.match(html, /Rancho &quot;viejo&quot;/); // names escape
  assert.equal(bldOfferGroup("ranch"), "primary"); // meat is not in SEASON_PEAK: primary, not seasonal
  assert.ok(!html.includes("seasonal"));
  const civic = { type: "molino", ok: true, level: 1, cost: 900, materials: 700, fee: 200, days: 4, upkeep: 2, affordable: true, imported: false };
  const card = bldOfferCard({ bldTypes: { molino: "Molino" }, goods: {} }, civic, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(card, /asegura el grano/);
  assert.equal(bldOfferGroup("molino"), "civic");
});

test("bldOfferCard: an empty imported object shows no import tag (truthiness regression), positive quantities do", async () => {
  const { bldOfferCard } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { workshop: "Taller" }, goods: { cloth: "paño", wool: "lana", timber: "madera", bricks: "ladrillos", ironware: "hierro forjado" } };
  const base = { type: "workshop", ok: true, level: 1, cost: 900, materials: 600, fee: 300, days: 5, upkeep: 3, affordable: true };
  const none = bldOfferCard(t, { ...base, imported: {} }, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.ok(!none.includes("con importación")); // {} is truthy but means no imported units
  const undef = bldOfferCard(t, base, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.ok(!undef.includes("con importación"));
  const some = bldOfferCard(t, { ...base, imported: { timber: 4, bricks: 0 } }, "es", (n) => String(n), (n) => String(n), () => "<svg/>");
  assert.match(some, /con importación/); // 4 timber imported, 0 bricks: positive sum wins
});

test("bldOfferArt: the offer drawing is the same sprite the city draws (assetKey mapping)", async () => {
  const { bldOfferArt } = await import("../src/view/buildingsview.mjs");
  const { assetKey } = await import("../src/view/city2d.mjs");
  assert.deepEqual(bldOfferArt("cadiz:19", "fishery", 1), { src: "city2d/assets/fishery-1.webp", filter: "" });
  // house: plot-deterministic style, exactly the key the city scene would use for that plot
  const expected = assetKey({ id: "cadiz:19", type: null }, { type: "house", level: 1, state: "active" }).replace(":", "-");
  assert.match(expected, /^house_(poor|comfortable|rich)-1$/);
  assert.equal(bldOfferArt("cadiz:19", "house", 1).src, `city2d/assets/${expected}.webp`);
  // the scene's REP_ART stand-ins: a reused sprite never passes for a different factory
  assert.deepEqual(bldOfferArt("cadiz:19", "tannery", 2), { src: "city2d/assets/soapworks-1.webp", filter: "sepia(.4) brightness(.9)" });
  assert.deepEqual(bldOfferArt("cadiz:19", "trading_post", 1), { src: "city2d/assets/office-1.webp", filter: "brightness(.94) hue-rotate(-12deg)" });
  // level clamps like the city art does (1..3)
  assert.equal(bldOfferArt("cadiz:19", "brewery", 9).src, "city2d/assets/brewery-3.webp");
  // every buildable type resolves to an existing asset file
  const { readFileSync, existsSync } = await import("node:fs");
  const { BUILDING_TYPES } = await import("../src/game/buildings.mjs");
  for (const type of Object.keys(BUILDING_TYPES)) {
    const { src } = bldOfferArt("cadiz:19", type, 1);
    assert.ok(existsSync(`web/${src}`), `${type} -> ${src}`);
  }
});

test("bldOfferCard: with art it shows the isometric model; without art the flat drawing stays", async () => {
  const { bldOfferCard, bldOfferArt } = await import("../src/view/buildingsview.mjs");
  const t = { bldTypes: { fishery: "Pesca" }, goods: { fish: "pescado", timber: "madera", bricks: "ladrillos", ironware: "hierro forjado" } };
  const o = { type: "fishery", ok: true, level: 1, cost: 700, materials: 550, fee: 150, days: 3, upkeep: 1, affordable: true, imported: {} };
  const withArt = bldOfferCard(t, o, "es", (n) => String(n), (n) => String(n), () => "", bldOfferArt("cadiz:19", "fishery", 1));
  assert.match(withArt, /<img class="bldoffer-art" src="city2d\/assets\/fishery-1\.webp"/);
  const flat = bldOfferCard(t, o, "es", (n) => String(n), (n) => String(n), () => "");
  assert.match(flat, /<svg class="gi"/); // no art passed: original flat drawing
  assert.ok(!flat.includes("bldoffer-art"));
});
