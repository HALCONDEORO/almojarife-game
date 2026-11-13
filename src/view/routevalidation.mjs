// Present only the route validator's public reasons. Never interpolate raw errors.
const messages = {
 es: {
  'too few stops': 'Añade al menos dos paradas para fijar la ruta.',
  'bad stop': 'Revisa los puertos: deben existir y dos paradas seguidas no pueden ser el mismo puerto, incluida la vuelta al inicio.',
  'bad rule': 'Revisa los productos y sus límites de precio: el producto debe estar disponible en ese puerto y el límite debe ser un número no negativo.',
  'bad cash brake': 'El freno de caja debe ser un número no negativo.',
  'game over': 'La partida ha terminado. No se puede fijar una ruta nueva.',
  fallback: 'No se pudo fijar la ruta. Revisa las paradas y sus reglas.',
 },
 en: {
  'too few stops': 'Add at least two stops to set the route.',
  'bad stop': 'Check the ports: they must exist, and consecutive stops cannot use the same port, including the return to the start.',
  'bad rule': 'Check the goods and their price limits: the good must be available at that port and the limit must be a non-negative number.',
  'bad cash brake': 'The cash reserve must be a non-negative number.',
  'game over': 'The game has ended. A new route cannot be set.',
  fallback: 'Could not set the route. Check its stops and rules.',
 },
};
export function routeValidationMessage(reason, lang = 'es') {
 const copy = messages[lang] ?? messages.es;
 return Object.hasOwn(copy, reason) ? copy[reason] : copy.fallback;
}
export function showRouteValidationError(element, reason, lang = 'es') {
 if (!element) return;
 element.textContent = routeValidationMessage(reason, lang);
 element.focus();
}
