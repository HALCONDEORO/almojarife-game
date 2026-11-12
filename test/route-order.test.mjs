import test from 'node:test';
import assert from 'node:assert/strict';
import {moveRouteStop,routeOrderButtons} from '../src/view/routeorder.mjs';
const stops=()=>[
 {city:'cadiz',buyGood:'grain',buyMax:'18',sellGood:'wine',sellMin:'52'},
 {city:'sevilla',buyGood:'wine',buyMax:'35',sellGood:'grain',sellMin:'25'},
 {city:'lisboa',buyGood:'salt',buyMax:'20',sellGood:'fish',sellMin:'31'},
];
test('moving up/down retains the exact complete row objects and values',()=>{
 const rows=stops(),first=rows[0],second=rows[1],third=rows[2];
 assert.equal(moveRouteStop(rows,1,-1),0);assert.deepEqual(rows,[second,first,third]);assert.equal(rows[0],second);
 assert.equal(moveRouteStop(rows,0,1),1);assert.deepEqual(rows,[first,second,third]);
});
test('boundary and invalid moves never alter the draft',()=>{
 for(const [i,d] of [[0,-1],[2,1],[-1,1],[3,-1],[.5,1],[1,0],[1,2],[NaN,1]]){
  const rows=stops(),before=structuredClone(rows);assert.equal(moveRouteStop(rows,i,d),null);assert.deepEqual(rows,before);
 }
 assert.equal(moveRouteStop([],0,1),null);assert.equal(moveRouteStop(null,0,1),null);
});
test('moving duplicate cities preserves distinct trading instructions',()=>{
 const rows=stops();rows[2].city='cadiz';const last=rows[2];moveRouteStop(rows,2,-1);assert.equal(rows[1],last);assert.equal(rows[0].buyGood,'grain');assert.equal(rows[1].buyGood,'salt');
});
test('button state and contextual ES/EN names expose order without drag-only controls',()=>{
 const first=routeOrderButtons(0,3,'Cádiz');assert.match(first,/id="rts-up-0"[^>]* disabled/);assert.doesNotMatch(first,/id="rts-down-0"[^>]* disabled/);assert.match(first,/aria-label="Subir: 1. Cádiz"/);
 const last=routeOrderButtons(2,3,'Lisboa','en');assert.match(last,/aria-label="Move down: 3. Lisboa"[^>]* disabled/);assert.doesNotMatch(last,/id="rts-up-2"[^>]* disabled/);
 const singleton=routeOrderButtons(0,1,'Cádiz');assert.equal((singleton.match(/ disabled/g)||[]).length,2);
});
test('port labels are escaped in both title and accessible name',()=>{
 const html=routeOrderButtons(1,3,'<img src=x onerror="x"> & \'');assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/&quot;/);assert.match(html,/&amp;/);assert.match(html,/&#39;/);
});
