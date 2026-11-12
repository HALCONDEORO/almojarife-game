// View-draft ordering only. Route validation and activation stay in game/routes.mjs.
export function moveRouteStop(stops, index, direction) {
  if (!Array.isArray(stops) || !Number.isInteger(index) || ![-1, 1].includes(direction)) return null;
  const next = index + direction;
  if (index < 0 || index >= stops.length || next < 0 || next >= stops.length) return null;
  [stops[index], stops[next]] = [stops[next], stops[index]];
  return next;
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function routeOrderLabel(index, city, direction, lang = 'es') {
  const verb = lang === 'en' ? (direction < 0 ? 'Move up' : 'Move down') : (direction < 0 ? 'Subir' : 'Bajar');
  return `${verb}: ${index + 1}. ${city}`;
}
export function routeOrderButtons(index, count, city, lang = 'es') {
  return [-1, 1].map(direction => {
    const key = direction < 0 ? 'up' : 'down';
    const label = escapeHtml(routeOrderLabel(index, city, direction, lang));
    return `<button type="button" id="rts-${key}-${index}" data-route-move="${index}:${direction}" title="${label}" aria-label="${label}"${index + direction < 0 || index + direction >= count ? ' disabled' : ''}>${direction < 0 ? '↑' : '↓'}</button>`;
  }).join('');
}
