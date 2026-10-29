// Cards are optional information. Keep moving owned-ship names readable without
// moving the camera, port click targets or simulation state.
export function screenRectsOverlap(a,b,gap=3){
 return a.width>0&&a.height>0&&b.width>0&&b.height>0&&a.left<b.right+gap&&a.right+gap>b.left&&a.top<b.bottom+gap&&a.bottom+gap>b.top;
}
export function syncTradeCardVisibility(root){
 const names=[...root.querySelectorAll('#shipsLayer [data-ship] > text')].map(n=>n.getBoundingClientRect());
 for(const card of root.querySelectorAll('.trade-card')){
  const blocked=names.some(n=>screenRectsOverlap(card.getBoundingClientRect(),n));
  card.style.visibility=blocked?'hidden':'';
  if(blocked)card.setAttribute('aria-hidden','true');else card.removeAttribute('aria-hidden');
  const line=card.previousElementSibling;
  if(line?.tagName?.toLowerCase()==='path')line.style.visibility=blocked?'hidden':'';
 }
}
