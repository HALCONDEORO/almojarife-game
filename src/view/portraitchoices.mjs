import { PORTRAITS, portraitSvg } from '../game/profile.mjs';

// A portrait is a choice button, not an unlabelled picture. Keep the selected
// state available without relying on the coloured border alone.
export function portraitChoices(selected, cloth, lang = 'es') {
  return Array.from({ length: PORTRAITS }, (_, i) => {
    const label = lang === 'es' ? `Retrato ${i + 1} de ${PORTRAITS}` : `Portrait ${i + 1} of ${PORTRAITS}`;
    return `<button type="button" class="pt ${selected === i ? 'on' : ''}" data-p="${i}" aria-label="${label}" title="${label}" aria-pressed="${selected === i}">${portraitSvg(i, cloth, 48)}</button>`;
  }).join('');
}
