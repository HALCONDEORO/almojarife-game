// Original campaign progression. Historical context is separate from fictional gameplay goals.
export const CAMPAIGNS = Object.freeze([
  Object.freeze({id:'river-1503',home:'sevilla',year:1503,title:{es:'Una casa junto al río',en:'A house by the river'}}),
  Object.freeze({id:'wool-1511',home:'bilbao',year:1511,title:{es:'Lana y hierro',en:'Wool and iron'}}),
  Object.freeze({id:'departure-1519',home:'sevilla',year:1519,title:{es:'Antes de la partida',en:'Before the departure'}}),
]);
export function campaignById(id){return CAMPAIGNS.find(c=>c.id===id)??null;}
export function newCampaign(id){if(!campaignById(id))throw Error('unknown campaign');return {id,bought:0,sailed:false,arrived:false,sold:0,readReport:false,completed:false};}
/** Explicit successful player-action events only; no parsing translated logs. No general game side effects. */
export function campaignEvent(g,event){
 const c=g.campaign;if(!c||!campaignById(c.id)||c.completed)return false;
 // Only the first chapter has tested rules yet. Later chapters remain unavailable in UI.
 if(c.id!=='river-1503')return false;
 if(event.kind==='buy'&&Number.isSafeInteger(event.qty)&&event.qty>0)c.bought+=event.qty;
 if(event.kind==='sail'&&c.bought>0){c.sailed=true;c.destination=event.to;}
 if(event.kind==='arrival'&&c.sailed&&event.city===c.destination)c.arrived=true;
 if(event.kind==='sell'&&c.arrived&&event.city===c.destination&&Number.isSafeInteger(event.qty)&&event.qty>0)c.sold+=event.qty;
 if(event.kind==='readReport'&&c.sold>0)c.readReport=true;
 c.completed=c.bought>0&&c.sailed&&c.arrived&&c.sold>0&&c.readReport;
 return c.completed;
}
export function campaignSteps(g){const c=g.campaign;if(!c||!campaignById(c.id))return [];return [c.bought>0,c.sailed,c.arrived,c.sold>0,c.readReport];}
