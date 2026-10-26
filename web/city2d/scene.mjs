import {urbanLayout} from '../../src/view/urbanlayout.mjs';
import {cityPlots} from '../../src/view3d/cityplots.mjs';
import {project,placement,resolveVisual,assetKey,mainland,harbourLayout,harbourShipBerths,spriteGeometry,obscuresSelection} from '../../src/view/city2d.mjs';
import {GROUND_TYPES,groundZoneAt,fieldPatches,scrubPatches,hash01} from '../../src/view/ground.mjs';
import {industrySpots,industryClusters} from '../../src/view/industry2d.mjs'; // the town's real works on the plan (townIndustry flag)
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search),city=q.get('city')||'huelva',pop=Number(q.get('pop')||8000),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const wallsLvl=(v)=>{const n=Number(v);return Number.isInteger(n)&&n>=0&&n<=3?n:0}; // numeric wall level 0-3 (WALL_MAX_LEVEL); anything else is 0, never truthy garbage
let walls=wallsLvl(q.get('walls')),bld={},labels={},tick=0,ships=[],civic=[];function parse(s,fallback){try{return JSON.parse(s)||fallback}catch{return fallback}}bld=parse(q.get('bld'),{});labels=parse(q.get('labels'),{});tick=Number(q.get('tick')||0);
const qnames=parse(q.get('names'),{}),qtnames=parse(q.get('tnames'),{}),qbnames=parse(q.get('bnames'),{});
const names={house:'Casa',warehouse:'Almacén',workshop:'Taller',farm:'Granja',pasture:'Dehesa',sawmill:'Aserradero',mine:'Mina',oil_mill:'Almazara',vineyard:'Viñedo',saltworks:'Salina',brewery:'Cervecería',soapworks:'Jabonería',pottery:'Alfarería',brickworks:'Ladrillera',esparto_field:'Espartizal',ranch:'Ganadería',armory:'Armería',dock:'Muelle',fishery:'Pesquería',ironworks:'Fragua',posito:'Pósito',hospital:'Hospital',alhondiga:'Alhóndiga',caminos:'Caminos',pozo:'Pozo',capilla:'Capilla',market:'Mercado',shipyard:'Astillero',tavern:'Taberna',bank:'Banco',office:'Oficina',carniceria:'Carnicería',molino:'Molino',corral:'Corral de comedias'};
const dispNames=()=>({...names,...qbnames,...qtnames,...qnames}); // localized: bnames covers every buildable type, names/tnames the service and town buildings; the ES map is the last fallback
const CHROME={es:{fit:'Encajar',zoomIn:'Acercar',zoomOut:'Alejar',plots:'Parcelas',preview:'Vista previa',indVarious:'varios vecinos',construct:'Vista de construcción',motion:'Animaciones',level:'Nivel',plan:'Plano de la ciudad',typeAria:'Edificio de la vista previa',levelAria:'Nivel de la vista previa',plot:'Parcela',previewTip:'Vista previa sin compra',loadError:'No se pudo cargar la ciudad. Puedes seguir usando el panel de edificios o volver al mapa.',title:'El Almojarife · Ciudad mediterránea'},en:{fit:'Fit',zoomIn:'Zoom in',zoomOut:'Zoom out',plots:'Plots',preview:'Preview',indVarious:'several owners',construct:'Build view',motion:'Animations',level:'Level',plan:'City plan',typeAria:'Preview building',levelAria:'Preview level',plot:'Plot',previewTip:'Preview without buying',loadError:'The city could not be loaded. You can still use the buildings panel or go back to the map.',title:'El Almojarife · Mediterranean city'}};
const uiLangC=()=>localStorage.getItem('lang')||(navigator.language?.toLowerCase().startsWith('es')?'es':'en'); // same rule as main.mjs
const chrome=()=>CHROME[uiLangC()==='en'?'en':'es'];
const applyChrome=()=>{const c=chrome();document.title=c.title;const cv=document.querySelector('canvas');if(cv)cv.setAttribute('aria-label',c.plan);$('fit').setAttribute('aria-label',c.fit);$('plus').setAttribute('aria-label',c.zoomIn);$('minus').setAttribute('aria-label',c.zoomOut);$('grid').textContent=c.plots;$('build').textContent=c.preview;$('motion').setAttribute('aria-label',c.motion);$('construct').setAttribute('aria-label',c.construct);$('construct').title=c.construct;$('type').setAttribute('aria-label',c.typeAria);$('level').setAttribute('aria-label',c.levelAria);[...$('level').options].forEach((o,i)=>o.textContent=c.level+' '+(i+1));};
let minZoom=.1,bounds,manifestBounds,layout,manifest,images={},visTop={},industry=[],indSpots=null,zoom=1,dx=0,dy=0,selected=null,hover=null,drag=null,moved=0,grid=false,preview=false,animate=!matchMedia('(prefers-reduced-motion: reduce)').matches,frame=0,last=0,dirty=true;
const boot=async()=>{applyChrome();layout=urbanLayout(await cityPlots(city,pop),pop);bounds=layout.visualBounds;manifestBounds=[[bounds.minX,bounds.minY],[bounds.maxX,bounds.minY],[bounds.maxX,bounds.maxY],[bounds.minX,bounds.maxY]].map(([x,y])=>project(x,y));manifest=await(await fetch('manifest.json')).json();const vc=document.createElement('canvas');vc.width=vc.height=128;const vg=vc.getContext('2d',{willReadFrequently:true});
const measure=(k,im)=>{vg.clearRect(0,0,128,128);vg.drawImage(im,0,0,128,128);const d=vg.getImageData(0,0,128,128).data;let r=0;while(r<128){let hit=false;for(let c=51;c<77;c++)if(d[(r*128+c)*4+3]>10){hit=true;break}if(hit)break;r++}let b=127;while(b>r){let hit=false;for(let c=0;c<128;c++)if(d[(b*128+c)*4+3]>10){hit=true;break}if(hit)break;b--}visTop[k]=(r+(b-r)*0.30)/128};
const loadAsset=async([k,v])=>{const im=new Image;im.src=v.file;try{await im.decode();images[k]=im;measure(k,im)}catch{throw Error('Missing art '+v.file)}};
/* Staged loading: the first frame waits only for the art this city shows now (level 1 of every type, the current housing level, owned types, walls, plaza); the other levels load in the background and trigger a redraw. */
const ownedTypes=new Set(Object.values(bld||{}).map(x=>x&&x.type).filter(Boolean)),hl=layout.housing.level;
const essential=([k])=>{const [t,l]=k.split(':');return l==='1'||t==='wall'||t==='gate'||t==='construction'||ownedTypes.has(t)||(t.startsWith('house')&&+l===hl)||k==='house_rich:2'||k==='alhondiga:2'};
const all=Object.entries(manifest.assets);await Promise.all(all.filter(essential).map(loadAsset));
const deferred=all.filter(e=>!essential(e));
for(const n of ['cobble','muelle','barco','arboles']){const im=new Image;im.src='assets/'+n+'.webp';await im.decode();images[n]=im}for(const t of['barca','cog','caravel','nao']){const im=new Image;im.src='assets/ships/'+t+'.svg';try{await im.decode();images['ship:'+t]=im}catch{}}for(const k of Object.keys(names)){if(['market','shipyard','tavern','bank','office'].includes(k))continue;const o=document.createElement('option');o.value=k;o.textContent=dispNames()[k];$('type').append(o)};const note=document.createElement('div');note.className='housing-scale';note.style.cssText='position:fixed;bottom:8px;left:8px;background:#f6e9cce8;color:#493c25;padding:6px 9px;font:12px Georgia;pointer-events:none';note.textContent=uiLangC()==='en'?`Residential groups: ${layout.housing.groups} · ≈ ${layout.housing.peoplePerGroup} people per house drawing (visual scale)`:`Conjuntos residenciales: ${layout.housing.groups} · ≈ ${layout.housing.peoplePerGroup} habitantes por casa dibujada (escala visual)`;document.body.append(note);fit();buildLabels();requestAnimationFrame(loop);window.__ready=true;Promise.all(deferred.map(e=>loadAsset(e).catch(()=>{}))).then(()=>{dirty=true});try{parent.postMessage({kind:"city2d-ready",city},location.origin);postView()}catch{}};
const xy=(x,y)=>{const p=project(x,y);return{x:canvas.width/2+(p.x+dx)*zoom,y:35+(p.y+dy)*zoom}};
/* A lot for sale fills its block (inset from the streets), whatever its w x d; a built or building lot keeps its own footprint. */
const freeFit=p=>p&&p.cell&&lotSet().has(p)&&!bld[p.id]?{...p,x:p.cell.x+.5,y:p.cell.y+.5,w:p.cell.w-1,d:p.cell.d-1}:p;
function polygon(p){ctx.beginPath();placement(freeFit(p)).polygon.forEach((v,i)=>{const x=canvas.width/2+(v.x+dx)*zoom,y=35+(v.y+dy)*zoom;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}
function fit(){dirty=true;if(!layout)return;canvas.width=innerWidth;canvas.height=innerHeight;const pts=manifestBounds,minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));zoom=Math.min((innerWidth-30)/(maxX-minX+40),(innerHeight-180)/(maxY-minY+100));zoom=Math.max(.15,zoom);minZoom=zoom*.5;dx=-(minX+maxX)/2;dy=(innerHeight/2+25-35)/zoom-(minY+maxY)/2;draw(0)}
let lotsOf=null,lotsLayout=null;function lotSet(){if(lotsLayout!==layout){lotsLayout=layout;lotsOf=new Set(layout?layout.plots:[])}return lotsOf} /* only layout.plots are lots for sale; layout.residential are the neighbours' houses */
function sprite(p,im,alpha=1,filter=''){if(!im)return;const g=spriteGeometry(p);ctx.save();ctx.globalAlpha=alpha;ctx.filter=filter;ctx.drawImage(im,canvas.width/2+(g.left+dx)*zoom,35+(g.top+dy)*zoom,g.width*zoom,g.height*zoom);ctx.restore()}
function spriteM(p,im){if(!im)return;const g=spriteGeometry(p),lx=canvas.width/2+(g.left+dx)*zoom,ty=35+(g.top+dy)*zoom,w=g.width*zoom,h=g.height*zoom;ctx.save();ctx.filter='brightness(.84) contrast(1.08)';ctx.translate(lx+w/2,0);ctx.scale(-1,1);ctx.drawImage(im,-w/2,ty,w,h);ctx.restore()}
function groundContact(p){
 const center=xy(p.x+p.w*.5,p.y+p.d*.5),w=placement(p).width*.44*zoom,h=(p.w+p.d)*3.4*zoom;
 ctx.save();ctx.translate(center.x,center.y);ctx.scale(1,h/w);const g=ctx.createRadialGradient(0,0,w*.12,0,0,w);g.addColorStop(0,'#514d324f');g.addColorStop(.6,'#65583b2e');g.addColorStop(1,'#65583b00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w,0,Math.PI*2);ctx.fill();ctx.restore();
}

// Ground types and texture layers come from src/view/ground.mjs (pure module, tested in test/ground.test.mjs).
let grainCache=null;
const groundCtx=()=>({bounds,plaza:layout.plaza,paths:layout.paths});
function grainTable(){
 if(grainCache)return grainCache;
 const t=[],x0=bounds.minX-70,y0=bounds.minY-70,w=bounds.maxX-bounds.minX+70,h=bounds.maxY-bounds.minY+70,g=groundCtx();
 for(let i=0;i<4200;i++){const x=x0+hash01(i,1)*w,y=y0+hash01(i,2)*h;t.push({x,y,zone:groundZoneAt(x,y,g),i})}
 return grainCache=t;
}
const grainColors=zone=>GROUND_TYPES[zone].layers.filter(l=>l.kind==='grain').flatMap(l=>l.colors);
/* Painterly ground (Marco 26/10: the ground must match the buildings). A tileable fBm noise is baked once into two tinted layers, a warm shadow and a cream light, and laid over the land with the view so it pans and zooms with the map. */
let groundTex=null;
function groundTexture(){
 if(groundTex)return groundTex;
 const N=256,mk=(r,g,b,amax)=>{const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
  const val=(ix,iy,o)=>hash01(((ix%(N>>o)+(N>>o))%(N>>o))*131+((iy%(N>>o)+(N>>o))%(N>>o))*7919+o*104729,11+o);
  for(let y=0;y<N;y++)for(let xx=0;xx<N;xx++){let v=0,amp=.5,tot=0;for(let o=3;o<=6;o++){const cell=N>>(o-1)||1,gx=xx/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),n=(N/cell)|0,w=(a,b)=>hash01(((a%n+n)%n)*131+((b%n+n)%n)*7919+o*104729,17+o);
    const t=w(x0,y0)*(1-sx)+w(x0+1,y0)*sx,bt=w(x0,y0+1)*(1-sx)+w(x0+1,y0+1)*sx;v+=(t*(1-sy)+bt*sy)*amp;tot+=amp;amp*=.55}
   v=v/tot;const k=(y*N+xx)*4;im.data[k]=r;im.data[k+1]=g;im.data[k+2]=b;im.data[k+3]=Math.max(0,Math.min(1,(v-.5)*3.2+.5))*amax}
  x.putImageData(im,0,0);return c};
 return groundTex={dark:mk(96,66,34,56),light:mk(255,240,200,46)};
}
function paintGround(){
 const t=groundTexture(),o=xy(0,0),sc=zoom*1.4;
 for(const k of ['dark','light']){const pat=ctx.createPattern(t[k],'repeat');if(pat.setTransform)pat.setTransform(new DOMMatrix().translate(o.x,o.y).scale(sc));ctx.fillStyle=pat;ctx.fillRect(0,0,canvas.width,canvas.height)}
 const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height); /* same light as the sprites: from the top left */
 g.addColorStop(0,'rgba(255,238,190,.16)');g.addColorStop(.5,'rgba(255,238,190,0)');g.addColorStop(1,'rgba(70,45,20,.14)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height)}
function drawLandmass(){
 const pts=mainland(bounds).map(([x,y])=>xy(x,y));
 ctx.beginPath();ctx.moveTo((pts[0].x+pts[pts.length-1].x)/2,(pts[0].y+pts[pts.length-1].y)/2);pts.forEach((p,i)=>{const n=pts[(i+1)%pts.length];ctx.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2)});ctx.closePath();
 ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.fillStyle=GROUND_TYPES.pradera.base;ctx.fill(); // the whole landmass starts as grassland
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#8ab6a077';ctx.lineWidth=30*zoom;ctx.stroke();ctx.strokeStyle='#d1c194';ctx.lineWidth=10*zoom;ctx.stroke();ctx.globalAlpha=.5;ctx.strokeStyle='#fffbea';ctx.lineWidth=2.4*zoom;ctx.stroke();ctx.globalAlpha=1;
 ctx.save();ctx.clip();
 const G=GROUND_TYPES,{minX,minY,maxX,maxY}=bounds;
 // Sand band along the curved south coast; the straight working quay keeps its stone.
 const coast=mainland(bounds).slice(6,-1),band=[[minX-70,maxY+1],[maxX+3,maxY+1],[maxX+3,maxY+5],...coast,[minX-70,maxY+18]].map(([x,y])=>xy(x,y));
 ctx.beginPath();band.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=G.arena.base;ctx.fill();
 // Scrubland blobs over the grass, shared with the zone classifier.
 for(const s of scrubPatches(bounds)){const p=xy(s.x,s.y);ctx.globalAlpha=.5;ctx.fillStyle=G.matorral.base;ctx.beginPath();ctx.ellipse(p.x,p.y,s.rx*14*zoom,s.ry*7*zoom,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 // Packed city earth, slightly padded so it tucks under walls and the quay apron.
 const pad=[[minX-1.5,minY-1.5],[maxX+3,minY-1.5],[maxX+3,maxY+1.5],[minX-1.5,maxY+1.5]].map(([x,y])=>xy(x,y));
 ctx.beginPath();pad.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=G.tierra.base;ctx.fill();
 // One deterministic grain pass, coloured by the ground type under each speckle.
 for(const s of grainTable()){
  const cols=grainColors(s.zone);if(!cols.length)continue;const p=xy(s.x,s.y);
  ctx.globalAlpha=.18;ctx.fillStyle=cols[Math.floor(hash01(s.i,3)*cols.length)];
  ctx.beginPath();ctx.ellipse(p.x,p.y,(1+hash01(s.i,4)*3.5)*zoom,(1+hash01(s.i,5)*2.5)*zoom,0,0,Math.PI*2);ctx.fill();
  const tuft=GROUND_TYPES[s.zone].layers.find(l=>l.kind==='tufts');
  if(tuft&&hash01(s.i,6)<tuft.chance){ctx.globalAlpha=tuft.alpha;ctx.strokeStyle=tuft.colors[s.i%tuft.colors.length];ctx.lineWidth=1*zoom;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-1.6*zoom,p.y-4*zoom);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.4*zoom,p.y-4.6*zoom);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+2*zoom,p.y-3.6*zoom);ctx.stroke()}
  const rip=GROUND_TYPES[s.zone].layers.find(l=>l.kind==='ripples');
  if(rip&&hash01(s.i,7)<rip.chance){ctx.globalAlpha=rip.alpha;ctx.strokeStyle=rip.colors[0];ctx.lineWidth=1*zoom;ctx.beginPath();ctx.arc(p.x,p.y,3.2*zoom,.25,Math.PI-.25);ctx.stroke()}
 }
 ctx.globalAlpha=1;paintGround();ctx.restore();
}
function drawStreets(){
 const G=GROUND_TYPES.camino,wear=G.layers.find(l=>l.kind==='wear');
 ctx.lineCap='round';ctx.globalAlpha=.34;ctx.strokeStyle='#6f5630';ctx.lineWidth=13.5*zoom;for(const p of layout.paths){const a=xy(p.beg.x,p.beg.y),b=xy(p.end.x,p.end.y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.globalAlpha=1; /* soft edge so the roads sit in the ground */ctx.strokeStyle=G.base;ctx.lineWidth=10*zoom;
 for(const p of layout.paths){const a=xy(p.beg.x,p.beg.y),b=xy(p.end.x,p.end.y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 if(wear){ctx.globalAlpha=wear.alpha;ctx.strokeStyle=wear.colors[0];ctx.lineWidth=wear.width*zoom;for(const p of layout.paths){const a=xy(p.beg.x,p.beg.y),b=xy(p.end.x,p.end.y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.globalAlpha=1}
}
function drawPlaza(){
 const sq=layout.plaza,G=GROUND_TYPES.empedrado,joints=G.layers.find(l=>l.kind==='joints');
 polygon(sq);ctx.fillStyle=G.base;ctx.fill();
 if(joints){ctx.save();polygon(sq);ctx.clip();ctx.globalAlpha=joints.alpha;ctx.strokeStyle=joints.colors[0];ctx.lineWidth=joints.width*zoom;
  for(let x=sq.x+joints.step;x<sq.x+sq.w;x+=joints.step){const a=xy(x,sq.y),b=xy(x,sq.y+sq.d);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(let y=sq.y+joints.step;y<sq.y+sq.d;y+=joints.step){const a=xy(sq.x,y),b=xy(sq.x+sq.w,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  ctx.globalAlpha=1;ctx.restore()}
}
function drawWalls(){
 if(!walls)return;
 // The expansion exists only when the real simulation owns it. Rear walls occupy empty perimeter margins.
 const edges=[[[bounds.minX+1,bounds.minY+1],[bounds.maxX-1,bounds.minY+1]],[[bounds.minX+1,bounds.minY+1],[bounds.minX+1,bounds.maxY-1]]];
 const lvl=walls; // art level == state level (wall:1..3/gate:1..3 exist in the manifest)
 let gx=null,bestY=1/0; // the gate stands where the main road leaves the city through the rear edge
 for(const seg of layout.paths||[])for(const pt of [seg.beg,seg.end]){if(pt&&pt.y<bestY){bestY=pt.y;gx=pt.x}}
 for(const [start,end]of edges){
  const len=Math.hypot(end[0]-start[0],end[1]-start[1]),n=Math.max(1,Math.round(len/1.7));
  const g=start[1]===end[1]?Math.min(Math.max(gx??((start[0]+end[0])/2),start[0]+3.4),end[0]-3.4):null;
  // Base band: the pale curtain art vanishes against the ground at fit zoom, so a solid stone face keeps the wall legible at any zoom; the sprites add crenellations and towers on top.
  const vert=start[0]===end[0],bh=30*zoom,segs=g===null?[[start,end]]:[[start,[g-3.3,start[1]]],[[g+3.3,start[1]],end]];
  for(const [s0,s1]of segs){const a=vert?xy(s0[0]+1.3,s0[1]):xy(s0[0],s0[1]+1.3),b=vert?xy(s1[0]+1.3,s1[1]):xy(s1[0],s1[1]+1.3);if(Math.hypot(b.x-a.x,b.y-a.y)<2)continue;const gr=ctx.createLinearGradient(0,a.y-bh,0,a.y);gr.addColorStop(0,'#b3a078');gr.addColorStop(1,'#8d7c5b');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x,b.y-bh);ctx.lineTo(a.x,a.y-bh);ctx.closePath();ctx.fill();ctx.strokeStyle='#7a6a4c';ctx.lineWidth=2.2*zoom;ctx.beginPath();ctx.moveTo(a.x,a.y-bh);ctx.lineTo(b.x,b.y-bh);ctx.stroke();}
  for(let i=0;i<=n;i++){const f=i/n,x=start[0]+(end[0]-start[0])*f,y=start[1]+(end[1]-start[1])*f;
   if(g!==null&&Math.abs(x-g)<3.3)continue; // the gate interrupts the rear wall
   if(vert)spriteM({x:x-1.35,y:y-.8,w:2.7,d:1.6},images['wall:'+lvl]); // the art is painted for an X-running wall: mirror it so the curtain runs along the Y edge
   else sprite({x:x-1.35,y:y-.8,w:2.7,d:1.6},images['wall:'+lvl],1,'brightness(.84) contrast(1.08)');} // art overlap: the tower end of one tile meets the wall end of the next; the filter keeps the pale curtain readable against the ground at fit zoom
  if(g!==null)sprite({x:g-3,y:start[1]-3,w:6,d:6},images['gate:'+lvl]);
 }
}
function boatSprite(p,t,type){
 const sh=type&&images['ship:'+type];if(sh){const g=spriteGeometry(p),w=g.width*zoom,h=w*sh.height/sh.width;ctx.drawImage(sh,canvas.width/2+(g.left+dx)*zoom,35+(g.top+dy)*zoom+g.height*zoom*.86-h,w,h);return} // per-class side art, scaled to the berth box and sitting on its bottom edge
 const im=images.barco;if(!im)return;if(!animate){sprite(p,im);return}
 const g=spriteGeometry(p),scale=g.scale*zoom;ctx.save();ctx.translate(canvas.width/2+(g.left+dx)*zoom,35+(g.top+dy)*zoom);ctx.scale(scale,scale);
 const sail=()=>{ctx.moveTo(162,123);ctx.lineTo(384,278);ctx.lineTo(373,291);ctx.lineTo(292,240);ctx.lineTo(219,199);ctx.lineTo(170,157);ctx.closePath()};
 ctx.save();ctx.beginPath();ctx.rect(0,0,512,512);sail();ctx.clip('evenodd');ctx.drawImage(im,0,0);ctx.restore();
 ctx.beginPath();sail();ctx.clip();for(let y=120;y<300;y+=4){const wind=Math.sin(t*1.8+y*.055)*1.7;ctx.drawImage(im,0,y,512,4,wind,y,512,4)}ctx.restore();
}
function harbourCrane(x,y,t){
 const p=xy(x,y),s=zoom,sway=animate?Math.sin(t*.6)*3:0;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
 ctx.fillStyle='#5c5d403d';ctx.beginPath();ctx.ellipse(6,3,18,6,0,0,Math.PI*2);ctx.fill();ctx.lineCap='round';
 const beam=(a,b,w,c)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()};
 beam([-8,0],[0,-45],5,'#796344');beam([8,0],[0,-45],5,'#967b51');beam([-7,-7],[7,-7],4,'#aa8b5c');beam([0,-43],[27,-53],5,'#90744b');beam([0,-28],[24,-52],3,'#6f5f42');beam([0,-43],[-11,-54],3,'#8d724b');beam([-11,-54],[27,-53],1,'#494c3b');
 beam([26,-52],[26+sway,-21],1.2,'#56553f');ctx.strokeStyle='#5a5942';ctx.lineWidth=2;ctx.beginPath();ctx.arc(26+sway,-19,3,0,Math.PI*1.4);ctx.stroke();ctx.fillStyle='#ac8c5b';ctx.beginPath();ctx.arc(0,-22,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#66583d';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function drawHarbour(t){
 const {edge,span,piers}=harbourLayout(bounds);
 const line=(a,b,color,width)=>{a=xy(...a);b=xy(...b);ctx.strokeStyle=color;ctx.lineWidth=width*zoom;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()};
 // Stone apron is inland; piers extend into water without touching any plot.
 const apron=[[edge-2,bounds.minY],[edge,bounds.minY],[edge,bounds.maxY-4],[edge-2,bounds.maxY-4]].map(p=>xy(...p));
 ctx.beginPath();apron.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#a99a7b';ctx.fill();
 line([edge,bounds.minY],[edge,bounds.maxY-4],'#6d6c59',13);
 line([edge,bounds.minY],[edge,bounds.maxY-4],'#d8cba7',6);
 for(const pier of piers){
  const y=pier.y,end=pier.x+pier.w,w=pier.d;
  const corners=[[edge,y],[end,y],[end,y+w],[edge,y+w]].map(p=>xy(...p));
  ctx.save();ctx.translate(0,5*zoom);ctx.beginPath();corners.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#204e5666';ctx.fill();ctx.restore();
  ctx.beginPath();corners.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#9b8057';ctx.fill();
  line([edge,y],[end,y],'#d1b58a',2);line([edge,y+w],[end,y+w],'#5f604e',3);
  for(let x=edge+.5;x<end;x+=.65)line([x,y],[x,y+w],'#5e533e77',1);
  for(const x of [edge+.6,end-.4])for(const yy of [y,y+w]){const p=xy(x,yy);ctx.fillStyle='#665b45';ctx.fillRect(p.x-2*zoom,p.y-4*zoom,4*zoom,10*zoom);ctx.fillStyle='#c2ac7d';ctx.beginPath();ctx.ellipse(p.x,p.y-4*zoom,2.5*zoom,1.6*zoom,0,0,Math.PI*2);ctx.fill()}
 }
 for(let i=0;i<11;i++){const p=xy(edge-1.2,bounds.minY+2+i*span/13);ctx.fillStyle='#7c7157';ctx.beginPath();ctx.ellipse(p.x,p.y,2.5*zoom,4*zoom,0,0,Math.PI*2);ctx.fill()}
 // Crates, barrels and a handcart make the working waterfront legible at close zoom.
 for(let i=0;i<8;i++){const p=xy(edge-2.6,bounds.minY+3+i*span/10);ctx.fillStyle='#655c4444';ctx.beginPath();ctx.ellipse(p.x+3*zoom,p.y+2*zoom,8*zoom,3*zoom,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%2?'#a08053':'#8d714c';ctx.fillRect(p.x-4*zoom,p.y-8*zoom,8*zoom,8*zoom);ctx.strokeStyle='#5e553e';ctx.lineWidth=1*zoom;ctx.strokeRect(p.x-4*zoom,p.y-8*zoom,8*zoom,8*zoom);ctx.beginPath();ctx.moveTo(p.x-4*zoom,p.y-8*zoom);ctx.lineTo(p.x+4*zoom,p.y);ctx.stroke()}
 const berths=harbourShipBerths(bounds,ships); // the player's real docked ships ride at the piers; the cosmetic boat only fills an empty harbour
 if(berths.length)berths.forEach((b,i)=>{const bob=animate?Math.sin(t*1.1+i*1.7)*.22:0;boatSprite({x:b.x,y:b.y+bob,w:b.w,d:b.d},t,b.type)});
 else if(images.barco){const bob=animate?Math.sin(t*1.1)*.22:0;boatSprite({x:edge+10,y:bounds.minY+span*.45+bob,w:7,d:7},t)}
 harbourCrane(edge-.3,bounds.minY+span*.47,t);
 // Cosmetic dockworkers follow the apron, never simulation citizens or jobs.
 for(let i=0;i<7;i++){const f=(i/7+(animate?t*.009:0))%1,p=xy(edge-1.2,bounds.minY+3+f*(span-9)),step=animate?Math.sin(t*5+i)*1.4:0;ctx.fillStyle='#5b5a413b';ctx.beginPath();ctx.ellipse(p.x+2*zoom,p.y+zoom,4*zoom,1.8*zoom,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4e4c39';ctx.lineWidth=1.3*zoom;ctx.beginPath();ctx.moveTo(p.x,p.y-3*zoom);ctx.lineTo(p.x-step*zoom,p.y);ctx.moveTo(p.x,p.y-3*zoom);ctx.lineTo(p.x+step*zoom,p.y);ctx.stroke();ctx.fillStyle=['#775746','#68746a','#9d8761'][i%3];ctx.fillRect(p.x-1.7*zoom,p.y-8*zoom,3.4*zoom,5*zoom);ctx.fillStyle='#cfb18b';ctx.beginPath();ctx.arc(p.x,p.y-9*zoom,1.8*zoom,0,Math.PI*2);ctx.fill()}
}
let labEls=[];
const SVC=['market','shipyard','tavern','bank','office','warehouse'];
function buildLabels(){
 for(const l of labEls)l.el.remove();labEls=[];
 if(!layout)return;
 const dn=dispNames();
 for(const p of layout.plots){
  const owned=!!bld[p.id],svc=SVC.includes(p.type)&&+p.id.split(':')[1]<6,town=p.type.startsWith('town:');
  const txt=owned?(labels[p.id]):(svc||town)?dn[p.type]:null;
  if(!txt)continue;
  const el=document.createElement('div');el.className='bldlab';el.textContent=txt;el.title=txt;
  const kind=owned?'plot':'building',msgId=owned?p.id:p.type;
  el.addEventListener('click',()=>{if(preview)return;parent.postMessage({kind,id:msgId},location.origin)});
  document.body.appendChild(el);
  el.style.display='block';const r=el.getBoundingClientRect();el.style.display='none'; // measured once; the text never changes
  labEls.push({p,el,w:r.width,h:r.height});
 }
 for(const c of civic){
  const el=document.createElement('div');el.className='bldlab';el.textContent=c.label;el.title=c.label;
  el.addEventListener('click',()=>{if(preview)return;parent.postMessage({kind:'building',id:c.id},location.origin)});
  document.body.appendChild(el);
  el.style.display='block';const r=el.getBoundingClientRect();el.style.display='none';
  labEls.push({p:{id:'civic:'+c.id,type:'house',x:layout.plaza.x+(c.id==='hall'?1:6),y:layout.plaza.y+4,w:3,d:3},el,w:r.width,h:r.height});
 }
}
function placeLabels(){
 const items=[];
 for(const{p,el,w,h}of labEls){
  const g=spriteGeometry(p),x=canvas.width/2+(g.left+g.width/2+dx)*zoom;let key=assetKey(p,bld[p.id]||{type:p.type,level:1,state:'active'});if(!images[key])key=p.type+':1';const y=35+(g.top+dy)*zoom+(visTop[key]||0)*g.height*zoom;
  if(x<-60||x>canvas.width+60||y<120||y>canvas.height+40){el.style.display='none';continue} // 120 keeps labels clear of the toolbar and the parent's docked mission line (#345)
  items.push({el,w,h,ax:x,ay:y,x,y,own:bld[p.id]?0:1});
 }
 // Owned names keep anchor priority; service/town labels yield or hide in dense clusters.
 items.sort((a,b)=>a.own-b.own);
 const placed=[],RING=[[0,0],[0,-14],[-15,-8],[15,-8],[0,-28],[-26,-16],[26,-16],[0,-42],[-18,-36],[18,-36],[-34,-26],[34,-26],[0,-56],[-24,-50],[24,-50],[-44,-40],[44,-40],[0,14],[-15,8],[15,8]];
 for(const it of items){
  let spot=null;
  for(const[ox,oy]of RING){
   const x=it.ax+ox,y=it.ay+oy;
   if(y-it.h<120)continue;
   let hit=false;
   for(const q of placed){
    const cw=Math.min(x+it.w/2,q.x+q.w/2)-Math.max(x-it.w/2,q.x-q.w/2),ch=Math.min(y,q.y)-Math.max(y-it.h,q.y-q.h);
    if(cw>0&&ch>0){hit=true;break}
   }
   if(!hit){spot={x,y};break}
  }
  if(!spot){it.el.style.display='none';continue} // suppression beats drifting onto another building
  it.x=spot.x;it.y=spot.y;placed.push(it);
  it.el.style.display='block';it.el.style.left=it.x+'px';it.el.style.top=it.y+'px';
  if(Math.hypot(it.x-it.ax,it.y-it.ay)>10){ // short leader ties a displaced label to its own building
   ctx.save();ctx.strokeStyle='#1b2a3388';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(it.x,it.y+2);ctx.lineTo(it.ax,it.ay+2);ctx.stroke();
   ctx.strokeStyle='#ffe9b0cc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(it.x,it.y+2);ctx.lineTo(it.ax,it.ay+2);ctx.stroke();ctx.restore();
  }
 }
}
// The town's real industry roster, drawn where each trade belongs: extractive works in the
// country ring, salt pans on the south beach, dockside trades by the quay, processors in the
// fabric. Placement is pure and tested (src/view/industry2d.mjs); the label carries type,
// owner and real state so a reused sprite can never pass for a different factory. Player-owned
// works glow gold; works sold at auction fade.
const REP_ART={tannery:['soapworks:1','sepia(.4) brightness(.9)'],trading_post:['office:1','brightness(.94) hue-rotate(-12deg)']};
function drawIndustry(){
 if(!industry.length||!layout)return;
 // One drawing per type+owner group with an honest count (visual scale, like housing).
 indSpots??=industrySpots(bounds,layout,industryClusters(industry)).map((s)=>{
  const m=s.members,ownerSame=m.every(e=>e.ownerDesc===m[0].ownerDesc);
  const label=s.count===1?m[0].label:`${s.typeName||s.type} ×${s.count} · ${ownerSame?m[0].ownerDesc:chrome().indVarious}`;
  const own=s.ownerKind==='own',gone=s.ownerKind==='gone';
  return {...s,label,own,gone};
 });
 for(const s of [...indSpots].sort((a,b)=>placement(a).depth-placement(b).depth)){
  const rep=REP_ART[s.type],key=rep?rep[0]:(images[s.type+':'+s.level]?s.type+':'+s.level:s.type+':1');
  groundContact(s);sprite(s,images[key],s.gone?.5:1,rep?rep[1]:'');
  if(zoom<.7)continue; // labels only at inspection zoom: at fit zoom the works read as town texture, not clutter
  const g=spriteGeometry(s),lx=canvas.width/2+(g.left+g.width/2+dx)*zoom,ly=35+(g.top+dy)*zoom+(visTop[key]||0)*g.height*zoom;
  ctx.save();ctx.font=`${Math.max(8,12*zoom)}px Georgia`;ctx.textAlign='center';
  ctx.lineWidth=2.5;ctx.strokeStyle='#1b2a33cc';ctx.strokeText(s.label,lx,ly);
  ctx.fillStyle=s.own?'#ffe9b0':s.gone?'#c9c2ae':'#f6e9c8';ctx.fillText(s.label,lx,ly);ctx.restore();
 }
}
/* The ground (sea, landmass, roads, hills, fields, trees) only changes with the view, so it is drawn once into a cache and blitted while the view is still (animation frames, hover). */
let terrainCache=null,terrainKey="";
function drawTerrain(){const key=[canvas.width,canvas.height,zoom,dx,dy,!!images.arboles,layout.plots.length].join("|");if(terrainCache&&terrainKey===key){ctx.drawImage(terrainCache,0,0);return}
const sea=ctx.createLinearGradient(0,0,canvas.width,canvas.height);sea.addColorStop(0,'#44787f');sea.addColorStop(.55,'#6b9b98');sea.addColorStop(1,'#3d727b');ctx.fillStyle=sea;ctx.fillRect(0,0,canvas.width,canvas.height);
 drawLandmass();
 // Roads continue inland beyond the owned plot district, entirely decorative.
 for(const p of layout.paths.filter(p=>p.beg.x===p.end.x).slice(0,3)){const a=xy(p.beg.x,bounds.minY),b=xy(p.beg.x,bounds.minY-80);ctx.strokeStyle='#cebc92';ctx.lineWidth=7*zoom;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 // Low hills, fields and distant roofs remain outside the canonical district.
 for(let i=0;i<9;i++){const p=xy(bounds.minX-18-i*4,bounds.minY-26+i*3),r=(85+i%3*27)*zoom,g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,i%2?'#78875b33':'#d8c89366');g.addColorStop(1,'#a7ab7800');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p.x,p.y,r*2,r,0,0,Math.PI*2);ctx.fill()}
 const fields=fieldPatches(bounds),furrow=GROUND_TYPES.campo.layers.find(l=>l.kind==='furrows'),tones=GROUND_TYPES.campo.tones;
 for(let i=0;i<fields.length;i++){const{x,y,w,d}=fields[i],ps=[[x,y],[x+w,y],[x+w,y+d],[x,y+d]].map(([x,y])=>xy(x,y));ctx.beginPath();ps.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=tones[i%tones.length];ctx.globalAlpha=.65;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#d4c49a';ctx.lineWidth=2*zoom;ctx.stroke();for(let j=1;j<8;j++){const a=xy(x+j,y),b=xy(x+j,y+d);ctx.globalAlpha=furrow.alpha;ctx.strokeStyle=furrow.colors[0];ctx.lineWidth=furrow.width*zoom;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.globalAlpha=1}
 for(let i=0;i<38;i++){const x=bounds.minX-7-((i*7.43)%33),y=bounds.minY-5-((i*13.7)%41);sprite({x,y,w:1.6+i%3*.4,d:1.6+i%3*.4},images.arboles,.74)}
if(!terrainCache)terrainCache=document.createElement("canvas");terrainCache.width=canvas.width;terrainCache.height=canvas.height;terrainCache.getContext("2d").drawImage(canvas,0,0);terrainKey=key}
function draw(t){if(!layout)return;canvas.width=innerWidth;canvas.height=innerHeight;drawTerrain();

 drawWalls();
 drawStreets();
 drawPlaza();
 drawHarbour(t);
 for(let i=0;i<45;i++){const x=bounds.minX+2+((i*13.7)%Math.max(1,bounds.maxX-bounds.minX-4)),y=bounds.minY+2+((i*7.3)%Math.max(1,bounds.maxY-bounds.minY-4));if(layout.plots.some(p=>x>p.x-2&&x<p.x+p.w+2&&y>p.y-2&&y<p.y+p.d+2))continue;if(layout.paths.some(p=>Math.abs(p.beg.x-p.end.x)<.1?Math.abs(x-p.beg.x)<2:Math.abs(y-p.beg.y)<2))continue;sprite({x,y,w:1.6,d:1.6},images.arboles,.85)}for(const c of civic){const cp={x:layout.plaza.x+(c.id==='hall'?1:6),y:layout.plaza.y+4,w:3,d:3};sprite(cp,images[c.id==='hall'?'house_rich:2':'alhondiga:2'])} /* town hall and exchange on the plaza: own sprites already in the set (rich house with garden, arcaded trading house) */for(const p of [...layout.plots,...layout.residential].sort((a,b)=>placement(a).depth-placement(b).depth)){
 const owned=bld[p.id],service=['market','shipyard','tavern','bank','office','warehouse'].includes(p.type)&&+p.id.split(':')[1]<6;
 let b=owned||{type:p.type,level:p.level||(p.type==='house'?layout.housing.level:1),state:'active'},v=resolveVisual(p,b),at=xy(p.x+p.w,p.y+p.d),free=lotSet().has(p)&&!owned&&!service&&!p.type.startsWith('town:'); /* free = an unbuilt lot for sale: drawn as an empty marked lot, never as a finished building */polygon(p);if(free){ctx.fillStyle=p===selected?'#e9cb78':p===hover?'#e5d4a6':'#b7bf7c';ctx.globalAlpha=p===selected||p===hover?.9:.62;ctx.fill();ctx.globalAlpha=1;ctx.setLineDash(p===selected?[6,4]:[]);ctx.strokeStyle=p===selected?'#fff2b4':'#6f7c3e';ctx.lineWidth=p===selected?3:1.5;ctx.stroke();ctx.setLineDash([])}else if(grid||p===selected||p===hover||v.state==='plot'){ctx.fillStyle=p===selected?'#e9cb78':p===hover?'#e5d4a6':'#cdbd95';ctx.fill();ctx.strokeStyle=p===selected?'#fff2b4':'#8c825d';ctx.lineWidth=p===selected?3:1;ctx.stroke()}
 const focusAlpha=obscuresSelection(p,selected)?.45:1;
 const isPreview=preview&&p===hover&&!owned&&!service;if(!free&&v.state!=='plot'&&v.state!=='construction'&&!isPreview){groundContact(p);const key=assetKey(p,b);sprite(p,images[key]||images[p.type+':1'],focusAlpha,v.state==='halted'?'saturate(.15) brightness(.8)':'');}
 if(v.state==='construction'){groundContact(p);sprite(p,images['construction:'+Math.max(1,Math.min(3,b.nextLevel||1))],.9*focusAlpha);}
 if(isPreview){sprite(p,images[assetKey(p,{type:$('type').value,level:+$('level').value})],.55);polygon(p);ctx.strokeStyle='#4c7554';ctx.lineWidth=3;ctx.stroke()}
 if(v.state==='halted'){ctx.fillStyle='#f6e9c8';ctx.beginPath();ctx.arc(at.x,at.y-7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4f4b3c';ctx.fillRect(at.x-3,at.y-11,2,7);ctx.fillRect(at.x+1,at.y-11,2,7)}
 // Small ambient smoke only for active working furnaces. It carries no simulation effect.
 if(animate&&v.state==='active'&&['ironworks','brickworks','pottery','brewery','soapworks'].includes(b.type)){for(let i=0;i<3;i++){const phase=(t*.18+i*.33)%1;ctx.globalAlpha=(1-phase)*.15;ctx.fillStyle='#e3dfce';ctx.beginPath();ctx.ellipse(at.x+Math.sin(phase*4)*6*zoom,at.y-(70+phase*45)*zoom,5*zoom+phase*7*zoom,4*zoom+phase*7*zoom,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
 if(animate&&v.state==='construction'){const off=Math.sin(t*2+p.x)*3*zoom;ctx.fillStyle='#b7a27c';ctx.fillRect(at.x-7*zoom+off,at.y-9*zoom,5*zoom,4*zoom)}
 }
 drawIndustry();
 // Tiny water shimmer outside land, never over the city.
 if(animate){ctx.strokeStyle='#b6dbd44d';ctx.lineWidth=1;for(let i=0;i<18;i++){const x=(i*91+t*5)%innerWidth,y=innerHeight-20-(i%3)*9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+20,y);ctx.stroke()}}
 if(selected){
  // Final overlay stays legible even when a roof is in front of the footprint.
  polygon(selected);ctx.strokeStyle='#fff1a6';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([5,4]);ctx.strokeStyle='#6a6039';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);

 }
 if(selected){const b=bld[selected.id];$('tip').textContent=(labels[selected.id]||names[b?.type||selected.type]||chrome().plot)+' · '+selected.id+(preview?' · '+dispNames()[$('type').value]+' '+$('level').value+' · '+chrome().previewTip:'')}
 placeLabels();
 window.__city2d={city,walls,plots:layout.plots.length,owned:Object.keys(bld).length,selected:selected?.id||null,preview,grid,animate,frame,zoom,points:layout.plots.map(p=>({id:p.id,...xy(p.x+p.w/2,p.y+p.d/2)}))};
}
function loop(ms){if((animate||dirty)&&ms-last>=33){last=ms;frame++;draw(animate?ms/1000:0);dirty=false}requestAnimationFrame(loop)}
function pick(e){const r=canvas.getBoundingClientRect();for(const p of [...layout.plots,...layout.residential].reverse()){polygon(p);if(ctx.isPointInPath(e.clientX-r.left,e.clientY-r.top))return p}return null}
canvas.onpointerdown=e=>{dirty=true;drag={x:e.clientX,y:e.clientY};moved=0;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{dirty=true;if(drag){const x=e.clientX-drag.x,y=e.clientY-drag.y;moved+=Math.abs(x)+Math.abs(y);dx+=x/zoom;dy+=y/zoom;drag={x:e.clientX,y:e.clientY}}else hover=pick(e)};canvas.onpointerup=e=>{dirty=true;drag=null;if(moved>6)return;selected=pick(e);if(!selected)return;hover=selected;draw(0);if(preview)return;if(selected.id.startsWith('residential-')){parent.postMessage({kind:'neighbors',id:selected.id,people:layout.housing.peoplePerGroup,level:layout.housing.level},location.origin);return}const service=+selected.id.split(':')[1]<6&&!bld[selected.id];parent.postMessage({kind:service?'building':'plot',id:service?selected.type:selected.id},location.origin)};canvas.onpointercancel=()=>drag=null;canvas.addEventListener('wheel',e=>{dirty=true;e.preventDefault();const z0=zoom,z1=Math.max(minZoom,Math.min(4,z0*(e.deltaY<0?1.1:.9)));if(z1===z0)return;const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;dx+=(sx-canvas.width/2)*(1/z1-1/z0);dy+=(sy-35)*(1/z1-1/z0);zoom=z1},{passive:false}); // one registration; the world point under the cursor stays fixed
document.querySelector('nav').addEventListener('click',()=>dirty=true);document.querySelector('nav').addEventListener('change',()=>dirty=true);if(q.get('chrome')==='0')document.querySelector('nav').classList.add('corner'); // chrome=0: the parent's corner bar owns the controls; the iframe keeps only the build-mode sub-panel
const doZoomIn=()=>{zoom=Math.min(4,zoom*1.3)},doZoomOut=()=>{zoom=Math.max(minZoom,zoom/1.3)};
const doConstruct=()=>{const on=$('construct').getAttribute('aria-pressed')!=='true';$('construct').setAttribute('aria-pressed',on);$('bm').hidden=!on;if(!on){grid=preview=false;$('grid').setAttribute('aria-pressed',false);$('build').setAttribute('aria-pressed',false);$('type').hidden=$('level').hidden=true}postView()};
const doMotion=()=>{animate=!animate;$('motion').setAttribute('aria-pressed',animate);postView()};
const postView=()=>{try{parent.postMessage({kind:'city2d-view',city,motion:animate,construct:$('construct').getAttribute('aria-pressed')==='true'},location.origin)}catch{}};
$('fit').onclick=fit;$('plus').onclick=doZoomIn;$('minus').onclick=doZoomOut;$('construct').onclick=doConstruct;$('grid').onclick=()=>{grid=!grid;$('grid').setAttribute('aria-pressed',grid)};$('build').onclick=()=>{preview=!preview;grid=preview;$('build').setAttribute('aria-pressed',preview);$('grid').setAttribute('aria-pressed',grid);$('type').hidden=!preview;$('level').hidden=!preview};$('motion').setAttribute('aria-pressed',animate);$('motion').onclick=doMotion;addEventListener('resize',fit);
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.kind!=='city2d-cmd'||e.data.city!==city)return;dirty=true;const c=e.data.cmd;if(c==='fit')fit();else if(c==='zoom-in')doZoomIn();else if(c==='zoom-out')doZoomOut();else if(c==='toggle-motion')doMotion();else if(c==='toggle-construct')doConstruct();});
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.kind!=='city2d-state'||e.data.city!==city)return;dirty=true;walls=wallsLvl(e.data.walls);bld=e.data.buildings||{};labels=e.data.labels||{};tick=e.data.tick||0;ships=Array.isArray(e.data.ships)?e.data.ships:[];industry=Array.isArray(e.data.industry)?e.data.industry:[];civic=Array.isArray(e.data.civic)?e.data.civic:[];indSpots=null;buildLabels()});
boot().catch(e=>{console.error(e);window.__error=String(e); $('error').hidden=false;$('error').textContent=chrome().loadError});
