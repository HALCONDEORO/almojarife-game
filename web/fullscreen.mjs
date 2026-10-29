// Keep both map and city controls in sync with the browser's actual fullscreen state.
export function syncFullscreenButtons(buttons, active, lang = 'es') {
  const label = lang === 'es'
    ? (active ? 'Salir de pantalla completa' : 'Pantalla completa')
    : (active ? 'Exit fullscreen' : 'Fullscreen');
  for (const button of buttons) {
    if (!button) continue;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(active));
  }
}
