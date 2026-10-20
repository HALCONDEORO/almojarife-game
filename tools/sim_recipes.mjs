// Isolated candidate-material demand, not enabled game construction or player spending.
import {loadWorld} from '../src/sim/world.mjs';import {makeMarket,tickMarket} from '../src/sim/market.mjs';
import {makeShip,tickShip} from '../src/sim/trade.mjs';import {aiStep} from '../src/sim/ai.mjs';
import {consumeRecipe} from '../src/sim/recipes.mjs';
const world=loadWorld(),enabled=process.argv.includes('--recipes'),m=makeMarket(world);
const traders=Array.from({length:6},(_,i)=>({cash:2000,ship:makeShip(i,i%2?'caravel':'cog',world.cities[i].id)}));
const consumed={},made={},failures={},counts={};let samples=0,pins=0,spent=0;
for(let day=0;day<1095;day++){
 tickMarket(m,day,world);
 for(const tr of traders){tickShip(tr.ship);aiStep(world,m,tr,tr.ship);}
 if(enabled&&day%30===0)for(const c of world.cities){
  // Hypothetical town budget. Not minted player money, not evidence of actual buildings.
  const recipe=day%90===0?'barca':day%60===0?'warehouse':'weave';
  const r=consumeRecipe(world,m,c.id,recipe,500);
  if(r.ok){spent+=r.cost;counts[recipe]=(counts[recipe]??0)+1;for(const[g,n]of Object.entries(r.inputs))consumed[g]=(consumed[g]??0)+n;for(const[g,n]of Object.entries(r.outputs))made[g]=(made[g]??0)+n;}
  else failures[r.reason]=(failures[r.reason]??0)+1;
 }
 for(const city of Object.values(m))for(const e of Object.values(city)){
  if(!Number.isSafeInteger(e.stock)||e.stock<0)throw Error('invalid stock');
  const raw=(e.target/Math.max(1,e.stock))**0.6;samples++;if(raw>=3||raw<=0.4)pins++;
 }
}
console.log(JSON.stringify({scope:'Isolated 1095-day six-bot stress test. Candidate monthly town input purchases use a hypothetical 500-coin budget per event. Not player finance, not factories or construction enabled in game.',recipes:enabled,days:1095,counts,consumed,made,failedPurchases:failures,hypotheticalSpend:spent,exactClampShare:pins/samples,finalNpcCash:traders.reduce((n,t)=>n+t.cash,0)},null,2));
