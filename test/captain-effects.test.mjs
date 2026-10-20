import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doSail,advanceDay,netWorth} from '../src/game/game.mjs';
import {captainRoster,hireCaptain} from '../src/game/captains.mjs';
import {travelEstimate} from '../src/view/nav.mjs';import {accrueDay,accruedTotal,dueNow,settleWeek} from '../src/game/ledger.mjs';
import {crewLimits} from '../src/game/crew.mjs';
const w=loadWorld();
test('captain departure equals shared estimate, crew minimum still enforced',()=>{
 const g=newGame(w),s=g.ships[0];hireCaptain(g,s,captainRoster(g,s.at)[0].id);
 for(const to of w.cities.filter(c=>c.id!==s.at)){
 const copy=JSON.parse(JSON.stringify(s)),g2={...g,ships:[copy],log:[],voyages:[]};
 const est=travelEstimate(w,copy,to.id),r=doSail(g2,copy,to.id);assert.equal(r.ok,est.ok);if(r.ok)assert.equal(r.days,est.days);
 }
 s.crew=crewLimits(s).min-1;assert.equal(travelEstimate(w,s,'lisboa').ok,false);assert.equal(doSail(g,s,'lisboa').ok,false);
});
test('salary accrues docked and sailing, due/net worth include it, paid once weekly',()=>{
 const a=newGame(w),b=newGame(w);hireCaptain(a,a.ships[0],captainRoster(a,a.ships[0].at)[0].id);b.cash=a.cash;
 for(let d=1;d<=7;d++){a.day=b.day=d;accrueDay(a,a.ships[0]);accrueDay(b,b.ships[0]);}
 assert.equal(Math.round(accruedTotal(a)-accruedTotal(b)),14);assert.equal(Math.round(dueNow(a)-dueNow(b)),14);
 assert.equal(Math.round(netWorth(b)-netWorth(a)),14);const before=a.cash,r=settleWeek(a);settleWeek(b);
 assert.equal(r.lines[0].captain,14);assert.equal(Math.round(b.cash-a.cash),14);assert.equal(Math.round(before-a.cash),Math.round(r.paid));assert.equal(accruedTotal(a),0);
 const g=newGame(w),s=g.ships[0];hireCaptain(g,s,captainRoster(g,s.at)[0].id);doSail(g,s,'lisboa');advanceDay(g);assert.equal(g.accrued.captains[s.id],2);
});
