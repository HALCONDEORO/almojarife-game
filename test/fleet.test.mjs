import test from'node:test';import assert from'node:assert/strict';import{fleetRows,fleetHtml}from'../src/view/fleet.mjs';
const ships=Array.from({length:40},(_,i)=>({id:i+1,type:'barca',at:i%2?'huelva':'cadiz',hull:100,cargo:{},...(i%3===1?{voyage:{from:'cadiz',to:'huelva'}}:i%3===2?{route:{}}:{})}));
test('fleet supports forty ships and stable original indices',()=>{assert.equal(fleetRows(ships).length,40);for(const r of fleetRows(ships,{filter:'idle'}))assert.equal(r.s,ships[r.index]);assert.equal(fleetRows(ships,{filter:'sea'}).length,13);assert.equal(fleetRows(ships,{filter:'route'}).length,13);});
test('search matches port or ship identity without changing ships',()=>{const before=JSON.stringify(ships);assert.ok(fleetRows(ships,{search:'huelva'}).length>0);assert.equal(fleetRows(ships,{search:'40'})[0].s.id,40);assert.equal(JSON.stringify(ships),before);});
test('fleet HTML is localized and escapes ship names',()=>{const g={ships:[{...ships[0],name:'<script>x</script>'}]};const h=fleetHtml(g,0,{lang:'en'});assert.match(h,/Fleet/);assert.match(h,/Cargo/);assert.match(h,/Hull/);assert.match(h,/&lt;script&gt;/);assert.doesNotMatch(h,/<script>/);});
test('search folds diacritics both ways and matches display names (issue #26)',()=>{
 const cityName=id=>id==='cadiz'?'Cádiz':id==='malaga'?'Málaga':id;
 const rows=fleetRows(ships,{search:'Cádiz',cityName});
 assert.ok(rows.length>0,'accented query should match unaccented port id');
 for(const r of rows)assert.ok(r.s.at==='cadiz'||r.s.voyage?.to==='cadiz'||r.s.voyage?.from==='cadiz'||String(r.s.name??r.s.id).toLowerCase().includes('c'));
 const rows2=fleetRows(ships,{search:'malaga',cityName});
 assert.equal(rows2.length,0,'no ship in Málaga in fixture, but unaccented query must not error on accented names');
 const shipsAcc=[{id:1,type:'barca',at:'malaga',hull:100,cargo:{}}];
 assert.equal(fleetRows(shipsAcc,{search:'Málaga',cityName}).length,1,'accented id matches accented query');
 assert.equal(fleetRows(shipsAcc,{search:'malaga',cityName}).length,1,'accented display name matches unaccented query');
});
test('search and filter appear only with more than 5 ships, and stale filters are ignored below that',async()=>{
  const {fleetHtml,showFleetSearch,FLEET_SEARCH_MIN}=await import('../src/view/fleet.mjs');
  const mk=n=>({ships:Array.from({length:n},(_,i)=>({id:i+1,type:'barca',at:'cadiz',hull:100,cargo:{}}))});
  assert.equal(FLEET_SEARCH_MIN,5);assert.ok(!showFleetSearch(5));assert.ok(showFleetSearch(6));
  for(const n of [1,5]){const h=fleetHtml(mk(n),0,{filter:'sea',search:'zzz'});assert.ok(!h.includes('fleet-search')&&!h.includes('fleet-filter'));assert.equal((h.match(/fleet-row"/g)||[]).length,n);}
  const h6=fleetHtml(mk(6),0,{});assert.ok(h6.includes('id="fleet-search"')&&h6.includes('id="fleet-filter"'));
});
