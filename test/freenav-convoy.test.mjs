import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,buyCaravel,formConvoy,doGoTo,advanceTick} from '../src/game/game.mjs';
const world=loadWorld();
function setup(){const g=newGame(world,'cadiz',{seed:1,noGoal:true});g.freeNav=true;g.cash=100000;assert.ok(buyCaravel(g,'cadiz').ok);const ships=g.ships;assert.ok(formConvoy(g,ships.map(s=>s.id)).ok);return{g,ships};}
test('free navigation port order launches the whole convoy at the slowest pace',()=>{
 const{g,ships}=setup(),p=world.nodes.huelva;const r=doGoTo(g,ships[0],p.lat,p.lon);assert.ok(r.ok&&r.toPort);assert.equal(r.ships.length,2);
 for(const s of ships)assert.equal(s.voyage.to,'huelva');assert.equal(ships[0].voyage.ticksLeft,ships[1].voyage.ticksLeft);
 for(let i=0;i<10000&&ships.some(s=>s.voyage);i++)advanceTick(g);
 for(const s of ships){assert.equal(s.at,'huelva');assert.ok(!s.voyage);}
});
test('convoy open-sea order is refused without moving either member',()=>{
 const{g,ships}=setup(),p=world.nodes.w_cadiz_off;assert.equal(doGoTo(g,ships[0],p.lat,p.lon).reason,'convoy');for(const s of ships)assert.ok(!s.voyage);
});
test('short crew in a mate refuses the complete convoy before departure',()=>{
 const{g,ships}=setup(),p=world.nodes.huelva;ships[1].crew=0;assert.equal(doGoTo(g,ships[0],p.lat,p.lon).reason,'crew');for(const s of ships)assert.ok(!s.voyage);
});
test('mid-voyage convoy course change is refused and keeps both legs',()=>{
 const{g,ships}=setup(),p=world.nodes.huelva;assert.ok(doGoTo(g,ships[0],p.lat,p.lon).ok);const before=ships.map(s=>JSON.stringify(s.voyage)),to=world.nodes.sevilla;assert.equal(doGoTo(g,ships[0],to.lat,to.lon).reason,'convoy');assert.deepEqual(ships.map(s=>JSON.stringify(s.voyage)),before);
});
