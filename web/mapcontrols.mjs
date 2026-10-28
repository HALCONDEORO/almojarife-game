import {centerOn,panTo,minimapPoint,mapKey,viewBox,zoomAt,panBy} from '../src/view/camera.mjs';
export function installMapControls({map,cam,apply,state,selected,position,port,project,locale,blocked}) {
  const area=map.parentElement, ns='http://www.w3.org/2000/svg';
  const bar=document.createElement('nav');bar.id='map-navigation';
  bar.innerHTML='<button type="button" data-center="ship"></button><button type="button" data-center="port"></button>';
  area.append(bar);
  const mini=document.createElementNS(ns,'svg');mini.id='map-minimap';mini.setAttribute('viewBox',`0 0 ${cam.W} ${cam.H}`);mini.setAttribute('preserveAspectRatio','none');mini.setAttribute('role','img');
  mini.innerHTML=`<image href="../assets/map/background.webp" width="${cam.W}" height="${cam.H}" preserveAspectRatio="none"/><g data-mini-ships></g><rect data-mini-view fill="#fff4" stroke="#8d301f" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  area.append(mini);let motion=0,lastKey,lastUi;
  function cancel(){motion++;}
  function center(kind){
    const p=kind==='ship'?selected():port();if(!p)return;
    const [x,y]=project(p),dest=centerOn({...cam},x,y),from={...cam},id=++motion;
    if(document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches){Object.assign(cam,dest);apply();return;}
    const start=performance.now();
    function step(now){if(id!==motion)return;const t=Math.min(1,(now-start)/240),v=t*t*(3-2*t);for(const k of ['x','y','zoom'])cam[k]=from[k]+(dest[k]-from[k])*v;apply();if(t<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }
  bar.querySelector('[data-center="ship"]').onclick=()=>center('ship');
  bar.querySelector('[data-center="port"]').onclick=()=>center('port');
  let dragging=false;
  function miniPan(e){const r=mini.getBoundingClientRect();cancel();panTo(cam,...minimapPoint(cam,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height));apply();}
  mini.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;mini.setPointerCapture(e.pointerId);miniPan(e);});
  mini.addEventListener('pointermove',e=>{if(dragging)miniPan(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])mini.addEventListener(event,()=>{dragging=false;});
  map.addEventListener('pointerdown',cancel);map.addEventListener('wheel',cancel);
  document.addEventListener('keydown',e=>{
    if(blocked()||e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
    const cmd=mapKey(e.key,!!e.target.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]'));if(!cmd)return;
    e.preventDefault();cancel();
    if(cmd.kind==='ship'||cmd.kind==='port')center(cmd.kind);
    else {if(cmd.kind==='pan')panBy(cam,cmd.dx,cmd.dy);else zoomAt(cam,cmd.factor);apply();}
  });
  function refresh(){
    const hide=blocked();bar.hidden=hide;mini.style.display=hide||cam.zoom<=1?'none':'';
    const es=locale()==='es',ui=[hide,es,!!selected(),!!port()].join('|');if(ui!==lastUi){lastUi=ui;bar.setAttribute('aria-label',es?'Navegación del mapa':'Map navigation');
    const sb=bar.querySelector('[data-center="ship"]'),pb=bar.querySelector('[data-center="port"]');
    sb.textContent=es?'Centrar barco':'Center ship';sb.title=es?'Centrar barco (Inicio)':'Center ship (Home)';sb.disabled=!selected();
    pb.textContent=es?'Centrar puerto':'Center port';pb.title=es?'Centrar puerto (C)':'Center port (C)';pb.disabled=!port();
    mini.setAttribute('aria-label',es?'Minimapa: clic o arrastra para mover la vista':'Minimap: click or drag to move the view');}
    if(hide)return;
    const g=state(),key=[g?.tick,...viewBox(cam),g?.ships.length].join('|');if(key===lastKey)return;lastKey=key;
    const [x,y,w,h]=viewBox(cam),rect=mini.querySelector('[data-mini-view]');for(const [k,v] of Object.entries({x,y,width:w,height:h}))rect.setAttribute(k,v);
    mini.querySelector('[data-mini-ships]').innerHTML=(g?.ships??[]).map(s=>{const p=position(s),q=p&&project(p);return q?`<circle cx="${q[0]}" cy="${q[1]}" r="11" fill="#392810" stroke="#fff1ce" stroke-width="3"/>`:'';}).join('');
  }
  return {refresh,cancel};
}
