// Engraving-style SVG icons for trade goods. Own work (see CREDITS.md), 24x24 grid,
// same on every device. House style: ink outline #3a2a14, muted period palette,
// fine hatch lines for shading (light from top-left), like a woodcut on parchment.
// Rendered via an in-document symbol sprite so each good's artwork is defined once
// and referenced with <use>; the source of truth is S below.
const INK = "#3a2a14";
const G = (inner) => `<g stroke="${INK}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;
// Hatch helper: shading strokes, thinner than the outline.
const H = (d, c = INK, w = 0.7) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;

const S = {
  // Wheat ear: stalk, kernels with centre crease, awns, one leaf.
  grain: G(`<path d="M12 21.5V7.5" fill="none"/><path d="M12 21.5C9.4 19.2 7.4 19 5.6 19.8 6.4 17.6 8.6 16.4 12 17.2" fill="#a3b04a"/><g fill="#dcb743"><ellipse cx="12" cy="4.8" rx="1.6" ry="2.5"/><ellipse cx="8.7" cy="7.8" rx="1.4" ry="2.4" transform="rotate(-32 8.7 7.8)"/><ellipse cx="15.3" cy="7.8" rx="1.4" ry="2.4" transform="rotate(32 15.3 7.8)"/><ellipse cx="8.7" cy="12.3" rx="1.4" ry="2.4" transform="rotate(-32 8.7 12.3)"/><ellipse cx="15.3" cy="12.3" rx="1.4" ry="2.4" transform="rotate(32 15.3 12.3)"/></g><path d="M12 2.6v3M8.9 6.2l1.2 2.2M15.1 6.2l-1.2 2.2M8.9 10.7l1.2 2.2M15.1 10.7l-1.2 2.2" fill="none" stroke="#a8842a" stroke-width="0.7"/><path d="M11 2.4 10 1M12 2.2V0.8M13 2.4 14 1" fill="none" stroke-width="0.9"/>`),
  // Fish in profile: scales, fin and tail texture.
  fish: G(`<path d="M2.8 12C5.8 7.4 11 6.2 14.8 8.8L19.4 5.6 19.4 18.4 14.8 15.2C11 17.8 5.8 16.6 2.8 12Z" fill="#6f958b"/><circle cx="6.6" cy="10.6" r="1.05" fill="${INK}" stroke="none"/><path d="M9.4 9.6c1 1.4 1 3.4 0 4.8M11.8 9.2c1 1.6 1 4 0 5.6M14 9c1 1.7 1 4.3 0 6M16.4 8.6l1.4 3.4-1.4 3.4" fill="none" stroke="#4a6b62" stroke-width="0.7"/><path d="M16.2 9.4 19 7M16.2 14.6 19 17" fill="none" stroke="#4a6b62" stroke-width="0.7"/>`),
  // Ironware: smith's anvil with horn, waist and foot.
  ironware: G(`<path d="M3.2 6.6h10.8l2-1.4c2 1.2 3.6 2.8 4.6 4.8-1.4 1-3.2 1.5-5.2 1.5h-2.2l.7 3.2h2l1 4.1H7.1l1-4.1h2l.7-3.2H7.4a4.2 4.2 0 0 1-4.2-4.2Z" fill="#7d848c"/><path d="M4.2 8h9.6" fill="none" stroke="#c3cad1" stroke-width="0.9"/>${H("M9.8 12.8l3 0.4M9.6 14.4l3.2 0.4M9 16.6l4 0.3", "#565d64", 0.6)}`),
  // Ham on the bone: plump lobe with a long diagonal shank bone and knobs.
  meat: G(`<path d="M12.8 11.2 18.6 5.4" fill="none" stroke="#f1e3d0" stroke-width="3.2"/><circle cx="19.3" cy="4" r="1.9" fill="#f1e3d0"/><circle cx="20.8" cy="5.9" r="1.9" fill="#f1e3d0"/><path d="M2.6 15c-1.2-3.8 1.2-7.8 5.2-8.4 2.9-.4 5.2.6 6.4 2.4.9 1.3 1.3 2.9.9 4.4-1.2 2.4-3.8 4.9-6.6 5.2-3.1.3-5.3-1.3-5.9-3.6Z" fill="#a8443c"/>${H("M4.8 16.8c1.9 1.5 4.6 1.9 6.9 1.3M5.8 18.6c1.5.8 3.4 1 5.1.6", "#7d2f28", 0.8)}<path d="M4.6 12.6c.8-2.1 2.7-3.6 5-3.8" fill="none" stroke="#d9837a" stroke-width="1.1"/>`),
  // Amphora: foot, rim, two handles, incised bands, side shading.
  pottery: G(`<path d="M9.8 3h4.4v1.8h-1l.3 1.6c2.1 1 3.4 3 3.4 6.2 0 4.4-2.3 8-4.9 8s-4.9-3.6-4.9-8c0-3.2 1.3-5.2 3.4-6.2l.3-1.6h-1Z" fill="#b9603a"/><path d="M9.4 5.6C7.2 6 6 7.6 6.6 9.8M14.6 5.6c2.2.4 3.4 2 2.8 4.2" fill="none"/><path d="M6.8 12.6h10.4M7.2 15.4h9.6" fill="none" stroke="#8a4526" stroke-width="0.7"/><path d="M9.8 20.6h4.4" fill="none"/>${H("M14.4 9.4l1.6 1.2M14.2 11.6l1.8 1.4M13.8 13.8l1.8 1.6", "#8a4526")}`),
  // Chickpeas: cluster with beaks and creases.
  legumes: G(`<circle cx="8.2" cy="13.8" r="3.4" fill="#d3ba6e"/><circle cx="15.4" cy="15.2" r="3.2" fill="#c9ad60"/><circle cx="11.8" cy="8.2" r="3" fill="#dfc57e"/><path d="M11.4 5.3c.2-1 .9-1.6 1.8-1.7M7.8 10.5c.1-1 .8-1.7 1.7-1.9M15 12.1c.2-1 .9-1.6 1.8-1.7" fill="none" stroke-width="1"/>${H("M7 13.4c.5-1.2 1.4-2 2.6-2.2M10.6 8c.4-1 1.2-1.7 2.2-1.9M14.2 15c.4-1 1.2-1.7 2.2-1.9", "#a89048")}`),
  // Kid rib rack: three short rib bones with knobs rising from the meat pad.
  kid_meat: G(`<path d="M5 15.6c0-3 3-5 7-5s7 2 7 5c0 2-1.6 3.4-3.8 3.8-2.8.6-6.6.2-8.4-.9C5.6 17.7 5 16.8 5 15.6Z" fill="#e08a7a"/><path d="M8.6 11.4C8.2 9.4 8.6 7.4 9.8 5.6M12 10.9c-.2-2.2.2-4.2 1.2-5.9M15.4 11.4c.2-2.2.8-4 1.8-5.4" fill="none" stroke="#f4e6d4" stroke-width="2.4"/><g fill="#f4e6d4"><circle cx="9.8" cy="5.4" r="1.3"/><circle cx="13.2" cy="4.9" r="1.3"/><circle cx="17.2" cy="5.9" r="1.3"/></g>${H("M6.8 14.8c1.8 1 4.2 1.4 6.6 1.2M7.4 16.8c1.6.7 3.6 1 5.6.8", "#b05c4e", 0.7)}<path d="M7 13.8c1.2-1.4 3-2 4.8-2" fill="none" stroke="#f0b3a6" stroke-width="0.9"/>`),
  // Cured hide: stitched border and shaded edges.
  leather: G(`<path d="M8 3.4C7 5 8.4 6.4 7.5 8 6.1 10.4 4.2 10.6 4.2 12.4c0 1.8 1.9 2 3.3 4.4.9 1.6-.5 3 .5 4.6 1.3 1.9 6.7 1.9 8 0 1-1.6-.4-3 .5-4.6 1.4-2.4 3.3-2.6 3.3-4.4 0-1.8-1.9-2-3.3-4.4-.9-1.6.5-3-.5-4.6-1.3-1.8-6.7-1.8-8 0Z" fill="#a9672f"/><path d="M9.2 6.2C8.6 7.4 9.6 8.6 8.9 10c-.9 1.8-2.4 2-2.4 3.4 0 1.4 1.5 1.6 2.4 3.4.7 1.4-.3 2.6.3 3.8M14.8 6.2c.6 1.2-.4 2.4.3 3.8.9 1.8 2.4 2 2.4 3.4 0 1.4-1.5 1.6-2.4 3.4-.7 1.4.3 2.6-.3 3.8" fill="none" stroke="#7d4a1e" stroke-width="0.8" stroke-dasharray="1.6 1.4"/>`),
  // Esparto sheaf: fan of blades with mid-veins, tied band.
  esparto: G(`<g fill="#b3a452"><path d="M11 21.2 9.9 4.4 11.2 3.4 12.2 21.2Z"/><path d="M12.5 21.2 13.4 3.9 14.7 4.6 13.4 21.2Z"/><path d="M10.3 21.2 7.1 6.2 8.3 5.5 11.3 21.2Z"/><path d="M13.9 21.2 16.9 5.8 18 6.6 14.8 21.2Z"/><path d="M9.8 21.2 4.8 9.2 5.9 8.4 10.8 21.2Z"/></g>${H("M10.9 19.4 10.2 6.4M12.9 19.4 13.7 6M9.7 19.4 7.6 8.4M14.5 19.4 17.3 8M9.2 19.2 5.8 10.6", "#877a34", 0.6)}<rect x="8.2" y="14.6" width="7.8" height="2.4" rx="1.2" fill="#8a6a2f"/><path d="M8.2 15.8h7.8" fill="none" stroke="#5f4720" stroke-width="0.7"/>`),
  // Salt mound on a wooden tray, shaded side and crystals.
  salt: G(`<path d="M5.6 17.6C6.4 12.6 8.8 7.4 12 5.4c3.2 2 5.6 7.2 6.4 12.2Z" fill="#f7f1de"/>${H("M12.8 9l1.8 2.2M13.6 12.4l1.8 2M14.2 15.4l1.4 1.6", "#c9c0a4")}<path d="M10.4 8.6c-.8 1.6-1.4 3.6-1.7 5.6" fill="none" stroke="#ffffff" stroke-width="1"/><rect x="3.6" y="17.6" width="16.8" height="2.5" rx="1.2" fill="#8a6a2f"/><path d="M3.6 18.9h16.8" fill="none" stroke="#5f4720" stroke-width="0.7"/><path d="M18.8 3.4l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" fill="#fdfaf2" stroke-width="0.8"/>`),
  // Fleece: scalloped cloud full of curls, shaded base.
  wool: G(`<path d="M7.2 18.6a3.6 3.6 0 0 1-1.1-7 4.1 4.1 0 0 1 3.5-4.7 4.2 4.2 0 0 1 4.8 0 4.1 4.1 0 0 1 3.5 4.7 3.6 3.6 0 0 1-1.1 7Z" fill="#f2efe6"/><path d="M8.6 11.2a1.6 1.6 0 0 1 2.6-.5 1.6 1.6 0 0 1 2.6-.5M9.8 14.2a1.6 1.6 0 0 1 2.6-.5 1.6 1.6 0 0 1 2.6-.5" fill="none" stroke="#a89e86" stroke-width="0.8"/>${H("M7.4 17.2c1.4.8 3 1.2 4.6 1.2M9 18.4h5.4", "#c9c0a6", 0.7)}`),
  // Two stacked iron ingots with forged texture.
  iron: G(`<path d="M3.6 16.8 5.3 12.4h7.4l1.7 4.4Z" fill="#7a828a"/><path d="M9.6 11.4 11.3 7h7.4l1.7 4.4Z" fill="#8d959d"/><path d="M5.3 12.4h7.4M11.3 7h7.4" fill="none" stroke="#c3cad1" stroke-width="0.9"/>${H("M6.2 14.6l4.8 0.4M6.8 15.8l4.2 0.3M12.2 9.2l4.6 0.4M12.8 10.4l4 0.3", "#565d64", 0.6)}`),
  // Two logs: end rings, bark hatching.
  timber: G(`<rect x="4" y="12.4" width="14.5" height="5.6" rx="2.2" fill="#a8733a"/><circle cx="5.7" cy="15.2" r="2.9" fill="#d9b27a"/><circle cx="5.7" cy="15.2" r="1.6" fill="none" stroke="#8a6a3a" stroke-width="0.7"/><circle cx="5.7" cy="15.2" r="0.5" fill="${INK}" stroke="none"/><rect x="7.2" y="6.2" width="13.5" height="5.2" rx="2" fill="#b57f42"/><circle cx="8.9" cy="8.8" r="2.6" fill="#e0bb84"/><circle cx="8.9" cy="8.8" r="1.4" fill="none" stroke="#8a6a3a" stroke-width="0.7"/>${H("M12.4 9.6c1.8-.7 3.8-.7 5.6 0M10.6 15c2-.8 4.2-.8 6.2 0M12.8 16.8c1.6-.6 3.4-.6 5 0", "#7d5426", 0.7)}`),
  // Brick wall: three bricks, mortar, surface texture.
  bricks: G(`<rect x="7.6" y="5.4" width="9" height="5" rx="1" fill="#c06044"/><rect x="3.4" y="12.6" width="8.4" height="5" rx="1" fill="#b5583a"/><rect x="12.6" y="12.6" width="8.4" height="5" rx="1" fill="#a94f34"/><path d="M4 18.8h16.4M7.6 11.6h9" fill="none" stroke="#e8d9b5" stroke-width="0.9"/>${H("M9.2 7.2l2.4 0.2M13 9l2.2 0.2M5.2 14.4l2.4 0.2M8.6 16.2l2 0.2M14.4 14.4l2.4 0.2M15.2 16.2l2.4 0.2", "#7d3220", 0.6)}`),
  // Draped bolt of cloth: folds, fringe edge, tie band.
  cloth: G(`<path d="M4.4 6.4h15.2v8.8l-2.5 2.2-2.7-2.2-2.4 2.2-2.4-2.2-2.7 2.2-2.5-2.2Z" fill="#a83a3a"/><path d="M4.4 6.4h15.2" fill="none"/>${H("M7.4 6.8v7.4M12 6.8v7.4M16.6 6.8v7.4", "#6e2423", 0.8)}<path d="M8.9 6.8v6.4M14.4 6.8v6.4" fill="none" stroke="#d97a72" stroke-width="0.7"/><rect x="10.9" y="6.4" width="2.2" height="8.8" fill="#8a6a2f" stroke-width="1.1"/><path d="M10.9 10.8h2.2" fill="none" stroke="#5f4720" stroke-width="0.7"/>`),
  // Oil cruet: long neck, cork, oil line, olive twig.
  olive_oil: G(`<path d="M10.4 7.2h3.2l.6 2.2c1.6 1 2.6 2.8 2.6 5 0 3.6-1.9 6-4.8 6s-4.8-2.4-4.8-6c0-2.2 1-4 2.6-5Z" fill="#9aa83a"/><path d="M10.4 4.6h3.2v2.6h-3.2Z" fill="#6b4a22"/><path d="M7.6 14.6c1.2.6 2.8.9 4.4.9s3.2-.3 4.4-.9" fill="none" stroke="#6b7a22" stroke-width="0.8"/>${H("M14.2 11.4l1.4 1.2M14 13.6l1.6 1.4M13.6 15.8l1.4 1.2", "#6b7a22", 0.6)}<path d="M8.8 10.8c.5-1.2 1.4-2 2.4-2.4" fill="none" stroke="#d8e07a" stroke-width="1"/><circle cx="18.6" cy="19.6" r="1.7" fill="#6b7a22"/><circle cx="15.4" cy="20.8" r="1.4" fill="#7d8a2a"/><path d="M16.4 19.2c.8-1.4 2-2.2 3.6-2.4-.4 1.4-1.6 2.3-3.2 2.5" fill="#7d9a3a" stroke-width="0.9"/>`),
  // Wine barrel: staves, hoops with rivets, cellar shading.
  wine: G(`<path d="M12 4.2c4.3 0 6.9 3.4 6.9 7.8s-2.6 7.8-6.9 7.8-6.9-3.4-6.9-7.8 2.6-7.8 6.9-7.8Z" fill="#8a4a2a"/><path d="M5.4 8.4h13.2M5.4 15.6h13.2" fill="none" stroke="#d9d2c0" stroke-width="1.5"/><path d="M12 4.4v15.2M8.7 5C7.8 8.2 7.8 15.8 8.7 19M15.3 5c.9 3.2.9 13.2 0 14" fill="none" stroke-width="0.9"/><g fill="${INK}" stroke="none"><circle cx="8" cy="8.4" r="0.5"/><circle cx="12" cy="8.4" r="0.5"/><circle cx="16" cy="8.4" r="0.5"/><circle cx="8" cy="15.6" r="0.5"/><circle cx="12" cy="15.6" r="0.5"/><circle cx="16" cy="15.6" r="0.5"/></g>${H("M14.6 17.2c.8-1.4 1.2-3.2 1.2-5.2", "#5f2f18", 0.8)}`),
  // Silk: wound spool with a loose strand curling away.
  silk: G(`<path d="M8 4h8l-1.2 2H9.2Z" fill="#d9c9a8"/><path d="M9.2 6h5.6l1 10.4H8.2Z" fill="#a52f68"/><path d="M8.2 16.4h7.6L17 19H7Z" fill="#d9c9a8"/><path d="M9.6 7.4 14 8.2M9.4 9.4l4.8.9M9.3 11.5l5 .8M9.2 13.5l5.1.8M9.1 15.4l5.2.7" fill="none" stroke="#e86aa6" stroke-width="0.8"/>${H("M10.2 6.6l4 0.7M9 16.2l5.4 0.6", "#6e1c44", 0.6)}<path d="M15.8 16.8c2.2.2 3.4 1.2 3.2 2.8-.2 1.2-1.6 1.6-2.8 1" fill="none" stroke="#a52f68" stroke-width="1.2"/>`),
  // Sugarloaf: cone with paper wrap band on a plate.
  sugar: G(`<path d="M12 2.8c2.5 3.8 4 8.2 4.5 13.6h-9C8 11 9.5 6.6 12 2.8Z" fill="#fbfbf7"/>${H("M13 6.4l1 3.4M13.8 11.4l0.8 3.4", "#cfc8b4", 0.6)}<path d="M10.4 6.8c-.7 2.4-1.2 5-1.4 7.6" fill="none" stroke="#ffffff" stroke-width="1"/><path d="M7.9 13.6h8.2l.6 2.8H7.3Z" fill="#9fb4c0"/><path d="M7.6 15h8.8" fill="none" stroke="#6e8794" stroke-width="0.7"/><rect x="5.2" y="16.4" width="13.6" height="2.6" rx="1.3" fill="#c9c2b2"/><path d="M5.2 17.7h13.6" fill="none" stroke="#9a917c" stroke-width="0.7"/>`),
  // Black pepper: stem, wrinkled corns, leaf.
  pepper: G(`<path d="M11.6 3.6c.4 2 .1 3.9-.9 5.6" fill="none"/><path d="M11.9 4.4c1.7-1.6 4-1.4 5.1 0-1.3 1.6-3.6 1.6-5.1 0Z" fill="#6f7d3a"/><circle cx="8.3" cy="11" r="2" fill="#6b5138"/><circle cx="12.2" cy="10.2" r="2.1" fill="#4a3b2c"/><circle cx="15.4" cy="12" r="1.9" fill="#6b5138"/><circle cx="9.7" cy="14.6" r="2" fill="#4a3b2c"/><circle cx="13.6" cy="15.2" r="2" fill="#6b5138"/><circle cx="11.6" cy="18.6" r="1.9" fill="#4a3b2c"/><path d="M7.6 10.4c.4.4 1 .6 1.5.5M11.4 9.6c.5.4 1.1.5 1.7.4M14.7 11.4c.4.4 1 .6 1.5.5M9 14c.4.4 1 .6 1.5.5M12.9 14.6c.5.4 1.1.5 1.7.4M10.9 18c.4.4 1 .6 1.5.5" fill="none" stroke="#2e241a" stroke-width="0.6"/>`),
  // Saffron crocus: veined petals, three red stigmas.
  saffron: G(`<path d="M12 13.2C10.6 9.9 10.6 6.3 12 3.6c1.4 2.7 1.4 6.3 0 9.6Z" fill="#8d5fc0"/><path d="M11.8 13.2C9 11.4 7.2 8.4 7.4 5c2.7.7 4.3 3.6 4.4 8.2Z" fill="#7a4fb0"/><path d="M12.2 13.2C15 11.4 16.8 8.4 16.6 5c-2.7.7-4.3 3.6-4.4 8.2Z" fill="#7a4fb0"/><path d="M12 5.6v6.4M8.6 7.4c.8 1.8 1.6 3.4 2.6 4.6M15.4 7.4c-.8 1.8-1.6 3.4-2.6 4.6" fill="none" stroke="#5c3a8a" stroke-width="0.6"/><path d="M12 13v7.4" fill="none" stroke="#5c7a33"/><path d="M12 17.4c-1.6-.2-2.6-1.2-3-2.8M12 18.6c1.6-.2 2.6-1.2 3-2.8" fill="none" stroke="#5c7a33" stroke-width="1.1"/><path d="M11.6 12.4 10.6 6.6M12.2 12.2V5.8M12.6 12.4 13.8 6.4" fill="none" stroke="#d92b1f" stroke-width="1.25"/>`),
  // Soap bar: stamped oval, two bubbles.
  soap: G(`<rect x="4" y="10" width="16" height="9" rx="4.5" fill="#e8e2d0"/><ellipse cx="12" cy="14.5" rx="4.6" ry="2.4" fill="none" stroke="#b9ad8e" stroke-width="0.8"/><path d="M9.6 14.5h4.8" fill="none" stroke="#b9ad8e" stroke-width="0.7"/><circle cx="6.6" cy="5.8" r="1.5" fill="#f4f8f8" stroke-width="1"/><circle cx="10.4" cy="4" r="1.9" fill="#f4f8f8" stroke-width="1"/><path d="M5.9 5.2c.3-.4.7-.6 1.1-.6M9.5 3.2c.4-.5.9-.7 1.4-.6" fill="none" stroke="#c9d4d4" stroke-width="0.6"/>`),
  // Beer: wooden tankard with staves, hoops, foam crown.
  beer: G(`<path d="M6.2 8.8h10.6l-.9 10.8a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z" fill="#b57f42"/><path d="M16.9 10.6h2a2.6 2.6 0 0 1 0 5.2h-2" fill="none" stroke-width="1.6"/><path d="M6 8.8a2 2 0 0 1 1.6-2.6 2.6 2.6 0 0 1 4.2-1.8 2.4 2.4 0 0 1 4.4 1.2 2 2 0 0 1 1.8 3.2Z" fill="#f7f1de"/><path d="M8.9 9v11.4M12 9v11.4M15.1 9v11.4" fill="none" stroke="#7d5426" stroke-width="0.7"/><path d="M6.3 12.4h10.4M6.5 16.8h10" fill="none" stroke="#5f4720" stroke-width="1"/>`),
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
