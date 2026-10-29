import { PALETTE } from '../game/profile.mjs';
const names = {
  es: ['Rojo', 'Azul', 'Verde', 'Dorado', 'Morado', 'Negro', 'Marfil', 'Naranja'],
  en: ['Red', 'Blue', 'Green', 'Gold', 'Purple', 'Black', 'Ivory', 'Orange'],
};
export function crestColorChoices(crest, key, lang = 'es') {
  const es = lang === 'es', paletteNames = es ? names.es : names.en;
  const group = key === 'c1' ? (es ? 'Color principal' : 'Main colour') : (es ? 'Color secundario' : 'Second colour');
  return PALETTE.map((color, i) => {
    const label = `${group}: ${paletteNames[i]}`;
    return `<button type="button" class="sw ${crest[key] === color ? 'on' : ''}" data-k="${key}" data-v="${color}" style="background:${color}" aria-label="${label}" title="${label}" aria-pressed="${crest[key] === color}"></button>`;
  }).join('');
}
