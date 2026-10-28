// Original SVG artwork. Decorative only: no geographic distance claims.
export const escapeSvg = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

// Inland Iberia, away from the coastal nodes and lanes in data/world.json.
// Bounds include lettering; coordinates are chart units, using the live transform.
export function ornamentGeometry(x, y) {
  return {
    rose: { x: x(-4.3), y: y(39.7), w: 112, h: 112 },
    cartouche: { x: x(-4.3), y: y(41.4), w: 216, h: 62 }
  };
}

export function chartOrnamentSvg({ enabled = false, mode = 'geographic', lang = 'es', x, y } = {}) {
  if (!enabled || mode !== 'geographic') return '';
  const { rose: r, cartouche: c } = ornamentGeometry(x, y);
  if (![r.x, r.y, c.x, c.y].every(Number.isFinite)) return '';
  const es = lang === 'es';
  const title = es ? 'CARTA DE NAVEGACIÓN' : 'NAVIGATION CHART';
  const subtitle = es ? 'Costas de Iberia y el Magreb' : 'Coasts of Iberia and the Maghreb';
  const points = Array.from({ length: 8 }, (_, i) => {
    const length = i % 2 ? 29 : 43;
    return `<g transform="rotate(${i * 45})"><path d="M0 -${length} L7 0 H0 Z" fill="#59432c"/><path d="M0 -${length} L-7 0 H0 Z" fill="#eee0bd"/></g>`;
  }).join('');
  return `<g data-chart-ornament="true" pointer-events="none" style="pointer-events:none" aria-hidden="true" focusable="false" fill="#59432c" stroke="#59432c" stroke-width=".8" font-family="Georgia,serif">
    <g transform="translate(${c.x} ${c.y})">
      <path d="M-108 -31 H108 V31 H-108 Z M-102 -25 H102 V25 H-102 Z" fill="#f1e5c9" fill-opacity=".82" fill-rule="evenodd"/>
      <path d="M-94 0 H-80 M80 0 H94"/>
      <text y="-6" text-anchor="middle" stroke="none" font-size="14" letter-spacing="1">${escapeSvg(title)}</text>
      <text y="15" text-anchor="middle" stroke="none" font-size="12">${escapeSvg(subtitle)}</text>
    </g>
    <g transform="translate(${r.x} ${r.y})">
      <circle r="35" fill="#f1e5c9" fill-opacity=".5"/><circle r="32" fill="none" stroke-dasharray="1 5.28"/>
      ${points}<circle r="4" fill="#59432c"/><circle r="1.5" fill="#eee0bd" stroke="none"/>
      <g text-anchor="middle" stroke="none" font-size="12"><text y="-47">N</text><text x="50" y="4">E</text><text y="55">S</text><text x="-50" y="4">${es ? 'O' : 'W'}</text></g>
    </g>
  </g>`;
}
