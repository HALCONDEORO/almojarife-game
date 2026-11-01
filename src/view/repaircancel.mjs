// Shared preview for the yard and ship data tab. No transaction or phase change here.
import { repairRefund } from '../game/game.mjs';

export function repairCancelHtml(order, lang, fmt) {
  const refund = repairRefund(order), retained = order.cost - refund;
  const en = lang === 'en';
  const label = en ? `Cancel · refund ${fmt(refund)}` : `Cancelar · devolver ${fmt(refund)}`;
  const note = en
    ? `Already paid: ${fmt(order.cost)} · retained: ${fmt(retained)}. Completed hull repairs stay.`
    : `Ya pagado: ${fmt(order.cost)} · retenido: ${fmt(retained)}. El casco ya reparado se conserva.`;
  return `<span class="repair-cancel"><button data-repaircancel="${order.id}">${label}</button> <small>${note}</small></span>`;
}
