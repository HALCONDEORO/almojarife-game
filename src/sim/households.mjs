// Laboratory foundation: one spending purse per social class, shared by its entire basket.
// No default income calibration. Caller owns the explicit daily income and class basket.
import { CLASSES } from './classes.mjs';
import { price } from './market.mjs';
export function quoteHouseholdDemand(world, market, households, { counts, demandBy, incomePerPerson, food = [] }) {
  const next = {...households}, remaining = Object.fromEntries(Object.entries(market).map(([k,e])=>[k,e.stock]));
  const byClass = {}, consumedByGood = {}, spentByGood = {};
  const goods=Object.keys(market).sort(), cachedPrices={}, cachedDemand={};
  for(const good of goods){const p=price(world,market[good],good);cachedPrices[good]=p;cachedDemand[good]=demandBy(good,p/world.goods[good].base);}
  const foodSet=new Set(food),groups=[goods.filter(g=>foodSet.has(g)),goods.filter(g=>!foodSet.has(g))];
  for (const cls of CLASSES) {
    const old = next[cls] ?? {cash:0,carryByGood:{}}, income = counts[cls] * incomePerPerson[cls];
    if (!Number.isFinite(income) || income < 0 || !Number.isFinite(old.cash) || old.cash < 0) throw new Error('invalid household cash or income');
    let cash = old.cash + income;
    const wish = {}, prices = {}, carry = {...old.carryByGood};
    for (const good of goods) {
      const p = cachedPrices[good], d = cachedDemand[good][cls] ?? 0;
      if (!Number.isFinite(d)||d<0) throw new Error('invalid household demand');
      // Unmet wants are not orders or debt: carry retains only fractional current demand.
      const desired = d + (carry[good] ?? 0); carry[good] = desired - Math.floor(desired);
      wish[good] = Math.min(remaining[good],Math.floor(desired)); prices[good] = p;
    }
    const units = {}, spending = {};
    for (const group of groups) {
      const wantedCost = group.reduce((s,k)=>s+wish[k]*prices[k],0);
      const share = wantedCost > cash ? cash / wantedCost : 1;
      for (const good of group) {
        const n = Math.min(wish[good],Math.floor(wish[good]*share)), cost=n*prices[good];
        units[good]=n;spending[good]=cost;cash-=cost;remaining[good]-=n;
        consumedByGood[good]=(consumedByGood[good]??0)+n;
        spentByGood[good]=(spentByGood[good]??0)+cost;
      }
      // Use affordable integer leftovers within this priority group before luxury.
      // Stable good order makes save/reload and object insertion order irrelevant.
      for (const good of [...group].sort((a,b)=>prices[a]-prices[b]||a.localeCompare(b))) {
        const extra=Math.min(wish[good]-units[good],Math.floor(cash/prices[good]));
        const cost=extra*prices[good];units[good]+=extra;spending[good]+=cost;
        cash-=cost;remaining[good]-=extra;consumedByGood[good]+=extra;spentByGood[good]+=cost;
      }
    }
    next[cls]={cash,carryByGood:carry};
    byClass[cls]={income,spent:old.cash+income-cash,cash,units,spending};
  }
  return {households:next,byClass,consumedByGood,spentByGood,
    retailRevenue:Object.values(spentByGood).reduce((s,n)=>s+n,0)};
}
export function settleHouseholdDemand(world, market, meta, policy) {
  const q=quoteHouseholdDemand(world,market,meta.households,policy);
  for(const [good,n]of Object.entries(q.consumedByGood)) market[good].stock-=n;
  meta.households=q.households;
  return q;
}
