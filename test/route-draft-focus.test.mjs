import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDraftFocusId,focusRouteDraft} from '../src/view/routedraftfocus.mjs';
test('added stop focuses its port; empty draft can still focus Add',()=>{
 assert.equal(routeDraftFocusId('add',0,3),'rts-city-2');assert.equal(routeDraftFocusId('add',0,1),'rts-city-0');assert.equal(routeDraftFocusId('add',0,0),'rts-add');
});
test('remove selects successor, last predecessor or Add when no stops remain',()=>{
 assert.equal(routeDraftFocusId('remove',0,2),'rts-city-0');assert.equal(routeDraftFocusId('remove',1,2),'rts-city-1');assert.equal(routeDraftFocusId('remove',2,2),'rts-city-1');assert.equal(routeDraftFocusId('remove',0,0),'rts-add');
});
test('invalid requests do not select a focus target',()=>{
 for(const args of [['move',0,2],['remove',-1,2],['remove',.5,2],['add',0,-1],['add',0,NaN]])assert.equal(routeDraftFocusId(...args),null);
});
test('focus helper targets only returned fresh controls and tolerates missing element',()=>{
 let focused;focusRouteDraft(id=>({focus(){focused=id;}}),'remove',2,2);assert.equal(focused,'rts-city-1');assert.doesNotThrow(()=>focusRouteDraft(()=>null,'add',0,1));
});
