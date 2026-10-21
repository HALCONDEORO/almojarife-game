import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay} from '../src/game/game.mjs';
import {hireContact,fireContact,tickContacts,contactsOf,CONTACT_PRICE,CONTACT_MAX,CONTACT_EVERY,CONTACT_REPORTS,CONTACT_FALSE_ERROR} from '../src/game/contacts.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>newGame(world);
const know=(g,city)=>{(g.intel??={})[city]={day:0,exact:true,cells:JSON.parse(JSON.stringify(g.market[city]))};};
test('hiring validates and charges',()=>{
 const g=mk();
 assert.equal(hireContact(g,'nowhere').reason,'unknown city');
 assert.equal(hireContact(g,'sevilla').reason,'unknown port','you only know who to ask in a port you know');
 know(g,'sevilla');
 assert.equal(hireContact(g,'sevilla').reason,'no ship here','hiring is in person, at the port');
 know(g,'cadiz');
 const cash=g.cash;
 assert.ok(hireContact(g,'cadiz').ok);
 assert.equal(g.cash,cash-CONTACT_PRICE);
 assert.equal(hireContact(g,'cadiz').reason,'already hired');
 for(const c of ['sevilla','huelva','lisboa']){know(g,c);g.ships.push({...g.ships[0],id:g.ships.length+1,at:c,cargo:{}});}
 g.ships[1].at='sevilla';hireContact(g,'sevilla');g.ships[2].at='huelva';hireContact(g,'huelva');g.ships[3].at='lisboa';hireContact(g,'lisboa');
 know(g,'faro');g.ships.push({...g.ships[0],id:9,at:'faro',cargo:{}});
 assert.equal(hireContact(g,'faro').reason,'too many contacts');
 assert.ok(fireContact(g,'faro').ok===false||true);
 assert.equal(fireContact(g,'faro').reason,'no contact');
 assert.ok(fireContact(g,'cadiz').ok);assert.ok(!contactsOf(g).some((c)=>c.city==='cadiz'));
});
test('reports land weekly, inexact, and the contact retires after the month',()=>{
 const g=mk();know(g,'cadiz');
 assert.ok(hireContact(g,'cadiz').ok);
 g.ships[0].at='faro';know(g,'faro'); // leave: Cádiz is no longer live
 const before=g.intel.cadiz.day;
 for(let d=1;d<=CONTACT_EVERY;d++){g.day=d;tickContacts(g);}
 assert.equal(g.intel.cadiz.day,CONTACT_EVERY,'the report refreshed the intel');
 assert.equal(g.intel.cadiz.exact,false,'always inexact');
 const real=g.market.cadiz.grain.stock,got=g.intel.cadiz.cells.grain.stock;
 assert.ok(Math.abs(got-real)<=Math.ceil(real*CONTACT_FALSE_ERROR)+1,'inside even the false-report band');
 assert.ok((g.inbox??[]).some((m)=>m.txt?.es?.includes('informante')),'the report is announced');
 let days=CONTACT_EVERY;
 for(let r=1;r<CONTACT_REPORTS;r++){for(let d=days+1;d<=days+CONTACT_EVERY;d++){g.day=d;tickContacts(g);}days+=CONTACT_EVERY;}
 assert.equal(contactsOf(g).length,0,'retires after the month');
 assert.ok((g.inbox??[]).some((m)=>m.txt?.es?.includes('se retira')),'the goodbye is announced');
 for(let d=days+1;d<=days+CONTACT_EVERY;d++){g.day=d;tickContacts(g);}
 assert.equal(g.intel.cadiz.day,days,'no more reports after retiring');
});
test('presence beats the contact: advanceDay leaves a live port exact',()=>{
 const g=mk();know(g,'cadiz');
 assert.ok(hireContact(g,'cadiz').ok); // the ship is docked in Cádiz: the port stays live
 for(let d=0;d<CONTACT_EVERY;d++)advanceDay(g);
 assert.equal(g.intel.cadiz.exact,true,'your own eyes win');
 assert.equal(g.intel.cadiz.day,g.day);
 assert.equal(contactsOf(g)[0].reports,1,'the report still counts down');
});
test('contacts survive a save/load',()=>{
 const g=mk();know(g,'cadiz');hireContact(g,'cadiz');
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(r.contacts,g.contacts);
});
