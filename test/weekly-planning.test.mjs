import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weeklyPlanning, weeklyPlanningEnabled } from '../src/game/weekly-planning.mjs';
import { weeklyPlanningHtml, PLANNING_TEXT } from '../src/view/weekly-planning.mjs';
import { makeMarket, cityDemand, tickMarketCity } from '../src/sim/market.mjs';
import { festivalDay, festivalDemandMul } from '../src/game/festivals.mjs';
import { plaguePopMul } from '../src/game/plague.mjs';
import { calamityDemandMul } from '../src/game/calamities.mjs';
import { houseClassPop } from '../src/game/buildings.mjs';
import { effectivePop } from '../src/game/citylife.mjs';
const fixture = () => {
 const cities = [{ id:'a', name:'<City>', pop:1000, makes:[], needs:['grain'] }, { id:'b', pop:10000, makes:['grain'], needs:[] }];
 const world = {cities, nodes:Object.fromEntries(cities.map(c => [c.id,c])), goods:{ grain:{base:22}, silk:{base:200} }};
 return { world, market:makeMarket(world), day:12, buildings:{} };
};
test('daily demand converts to seven periods with city selection and current population', () => {
 const g = fixture(), a = weeklyPlanning(g,'a');
 assert.equal(a.day,12); assert.equal(a.population,1000);
 assert.equal(a.rows[0].daily,cityDemand({...g.market.a.grain,stock:1,target:1},'grain',22));
 for(const r of a.rows) assert.equal(r.weekly,7*r.daily);
 assert.notEqual(weeklyPlanning(g,'b').rows[0].weekly,a.rows[0].weekly);
 g.world.nodes.a.pop = 2000;
 assert.ok(weeklyPlanning(g,'a').rows[0].weekly > a.rows[0].weekly);
 assert.equal(weeklyPlanning(g,'missing'),null);
});
test('typed houses and current growth modifier use market class composition', () => {
 const g=fixture(); g.buildings.a={ h:{type:'house_rich',level:2,state:'active'} };
 g.cityGrowth=true; g.growth={a:{mul:1.2}};
 const counts=houseClassPop(g,'a');
 const expected=cityDemand({pop:Math.round(effectivePop(g,'a')*1.2),classExtra:Object.fromEntries(Object.entries(counts).map(([c,n])=>[c,n*1.2])),stock:1,target:1,needs:true},'grain',22);
 assert.equal(weeklyPlanning(g,'a').rows[0].daily,expected);
});
test('only enabled world goods appear and missing models are explicit', () => {
 const g=fixture(); assert.ok(!weeklyPlanning(g,'a').rows.some(r=>r.good==='pottery'));
 g.world.goods.pottery={base:40}; g.market.a.pottery={pop:1000,needs:true};
 assert.ok(weeklyPlanning(g,'a').rows.find(r=>r.good==='pottery').weekly>0);
 g.world.goods.unknown={base:1};
 assert.equal(weeklyPlanning(g,'a').rows.find(r=>r.good==='unknown').weekly,null);
 assert.match(weeklyPlanningHtml(g,'a',{},'en','?weeklyplanning=1'),/no reusable demand model/);
});
test('warmup, stocks and ledger cannot pollute reference; rendering and calculation never mutate', () => {
 const g=fixture(), reference=weeklyPlanning(g,'a');
 g.market.a.grain.stock=0; g.market.a.grain.pop=999999;
 g.market.a.grain.needsLedger={days:999999,totals:{grain:{consumed:999999}}};
 const before=JSON.stringify(g);
 assert.deepEqual(weeklyPlanning(g,'a'),reference);
 weeklyPlanningHtml(g,'a',{},'en','?weeklyplanning=1');
 assert.equal(JSON.stringify(g),before);
});
test('flag is explicit and defaults off; rendering preserves serialized state and simulation', () => {
 const a=fixture(), b=structuredClone(a);
 for(const search of ['', '?weeklyplanning=0','?weeklyplanning=true']) {
 assert.equal(weeklyPlanningEnabled(search),false);
 assert.equal(weeklyPlanningHtml(a,'a',{},'en',search),'');
 }
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 for(let day=0;day<7;day++) {
 weeklyPlanningHtml(a,'a',{},'en','?weeklyplanning=1');
 tickMarketCity(a.market.a,day,a.world); tickMarketCity(b.market.a,day,b.world);
 }
 assert.equal(JSON.stringify(a),JSON.stringify(b));
});
test('EN/ES labels, empty state, escaping and keyboard scroll region', () => {
 assert.deepEqual(Object.keys(PLANNING_TEXT.en),Object.keys(PLANNING_TEXT.es));
 for(const lang of ['en','es']) {
 const html=weeklyPlanningHtml(fixture(),'a',{grain:'<img onerror="bad">'},lang,'?weeklyplanning=1');
 assert.ok(html.includes(PLANNING_TEXT[lang].weekly));
 assert.ok(html.includes('&lt;City&gt;')); assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('<img')); assert.match(html,/tabindex="0" role="region"/);
 assert.ok(weeklyPlanningHtml(null,'x',{},lang,'?weeklyplanning=1').includes(PLANNING_TEXT[lang].empty));
 }
 const main=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.match(main,/weeklyPlanningHtml\(g, s.at, t.goods, lang, location.search\)/);
});

test('current plague, festival and calamity modifiers are frozen rather than ignored', () => {
 const g=fixture(); g.world.goods.wine={base:50}; g.market.a.wine={needs:true,makes:false};
 g.cityFestivals=true; g.day=festivalDay(g.world,'a')-1;
 g.plague={active:{a:{untilDay:g.day+10}}};
 g.calamities={active:{a:{hambruna:{untilDay:g.day+10},malsana:{untilDay:g.day+10}}}};
 for(const r of weeklyPlanning(g,'a').rows) {
 const mul=plaguePopMul(g,'a')*festivalDemandMul(g,'a',r.good,g.day)*calamityDemandMul(g,'a',r.good);
 const expected=cityDemand({...g.market.a[r.good],pop:Math.round(1000*mul),classExtra:null,stock:1,target:1},r.good,g.world.goods[r.good].base);
 assert.equal(r.daily,expected); assert.equal(r.weekly,7*expected);
 }
});
