// Isolated planned-NPC stress test. Does not enable the plan in newGame.
import { loadWorld } from '../src/sim/world.mjs';
import { npcPlan } from '../src/sim/npcplan.mjs';
import { makeMarket, tickMarket } from '../src/sim/market.mjs';
import { makeShip, tickShip, sailTick } from '../src/sim/trade.mjs';
import { TICKS_PER_DAY } from '../src/sim/clock.mjs';
import { aiStep } from '../src/sim/ai.mjs';
import fs from 'node:fs';
const world=loadWorld(), historical=JSON.parse(fs.readFileSync(new URL('../data/population-1500.json',import.meta.url))).cities;
const planned=process.argv.includes('--planned'), days=365, start=performance.now();
const allocation=npcPlan(world,{historical}), market=makeMarket(world);
const origins=planned ? allocation.ports.flatMap((r)=>Array(r.count).fill(r.city)) : Array.from({length:3},(_,i)=>world.cities[(i*3+1)%world.cities.length].id);
const traders=origins.map((at,i)=>({cash:2000,ship:makeShip(i,i%2?'caravel':'cog',at)}));
const arrivals=Object.fromEntries(world.cities.map((c)=>[c.id,0]));let clamps=0,samples=0,maxDayMs=0;
for(let day=0;day<days;day++){
  const t=performance.now(); tickMarket(market,day,world);
  for(const tr of traders){
   let acted=false; // decided on the arrival tick already (same rule as sim_1000y/sim_economy)
   for(let i=0;i<TICKS_PER_DAY&&tr.ship.voyage;i++)if(sailTick(tr.ship)){tickShip(tr.ship,true);arrivals[tr.ship.at]++;aiStep(world,market,tr,tr.ship);acted=true;} // act on the arrival tick
   tickShip(tr.ship);if(!acted)aiStep(world,market,tr,tr.ship); // daily wear; docked traders decide once a day
  }
  maxDayMs=Math.max(maxDayMs,performance.now()-t);
  for(const city of Object.values(market))for(const e of Object.values(city)){
    if(!Number.isInteger(e.stock)||e.stock<0)throw new Error('invalid stock');
    const raw=(e.target/Math.max(1,e.stock))**0.6;samples++;if(raw>=3||raw<=0.4)clamps++;
  }
  if(traders.some((tr)=>!Number.isFinite(tr.cash)||tr.cash<0))throw new Error('invalid trader cash');
}
console.log(JSON.stringify({scope:'Isolated raw NPC trading test, no player costs or mission. All merchants use current greedy policy; starting coverage does not guarantee destination coverage.',planned,traders:traders.length,days,elapsedMs:Math.round(performance.now()-start),maxDayMs:Math.round(maxDayMs),clampShare:clamps/samples,portsWithArrival:Object.values(arrivals).filter((n)=>n>0).length,arrivals,totalTraderCash:traders.reduce((n,t)=>n+t.cash,0),allocation:planned?allocation:null},null,2));
