// Flat SVG icons for trade goods. Own work (see CREDITS.md), 24x24, same on every device.
const S = {
  grain: '<path d="M12 22V9" stroke="#8a6a1f" stroke-width="1.6"/><g fill="#e0b73a"><ellipse cx="12" cy="5" rx="2" ry="3.2"/><ellipse cx="8.2" cy="8" rx="1.9" ry="3" transform="rotate(-35 8.2 8)"/><ellipse cx="15.8" cy="8" rx="1.9" ry="3" transform="rotate(35 15.8 8)"/><ellipse cx="8.2" cy="13" rx="1.9" ry="3" transform="rotate(-35 8.2 13)"/><ellipse cx="15.8" cy="13" rx="1.9" ry="3" transform="rotate(35 15.8 13)"/></g>',
  fish: '<path d="M3 13c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3z" fill="#5a9a8a"/><circle cx="8" cy="11.5" r="1.1" fill="#123"/><path d="M12 9c2 1.5 2 6 0 7.5" stroke="#3d7364" stroke-width="1" fill="none"/>',
  ironware: '<path d="M3 18h16v3H3z" fill="#4a4f55"/><path d="M6 18v-5h9l3-3V8H9L6 12z" fill="#6c737b"/><path d="M12 6l2 2" stroke="#b9c0c7" stroke-width="1.4"/>',
  meat: '<path d="M5 14c0-5 5-8 10-6 4 1 6 5 4 8s-7 4-10 2c-2-1-4-2-4-4z" fill="#c4574f" stroke="#7a2a26" stroke-width="1.2"/><circle cx="15" cy="12" r="2.2" fill="#f1d9c9"/>',
  legumes: '<ellipse cx="9" cy="12" rx="4" ry="3" fill="#d9c27a" stroke="#8a6d2a" stroke-width="1.2"/><ellipse cx="15" cy="14" rx="4" ry="3" fill="#cdb064" stroke="#8a6d2a" stroke-width="1.2"/>',
  kid_meat: '<path d="M6 15c0-5 4-8 9-6 3 1 5 4 3 7s-6 4-9 2c-1-1-3-2-3-3z" fill="#e08a7a" stroke="#7a2a26" stroke-width="1.2"/><path d="M15 7l2-3M17 8l3-2" stroke="#5e3414" stroke-width="1.2"/>',
  leather: '<path d="M4 6l4-2 4 1 4-1 4 2-1 5 1 4-4 4H8l-4-4 1-4z" fill="#a9672f" stroke="#5e3414" stroke-width="1.2"/><path d="M9 11h6M9 15h6" stroke="#7a4a22" stroke-width="1" stroke-dasharray="2 2"/>',
  esparto: '<path d="M4 21c1-8 3-13 5-17M9 21c0-8 1-13 3-17M14 21c-1-8-1-12 0-17M19 21c-2-7-3-11-3-16" stroke="#a89a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M3 21h18" stroke="#7c6f33" stroke-width="1.4"/>',
  salt: '<path d="M4 20l2-9h12l2 9z" fill="#eef2f4" stroke="#8fa3ad" stroke-width="1.2"/><path d="M7 11l5-7 5 7z" fill="#fff" stroke="#8fa3ad" stroke-width="1.2"/>',
  wool: '<g fill="#f2efe6" stroke="#b9b09a" stroke-width="1"><circle cx="8" cy="10" r="4"/><circle cx="14" cy="9" r="4.5"/><circle cx="17" cy="14" r="3.5"/><circle cx="9" cy="15" r="3.5"/><circle cx="13" cy="15" r="3.5"/></g>',
  iron: '<path d="M3 17h18v3H3z" fill="#4a4f55"/><path d="M5 17V12h12l3-3v-1H8L5 11z" fill="#7a828a"/><path d="M5 12h12" stroke="#a7aeb5" stroke-width="1"/>',
  timber: '<g fill="#a8733a" stroke="#6e4a22" stroke-width="1"><rect x="2" y="14" width="20" height="6" rx="3"/><rect x="4" y="7" width="16" height="6" rx="3"/></g><circle cx="20" cy="17" r="1.8" fill="#d6a566"/><circle cx="18" cy="10" r="1.8" fill="#d6a566"/>',
  bricks: '<g fill="#b5583a" stroke="#7d3a24" stroke-width="1"><rect x="3" y="14" width="8" height="5"/><rect x="13" y="14" width="8" height="5"/><rect x="8" y="7" width="8" height="5"/></g>',
  cloth: '<path d="M3 5h16a2 2 0 010 4H3z" fill="#b2403f"/><path d="M3 9h16a2 2 0 010 4H3z" fill="#3b6fb0"/><path d="M3 13h16a2 2 0 010 4H3z" fill="#d8b24a"/><path d="M3 17h16a2 2 0 010 4H3z" fill="#4a8a55"/>',
  olive_oil: '<path d="M10 3h4v4c3 1 4 4 4 7v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5c0-3 1-6 4-7z" fill="#9aa83a"/><rect x="10" y="2" width="4" height="3" fill="#6b4a22"/><path d="M8 13h8v5H8z" fill="#cdd46a"/>',
  wine: '<path d="M3 8c0-2 4-3 9-3s9 1 9 3v8c0 2-4 3-9 3s-9-1-9-3z" fill="#8a4a2a" stroke="#4d2813" stroke-width="1"/><ellipse cx="12" cy="8" rx="9" ry="3" fill="#b06a3e"/><path d="M3 12c3 2 15 2 18 0M3 16c3 2 15 2 18 0" stroke="#4d2813" stroke-width="1.2" fill="none"/>',
  silk: '<path d="M3 17c4-8 6 4 9-2s5-8 9-4v6c-4-4-6 2-9 8s-5-8-9 0z" fill="#b0276b"/><path d="M3 12c4-8 6 4 9-2s5-6 9-3" stroke="#e86aa6" stroke-width="1.5" fill="none"/>',
  sugar: '<path d="M12 3l8 5v8l-8 5-8-5V8z" fill="#fbfbfb" stroke="#a9b2b8" stroke-width="1.2"/><path d="M12 3v18M4 8l16 8M20 8L4 16" stroke="#d7dde0" stroke-width="1"/>',
  pepper: '<path d="M12 6c5 0 8 4 7 9-1 4-4 6-7 6" fill="#c4332a" stroke="#7d1a14" stroke-width="1"/><path d="M12 6c-5 0-8 4-7 9 1 4 4 6 7 6z" fill="#d94a3a" stroke="#7d1a14" stroke-width="1"/><path d="M12 6V3c0-1 1-1.5 3-1" stroke="#3d7a2a" stroke-width="2" fill="none"/>',
  soap: '<rect x="4" y="9" width="16" height="10" rx="5" fill="#e8e2d0" stroke="#b8b09a" stroke-width="1"/><ellipse cx="12" cy="14" rx="4" ry="2" fill="#d4ccb4"/><circle cx="17" cy="6" r="2" fill="#cfe4ee" stroke="#9db4c0" stroke-width="1"/><circle cx="20" cy="3.5" r="1.4" fill="#cfe4ee" stroke="#9db4c0" stroke-width="1"/><circle cx="14" cy="4" r="1.1" fill="#cfe4ee" stroke="#9db4c0" stroke-width="1"/>',
  beer: '<path d="M6 8h10v11a2 2 0 01-2 2H8a2 2 0 01-2-2z" fill="#d99a2b" stroke="#8a6a1f" stroke-width="1"/><path d="M16 10h2a3 3 0 010 6h-2" fill="none" stroke="#8a6a1f" stroke-width="1.6"/><path d="M6 8c-1-3 2-4 3-3 1-2 4-2 5 0 1-1 3 0 2 3z" fill="#f5ead0"/>',
};
export const goodIcon = (id, size = 22) =>
  `<svg class="gi" role="img" aria-label="${id}" width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px">${S[id] ?? '<circle cx="12" cy="12" r="8" fill="#bbb"/>'}</svg>`;
export const ICON_IDS = Object.keys(S);
