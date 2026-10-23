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
