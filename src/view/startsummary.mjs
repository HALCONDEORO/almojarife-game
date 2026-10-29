import { startBonus } from '../game/profile.mjs';
export function startSummary(profile, baseCash) {
  const options = startBonus(profile);
  return { cash: baseCash + options.cash, baseUpkeepPercent: Math.round(options.upkeepMul * 10000) / 100 };
}
export function startSummaryHtml(profile, baseCash, lang = 'es') {
  const es = lang === 'es', summary = startSummary(profile, baseCash);
  const number = n => new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', { maximumFractionDigits: 2 }).format(n);
  return `<div class="founding-start-summary"><strong>${es ? 'Tu punto de partida' : 'Your starting position'}</strong><span>${es ? 'Monedas iniciales' : 'Starting coins'}: <b>${number(summary.cash)}</b></span><span>${es ? 'Mantenimiento base del barco' : 'Base ship upkeep'}: <b>${number(summary.baseUpkeepPercent)}%</b></span><small>${es ? '100% = coste normal. Combina origen y dificultad; no incluye salarios ni armamento.' : '100% = normal cost. Combines background and difficulty; excludes crew wages and weapons.'}</small></div>`;
}
