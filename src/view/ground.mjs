// Presentation-only ground types and texture layers for the 2D city view.
// Pure data and geometry: no canvas, no DOM, no simulation reads, nothing saved.
// The painter lives in web/city2d/scene.mjs; every palette and zone rule comes from here.

/** Deterministic hash -> [0,1). Same input, same output on every machine. */
export const hash01=(i,salt=0)=>{let n=((i>>>0)*2654435761+((salt>>>0)*40503))>>>0;n^=n>>>15;n=(n*2246822519)>>>0;n^=n>>>13;return (n>>>0)/4294967296};

/**
 * Ground type registry. Each type carries localized names, a base wash and
 * ordered texture layers (bottom to top). Layer kinds the painter understands:
 *  - grain:   deterministic speckle ellipses, colours picked by hash
 *  - tufts:   short grass strokes at a fraction (`chance`) of grain points
 *  - ripples: small wind arcs on sand at a fraction (`chance`) of grain points
 *  - joints:  paving grid, `step` in world units, `width` in zoom units
 *  - furrows: parallel plough lines, `step` in world units
 *  - wear:    lighter centre line along a road, `width` in zoom units
 * Colours are plain hex so tests can validate them and the painter can set alpha.
 */
export const GROUND_TYPES={
 tierra:{names:{es:'Tierra batida',en:'Packed earth'},base:'#b8a67a',layers:[
  {kind:'grain',colors:['#e0d1a8','#c9b586','#978a63','#64794f'],alpha:.18}]},
 empedrado:{names:{es:'Empedrado',en:'Cobbled paving'},base:'#cfc0a0',layers:[
  {kind:'joints',colors:['#a2946f'],alpha:.55,step:2.3,width:1.1},
  {kind:'grain',colors:['#e6d9b8','#b3a481','#8d8064'],alpha:.22}]},
 camino:{names:{es:'Camino de tierra',en:'Dirt road'},base:'#e4d3ad',layers:[
  {kind:'wear',colors:['#f0e2bd'],alpha:.45,width:3},
  {kind:'grain',colors:['#f0e2bd','#cbb98e'],alpha:.20}]},
 pradera:{names:{es:'Pradera',en:'Grassland'},base:'#a9ad7e',layers:[
  {kind:'grain',colors:['#c0c68c','#8f9a6b','#c9bd8a'],alpha:.20},
  {kind:'tufts',colors:['#6f7d4f','#7f8c57'],alpha:.65,chance:.30}]},
 matorral:{names:{es:'Matorral',en:'Scrubland'},base:'#9a9c6c',layers:[
  {kind:'grain',colors:['#8a8f60','#b0a873','#7c8156'],alpha:.22},
  {kind:'tufts',colors:['#5f6c46','#6d6a43'],alpha:.70,chance:.50}]},
 campo:{names:{es:'Campo de cultivo',en:'Ploughed field'},base:'#9ca16b',tones:['#9ca16b','#b4a573','#b9ac7a','#939a69'],layers:[
  {kind:'furrows',colors:['#626e47'],alpha:.28,step:1,width:1},
  {kind:'grain',colors:['#b4a573','#8a8f60'],alpha:.18}]},
 arena:{names:{es:'Arena',en:'Sand'},base:'#ddc88f',layers:[
  {kind:'grain',colors:['#eedaa6','#c9b078'],alpha:.24},
  {kind:'ripples',colors:['#c3ad79'],alpha:.40,chance:.16}]},
};

/** Classification priority, highest first. Every zone id exists in GROUND_TYPES. */
export const GROUND_ORDER=['empedrado','camino','campo','tierra','arena','matorral','pradera'];

const checkBounds=b=>{if(!b||![b.minX,b.minY,b.maxX,b.maxY].every(Number.isFinite)||b.minX>=b.maxX||b.minY>=b.maxY)throw Error('invalid bounds')};

/** Decorative farmland patches west of the district (world rects, deterministic). */
export function fieldPatches(bounds){
 checkBounds(bounds);const{minX,minY}=bounds;
 return Array.from({length:9},(_,i)=>({x:minX-7-(i%3)*10,y:minY-5-Math.floor(i/3)*12,w:8,d:9}));
}

/**
 * Soft scrubland blobs over the grass, deterministic, kept clear of the
 * district, the farmland patches and the southern sand band.
 */
export function scrubPatches(bounds){
 checkBounds(bounds);const{minX,minY,maxX,maxY}=bounds,out=[];
 const fields=fieldPatches(bounds); // fixed for every candidate in this call
 for(let i=0;out.length<12&&i<60;i++){
  const x=minX-64+hash01(i,11)*(maxX-minX+58),y=minY-58+hash01(i,12)*(maxY-minY+56);
  const rx=5+hash01(i,13)*9,ry=4+hash01(i,14)*7;
  if(x+rx>minX-4&&x-rx<maxX+4&&y+ry>minY-4&&y-ry<maxY+4)continue; // clear of the district
  if(y>maxY-2)continue; // never on the sand band
  if(fields.some(f=>x>f.x-rx&&x<f.x+f.w+rx&&y>f.y-ry&&y<f.y+f.d+ry))continue;
  out.push({x,y,rx,ry});
 }
 return out;
}

const segDist=(x,y,a,b)=>{
 const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy;
 if(!l2)return Math.hypot(x-a.x,y-a.y);
 const t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/l2));
 return Math.hypot(x-(a.x+t*vx),y-(a.y+t*vy));
};

/**
 * Ground type at a world point. ctx: {bounds, plaza?, paths?}.
 * Follows GROUND_ORDER; anything unclaimed outside the district is grassland.
 */
export function groundZoneAt(x,y,ctx){
 if(!ctx)throw Error('invalid ground context');
 const{bounds,plaza,paths}=ctx;checkBounds(bounds);
 if(![x,y].every(Number.isFinite))throw Error('invalid point');
 const{minX,minY,maxX,maxY}=bounds;
 if(plaza&&x>=plaza.x&&x<=plaza.x+plaza.w&&y>=plaza.y&&y<=plaza.y+plaza.d)return'empedrado';
 for(const p of paths||[])if(p&&p.beg&&p.end&&segDist(x,y,p.beg,p.end)<1.6)return'camino';
 for(const f of fieldPatches(bounds))if(x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.d)return'campo';
 if(x>=minX&&x<=maxX&&y>=minY&&y<=maxY)return'tierra';
 if(x>maxX&&x<=maxX+3&&y<=maxY)return'tierra'; // working quay strip, under the stone apron
 if(y>maxY+1&&y<maxY+18&&x<maxX-3)return'arena'; // sand band along the curved south coast
 for(const s of scrubPatches(bounds))if(((x-s.x)/s.rx)**2+((y-s.y)/s.ry)**2<=1)return'matorral';
 return'pradera';
}
