// Original screen-space label layout. Every discovered port remains present.
export function placePortLabels(ports, bounds) {
 const boxes=[],out=[];
 const overlaps=(a,b)=>a.x<b.x+b.w+3&&a.x+a.w+3>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y;
 for(const p of [...ports].sort((a,b)=>(b.priority??0)-(a.priority??0)||a.id.localeCompare(b.id))){
  const w=Math.max(30,p.name.length*8.5+8),h=18;
  const candidates=[];for(const dy of [0,-22,22,-44,44,-66,66,-88,88])for(const dx of [16,-16-w,48,-48-w,80,-80-w])candidates.push([dx,dy]);
  let box,offset;
  for(const[dx,dy]of candidates){const b={x:p.x+dx,y:p.y+dy-13,w,h};if((!bounds || (b.x>=bounds.x+8 && b.y>=bounds.y && b.x+b.w<=bounds.x+bounds.w-8 && b.y+b.h<=bounds.y+bounds.h)) && !boxes.some(o=>overlaps(b,o))){box=b;offset={x:dx,y:dy};break;}}
  if(!box){offset={x:16,y:72+out.length*20};box={x:p.x+16,y:p.y+offset.y-13,w,h};}
  boxes.push(box);out.push({...p,offset,box});
 }
 return out;
}
