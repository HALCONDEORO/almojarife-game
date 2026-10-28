// Read-only port-justice summary, own wording. No charges are created by opening the hall.
import { justiceReady } from '../game/justicewire.mjs';
export function justiceStatusHtml(g, lang = 'es') {
  if (!justiceReady(g)) return '';
  const es = lang === 'es';
  const open = (g.charges ?? []).filter(c => c.status === 'open').length;
  return `<section class="card" data-justice-status><h3>${es ? 'Justicia portuaria' : 'Port justice'}</h3><p>${es ? 'Los oficiales juzgan los cargos al llegar a un puerto del reino afectado. Las sentencias pueden incluir multa, embargo y retención del barco.' : 'Officers try charges on arrival in a port of the affected realm. Sentences may include a fine, seizure and holding the ship.'}</p><p>${es ? 'Cargos pendientes' : 'Open charges'}: ${open}</p></section>`;
}
