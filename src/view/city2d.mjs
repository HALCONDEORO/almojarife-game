// Presentation only: all data from the simulation and canonical layout stays immutable.
export const visualState=b=>!b||b.state==='plot'?'plot':b.state==='construction'?'construction':b.halted?'halted':'active';
export const project=(x,y,u=18)=>({x:(x-y)*u,y:(x+y)*u/2});
export function placement(plot,u=18){
 if(!plot||![plot.x,plot.y,plot.w,plot.d,u].every(Number.isFinite)||plot.w<=0||plot.d<=0||u<=0)throw Error('invalid plot');
 const inset=.12, x=plot.x+inset,y=plot.y+inset,w=Math.max(.1,plot.w-2*inset),d=Math.max(.1,plot.d-2*inset);
 const polygon=[[x,y],[x+w,y],[x+w,y+d],[x,y+d]].map(([a,b])=>project(a,b,u));
 const anchor=polygon[2],left=Math.min(...polygon.map(p=>p.x)),right=Math.max(...polygon.map(p=>p.x));
 return {id:plot.id,polygon,anchor,width:right-left,depth:plot.x+plot.y+plot.w+plot.d,world:{x,y,w,d}};
}
export function overlaps(a,b){const A=a.world,B=b.world;return A.x<B.x+B.w&&A.x+A.w>B.x&&A.y<B.y+B.d&&A.y+A.d>B.y;}
export function validateOccupancy(plots){const ids=new Set(),placed=plots.map(p=>{if(ids.has(p.id))throw Error('duplicate plot');ids.add(p.id);return placement(p)}),collisions=[];for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++)if(overlaps(placed[i],placed[j]))collisions.push([placed[i].id,placed[j].id]);return {count:placed.length,collisions};}
export function resolveVisual(plot,b){const state=visualState(b),type=b?.type||plot.type;return {type,level:Math.max(1,Math.min(3,b?.level||1)),nextLevel:b?.nextLevel||1,state,owned:!!b};}
/** Cosmetic only. Never stored in a save or used by the simulation. */
export function houseStyle(id){let n=0;for(const c of String(id))n=(n*31+c.charCodeAt(0))>>>0;return ['poor','comfortable','rich'][n%3];}
export function assetKey(plot,b){const v=resolveVisual(plot,b);return `${v.type==='house'?'house_'+houseStyle(plot.id):v.type}:${v.level}`;}
export function enabled(search){return new URLSearchParams(search).get('city2d')==='1';}
