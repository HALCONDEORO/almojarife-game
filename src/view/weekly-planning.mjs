import { weeklyPlanning, weeklyPlanningEnabled } from '../game/weekly-planning.mjs';
const PLANNING_STYLE = `<style>
.weekly-planning .needs-scroll{max-height:22rem;overflow:auto;isolation:isolate;border:1px solid #b7aa8d}
.weekly-planning .needs-table{min-width:28rem;table-layout:fixed;border-collapse:separate;border-spacing:0}
.weekly-planning .needs-table th,.weekly-planning .needs-table td{box-sizing:border-box;white-space:normal;overflow-wrap:anywhere}
.weekly-planning .needs-table th:first-child{width:10rem;position:sticky;left:0;z-index:1;background:#f4ead0;box-shadow:1px 0 #b7aa8d}
.weekly-planning .needs-table thead th{position:sticky;top:0;z-index:2;background:#e8d9b5;text-align:center}
.weekly-planning .needs-table thead th:first-child{z-index:3;background:#e8d9b5;text-align:left}
.weekly-planning .needs-scroll:focus-visible{outline:2px solid #6b4f2a;outline-offset:2px}
@media(max-width:480px){.weekly-planning .needs-table{min-width:20rem}.weekly-planning .needs-table th:first-child{width:7rem}}
</style>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PLANNING_TEXT = {
 en: { title: 'Weekly consumption planning reference', basis: 'Own-design projection: seven identical simulated daily baseline-demand periods at the current population and classes. Base period: day', note: 'Game units, not observed consumption or a forecast of purchases. Includes typed-house residents, effective population, city need/producer multipliers and current plague, festival, growth and calamity demand modifiers, held fixed for all seven periods. Base-price affordability; excludes stock scarcity, supply, household purse limits, integer market rounding and future changes. No warmup or ledger totals are used.', good: 'Good', daily: 'Baseline / day', weekly: 'Projected / 7 days', empty: 'No city or goods available for planning.', unavailable: 'Unavailable: no reusable demand model', scroll: 'Scroll horizontally to read all columns.', city: 'City', population: 'Current effective population' },
 es: { title: 'Referencia de planificación del consumo semanal', basis: 'Proyección de diseño propio: siete períodos diarios simulados idénticos de demanda base con la población y las clases actuales. Período base: día', note: 'Unidades del juego, no consumo observado ni previsión de compras. Incluye residentes de casas por clase, población efectiva, multiplicadores de necesidad/producción local y modificadores actuales de peste, fiesta, crecimiento y calamidad, constantes durante los siete períodos. Asequibilidad a precio base; excluye escasez de existencias, suministro, límites del bolsillo de los hogares, redondeo entero del mercado y cambios futuros. No usa preparación inicial ni totales del registro.', good: 'Bien', daily: 'Base / día', weekly: 'Proyección / 7 días', empty: 'No hay ciudad o bienes disponibles para planificar.', unavailable: 'No disponible: sin modelo de demanda reutilizable', scroll: 'Desliza horizontalmente para leer todas las columnas.', city: 'Ciudad', population: 'Población efectiva actual' }
};
export function weeklyPlanningHtml(g, cityId, goods, lang = 'es', search = '') {
 if (!weeklyPlanningEnabled(search)) return '';
 const t = PLANNING_TEXT[lang] ?? PLANNING_TEXT.es, plan = weeklyPlanning(g, cityId);
 const fmt = n => Number(n).toLocaleString(lang === 'en' ? 'en' : 'es', { maximumFractionDigits: 2 });
 const name = g?.world?.cities?.find(c => c.id === cityId)?.name ?? cityId;
 return PLANNING_STYLE + `<section class="needs-ledger weekly-planning"><h3>${t.title}</h3><p>${t.basis} ${esc(plan?.day ?? '—')}.</p><p>${t.note}</p>` + (!plan?.rows.length ? `<p role="status">${t.empty}</p>` : `<p>${t.city}: ${esc(name)} · ${t.population}: ${fmt(plan.population)}</p><p>${t.scroll}</p><div class="needs-scroll" tabindex="0" role="region" aria-label="${t.title}"><table class="needs-table"><thead><tr>${['good','daily','weekly'].map(k => `<th scope="col">${t[k]}</th>`).join('')}</tr></thead><tbody>${plan.rows.map(r => `<tr><th scope="row">${esc(goods?.[r.good] ?? r.good)}</th>${['daily','weekly'].map(k => `<td>${r[k] === null ? t.unavailable : fmt(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`) + '</section>';
}
