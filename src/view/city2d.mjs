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

/** Presentation coast. Every point remains outside the occupied bounding rectangle. */
export function shoreline(bounds,seed='city'){
 const {minX,minY,maxX,maxY}=bounds;
 if(![minX,minY,maxX,maxY].every(Number.isFinite)||minX>=maxX||minY>=maxY)throw Error('invalid coast');
 let n=0;for(const c of String(seed))n=(n*31+c.charCodeAt(0))>>>0;
 const bump=i=>1.4+((n+i*73)%17)/6,pts=[];
 // North/west form natural land, east keeps its straight working quay.
 for(let i=0;i<=12;i++)pts.push([minX+(maxX-minX)*i/12,minY-bump(i)]);
 pts.push([maxX+1,minY],[maxX+1,maxY]);
 for(let i=12;i>=0;i--)pts.push([minX+(maxX-minX)*i/12,maxY+bump(i+17)]);
 for(let i=12;i>=0;i--)pts.push([minX-bump(i+29),minY+(maxY-minY)*i/12]);
 return pts;
}

/** A coastal town is attached to mainland, never surrounded by sea. */
export function mainland(bounds){
 const {minX,minY,maxX,maxY}=bounds;
 if(![minX,minY,maxX,maxY].every(Number.isFinite)||minX>=maxX||minY>=maxY)throw Error('invalid mainland');
 const back=Math.max(maxX-minX,maxY-minY)*8;
 return [[minX-back,minY-back],[maxX+3,minY-back],[maxX+3,minY-12],[maxX+3,minY],[maxX+3,maxY-5],[maxX+3,maxY+5],[maxX-5,maxY+5],[minX,maxY+5],[minX-12,maxY+5],[minX-back,maxY+5]];
}

/** Decorative waterfront stays outside every canonical plot, not a purchasable dock. */
export function harbourLayout(bounds){
 const {minX,minY,maxX,maxY}=bounds;
 if(![minX,minY,maxX,maxY].every(Number.isFinite)||minX>=maxX||minY>=maxY)throw Error('invalid harbour');
 const edge=maxX+3,span=maxY-minY;
 return {edge,span,piers:Array.from({length:3},(_,i)=>({x:edge,y:minY+span*(.22+i*.25),w:7+i%2*2,d:2.1}))};
}

/** One footprint anchor shared by the sprite and its ground contact. */
export function spriteGeometry(plot){
 const p=placement(plot),scale=p.width*.94/400;
 return {anchor:p.anchor,scale,left:p.anchor.x-256*scale,top:p.anchor.y-500*scale,width:512*scale,height:512*scale};
}

/** Fade only a nearer silhouette that covers the selected plot centre. */
export function obscuresSelection(front,selected){
 if(!selected||front.id===selected.id||placement(front).depth<=placement(selected).depth)return false;
 const g=spriteGeometry(front),c=project(selected.x+selected.w/2,selected.y+selected.d/2);
 return c.x>g.left&&c.x<g.left+g.width&&c.y>g.top&&c.y<g.top+g.height;
}
