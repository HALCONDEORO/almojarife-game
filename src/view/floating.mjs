// Shared bounds for pointer and keyboard window movement. No DOM dependencies.
export function clampWindow(x,y,width,height,vw,vh) {
  const left=Math.max(0,Math.min(Math.max(0,vw-width),Number.isFinite(x)?x:0));
  const top=Math.max(0,Math.min(Math.max(0,vh-Math.min(height,80)),Number.isFinite(y)?y:0));
  return {left,top};
}
