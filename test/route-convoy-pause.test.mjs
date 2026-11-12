import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,buyCaravel,formConvoy,disbandConvoy,leaveConvoy,setRoute,setRouteAdv,doBuy,doSell,doSail,sailConvoy,clearRoute,repeatRoute} from '../src/game/game.mjs';
import {processRoutes} from '../src/game/routes.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {messageText} from '../src/view/ledgerview.mjs';
const world=loadWorld(),ops={doBuy,doSell,doSail};
function fixture(advanced=false){const g=newGame(world,'cadiz',{freePlay:true,embargo:false,events:false});g.cash=100000;const s=g.ships[0],mate=buyCaravel(g,'cadiz').ship;
 if(advanced)setRouteAdv(g,s,[{city:'cadiz',buy:[{good:'grain'}]},{city:'huelva',sell:[{good:'grain'}]}]);else setRoute(g,s,'cadiz','huelva','grain');
 const cv=formConvoy(g,[s.id,mate.id]).convoy;return{g,s,mate,cv};}
const notices=g=>g.inbox.filter(m=>m.kind==='routeStuck'&&m.action==='convoy');
for(const advanced of [false,true])test(`${advanced?'advanced':'legacy'} grouped route pauses without trade, departure or progress; dedup survives save`,()=>{
 const {g,s,mate,cv}=fixture(advanced);const before={cash:g.cash,cargo:{...s.cargo},stock:g.market.cadiz.grain.stock,idx:s.route.idx,legs:s.route.legs};
 let calls=0;const forbidden={doBuy:()=>{calls++;},doSell:()=>{calls++;},doSail:()=>{calls++;}};
 for(let i=0;i<3;i++)processRoutes(g,forbidden);
 assert.equal(calls,0);assert.equal(s.voyage,null);assert.equal(mate.voyage,null);
 assert.deepEqual({cash:g.cash,cargo:{...s.cargo},stock:g.market.cadiz.grain.stock,idx:s.route.idx,legs:s.route.legs},before);
 assert.equal(notices(g).length,1);assert.equal(notices(g)[0].convoy,cv.id);
 const back=deserialize(serialize(g,'Convoy pause'),world).g;processRoutes(back,ops);assert.equal(notices(back).length,1);
 for(const lang of ['es','en']){const text=messageText(notices(g)[0],lang,String,String);assert.match(text,lang==='es'?/convoy.*pausa|pausa.*convoy/:/convoy.*paused|paused.*convoy/);}
});
for(const release of ['disband','leave'])test(`route resumes when ${release} releases ship`,()=>{
 const {g,s,cv}=fixture(true);processRoutes(g,ops);
 if(release==='disband')disbandConvoy(g,cv.id);else leaveConvoy(g,s.id);
 processRoutes(g,ops);assert.ok(s.voyage);assert.equal(s.voyage.to,'huelva');assert.ok(s.cargo.grain>0);assert.ok(!Object.hasOwn(s.route,'convoyPauseKey'));
});
test('manual convoy departure is unchanged while an individual route is paused',()=>{
 const {g,s,mate,cv}=fixture();processRoutes(g,ops);assert.ok(sailConvoy(g,cv.id,'huelva',{doSail}).ok);
 assert.equal(s.voyage.to,'huelva');assert.equal(mate.voyage.to,'huelva');assert.equal(s.voyage.ticksLeft,mate.voyage.ticksLeft);
});
test('cancel/repeat does not remember pause diagnostics and a fresh pause warns again',()=>{
 const {g,s}=fixture();processRoutes(g,ops);clearRoute(s);assert.ok(!Object.hasOwn(s.lastRoute,'convoyPauseKey'));assert.ok(repeatRoute(g,s).ok);processRoutes(g,ops);assert.equal(notices(g).length,2);
});
test('conflicting member routes cannot trade or split the convoy',()=>{
 const {g,s,mate}=fixture();setRoute(g,mate,'cadiz','malaga','wine');processRoutes(g,ops);
 assert.equal(s.voyage,null);assert.equal(mate.voyage,null);assert.deepEqual(s.cargo,{});assert.deepEqual(mate.cargo,{});assert.equal(notices(g).length,2);
});
