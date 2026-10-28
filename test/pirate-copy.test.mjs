import test from 'node:test';import assert from 'node:assert/strict';
import {encounterText} from '../src/game/encounters.mjs';import {encounterDialogHtml} from '../src/view/encounterview.mjs';import {pirateOdds} from '../src/view/oddsview.mjs';
const e={kind:'pirates',result:'escaped',hullLost:0,cargoLost:0,delay:1};
test('zero losses read naturally in ES/EN, actual losses remain explicit',()=>{
 assert.match(encounterText(e),/Sin daños en el casco; sin pérdidas de carga/);assert.match(encounterText(e,'en'),/No hull damage; no cargo lost/);
 for(const lang of ['es','en'])assert.doesNotMatch(encounterText(e,lang),/-0/);
 assert.match(encounterText({...e,hullLost:2,cargoLost:3}),/Casco -2; carga perdida 3/);
 assert.match(encounterText({...e,hullLost:0,cargoLost:3}),/Sin daños en el casco; carga perdida 3/);
});
test('successful escape warns about displayed progress without changing the report data',()=>{
 const before=JSON.stringify(e);assert.match(encounterText(e),/puede hacer retroceder el progreso mostrado/);assert.match(encounterText(e,'en'),/can set the displayed voyage progress back/);assert.equal(JSON.stringify(e),before);
 assert.doesNotMatch(encounterText({...e,result:'repelled'}),/retroceder/);assert.doesNotMatch(encounterText({...e,delay:0}),/retroceder/);
});
test('pirate choice states escape and combat odds directly in both languages',()=>{
 const g={ships:[{id:1,type:'cog',hull:100,crew:12}],pending:{event:'sea-pirates',ship:1,day:0,escapeChance:70}};const before=JSON.stringify(g);
 assert.match(pirateOdds(g).flee,/70 % escapas, \+1 día · 30 % no logras huir: combate/);assert.match(pirateOdds(g,'en').flee,/70 % escape, \+1 day · 30 % escape fails: combat/);
 assert.match(encounterDialogHtml(g),/posible retroceso del progreso/);assert.match(encounterDialogHtml(g,'en'),/possible progress setback/);
 assert.doesNotMatch(encounterDialogHtml(g),/mira Luchar/);assert.equal(JSON.stringify(g),before);
});
