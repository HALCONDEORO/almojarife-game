// Flat SVG icons for trade goods. Own work (see CREDITS.md), 24x24 grid, same on every device.
// Unified house style: parchment-and-ink (game palette), ink outline #3a2a14 at 1.3px,
// round caps/joins, warm flat fills. Rendered via an in-document symbol sprite so each
// good's artwork is defined once and referenced with <use>; the source of truth is S below.
const INK = "#3a2a14";
const G = (inner) => `<g stroke="${INK}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;

const S = {
  // Wheat ear: central stalk, paired grain ellipses, awns, one leaf.
  grain: G(`<path d="M12 21.5V8" fill="none"/><path d="M12 21.5C9.5 19 7.5 18.8 5.8 19.6 6.6 17.6 8.6 16.4 12 17.2" fill="#7d9a3a"/><g fill="#e0b73a"><ellipse cx="12" cy="4.6" rx="1.7" ry="2.6"/><ellipse cx="8.6" cy="7.6" rx="1.5" ry="2.5" transform="rotate(-32 8.6 7.6)"/><ellipse cx="15.4" cy="7.6" rx="1.5" ry="2.5" transform="rotate(32 15.4 7.6)"/><ellipse cx="8.6" cy="12.2" rx="1.5" ry="2.5" transform="rotate(-32 8.6 12.2)"/><ellipse cx="15.4" cy="12.2" rx="1.5" ry="2.5" transform="rotate(32 15.4 12.2)"/></g><path d="M12 2.2V0.8M10.9 2.6 9.9 1.2M13.1 2.6 14.1 1.2" fill="none" stroke-width="1"/>`),
  // Fish in profile with tail, eye and gill arc.
  fish: G(`<path d="M2.8 12C5.8 7.4 11 6.2 14.8 8.8L19.4 5.6 19.4 18.4 14.8 15.2C11 17.8 5.8 16.6 2.8 12Z" fill="#5a9a8a"/><circle cx="6.9" cy="10.6" r="1.05" fill="${INK}" stroke="none"/><path d="M11.2 8.6C12.8 10.4 12.8 13.6 11.2 15.4M14.8 8.8C15.4 10.6 15.4 13.4 14.8 15.2" fill="none" stroke-width="1"/>`),
  // Ironware: horseshoe with nail holes and a single nail.
  ironware: G(`<path d="M6.4 20.2V11.4a5.6 5.6 0 0 1 11.2 0v8.8h-3.4v-8.4a2.2 2.2 0 0 0-4.4 0v8.4Z" fill="#6c737b"/><g fill="${INK}" stroke="none"><circle cx="6.4" cy="13" r="0.75"/><circle cx="6.4" cy="16.6" r="0.75"/><circle cx="17.6" cy="13" r="0.75"/><circle cx="17.6" cy="16.6" r="0.75"/></g><path d="M3.2 21.4 6 19.9" fill="none" stroke-width="1.6"/><path d="M3.4 20.1 4.4 21.2" fill="none" stroke-width="1.2"/>`),
  // Ham shank with bone.
  meat: G(`<path d="M4.6 13.2C4.2 9.2 7.6 5.8 11.8 6.2 15.6 6.6 17.8 9.2 17.4 12.4 17 16.2 13.2 19.4 9.6 19 6.6 18.7 4.9 16.4 4.6 13.2Z" fill="#c4574f"/><path d="M15.2 8.2 18.9 4.7" fill="none" stroke="#f1d9c9" stroke-width="2.6"/><circle cx="19.4" cy="3.6" r="1.5" fill="#f1d9c9"/><circle cx="20.7" cy="5.1" r="1.5" fill="#f1d9c9"/><path d="M7.6 12.6C8.4 10.4 10.4 9 12.6 9" fill="none" stroke="#e89084" stroke-width="1"/>`),
  // Two-handled amphora.
  pottery: G(`<path d="M9.6 3.2h4.8v2.2c2.3 1 3.6 3 3.6 6.4 0 4.6-2.4 8.2-6 8.2s-6-3.6-6-8.2c0-3.4 1.3-5.4 3.6-6.4Z" fill="#c8643a"/><path d="M9.4 6.4C7 6.6 5.8 8 6.4 10.4M14.6 6.4C17 6.6 18.2 8 17.6 10.4" fill="none"/><path d="M6.6 13h10.8" fill="none" stroke="#e9b27a" stroke-width="1.1"/><path d="M10.6 20.4h2.8" fill="none"/>`),
  // Chickpeas with their little beak.
  legumes: G(`<circle cx="8.4" cy="13.6" r="3.4" fill="#d9c27a"/><circle cx="15.2" cy="15.4" r="3.2" fill="#cdb064"/><circle cx="11.6" cy="8.4" r="3" fill="#e2cc85"/><path d="M11.2 5.5c.2-1 .9-1.6 1.8-1.7M8 10.3c.1-1 .8-1.7 1.7-1.9M14.9 12.3c.2-1 .9-1.6 1.8-1.7" fill="none" stroke-width="1"/>`),
  // Kid chop with bone, lighter than the ham.
  kid_meat: G(`<path d="M6.6 15.8C5.2 12 7.4 8.2 11.2 7.6 14.4 7.1 16.8 8.9 16.9 11.9 17 15.4 13.4 18.2 10.2 17.9 8.4 17.7 7.2 17 6.6 15.8Z" fill="#e08a7a"/><path d="M15 8.6 18.6 5.2" fill="none" stroke="#f4e3d3" stroke-width="2.3"/><circle cx="19.2" cy="4.1" r="1.35" fill="#f4e3d3"/><circle cx="20.4" cy="5.5" r="1.35" fill="#f4e3d3"/><ellipse cx="10.8" cy="12.6" rx="2.7" ry="2.1" fill="#f0b3a6" stroke="none"/>`),
  // Cured hide with stitch marks.
  leather: G(`<path d="M8 3.4C7 5 8.4 6.4 7.5 8 6.1 10.4 4.2 10.6 4.2 12.4c0 1.8 1.9 2 3.3 4.4.9 1.6-.5 3 .5 4.6 1.3 1.9 6.7 1.9 8 0 1-1.6-.4-3 .5-4.6 1.4-2.4 3.3-2.6 3.3-4.4 0-1.8-1.9-2-3.3-4.4-.9-1.6.5-3-.5-4.6-1.3-1.8-6.7-1.8-8 0Z" fill="#a9672f"/><path d="M9 8.4c-1.8 2.4-1.8 4.8 0 7.2M15 8.4c1.8 2.4 1.8 4.8 0 7.2" fill="none" stroke="#e8c98f" stroke-width="1" stroke-dasharray="1.7 1.5"/>`),
  // Esparto sheaf: spiky blades tied with a band.
  esparto: G(`<g fill="#b0a050"><path d="M11.1 21.2 10 4.4 11.3 3.4 12.2 21.2Z"/><path d="M12.6 21.2 13.4 3.9 14.7 4.6 13.4 21.2Z"/><path d="M10.4 21.2 7.2 6.2 8.4 5.5 11.4 21.2Z"/><path d="M13.9 21.2 16.9 5.8 18 6.6 14.8 21.2Z"/><path d="M9.9 21.2 4.9 9.2 6 8.4 10.9 21.2Z"/></g><rect x="8.2" y="14.6" width="7.8" height="2.4" rx="1.2" fill="#8a6a2f"/>`),
  // Salt mound on a wooden tray, with a sparkle.
  salt: G(`<path d="M5.6 17.6C6.4 12.6 8.8 7.4 12 5.4c3.2 2 5.6 7.2 6.4 12.2Z" fill="#f7f1de"/><path d="M12 5.4c3.2 2 5.6 7.2 6.4 12.2H12Z" fill="#e9e4d4" stroke="none"/><rect x="3.6" y="17.6" width="16.8" height="2.5" rx="1.2" fill="#8a6a2f"/><path d="M18.6 4.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z" fill="#fdfaf2" stroke-width="0.9"/>`),
  // Cloud of wool with curl marks.
  wool: G(`<path d="M7.2 18.6a3.6 3.6 0 0 1-1.1-7 4.1 4.1 0 0 1 3.5-4.7 4.2 4.2 0 0 1 4.8 0 4.1 4.1 0 0 1 3.5 4.7 3.6 3.6 0 0 1-1.1 7Z" fill="#f2efe6"/><path d="M8.8 11.4a1.7 1.7 0 0 1 2.8-.6M12.6 9.2a1.7 1.7 0 0 1 2.6-.4M10.4 14.6a1.7 1.7 0 0 1 2.8-.6" fill="none" stroke-width="1"/>`),
  // Two stacked iron ingots.
  iron: G(`<path d="M3.6 16.8 5.3 12.4h7.4l1.7 4.4Z" fill="#7a828a"/><path d="M9.6 11.4 11.3 7h7.4l1.7 4.4Z" fill="#8d959d"/><path d="M6 13.4h6M12 8h6" fill="none" stroke="#c3cad1" stroke-width="1"/>`),
  // Two logs with end rings and bark arcs.
  timber: G(`<rect x="4" y="12.4" width="14.5" height="5.6" rx="2.2" fill="#a8733a"/><circle cx="5.7" cy="15.2" r="2.9" fill="#d9b27a"/><circle cx="5.7" cy="15.2" r="1.4" fill="none" stroke-width="1"/><circle cx="5.7" cy="15.2" r="0.45" fill="${INK}" stroke="none"/><rect x="7.2" y="6.2" width="13.5" height="5.2" rx="2" fill="#b57f42"/><circle cx="8.9" cy="8.8" r="2.6" fill="#e0bb84"/><circle cx="8.9" cy="8.8" r="1.2" fill="none" stroke-width="1"/><path d="M12.4 9.6c1.8-.7 3.8-.7 5.6 0M10.6 15c2-.8 4.2-.8 6.2 0" fill="none" stroke-width="0.9"/>`),
  // Brick wall: three bricks with mortar lines.
  bricks: G(`<rect x="7.6" y="5.4" width="9" height="5" rx="1" fill="#c06044"/><rect x="3.4" y="12.6" width="8.4" height="5" rx="1" fill="#b5583a"/><rect x="12.6" y="12.6" width="8.4" height="5" rx="1" fill="#a94f34"/><path d="M4 18.8h16.4M7.6 11.6h9" fill="none" stroke="#e8d9b5" stroke-width="0.9"/>`),
  // Folded bolt of cloth with zigzag fold edge and tie band.
  cloth: G(`<path d="M4.4 7.2h15.2v8.4l-2.5 2-2.7-2-2.4 2-2.4-2-2.7 2-2.5-2Z" fill="#b2403f"/><path d="M4.4 7.2h15.2" fill="none"/><path d="M9.6 7.2v5.2M14.4 7.2v5.2" fill="none" stroke="#8a2c2b" stroke-width="1"/><rect x="10.9" y="7.2" width="2.2" height="8.2" fill="#8a6a2f" stroke-width="1.1"/><path d="M6.6 9.4h2M15.6 9.4h2" fill="none" stroke="#d97a72" stroke-width="0.9"/>`),
  // Oil cruet with spout and olives.
  olive_oil: G(`<path d="M10.2 5.6h3.6v2.2c2 1 3.2 3 3.2 5.8 0 4-2 7-5 7s-5-3-5-7c0-2.8 1.2-4.8 3.2-5.8Z" fill="#9aa83a"/><rect x="9.9" y="2.6" width="4.2" height="3.2" rx="1" fill="#6b4a22"/><path d="M8.6 12.6c.6-1.6 1.7-2.6 3-3" fill="none" stroke="#d8e07a" stroke-width="1.1"/><circle cx="17.6" cy="19.4" r="1.9" fill="#6b7a22"/><path d="M17.6 17.5c.4-1.4 1.4-2.2 2.8-2.4-.2 1.4-1.2 2.3-2.8 2.4Z" fill="#7d9a3a" stroke-width="1"/>`),
  // Wine barrel with hoops and staves.
  wine: G(`<path d="M12 4.2c4.3 0 6.9 3.4 6.9 7.8s-2.6 7.8-6.9 7.8-6.9-3.4-6.9-7.8 2.6-7.8 6.9-7.8Z" fill="#8a4a2a"/><path d="M5.4 8.4h13.2M5.4 15.6h13.2" fill="none" stroke="#d9d2c0" stroke-width="1.5"/><path d="M12 4.4v15.2M8.7 5C7.8 8.2 7.8 15.8 8.7 19M15.3 5c.9 3.2.9 13.2 0 14" fill="none" stroke-width="0.9"/>`),
  // Silk: draped ribbon with sheen.
  silk: G(`<path d="M17.4 4.6C13.2 3.6 8.8 5.2 7.2 8.9c-1.2 2.8.3 4.4 2.7 4.1-2 1.6-2.9 4.4-1 6.4 2.3 2.4 7 1.6 8.5-1.9.9-2.2-.4-4.2-2.8-4.6 2.4-1.1 4.4-4.3 2.8-8.3Z" fill="#b0276b"/><path d="M10 6.9c2-1.1 4.4-.9 5.9.6M9.6 17.6c1.9 1.2 4.2 1 5.7-.4" fill="none" stroke="#e86aa6" stroke-width="1.1"/>`),
  // Sugarloaf cone on a plate.
  sugar: G(`<path d="M12 3.2c2.5 3.6 4 7.8 4.5 13h-9c.5-5.2 2-9.4 4.5-13Z" fill="#fbfbfb"/><path d="M12 3.2c2.5 3.6 4 7.8 4.5 13H12Z" fill="#e6e0d2" stroke="none"/><rect x="5.4" y="16.2" width="13.2" height="2.6" rx="1.3" fill="#c9c2b2"/><path d="M10.2 8.4c-.5 1.6-.9 3.4-1.1 5.2" fill="none" stroke="#d7dde0" stroke-width="0.9"/>`),
  // Black pepper: stem with peppercorn cluster.
  pepper: G(`<path d="M11.6 3.6c.4 2 .1 3.9-.9 5.6" fill="none"/><path d="M11.9 4.4c1.7-1.6 4-1.4 5.1 0-1.3 1.6-3.6 1.6-5.1 0Z" fill="#6f7d3a"/><circle cx="8.3" cy="11" r="2" fill="#6b5138"/><circle cx="12.2" cy="10.2" r="2.1" fill="#4a3b2c"/><circle cx="15.4" cy="12" r="1.9" fill="#6b5138"/><circle cx="9.7" cy="14.6" r="2" fill="#4a3b2c"/><circle cx="13.6" cy="15.2" r="2" fill="#6b5138"/><circle cx="11.6" cy="18.6" r="1.9" fill="#4a3b2c"/><g fill="#b39a72" stroke="none"><circle cx="11.6" cy="9.4" r="0.55"/><circle cx="9.1" cy="13.9" r="0.55"/><circle cx="13" cy="14.6" r="0.55"/></g>`),
  // Saffron crocus with three red stigmas.
  saffron: G(`<path d="M12 13.2C10.6 9.9 10.6 6.3 12 3.6c1.4 2.7 1.4 6.3 0 9.6Z" fill="#8d5fc0"/><path d="M11.8 13.2C9 11.4 7.2 8.4 7.4 5c2.7.7 4.3 3.6 4.4 8.2Z" fill="#7a4fb0"/><path d="M12.2 13.2C15 11.4 16.8 8.4 16.6 5c-2.7.7-4.3 3.6-4.4 8.2Z" fill="#7a4fb0"/><path d="M12 13v7.4" fill="none" stroke="#5c7a33"/><path d="M12 17.4c-1.6-.2-2.6-1.2-3-2.8M12 18.6c1.6-.2 2.6-1.2 3-2.8" fill="none" stroke="#5c7a33" stroke-width="1.1"/><path d="M11.6 12.4 10.6 6.6M12.2 12.2V5.8M12.6 12.4 13.8 6.4" fill="none" stroke="#d92b1f" stroke-width="1.25"/>`),
  // Soap bar with bubbles.
  soap: G(`<rect x="4" y="10" width="16" height="9" rx="4.5" fill="#e8e2d0"/><path d="M7.4 14.5c1.4 1.2 7.8 1.2 9.2 0" fill="none" stroke="#c9c0a6" stroke-width="1"/><circle cx="6.6" cy="5.8" r="1.5" fill="#f4f8f8" stroke-width="1"/><circle cx="10.2" cy="4" r="1.9" fill="#f4f8f8" stroke-width="1"/><circle cx="13.4" cy="6.2" r="1.2" fill="#f4f8f8" stroke-width="1"/>`),
  // Beer tankard with foam and handle.
  beer: G(`<path d="M6.4 8.6h10.4l-1 11a1.8 1.8 0 0 1-1.8 1.6H9.2a1.8 1.8 0 0 1-1.8-1.6Z" fill="#d99a2b"/><path d="M17 10.4h1.9a2.6 2.6 0 0 1 0 5.2h-2" fill="none" stroke-width="1.6"/><path d="M6 8.8a2 2 0 0 1 1.6-2.6 2.6 2.6 0 0 1 4.2-1.8 2.4 2.4 0 0 1 4.4 1.2 2 2 0 0 1 1.6 3.2Z" fill="#f7f1de"/><path d="M8.6 11.4v7.6M12 11.4v7.6" fill="none" stroke="#b57a1e" stroke-width="1"/>`),
};

const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const FALLBACK = '<circle cx="12" cy="12" r="8" fill="#bbb"/>';

// One hidden <svg> holding every good's artwork as a <symbol>; mounted once per document.
export const ICON_SPRITE =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">` +
  Object.entries(S).map(([id, inner]) => `<symbol id="gi-${escAttr(id)}" viewBox="0 0 24 24">${inner}</symbol>`).join("") +
  `</svg>`;

// Appends the sprite to the document (idempotent). Call once before the first render;
// index.html mounts it ahead of main.mjs so every consumer finds the symbols in place.
export function mountIconSprite(doc = document) {
  if (doc.getElementById("gi-sprite")) return;
  const host = doc.createElement("div");
  host.id = "gi-sprite";
  host.setAttribute("aria-hidden", "true");
  host.style.display = "none";
  host.innerHTML = ICON_SPRITE;
  doc.body.appendChild(host);
}

// Same public contract as before: one inline <svg class="gi"> per good, grey circle fallback.
// Known goods reference the mounted sprite; the fallback stays self-contained.
export const goodIcon = (id, size = 22) => {
  const body = S[id]
    ? `<use href="#gi-${escAttr(id)}"/>`
    : FALLBACK;
  return `<svg class="gi" role="img" aria-label="${escAttr(id)}" width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px">${body}</svg>`;
};
export const ICON_IDS = Object.keys(S);
