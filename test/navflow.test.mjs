import test from 'node:test';import assert from 'node:assert/strict';
import {shipClickAction,portClickAction} from '../src/view/navflow.mjs';
const G={ships:[{id:'C1',at:'cadiz',voyage:null},{id:'C2',at:null,voyage:{to:'sevilla',path:['cadiz','sevilla'],ticksLeft:50,totalTicks:100,km:400}}]};
test('docked ship opens the city, ship at sea opens its card',()=>{
 assert.deepEqual(shipClickAction(G,0),{kind:'city',ship:0});
 assert.deepEqual(shipClickAction(G,1),{kind:'card',ship:1});
 assert.deepEqual(shipClickAction(G,9),{kind:'none'});
});
test('port with your docked ship enters the city; without presence it is only a destination',()=>{
 assert.deepEqual(portClickAction(G,'cadiz'),{kind:'city',ship:0});
 assert.deepEqual(portClickAction(G,'sevilla'),{kind:'target',city:'sevilla'});
});
