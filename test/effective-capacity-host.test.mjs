import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SHIP_TYPES,shipCapacity,cargoUsed} from '../src/sim/trade.mjs';
import {voyageCardHtml} from '../src/view/voyagecard.mjs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
// Execute the actual host snippets separately. Counting duplicate card paints confused
// two calls on one surface with coverage of two different player-facing surfaces.
const vessel={id:1,name:'Capacity fixture',type:'cog',at:'cadiz',voyage:null,cargo:{grain:4},weapons:{cannon:2},gear:1,crew:12};
const effective=shipCapacity(vessel);
assert.ok(effective<SHIP_TYPES[vessel.type].capacity,'fixture must distinguish effective and empty-hull capacity');
function voyageSurface(source){
 const begin=source.indexOf('  $("voyage-card").innerHTML=voyageCardHtml',source.indexOf('function render()'));
 const end=source.indexOf('  $("cash-card").innerHTML',begin);
 assert.ok(begin>0&&end>begin,'voyage host block is present');
 const card={innerHTML:''};
 vm.runInNewContext(source.slice(begin,end),{$:id=>id==='voyage-card'?card:null,voyageCardHtml,ship:()=>vessel,lang:'en',cityName:id=>id,target:null,pendingEvent:()=>null,g:{tick:0},etaPlain:()=>'',cargoUsed,shipCapacity,SHIP_TYPES});
 return card.innerHTML;
}
function auctionSurface(source){
 const begin=source.indexOf('        const sellable = g.ships.filter');
 const end=source.indexOf('\n      }',begin);
 assert.ok(begin>0&&end>begin,'owned-ship auction block is present');
 const context={h:'',g:{ships:[vessel]},s:vessel,t:{almSellShipTitle:'Sell ship',almSellShipInfo:'Auction',cap:'Cargo',types:{},sellShip:'Sell {p}',almSellShipNone:'None'},esc:String,shipDisplayName:x=>x.name,cargoUsed,shipCapacity,SHIP_TYPES,fmt:String,shipValue:()=>100};
 vm.runInNewContext(source.slice(begin,end),context);
 return context.h;
}
test('voyage host renders cargo against effective capacity with weapons and gear',()=>{
 const html=voyageSurface(src);assert.ok(html.includes(`Cargo: 4/${effective}`));assert.ok(!html.includes(`Cargo: 4/${SHIP_TYPES[vessel.type].capacity}`));
});
test('owned ship auction renders cargo against effective capacity with weapons and gear',()=>{
 const html=auctionSurface(src);assert.ok(html.includes(`Cargo: 4/${effective}`));assert.ok(!html.includes(`Cargo: 4/${SHIP_TYPES[vessel.type].capacity}`));assert.match(html,/data-sellship-id="1"/);
});
test('regression catches an empty-hull substitution independently on either surface',()=>{
 const badVoyage=src.replaceAll('cap:shipCapacity(ship())','cap:SHIP_TYPES[ship().type].capacity');
 assert.notEqual(badVoyage,src);assert.ok(!voyageSurface(badVoyage).includes(`Cargo: 4/${effective}`));assert.ok(auctionSurface(badVoyage).includes(`Cargo: 4/${effective}`));
 const badAuction=src.replaceAll('${shipCapacity(x)}','${SHIP_TYPES[x.type].capacity}');
 assert.notEqual(badAuction,src);assert.ok(!auctionSurface(badAuction).includes(`Cargo: 4/${effective}`));assert.ok(voyageSurface(badAuction).includes(`Cargo: 4/${effective}`));
});
test('map fullscreen icon uses SVG rather than a missing font glyph',()=>{const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/id="fs"[^>]*><svg/);assert.doesNotMatch(html,/⛶/);});
