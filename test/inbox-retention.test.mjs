import test from 'node:test';
import assert from 'node:assert/strict';
import { post, MAX_INBOX, markRead, markAllRead } from '../src/game/ledger.mjs';
import { msgClass } from '../src/game/msgclass.mjs';
import { msgClass as viewClass, actionUnread } from '../src/view/msgclass.mjs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const flood = (g, count = MAX_INBOX + 10) => { for (let i=0;i<count;i++) post(g,'arrival',{ship:1,city:'cadiz'}); };

test('retention and view share the exact existing classification',()=>{
 assert.equal(viewClass,msgClass);
 for(const m of [{kind:'warn'},{kind:'info',topic:'justice'},{kind:'info',topic:'calamity'},{kind:'report',debt:1}]) assert.equal(msgClass(m),'action');
 for(const m of [{kind:'report'},{kind:'info'},{kind:'arrival'}]) assert.notEqual(msgClass(m),'action');
});
test('unread action survives notice flood; newest-first order and hard cap remain',()=>{
 const g={day:1};post(g,'warn',{due:50,cash:10});const first=structuredClone(g.inbox[0]);flood(g);
 assert.equal(g.inbox.length,MAX_INBOX);assert.deepEqual(g.inbox.at(-1),first);assert.equal(actionUnread(g),1);
 assert.ok(g.inbox.every((m,i,a)=>!i||a[i-1].id>m.id));
});
test('read actions become replaceable and mark-all does not alter ids or content',()=>{
 const g={day:1};post(g,'warn');markRead(g,1);flood(g);assert.ok(!g.inbox.some(m=>m.id===1));
 post(g,'debt');const id=g.nextMsg;markAllRead(g);assert.equal(actionUnread(g),0);flood(g);assert.ok(!g.inbox.some(m=>m.id===id));
});
test('oldest replaceable entry is evicted, not a newer read entry',()=>{
 const g={day:0};post(g,'warn');post(g,'info',{txt:'old notice'});for(let i=0;i<MAX_INBOX-2;i++)post(g,'debt');
 markRead(g,3);post(g,'warn');assert.ok(g.inbox.some(m=>m.id===1));assert.ok(!g.inbox.some(m=>m.id===2));assert.ok(g.inbox.some(m=>m.id===3));
});
test('all-protected saturation drops oldest action, but a new notice cannot evict an action',()=>{
 const g={day:0};for(let i=0;i<MAX_INBOX;i++)post(g,'warn');post(g,'arrival');assert.equal(g.inbox[0].id,MAX_INBOX);
 assert.equal(g.inbox.at(-1).id,1);post(g,'debt');assert.equal(g.inbox.length,MAX_INBOX);assert.equal(g.inbox[0].id,MAX_INBOX+2);assert.ok(!g.inbox.some(m=>m.id===1));
});
test('legacy and oversized loaded inboxes normalize to cap on next enabled post',()=>{
 const g={day:0,inbox:Array.from({length:MAX_INBOX+8},(_,i)=>({id:100-i,kind:i?'arrival':'warn',read:false})),nextMsg:100};
 post(g,'arrival');assert.equal(g.inbox.length,MAX_INBOX);assert.ok(g.inbox.some(m=>m.id===100));
});
test('save round trip retains protected action, acknowledgement and explicit rollback',()=>{
 const w=loadWorld(),g=newGame(w,'cadiz',{regionalRivals:false,household:false,calamities:false});g.inbox=[];g.nextMsg=0;
 post(g,'info',{topic:'justice',txt:'Court action'});flood(g);const saved=serialize(g,'T',0);const h=deserialize(saved,w).g;
 assert.deepEqual(h.inbox,g.inbox);flood(h);assert.ok(h.inbox.some(m=>m.id===1));markRead(h,1);
 const j=deserialize(serialize(h,'T',0),w).g;flood(j);assert.ok(!j.inbox.some(m=>m.id===1));
 j.protectUnreadActions=false;assert.equal(deserialize(serialize(j,'T',0),w).g.protectUnreadActions,false);
});
test('flag-off is byte-identical to legacy post after every message, including payload overrides',()=>{
 const legacy=(g,kind,p={})=>{const box=(g.inbox??=[]);box.unshift({id:(g.nextMsg=(g.nextMsg??0)+1),day:g.day,kind,read:false,...(g.ships?.find(s=>s.id===p.ship)?.name?{shipName:g.ships.find(s=>s.id===p.ship).name}:{}),...p});if(box.length>MAX_INBOX)box.pop();};
 const g={day:3,protectUnreadActions:false,ships:[{id:1,name:'Test'}]},h=structuredClone(g);
 for(let i=0;i<MAX_INBOX*3;i++){const kind=['warn','arrival','info','report'][i%4],p={ship:1,...(i%5===0?{read:true}:{}),...(i%4===3?{debt:10}:{})};post(g,kind,p);legacy(h,kind,p);assert.equal(JSON.stringify(g),JSON.stringify(h));}
});
