import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {setRouteAdv} from '../src/game/routes.mjs';
import {routeValidationMessage,showRouteValidationError} from '../src/view/routevalidation.mjs';
const world=loadWorld(),valid=[{city:'cadiz'},{city:'huelva'}];
const cases=[['too few stops',[],{}],['bad stop',[{city:'cadiz'},{city:'cadiz'}],{}],['bad stop',[{city:'absent'},{city:'huelva'}],{}],['bad rule',[{city:'cadiz',buy:[{good:'absent'}]},{city:'huelva'}],{}],['bad cash brake',valid,{minCash:-1}]];
for(const lang of ['es','en'])test(`${lang} every current validation reason has a distinct message`,()=>{
 const seen=new Set();
 for(const [reason,stops,opts] of cases){const g=newGame(world,'cadiz',{freePlay:true});const ship=g.ships[0];const result=setRouteAdv(g,ship,stops,opts);assert.equal(result.reason,reason);const message=routeValidationMessage(reason,lang);assert.notEqual(message,routeValidationMessage('unknown',lang));assert.ok(message.length>20);seen.add(message);assert.equal(ship.route,undefined);}
 assert.equal(seen.size,4);
 const g=newGame(world,'cadiz',{freePlay:true});g.over=true;const result=setRouteAdv(g,g.ships[0],valid);assert.equal(result.reason,'game over');assert.match(routeValidationMessage(result.reason,lang),lang==='es'?/terminado/:/ended/);
});
test('invalid circuit closure gets the same actionable port message',()=>{
 const g=newGame(world,'cadiz',{freePlay:true});const result=setRouteAdv(g,g.ships[0],[{city:'cadiz'},{city:'huelva'},{city:'cadiz'}]);assert.equal(result.reason,'bad stop');assert.match(routeValidationMessage(result.reason,'en'),/return to the start/);
});
test('unknown reasons never expose raw content or inherited keys',()=>{
 for(const reason of ['constructor','__proto__','<script>unexpected</script>',null])assert.equal(routeValidationMessage(reason,'en'),routeValidationMessage('unknown','en'));
 assert.equal(routeValidationMessage('too few stops','fr'),routeValidationMessage('too few stops','es'));
});
test('error display uses textContent and focuses after its translated text is set',()=>{
 let focusedText;const el={textContent:'',focus(){focusedText=this.textContent;}};
 showRouteValidationError(el,'too few stops','en');assert.equal(focusedText,'Add at least two stops to set the route.');assert.doesNotThrow(()=>showRouteValidationError(null,'bad stop'));
});
test('rejected draft leaves an existing active route unchanged',()=>{
 const g=newGame(world,'cadiz',{freePlay:true}),ship=g.ships[0];assert.equal(setRouteAdv(g,ship,valid).ok,true);const active=ship.route;assert.equal(setRouteAdv(g,ship,[]).reason,'too few stops');assert.equal(ship.route,active);
});
