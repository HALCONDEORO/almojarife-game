// Castilian place and seafaring names for the game's setting. Proper names do not translate.
export const SHIP_NAMES=Object.freeze(['Buenaventura','Estrella del Mar','Esperanza','Mar Serena','Albatros','Golondrina','Aurora','Lucero','Brisa','Fortuna','Castilla','Andalucía','Vizcaya','Cantabria','La Perla','La Leona','La Dorada','La Veloz','La Valiente','La Constante','La Peregrina','La Galana','La Soberana','La Victoria']);
const key=s=>String(s).trim().normalize('NFKC').toLocaleLowerCase('es');
export function defaultShipName(id,ships=[]){
 const used=new Set(ships.map(s=>key(s.name??''))),start=Number.isSafeInteger(id)&&id>0?id-1:0;
 for(let n=start;;n++){const base=SHIP_NAMES[n%SHIP_NAMES.length],cycle=Math.floor(n/SHIP_NAMES.length),name=base+(cycle?' '+(cycle+1):'');if(!used.has(key(name)))return name;}
}
export function fillShipNames(ships){
 const named=ships.filter(s=>typeof s.name==='string'&&s.name.trim());
 for(const s of ships)if(typeof s.name!=='string'||!s.name.trim()){s.name=defaultShipName(s.id,named);named.push(s);}
 return ships;
}
export const shipDisplayName=(s,types={})=>(typeof s?.name==='string'&&s.name.trim())||`${types[s?.type]??s?.type??''} ${s?.id??''}`.trim();
