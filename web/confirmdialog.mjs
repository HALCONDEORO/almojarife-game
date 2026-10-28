// No native browser dialogs: usable in remote browsers and by keyboard.
export function confirmDialog(host, message, lang = 'es') {
  return new Promise(resolve => {
    const es = lang === 'es';
    host.innerHTML = `<section class="box pausemenu" style="padding:16px;min-width:280px;max-width:min(520px,90vw)" role="alertdialog" aria-modal="true" aria-labelledby="confirm-message"><p id="confirm-message"></p><p><button id="confirm-cancel"></button> <button id="confirm-accept"></button></p></section>`;
    host.hidden = false;
    host.querySelector('#confirm-message').textContent = message;
    const cancel = host.querySelector('#confirm-cancel'), accept = host.querySelector('#confirm-accept');
    cancel.textContent = es ? 'Cancelar' : 'Cancel'; accept.textContent = es ? 'Confirmar' : 'Confirm';
    const finish = value => resolve(value);
    cancel.onclick = () => finish(false); accept.onclick = () => finish(true);
    host.querySelector('section').onkeydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
      if (e.key === 'Tab' && !e.defaultPrevented) { e.preventDefault(); (document.activeElement === cancel ? accept : cancel).focus(); }
    };
    cancel.focus();
  });
}
