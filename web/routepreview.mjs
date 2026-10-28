// Pointer-only view overlay. No order, camera, save or simulation mutations.
import { routePreview, previewText } from '../src/view/routepreview.mjs';
import { shipPosition } from '../src/sim/position.mjs';

/** Resolve pointer exactly like the existing free-navigation right-click order. */
export function mapDestination(map, event, world, projection) {
  const city = event.target.closest?.('g.city');
  if (city && city.dataset.explored !== 'true') return null;
  if (city && world.nodes[city.dataset.c]) return { port: city.dataset.c, ...world.nodes[city.dataset.c] };
  const ctm = map.getScreenCTM(); if (!ctm) return null;
  const p = map.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
  const q = p.matrixTransform(ctm.inverse()), tol = 48 / (ctm.a || 1);
  let port = null, best = tol;
  map.querySelectorAll('g.city[data-explored="true"]').forEach(el => {
    const d = Math.hypot(Number(el.dataset.mx) - q.x, Number(el.dataset.my) - q.y);
    if (d < best) { best = d; port = el.dataset.c; }
  });
  return port ? { port, ...world.nodes[port] } : projection.inverse(q);
}

export function installRoutePreview({ map, world, state, selected, locale, name, project, inverse, blocked }) {
  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'polyline');
  line.id = 'route-preview-line'; line.setAttribute('fill', 'none');
  line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-dasharray', '6 5');
  line.setAttribute('vector-effect', 'non-scaling-stroke'); line.setAttribute('pointer-events', 'none');
  const label = document.createElement('div'); label.id = 'route-preview-label'; label.hidden = true;
  label.style.cssText = 'position:fixed;z-index:40;pointer-events:none;max-width:260px;padding:6px 9px;border:1px solid #72552a;border-radius:4px;background:#fff1ce;color:#392810;font:14px Georgia,serif;box-shadow:0 2px 5px #0004;';
  document.body.append(label);
  let pointer = null, scheduled = false, cacheKey = null, cached, lastFrameKey;
  const hide = () => { line.remove(); label.hidden = true; };
  function draw() {
    scheduled = false;
    const g = state(), ship = selected();
    if (!pointer || !g || !ship || blocked()) { hide(); return; }
    const rect = map.getBoundingClientRect();
    if (!rect.width || !rect.height) { hide(); return; }
    // Hit-test afresh: main render may replace port elements while the pointer is stationary.
    const element = document.elementFromPoint(pointer.x, pointer.y);
    if (!element || !map.contains(element)) { hide(); return; }
    const dest = mapDestination(map, { target: element, clientX: pointer.x, clientY: pointer.y }, world, { inverse });
    if (!dest) { hide(); return; }
    const key = [ship.id,g.tick,ship.at,ship.voyage?.ticksLeft,ship.hull,ship.crew,ship.captain,ship.convoy,locale(),dest.port,dest.lat.toFixed(3),dest.lon.toFixed(3)].join('|');
    if (key !== cacheKey) { cached = routePreview(g,ship,dest); cacheKey = key; }
    const preview = cached, from = shipPosition(world, ship);
    let points;
    if (preview.ok) {
      points = preview.path.map(id => preview.pts[id] ?? world.nodes[id]).filter(Boolean);
      // The first route node is already the ship's current lane position.
      if (ship.voyage && points.length) points[0] = from;
    } else points = [from,dest];
    line.setAttribute('points', points.map(p => project(p).join(',')).join(' '));
    line.setAttribute('stroke', preview.ok ? '#315d58' : '#9d3026');
    if (line.parentNode !== map) map.append(line);
    label.textContent = previewText(preview,{lang:locale(),destination:preview.ok && preview.toPort ? name(preview.to) : ''});
    label.style.color = preview.ok ? '#392810' : '#83271f'; label.hidden = false;
    const w=label.offsetWidth,h=label.offsetHeight;
    label.style.left = `${Math.max(rect.left+6,Math.min(pointer.x+14,rect.right-w-6,innerWidth-w-6))}px`;
    label.style.top = `${Math.max(rect.top+6,Math.min(pointer.y+16,rect.bottom-h-6,innerHeight-h-6))}px`;
  }
  function refresh(force = false) {
    if (!pointer || scheduled) return;
    const g = state(), s = selected();
    const frameKey = [g?.tick,s?.id,s?.hull,s?.crew,s?.captain,s?.convoy,locale(),map.getAttribute('viewBox'),blocked(),line.isConnected].join('|');
    if (!force && frameKey === lastFrameKey) return;
    lastFrameKey = frameKey; scheduled=true; requestAnimationFrame(draw);
  }
  map.addEventListener('pointermove', e => { if(e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY};refresh(true); });
  map.addEventListener('pointerleave', () => {pointer=null;hide();});
  map.addEventListener('pointerdown', () => {pointer=null;hide();});
  map.addEventListener('contextmenu', () => {pointer=null;hide();},true);
  return { refresh, hide };
}
