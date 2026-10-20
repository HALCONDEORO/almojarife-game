// Original automatic sea encounter rules, independent of UI and not enabled by this module.
import {defenceOf} from './crew.mjs';
const skill=(ship,key)=>{const n=ship.captain?.[key];return Number.isSafeInteger(n)&&n>=0&&n<=3?n:0;};
const unit=n=>{if(!Number.isFinite(n)||n<0||n>=1)throw Error('roll must be finite in [0,1)');return n;};
/** Resolve a single encounter with supplied random draws. No mutation, money or hidden user choice. */
export function encounterOutcome(ship,kind,roll){
 const r=unit(roll);
 if(kind==='pirates'){
  const defence=defenceOf(ship)+skill(ship,'defence')*6;
  const chance=Math.min(0.9,0.2+defence/150);
  const won=r<chance;
  return {kind,result:won?'repelled':'raided',defence,chance,hullLoss:won?2:10,cargoLossPct:won?0:20,delay:won?0:1};
 }
 if(kind==='storm'){
  const reduction=skill(ship,'weather')*0.15;
  const severe=r>=0.7;
  return {kind,result:severe?'severe':'weathered',weatherReduction:reduction,hullLoss:Math.ceil((severe?12:6)*(1-reduction)),cargoLossPct:Math.ceil((severe?10:4)*(1-reduction)),delay:severe?2:1};
 }
 throw Error('unknown encounter');
}
/** Apply once to a live owned ship at sea. Caller must prevent duplicate event ids before calling. */
export function applyEncounter(g,ship,outcome){
 if(g.over||!g.ships?.includes(ship)||!ship.voyage)return {ok:false,reason:'no active owned voyage'};
 if(!outcome||!['pirates','storm'].includes(outcome.kind)||!Number.isFinite(outcome.hullLoss)||outcome.hullLoss<0||outcome.hullLoss>100||!Number.isFinite(outcome.cargoLossPct)||outcome.cargoLossPct<0||outcome.cargoLossPct>100||!Number.isSafeInteger(outcome.delay)||outcome.delay<0||outcome.delay>2)return {ok:false,reason:'bad outcome'};
 const before=ship.hull??100;ship.hull=Math.max(10,before-outcome.hullLoss);
 let cargoLost=0;
 for(const [good,q] of Object.entries(ship.cargo??{})){
  const lost=Math.min(q,Math.ceil(q*outcome.cargoLossPct/100));cargoLost+=lost;
  ship.cargo[good]=q-lost;if(!ship.cargo[good])delete ship.cargo[good];
  // Basis is currently global by good, not per ship. Remove the lost share from that book too.
  const b=g.basis?.[good];if(b&&b.qty>0){const used=Math.min(lost,b.qty),unit=b.cost/b.qty;b.qty-=used;b.cost=Math.max(0,b.cost-used*unit);}
 }
 ship.voyage.daysLeft+=outcome.delay;ship.voyage.totalDays=Math.max((ship.voyage.totalDays??ship.voyage.daysLeft-outcome.delay)+outcome.delay,ship.voyage.daysLeft);
 return {ok:true,...outcome,hullLost:before-ship.hull,cargoLost};
}

export function encounterText(e,lang='es'){
 const es=lang==='es',kind=e.kind==='pirates'?(es?'Piratas':'Pirates'):(es?'Tormenta':'Storm');
 const result=e.result==='repelled'?(es?'rechazados':'repelled'):e.result==='raided'?(es?'asalto sufrido':'raided'):e.result==='severe'?(es?'fuerte':'severe'):(es?'superada':'weathered');
 return es?`${kind}: ${result}. Casco -${e.hullLost}; carga perdida ${e.cargoLost}; retraso ${e.delay} días.`:`${kind}: ${result}. Hull -${e.hullLost}; cargo lost ${e.cargoLost}; delay ${e.delay} days.`;
}
