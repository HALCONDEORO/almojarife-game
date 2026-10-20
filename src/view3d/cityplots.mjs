// Project adapter for MIT gen-city. Vendor attribution lives in vendor/gen-city/PROVENANCE.md.
import {City,CityGenerationMode} from '../../vendor/gen-city/index.mjs';
import {seeded} from '../view/cityscene.mjs';
/** Isolated layout prototype, no simulation state or real services changed. */
export async function cityPlots(id='cadiz',pop=8000){
 if(typeof id!=='string'||!Number.isFinite(pop)||pop<0)throw Error('invalid city');
 const size=pop>=25000?72:pop>=10000?60:48,r=seeded(`plots-v1:${id}`);
 // Upstream seed mode accepts1000 but its integer range can then exceed max. Never emit1000.
 const seed=Array.from({length:256},()=>Math.floor(r()*1000));
 const city=new City({width:size,height:size});await city.generate({mode:CityGenerationMode.SEED,seed,streetMinLength:8,buildingMinSize:3,buildingMaxSize:5,probabilityIntersection:.15});
 const paths=city.getAllPaths().map(p=>p.getPositions()).filter(p=>p.beg.x!==p.end.x||p.beg.y!==p.end.y);
 const services=['market','shipyard','tavern','bank','office','warehouse'];
 const plots=city.getAllBuildings().map((b,i)=>({id:`${id}:${i}`,type:services[i]??(b.position.y<size/3?'warehouse':b.position.y<size*2/3?'workshop':'house'),x:b.position.x,y:b.position.y,w:b.width,d:b.height}));
 return {id,size,paths,plots,version:1};
}
