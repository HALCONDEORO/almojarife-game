import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{newGame,doSail}from'../src/game/game.mjs';import{loadWorld}from'../src/sim/world.mjs';
import{privateeringHallHtml,privateeringSeaHtml}from'../src/view/privateeringview.mjs';
import{buyLetter}from'../src/game/marque.mjs';
const realms=JSON.parse(readFileSync(new URL('../data/realms.json',import.meta.url))),peaces=JSON.parse(readFileSync(new URL('../data/peaces.json',import.meta.url))),world=loadWorld();
test('normal game has letters at hall with existing fee and peace active',()=>{const g=newGame(world);const s=g.ships[0];assert.equal(g.peace,true);assert.match(privateeringHallHtml(g,s,realms,peaces),/data-letter="portugal"/);assert.ok(buyLetter(g,realms,s.at,'portugal').ok);const h=privateeringHallHtml(g,s,realms,peaces);assert.match(h,/Vence día 365/);assert.doesNotMatch(h,/data-letter="portugal"/);});
test('sea controls expose unlicensed targets and no controls ashore or off',()=>{const g=newGame(world),s=g.ships[0];s.crew=20;assert.equal(privateeringSeaHtml(g,s,realms,peaces),'');assert.ok(doSail(g,s,'malaga').ok);g.ai[0].home='lisboa';g.ai[0].ship.voyage={...s.voyage};assert.match(privateeringSeaHtml(g,s,realms,peaces),/data-trader-attack="0"/);assert.match(privateeringSeaHtml(g,s,realms,peaces),/sin carta válida/);g.marque=false;assert.equal(privateeringSeaHtml(g,s,realms,peaces),'');});
import {attackTrader} from '../src/game/privateering.mjs';
import {makeShip} from '../src/sim/trade.mjs';
import {fleetSelection,fleetLossHtml} from '../src/view/fleetloss.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
function losingFight(extra=false){const g=newGame(world),s=g.ships[0];s.crew=20;assert.ok(doSail(g,s,'malaga').ok);s.hull=1;const t=g.ai[0];t.home='lisboa';t.ship.voyage={...s.voyage};t.ship.cannons=100;t.ship.crew=100;if(extra)g.ships.push(makeShip(g.nextId++,'cog','cadiz'));const r=attackTrader(g,realms,s.id,0,peaces,{unlicensed:true});assert.ok(r.ok);assert.equal(s.sunk,true);return g;}
test('last ship sunk is a persisted terminal loss with safe loss display',()=>{const g=losingFight();assert.equal(g.over,'lose');assert.equal(g.overReason,'fleet-lost');assert.equal(fleetSelection(g),-1);assert.match(fleetLossHtml('es'),/último barco/);assert.equal(deserialize(serialize(g,'T'),world).g.overReason,'fleet-lost');});
test('selected ship sinking selects a remaining ship without ending play',()=>{const g=losingFight(true);assert.equal(g.ships.length,1);assert.equal(g.over,null);assert.equal(fleetSelection(g,1),0);assert.ok(g.ships[fleetSelection(g,1)]);});
