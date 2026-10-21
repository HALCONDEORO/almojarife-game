// Procedural canvas textures: generated at runtime, no downloads, own work (MIT like the repo).
// Each kind is a small repeating pattern in real-world metres so every surface tiles the same.
// In Node (tests, no DOM) makeTexture returns null and materials stay flat-coloured.

/** tiles: low Arab roof tiles - staggered scallop rows with a little value noise. */
function drawTiles(ctx, S) {
  ctx.fillStyle = "#a14e2c"; ctx.fillRect(0, 0, S, S);
  const row = S / 4, col = S / 4;
  for (let r = 0; r < 5; r++) {
    for (let c = -1; c < 5; c++) {
      const x = c * col + (r % 2 ? col / 2 : 0), y = r * row;
      const v = 0.88 + ((r * 7 + c * 13) % 5) * 0.05; // deterministic shade variation
      ctx.fillStyle = `rgb(${Math.round(0x9b * v)},${Math.round(0x4a * v)},${Math.round(0x2b * v)})`;
      ctx.beginPath(); ctx.arc(x + col / 2, y + row * 0.9, col / 2, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "rgba(60,25,12,0.55)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + col / 2, y + row * 0.9, col / 2, Math.PI, 0); ctx.stroke();
    }
    ctx.fillStyle = "rgba(60,25,12,0.35)"; ctx.fillRect(0, r * row - 1, S, 2); // row shadow
  }
}

/** stone: large ashlar blocks with mortar lines, for the quay. */
function drawStone(ctx, S) {
  ctx.fillStyle = "#b9ad90"; ctx.fillRect(0, 0, S, S);
  const row = S / 3, col = S / 2;
  for (let r = 0; r < 3; r++) for (let c = -1; c < 3; c++) {
    const x = c * col + (r % 2 ? col / 2 : 0), v = 0.92 + ((r * 5 + c * 11) % 4) * 0.045;
    ctx.fillStyle = `rgb(${Math.round(0xb9 * v)},${Math.round(0xad * v)},${Math.round(0x90 * v)})`;
    ctx.fillRect(x + 2, r * row + 2, col - 4, row - 4);
  }
  ctx.strokeStyle = "rgba(80,70,52,0.6)"; ctx.lineWidth = 2;
  for (let r = 0; r <= 3; r++) { ctx.beginPath(); ctx.moveTo(0, r * row); ctx.lineTo(S, r * row); ctx.stroke(); }
}

const DRAWERS = { tiles: drawTiles, stone: drawStone };

/** One 128px canvas texture per kind; repeat counts tiles per metre (UVs are in metres where used). */
export function makeTexture(THREE, kind, perMetre = 0.4) {
  if (typeof document === "undefined" || !DRAWERS[kind]) return null;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  DRAWERS[kind](c.getContext("2d"), 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(perMetre, perMetre); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
