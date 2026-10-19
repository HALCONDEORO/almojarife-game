// Flat SVG icons for trade goods. Own work (see CREDITS.md), 24x24, same on every device.
const S = {
  grain: '<path d="M12 22V9" stroke="#8a6a1f" stroke-width="1.6"/><g fill="#e0b73a"><ellipse cx="12" cy="5" rx="2" ry="3.2"/><ellipse cx="8.2" cy="8" rx="1.9" ry="3" transform="rotate(-35 8.2 8)"/><ellipse cx="15.8" cy="8" rx="1.9" ry="3" transform="rotate(35 15.8 8)"/><ellipse cx="8.2" cy="13" rx="1.9" ry="3" transform="rotate(-35 8.2 13)"/><ellipse cx="15.8" cy="13" rx="1.9" ry="3" transform="rotate(35 15.8 13)"/></g>',
  dried_fish: '<path d="M2 12c4-6 11-6 15 0-4 6-11 6-15 0z" fill="#9db4c0"/><path d="M17 12l5-4v8z" fill="#7c97a6"/><circle cx="7" cy="11" r="1.1" fill="#234"/><path d="M10 8v8M13 8.5v7" stroke="#6b8797" stroke-width="1"/>',
  salt: '<path d="M4 20l2-9h12l2 9z" fill="#eef2f4" stroke="#8fa3ad" stroke-width="1.2"/><path d="M7 11l5-7 5 7z" fill="#fff" stroke="#8fa3ad" stroke-width="1.2"/>',
  wool: '<g fill="#f2efe6" stroke="#b9b09a" stroke-width="1"><circle cx="8" cy="10" r="4"/><circle cx="14" cy="9" r="4.5"/><circle cx="17" cy="14" r="3.5"/><circle cx="9" cy="15" r="3.5"/><circle cx="13" cy="15" r="3.5"/></g>',
  iron: '<path d="M3 17h18v3H3z" fill="#4a4f55"/><path d="M5 17V12h12l3-3v-1H8L5 11z" fill="#7a828a"/><path d="M5 12h12" stroke="#a7aeb5" stroke-width="1"/>',
  timber: '<g fill="#a8733a" stroke="#6e4a22" stroke-width="1"><rect x="2" y="14" width="20" height="6" rx="3"/><rect x="4" y="7" width="16" height="6" rx="3"/></g><circle cx="20" cy="17" r="1.8" fill="#d6a566"/><circle cx="18" cy="10" r="1.8" fill="#d6a566"/>',
  cloth: '<path d="M3 5h16a2 2 0 010 4H3z" fill="#b2403f"/><path d="M3 9h16a2 2 0 010 4H3z" fill="#3b6fb0"/><path d="M3 13h16a2 2 0 010 4H3z" fill="#d8b24a"/><path d="M3 17h16a2 2 0 010 4H3z" fill="#4a8a55"/>',
  olive_oil: '<path d="M10 3h4v4c3 1 4 4 4 7v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5c0-3 1-6 4-7z" fill="#9aa83a"/><rect x="10" y="2" width="4" height="3" fill="#6b4a22"/><path d="M8 13h8v5H8z" fill="#cdd46a"/>',
  wine: '<path d="M3 8c0-2 4-3 9-3s9 1 9 3v8c0 2-4 3-9 3s-9-1-9-3z" fill="#8a4a2a" stroke="#4d2813" stroke-width="1"/><ellipse cx="12" cy="8" rx="9" ry="3" fill="#b06a3e"/><path d="M3 12c3 2 15 2 18 0M3 16c3 2 15 2 18 0" stroke="#4d2813" stroke-width="1.2" fill="none"/>',
  silk: '<path d="M3 17c4-8 6 4 9-2s5-8 9-4v6c-4-4-6 2-9 8s-5-8-9 0z" fill="#b0276b"/><path d="M3 12c4-8 6 4 9-2s5-6 9-3" stroke="#e86aa6" stroke-width="1.5" fill="none"/>',
  sugar: '<path d="M12 3l8 5v8l-8 5-8-5V8z" fill="#fbfbfb" stroke="#a9b2b8" stroke-width="1.2"/><path d="M12 3v18M4 8l16 8M20 8L4 16" stroke="#d7dde0" stroke-width="1"/>',
  pepper: '<path d="M12 6c5 0 8 4 7 9-1 4-4 6-7 6" fill="#c4332a" stroke="#7d1a14" stroke-width="1"/><path d="M12 6c-5 0-8 4-7 9 1 4 4 6 7 6z" fill="#d94a3a" stroke="#7d1a14" stroke-width="1"/><path d="M12 6V3c0-1 1-1.5 3-1" stroke="#3d7a2a" stroke-width="2" fill="none"/>',
};
export const goodIcon = (id, size = 22) =>
  `<svg class="gi" role="img" aria-label="${id}" width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px">${S[id] ?? '<circle cx="12" cy="12" r="8" fill="#bbb"/>'}</svg>`;
export const ICON_IDS = Object.keys(S);
