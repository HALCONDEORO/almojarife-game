// Painted raster icons for trade goods. Own work (see CREDITS.md): each good is
// a hand-painted-style illustration of the real period object (c. 1480), served
// as a 256px WebP from ./icons-img/. Rendered through one inline <svg class="gi">
// wrapper per good so the same markup works in HTML rows and inside generated
// SVG layers (the trade map); unknown ids keep the grey-circle fallback.
const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const FALLBACK = '<circle cx="12" cy="12" r="8" fill="#bbb"/>';

// One entry per trade good; the artwork lives in icons-img/<id>.webp.
export const ICON_IDS = [
  "grain", "fish", "ironware", "meat", "pottery", "legumes",
  "leather", "esparto", "salt", "wool", "iron", "timber", "bricks", "cloth",
  "olive_oil", "wine", "silk", "sugar", "pepper", "saffron", "soap", "beer",
];
const KNOWN = new Set(ICON_IDS);

// Same public contract as before: one inline <svg class="gi"> per good, grey
// circle fallback for unknown ids. The raster painting is referenced with a
// relative href so the game works from any base path.
export const goodIcon = (id, size = 22) => {
  const body = KNOWN.has(id)
    ? `<image href="icons-img/${escAttr(id)}.webp" width="24" height="24" preserveAspectRatio="xMidYMid meet"/>`
    : FALLBACK;
  return `<svg class="gi" role="img" aria-label="${escAttr(id)}" width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px">${body}</svg>`;
};
