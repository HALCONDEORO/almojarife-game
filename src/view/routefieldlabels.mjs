// Contextual labels for route-editing controls; no route rules live here.
const labels = {
  es: { stop: 'Parada', city: 'Puerto', buyGood: 'Producto para comprar', buyMax: 'Precio máximo de compra (monedas por unidad)', sellGood: 'Producto para vender', sellMin: 'Precio mínimo de venta (monedas por unidad)', remove: 'Eliminar parada', cash: 'Freno de caja (monedas)', limitHint: 'Deja el precio vacío para no fijar un límite.' },
  en: { stop: 'Stop', city: 'Port', buyGood: 'Good to buy', buyMax: 'Maximum buy price (coins per unit)', sellGood: 'Good to sell', sellMin: 'Minimum sell price (coins per unit)', remove: 'Remove stop', cash: 'Cash reserve (coins)', limitHint: 'Leave the price blank to set no limit.' },
};
export function routeFieldLabel(field, index, lang = 'es') {
  const copy = labels[lang] ?? labels.es;
  if (!Object.hasOwn(copy, field)) throw new RangeError('Unknown route field');
  if (field === 'cash' || field === 'limitHint') return copy[field];
  if (!Number.isInteger(index) || index < 0) throw new RangeError('Invalid route stop');
  return `${copy.stop} ${index + 1}: ${copy[field]}`;
}
