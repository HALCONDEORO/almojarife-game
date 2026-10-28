// Optional justice data must never prevent the main trading game from starting.
import {setJusticeData} from './justicewire.mjs';
import {validateRealms} from './marque.mjs';
import {validateCourts} from './justice.mjs';
export async function loadJusticeData(fetcher, ports, timeoutMs = 2500) {
 const controller = new AbortController(); let timer;
 try {
  const deadline = new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);});
  const [realms,courts]=await Promise.race([deadline,Promise.all(['realms','courts'].map(async name=>{
   const r=await fetcher(`../data/${name}.json`,{signal:controller.signal});if(!r.ok)throw Error('unavailable');return r.json();
  }))]);
  if(!realms||!courts||Array.isArray(realms)||Array.isArray(courts)||!realms.realms||!Array.isArray(realms.holdings)||!courts.byRealm||!courts.byPort||validateRealms(realms,ports).length||validateCourts(courts,ports,realms).length)throw Error('invalid data');
  setJusticeData(realms,courts);return {realms,courts,ready:true};
 }catch{
  setJusticeData(null);return {realms:null,courts:null,ready:false};
 }finally{clearTimeout(timer);}
}

/** Bound any optional JSON dependency before the title, including a hung body. */
export async function optionalJson(fetcher,url,timeoutMs=2500){
 const controller=new AbortController();let timer;
 try{return await Promise.race([new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},timeoutMs);}),Promise.resolve().then(()=>fetcher(url,{signal:controller.signal})).then(r=>r.ok?r.json():null)]);}catch{return null;}finally{clearTimeout(timer);}
}
