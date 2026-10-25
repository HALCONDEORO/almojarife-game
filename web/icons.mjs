// Painted SVG icons for trade goods. Own work (see CREDITS.md), 24x24 grid,
// same on every device. Style: small period still-life paintings - flat base
// colours with shared volumetric overlays (light from the top-left), ground
// shadows and fine ink detail, like miniatures on parchment.
// Rendered via an in-document symbol sprite; the source of truth is S below.
const INK = "#3a2a14";
const G = (inner) => `<g stroke="${INK}" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;

// Shared volume overlays: one highlight and one shade gradient reused by every
// icon, plus a horizontal cylinder gradient and a vertical one. Defined once in
// the sprite; ids are shared on purpose so the artwork stays compact.
const DEFS = `<defs>` +
  `<radialGradient id="gi-hl" cx="34%" cy="26%" r="75%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".8"/><stop offset="42%" stop-color="#ffffff" stop-opacity=".14"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="gi-sh" cx="50%" cy="55%" r="52%"><stop offset="55%" stop-color="#1a0e04" stop-opacity="0"/><stop offset="100%" stop-color="#1a0e04" stop-opacity=".4"/></radialGradient>` +
  `<linearGradient id="gi-lin" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity=".42"/><stop offset="42%" stop-color="#ffffff" stop-opacity="0"/><stop offset="100%" stop-color="#1a0e04" stop-opacity=".4"/></linearGradient>` +
  `<linearGradient id="gi-linv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".34"/><stop offset="55%" stop-color="#ffffff" stop-opacity="0"/><stop offset="100%" stop-color="#1a0e04" stop-opacity=".34"/></linearGradient>` +
  `</defs>`;

// Ground shadow under an object.
const SHADOW = (cx = 12, cy = 20.8, rx = 6.5, ry = 1.5) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3a2a14" opacity=".16" stroke="none"/>`;
// Painted path: base fill + highlight + shade over the same geometry.
const P = (d, fill) =>
  `<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#gi-hl)" stroke="none"/><path d="${d}" fill="url(#gi-sh)" stroke="none"/>`;
// Painted path with cylinder shading instead of radial.
const PC = (d, fill) =>
  `<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#gi-lin)" stroke="none"/>`;
// Painted ellipse (optionally rotated).
const E = (cx, cy, rx, ry, fill, rot) => {
  const e = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ""}`;
  return `${e} fill="${fill}"/>${e} fill="url(#gi-hl)" stroke="none"/>${e} fill="url(#gi-sh)" stroke="none"/>`;
};
// Small white glint.
const GLINT = (cx, cy, r = 0.8) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity=".85" stroke="none"/>`;

const S = {
  // Wheat ear: volumetric kernels with crease, awns, stalk and leaf.
  grain: G(`${SHADOW(12, 21.6, 4.5, 1.1)}<path d="M12 21.4V7.5" fill="none" stroke="#7d8a3a" stroke-width="1.4"/><path d="M12 21.4C9.4 19.2 7.4 19 5.6 19.8 6.4 17.6 8.6 16.4 12 17.2Z" fill="#9aa84a"/><path d="M12 21.4C9.4 19.2 7.4 19 5.6 19.8 6.4 17.6 8.6 16.4 12 17.2Z" fill="url(#gi-linv)" stroke="none"/>${E(12, 4.8, 1.7, 2.6, "#d9a62e")}${E(8.7, 7.8, 1.5, 2.5, "#d9a62e", -32)}${E(15.3, 7.8, 1.5, 2.5, "#d9a62e", 32)}${E(8.7, 12.3, 1.5, 2.5, "#d9a62e", -32)}${E(15.3, 12.3, 1.5, 2.5, "#d9a62e", 32)}<path d="M12 2.6v3.2M8.9 6.2l1.2 2.2M15.1 6.2l-1.2 2.2M8.9 10.7l1.2 2.2M15.1 10.7l-1.2 2.2" fill="none" stroke="#8a6420" stroke-width="0.7"/><path d="M11 2.4 10 1M12 2.2V0.8M13 2.4 14 1" fill="none" stroke="#8a6420" stroke-width="0.8"/>`),
  // Fish in profile: belly light, back dark, scales, fin, eye glint.
  fish: G(`${SHADOW(11.5, 20.6, 7, 1.3)}${P("M2.8 12C5.8 7.4 11 6.2 14.8 8.8L19.4 5.6 19.4 18.4 14.8 15.2C11 17.8 5.8 16.6 2.8 12Z", "#6f9a92")}<path d="M3.6 12.6c2.8 2.6 7.4 3.2 11 .6-1.2 1.8-3.2 2.9-5.6 2.9-2.6 0-4.6-1.2-5.4-3.5Z" fill="#cfded8" stroke="none"/><path d="M4.6 9.2C6.6 7.2 9.6 6.4 12.4 7.4" fill="none" stroke="#a8c6be" stroke-width="1.1"/><path d="M9.4 9.6c1 1.4 1 3.4 0 4.8M11.8 9.2c1 1.6 1 4 0 5.6M14 9c1 1.7 1 4.3 0 6" fill="none" stroke="#48706a" stroke-width="0.7"/><path d="M16.4 8.2l1.4 3.8-1.4 3.8" fill="none" stroke="#48706a" stroke-width="0.8"/><circle cx="6.6" cy="10.6" r="1.1" fill="${INK}" stroke="none"/>${GLINT(6.3, 10.2, 0.4)}`),
  // Ironware: anvil with lit top face and shaded waist.
  ironware: G(`${SHADOW(12, 20.4, 7, 1.4)}${P("M3.2 6.6h10.8l2-1.4c2 1.2 3.6 2.8 4.6 4.8-1.4 1-3.2 1.5-5.2 1.5h-2.2l.7 3.2h2l1 4.1H7.1l1-4.1h2l.7-3.2H7.4a4.2 4.2 0 0 1-4.2-4.2Z", "#7d868f")}<path d="M3.2 6.6h10.8l2-1.4c.8.5 1.6 1.1 2.3 1.8H4.6c-.5.6-.9 1.2-1.4 1.9Z" fill="#b4bcc4" stroke="none"/><path d="M9.8 12.8l3 0.4M9.6 14.4l3.2 0.4M9 16.6l4 0.3" fill="none" stroke="#4a525a" stroke-width="0.6"/>${GLINT(4.6, 7.3, 0.6)}`),
  // Ham on the bone: glossy lobe, long bone visibly entering the meat.
  meat: G(`${SHADOW(9.5, 20.8, 6.5, 1.4)}${P("M2.6 15c-1.2-3.8 1.2-7.8 5.2-8.4 2.9-.4 5.2.6 6.4 2.4.9 1.3 1.3 2.9.9 4.4-1.2 2.4-3.8 4.9-6.6 5.2-3.1.3-5.3-1.3-5.9-3.6Z", "#b0473d")}<path d="M11.2 10.6 18.6 4.4" fill="none" stroke="#e8d5b8" stroke-width="3"/>${E(19.2, 3.4, 1.8, 1.8, "#f1e3d0")}${E(20.6, 5.2, 1.8, 1.8, "#f1e3d0")}<path d="M10.4 9.2c1.2.2 2.2.8 2.8 1.8l1.6-1.2c-.8-1.2-2-2-3.4-2.2Z" fill="#f1e3d0" stroke-width="0.7"/><path d="M4.6 12.4c.9-2.2 2.8-3.6 5-3.8" fill="none" stroke="#e89084" stroke-width="1.2"/><path d="M4.8 16.8c1.9 1.5 4.6 1.9 6.9 1.3" fill="none" stroke="#7d2f28" stroke-width="0.7"/>`),
  // Amphora: glazed highlight, incised bands, ring foot.
  pottery: G(`${SHADOW(12, 20.9, 5.5, 1.3)}${P("M9.8 3h4.4v1.8h-1l.3 1.6c2.1 1 3.4 3 3.4 6.2 0 4.4-2.3 8-4.9 8s-4.9-3.6-4.9-8c0-3.2 1.3-5.2 3.4-6.2l.3-1.6h-1Z", "#c06a3e")}<path d="M9.4 5.6C7.2 6 6 7.6 6.6 9.8M14.6 5.6c2.2.4 3.4 2 2.8 4.2" fill="none"/><path d="M6.8 12.6h10.4M7.2 15.4h9.6" fill="none" stroke="#8a4526" stroke-width="0.7"/><path d="M9.8 20.6h4.4" fill="none"/><path d="M8.6 8.6c-.9 1.2-1.4 2.8-1.3 4.6" fill="none" stroke="#eec49a" stroke-width="1.3"/>`),
  // Chickpeas: round peas with crease and beak, soft cluster.
  legumes: G(`${SHADOW(12, 20.6, 6, 1.3)}${E(8.2, 13.8, 3.4, 3.4, "#d9be76")}${E(15.4, 15.2, 3.2, 3.2, "#d0b468")}${E(11.8, 8.2, 3, 3, "#e0c57e")}${E(10.4, 17.9, 2.6, 2.4, "#c9ad60")}<path d="M11.4 5.3c.2-1 .9-1.6 1.8-1.7M7.8 10.5c.1-1 .8-1.7 1.7-1.9M15 12.1c.2-1 .9-1.6 1.8-1.7" fill="none" stroke-width="0.9"/><path d="M7 13.4c.5-1.2 1.4-2 2.6-2.2M10.6 8c.4-1 1.2-1.7 2.2-1.9M14.2 15c.4-1 1.2-1.7 2.2-1.9" fill="none" stroke="#a89048" stroke-width="0.7"/>`),
  // Kid rib rack: glossy meat pad, fat edge, bones with knobs.
  kid_meat: G(`${SHADOW(12, 21, 6.5, 1.3)}<path d="M8.6 11.4C8.2 9.4 8.6 7.4 9.8 5.6M12 10.9c-.2-2.2.2-4.2 1.2-5.9M15.4 11.4c.2-2.2.8-4 1.8-5.4" fill="none" stroke="#e8d5b8" stroke-width="2.4"/>${E(9.8, 5.4, 1.3, 1.3, "#f4e6d4")}${E(13.2, 4.9, 1.3, 1.3, "#f4e6d4")}${E(17.2, 5.9, 1.3, 1.3, "#f4e6d4")}${P("M5 15.6c0-3 3-5 7-5s7 2 7 5c0 2-1.6 3.4-3.8 3.8-2.8.6-6.6.2-8.4-.9C5.6 17.7 5 16.8 5 15.6Z", "#de8474")}<path d="M6.2 14.2c1.4-1.8 3.6-2.6 5.8-2.4" fill="none" stroke="#f4c4b4" stroke-width="1.2"/><path d="M6.8 17.2c1.8.9 4.2 1.2 6.4.9" fill="none" stroke="#b05c4e" stroke-width="0.7"/>`),
  // Cured hide: wavy edge, darker rim, stitch dashes.
  leather: G(`${SHADOW(12, 20.9, 6, 1.3)}${P("M8 3.4C7 5 8.4 6.4 7.5 8 6.1 10.4 4.2 10.6 4.2 12.4c0 1.8 1.9 2 3.3 4.4.9 1.6-.5 3 .5 4.6 1.3 1.9 6.7 1.9 8 0 1-1.6-.4-3 .5-4.6 1.4-2.4 3.3-2.6 3.3-4.4 0-1.8-1.9-2-3.3-4.4-.9-1.6.5-3-.5-4.6-1.3-1.8-6.7-1.8-8 0Z", "#b3702f")}<path d="M9.2 6.2C8.6 7.4 9.6 8.6 8.9 10c-.9 1.8-2.4 2-2.4 3.4 0 1.4 1.5 1.6 2.4 3.4.7 1.4-.3 2.6.3 3.8M14.8 6.2c.6 1.2-.4 2.4.3 3.8.9 1.8 2.4 2 2.4 3.4 0 1.4-1.5 1.6-2.4 3.4-.7 1.4.3 2.6-.3 3.8" fill="none" stroke="#7d4a1e" stroke-width="0.8" stroke-dasharray="1.6 1.4"/><path d="M9.4 9.6c-.6 1.4-.6 3.4 0 4.8" fill="none" stroke="#d99a5a" stroke-width="1"/>`),
  // Esparto sheaf: volumetric blades with veins, cord band.
  esparto: G(`${SHADOW(12, 21.2, 5.5, 1.2)}${P("M11 21.2 9.9 4.4 11.2 3.4 12.2 21.2Z", "#b8a54e")}${P("M12.5 21.2 13.4 3.9 14.7 4.6 13.4 21.2Z", "#ac9a44")}${P("M10.3 21.2 7.1 6.2 8.3 5.5 11.3 21.2Z", "#c0ae56")}${P("M13.9 21.2 16.9 5.8 18 6.6 14.8 21.2Z", "#ac9a44")}${P("M9.8 21.2 4.8 9.2 5.9 8.4 10.8 21.2Z", "#c0ae56")}<path d="M10.9 19.4 10.2 6.4M12.9 19.4 13.7 6M9.7 19.4 7.6 8.4" fill="none" stroke="#877a34" stroke-width="0.6"/>${PC("M8.2 14.6h7.8v2.4a1.2 1.2 0 0 1-1.2 1.2H9.4a1.2 1.2 0 0 1-1.2-1.2Z", "#8a6a2f")}<path d="M8.2 15.8h7.8" fill="none" stroke="#5f4720" stroke-width="0.7"/>`),
  // Salt: glistening mound with crystals, wooden tray.
  salt: G(`${SHADOW(12, 20.6, 7.5, 1.2)}${P("M5.6 17.6C6.4 12.6 8.8 7.4 12 5.4c3.2 2 5.6 7.2 6.4 12.2Z", "#f5eeda")}<path d="M9 13.4l1-2.4 1 2.4-1 1.2ZM12.6 10.6l.8-1.9.8 1.9-.8 1Z" fill="#ffffff" stroke="#c9c0a4" stroke-width="0.5"/>${PC("M3.6 17.6h16.8v1.3a1.2 1.2 0 0 1-1.2 1.2H4.8a1.2 1.2 0 0 1-1.2-1.2Z", "#8a6a2f")}<path d="M18.8 3.4l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" fill="#ffffff" stroke-width="0.7"/>`),
  // Fleece: one fluffy cloud of wool with spiral locks.
  wool: G(`${SHADOW(12, 20.4, 6.5, 1.3)}${P("M6.6 18.8a3.4 3.4 0 0 1-1.4-6.4 3.9 3.9 0 0 1 2.9-4.6 4 4 0 0 1 3.9-1.6 4 4 0 0 1 3.9 1.6 3.9 3.9 0 0 1 2.9 4.6 3.4 3.4 0 0 1-1.4 6.4Z", "#f2efe6")}<path d="M8.2 10.8a1.5 1.5 0 0 1 2.4-.5 1.5 1.5 0 0 1 2.4-.2M6.9 14.2a1.5 1.5 0 0 1 2.4-.4 1.5 1.5 0 0 1 2.4-.2 1.5 1.5 0 0 1 2.2.4M8.6 17a1.4 1.4 0 0 1 2.2-.4 1.4 1.4 0 0 1 2.2-.2" fill="none" stroke="#a89e86" stroke-width="0.7"/><path d="M7.8 12.4c.4-.8 1.2-1.3 2.1-1.4" fill="none" stroke="#ffffff" stroke-width="1"/>`),
  // Iron ingots: lit top faces, forged sides, speckle.
  iron: G(`${SHADOW(12, 20.6, 7, 1.3)}${P("M3.6 16.8 5.3 12.4h7.4l1.7 4.4Z", "#78818a")}${P("M9.6 11.4 11.3 7h7.4l1.7 4.4Z", "#8d959d")}<path d="M5.3 12.4h7.4l1.7 4.4H3.6Z" fill="none"/><path d="M11.3 7h7.4l1.7 4.4H9.6Z" fill="none"/><path d="M5.3 12.4h7.4M11.3 7h7.4" fill="none" stroke="#c3cad1" stroke-width="0.9"/><path d="M6.2 14.6l4.8 0.4M12.2 9.2l4.6 0.4" fill="none" stroke="#4a525a" stroke-width="0.6"/>${GLINT(6, 13.2, 0.5)}${GLINT(12, 7.8, 0.5)}`),
  // Timber: two logs with cylinder shade, end rings, bark lines.
  timber: G(`${SHADOW(12, 20.6, 7.5, 1.3)}${PC("M4 14.6a2.2 2.2 0 0 1 2.2-2.2h10.1a2.2 2.2 0 0 1 2.2 2.2v1.2a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 15.8Z", "#a8733a")}${E(5.7, 15.2, 2.9, 2.9, "#d9b27a")}<circle cx="5.7" cy="15.2" r="1.6" fill="none" stroke="#8a6a3a" stroke-width="0.7"/><circle cx="5.7" cy="15.2" r="0.5" fill="${INK}" stroke="none"/>${PC("M7.2 8.2a2 2 0 0 1 2-2h9.5a2 2 0 0 1 2 2v1.2a2 2 0 0 1-2 2H9.2a2 2 0 0 1-2-2Z", "#b57f42")}${E(8.9, 8.8, 2.6, 2.6, "#e0bb84")}<circle cx="8.9" cy="8.8" r="1.4" fill="none" stroke="#8a6a3a" stroke-width="0.7"/><path d="M12.4 9.6c1.8-.7 3.8-.7 5.6 0M10.6 15c2-.8 4.2-.8 6.2 0" fill="none" stroke="#7d5426" stroke-width="0.7"/>`),
  // Bricks: fired clay with speckle, recessed mortar.
  bricks: G(`${SHADOW(12, 20.6, 7.5, 1.2)}${P("M7.6 5.4h8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z", "#c06044")}${P("M3.4 12.6h7.4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z", "#b5583a")}${P("M12.6 12.6h7.4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7.4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z", "#a94f34")}<path d="M4 18.8h16.4M7.6 11.6h9" fill="none" stroke="#e8d9b5" stroke-width="0.9"/><g fill="#7d3220" stroke="none"><circle cx="9.6" cy="7.4" r="0.45"/><circle cx="14.2" cy="8.8" r="0.45"/><circle cx="6" cy="14.8" r="0.45"/><circle cx="9.4" cy="16.4" r="0.45"/><circle cx="15.4" cy="14.8" r="0.45"/><circle cx="18.6" cy="16.2" r="0.45"/></g>`),
  // Cloth: folded bolt with silk-fold shading and fringe.
  cloth: G(`${SHADOW(12, 20.9, 7.5, 1.2)}${P("M4.4 6.4h15.2v8.8l-2.5 2.2-2.7-2.2-2.4 2.2-2.4-2.2-2.7 2.2-2.5-2.2Z", "#a83a3a")}<path d="M7.4 6.6v7.8M12 6.6v7.8M16.6 6.6v7.8" fill="none" stroke="#6e2423" stroke-width="1.1"/><path d="M8.7 6.6v7.4M13.3 6.6v7.4M17.9 6.6v7.4" fill="none" stroke="#d97a72" stroke-width="0.7"/>${PC("M10.9 6.4h2.2v8.8h-2.2Z", "#8a6a2f")}<path d="M10.9 10.8h2.2" fill="none" stroke="#5f4720" stroke-width="0.7"/>`),
  // Oil cruet: translucent body, oil level, cork, olive twig.
  olive_oil: G(`${SHADOW(12, 20.9, 6, 1.3)}${P("M10.4 7.2h3.2l.6 2.2c1.6 1 2.6 2.8 2.6 5 0 3.6-1.9 6-4.8 6s-4.8-2.4-4.8-6c0-2.2 1-4 2.6-5Z", "#a8b23e")}<path d="M7.4 13.6c1.4.8 3 .9 4.6.9s3.2-.1 4.6-.9c-.2 2.6-1.8 4.4-4.6 4.4s-4.4-1.8-4.6-4.4Z" fill="#7d8a2a" stroke="none"/>${PC("M10.4 4.6h3.2v2.6h-3.2Z", "#8a6a3a")}<path d="M8.8 10.4c.4-1.2 1.2-2.2 2.2-2.6" fill="none" stroke="#e8f09a" stroke-width="1.2"/>${E(18.4, 19.4, 1.7, 1.9, "#6b7a22")}${E(15.2, 20.6, 1.4, 1.5, "#7d8a2a")}<path d="M16.4 18.8c.8-1.4 2-2.2 3.6-2.4-.4 1.4-1.6 2.3-3.2 2.5Z" fill="#7d9a3a" stroke-width="0.8"/>`),
  // Wine barrel: staves, metal hoops with rivets, cellar shade.
  wine: G(`${SHADOW(12, 20.6, 6.5, 1.3)}${PC("M12 4.2c4.3 0 6.9 3.4 6.9 7.8s-2.6 7.8-6.9 7.8-6.9-3.4-6.9-7.8 2.6-7.8 6.9-7.8Z", "#8a4a2a")}<path d="M5.4 8.4h13.2M5.4 15.6h13.2" fill="none" stroke="#6e6a5e" stroke-width="1.4"/><path d="M5.4 8.8h13.2M5.4 16h13.2" fill="none" stroke="#3e3a34" stroke-width="0.5"/><path d="M12 4.4v15.2M8.7 5C7.8 8.2 7.8 15.8 8.7 19M15.3 5c.9 3.2.9 13.2 0 14" fill="none" stroke-width="0.8"/><g fill="${INK}" stroke="none"><circle cx="8" cy="8.4" r="0.5"/><circle cx="12" cy="8.4" r="0.5"/><circle cx="16" cy="8.4" r="0.5"/><circle cx="8" cy="15.6" r="0.5"/><circle cx="12" cy="15.6" r="0.5"/><circle cx="16" cy="15.6" r="0.5"/></g><path d="M7.2 6.4c-.6 1.6-.9 3.6-.9 5.6" fill="none" stroke="#c98a5a" stroke-width="1"/>`),
  // Silk: wound spool with sheen bands and a loose strand.
  silk: G(`${SHADOW(12, 20.9, 5.5, 1.2)}${PC("M8 4h8l-1.2 2H9.2Z", "#d9c9a8")}${PC("M8.2 16.4h7.6L17 19H7Z", "#d9c9a8")}${P("M9.2 6h5.6l1 10.4H8.2Z", "#b8357a")}<path d="M9.6 7.4 14 8.2M9.4 9.4l4.8.9M9.3 11.5l5 .8M9.2 13.5l5.1.8M9.1 15.4l5.2.7" fill="none" stroke="#e86aa6" stroke-width="0.9"/><path d="M9.8 8.4 14.6 9.2M9.6 12.4l5.2.8" fill="none" stroke="#6e1c44" stroke-width="0.5"/><path d="M15.8 16.8c2.2.2 3.4 1.2 3.2 2.8-.2 1.2-1.6 1.6-2.8 1" fill="none" stroke="#b8357a" stroke-width="1.2"/>`),
  // Sugarloaf: matte cone, blue paper wrap, pewter plate.
  sugar: G(`${SHADOW(12, 20.3, 7, 1.2)}${P("M12 2.8c2.5 3.8 4 8.2 4.5 13.6h-9C8 11 9.5 6.6 12 2.8Z", "#f7f4ea")}<path d="M13 6.4l1 3.4M13.8 11.4l.8 3.4" fill="none" stroke="#cfc8b4" stroke-width="0.6"/>${PC("M7.9 13.6h8.2l.6 2.8H7.3Z", "#9fb4c0")}<path d="M7.6 15h8.8" fill="none" stroke="#6e8794" stroke-width="0.7"/>${E(12, 17.7, 6.8, 1.3, "#c9c2b2")}${GLINT(10.4, 7.6, 0.6)}`),
  // Black pepper: wrinkled corns with glints, stem and leaf.
  pepper: G(`${SHADOW(12, 20.9, 5.5, 1.2)}<path d="M11.6 3.6c.4 2 .1 3.9-.9 5.6" fill="none"/><path d="M11.9 4.4c1.7-1.6 4-1.4 5.1 0-1.3 1.6-3.6 1.6-5.1 0Z" fill="#6f7d3a"/><path d="M11.9 4.4c1.7-1.6 4-1.4 5.1 0-1.3 1.6-3.6 1.6-5.1 0Z" fill="url(#gi-linv)" stroke="none"/>${E(8.3, 11, 2, 2, "#6b5138")}${E(12.2, 10.2, 2.1, 2.1, "#4a3b2c")}${E(15.4, 12, 1.9, 1.9, "#6b5138")}${E(9.7, 14.6, 2, 2, "#4a3b2c")}${E(13.6, 15.2, 2, 2, "#6b5138")}${E(11.6, 18.6, 1.9, 1.9, "#4a3b2c")}<path d="M7.6 10.4c.4.4 1 .6 1.5.5M11.4 9.6c.5.4 1.1.5 1.7.4M9 14c.4.4 1 .6 1.5.5M12.9 14.6c.5.4 1.1.5 1.7.4" fill="none" stroke="#2e241a" stroke-width="0.6"/>${GLINT(7.6, 10.2, 0.5)}${GLINT(12.9, 14.4, 0.5)}`),
  // Saffron crocus: satin petals with veins, red stigmas.
  saffron: G(`${SHADOW(12, 21.4, 3.5, 1)}${P("M12 13.2C10.6 9.9 10.6 6.3 12 3.6c1.4 2.7 1.4 6.3 0 9.6Z", "#9a6fd0")}${P("M11.8 13.2C9 11.4 7.2 8.4 7.4 5c2.7.7 4.3 3.6 4.4 8.2Z", "#8658be")}${P("M12.2 13.2C15 11.4 16.8 8.4 16.6 5c-2.7.7-4.3 3.6-4.4 8.2Z", "#8658be")}<path d="M12 5.6v6.4M8.6 7.4c.8 1.8 1.6 3.4 2.6 4.6M15.4 7.4c-.8 1.8-1.6 3.4-2.6 4.6" fill="none" stroke="#5c3a8a" stroke-width="0.6"/><path d="M12 13v7.4" fill="none" stroke="#5c7a33"/><path d="M12 17.4c-1.6-.2-2.6-1.2-3-2.8M12 18.6c1.6-.2 2.6-1.2 3-2.8" fill="none" stroke="#5c7a33" stroke-width="1"/><path d="M11.6 12.4 10.6 6.6M12.2 12.2V5.8M12.6 12.4 13.8 6.4" fill="none" stroke="#d92b1f" stroke-width="1.25"/>`),
  // Soap: milky bar with stamped oval, wet sheen, bubbles.
  soap: G(`${SHADOW(12, 20.3, 7, 1.3)}${P("M8.5 10h7a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5 4.5 4.5 0 0 1 8.5 10Z", "#e8e2d0")}<ellipse cx="12" cy="14.5" rx="4.4" ry="2.3" fill="none" stroke="#b9ad8e" stroke-width="0.8"/><path d="M9.6 14.5h4.8" fill="none" stroke="#b9ad8e" stroke-width="0.7"/><path d="M6.4 12.2c.6-1 1.6-1.6 2.8-1.8" fill="none" stroke="#ffffff" stroke-width="1.2"/>${E(6.6, 5.8, 1.5, 1.5, "#eef4f4")}${E(10.4, 4, 1.9, 1.9, "#eef4f4")}${GLINT(9.8, 3.4, 0.5)}${GLINT(6.2, 5.3, 0.4)}`),
  // Beer: oak tankard, staves, dark hoops, foam crown overflowing.
  beer: G(`${SHADOW(12, 21.4, 5.5, 1.2)}${PC("M6.2 9.6h10.6l-.9 10a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z", "#b57f42")}<path d="M8.9 9.8v10.6M12 9.8v10.6M15.1 9.8v10.6" fill="none" stroke="#7d5426" stroke-width="0.7"/><path d="M6.3 13h10.6M6.5 17h10.2" fill="none" stroke="#4a4e52" stroke-width="1.1"/><path d="M16.9 11.2h2a2.6 2.6 0 0 1 0 5.2h-2" fill="none" stroke-width="1.6"/>${P("M5.8 10a2.2 2.2 0 0 1 1.8-2.6 2.4 2.4 0 0 1 4-1.6 2.3 2.3 0 0 1 4.2.6 2.1 2.1 0 0 1 2 2.8c.4 1.4-.6 2.6-2 2.6H7.6c-1.4 0-2.2-1.2-1.8-2.8Z", "#f5efdc")}<path d="M8.8 10.4c.2 1.4 0 2.6-.6 3.6" fill="none" stroke="#f5efdc" stroke-width="1.6"/><path d="M9.4 6.8c.8-.5 1.8-.6 2.8-.4" fill="none" stroke="#ffffff" stroke-width="0.9"/>`),
};

const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const FALLBACK = '<circle cx="12" cy="12" r="8" fill="#bbb"/>';

// One hidden <svg> holding the shared gradients plus every good's artwork as a
// <symbol>; mounted once per document.
export const ICON_SPRITE =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">` +
  DEFS +
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
