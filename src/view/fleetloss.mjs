// Terminal fleet loss is a valid saved end state, never an undefined ship render.
export function fleetSelection(g, selected = 0) {
  if (!g.ships.length) return -1;
  return Math.max(0, Math.min(Number.isInteger(selected) ? selected : 0, g.ships.length - 1));
}
export function fleetLossHtml(lang = 'es') {
 return `<section class="card" data-fleet-loss><h2>${lang==='es'?'Tu flota se ha perdido':'Your fleet is lost'}</h2><p>${lang==='es'?'Has perdido el último barco. La partida ha terminado; puedes empezar otra desde el menú.':'You lost your last ship. The game is over; start another from the menu.'}</p></section>`;
}
