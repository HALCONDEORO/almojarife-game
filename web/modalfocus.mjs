// Focus and background isolation for the title-hosted in-game dialogs.
export function installModalFocus(host, active) {
  const held = new Map();
  let wasOpen = false;
  const sync = () => {
    const open = active() && !host.hidden;
    if (open) {
      for (const el of document.body.children) {
        if (el === host || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
        if (!held.has(el)) held.set(el, el.inert);
        el.inert = true;
      }
    } else {
      for (const [el, inert] of held) el.inert = inert;
      held.clear();
      if (wasOpen && active()) (document.querySelector('#v3d [data-city-menu]') ?? document.getElementById('new'))?.focus();
    }
    wasOpen = open;
  };
  new MutationObserver(sync).observe(host, {attributes:true, attributeFilter:['hidden'], childList:true});
  new MutationObserver(sync).observe(document.body, {childList:true});
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !active() || host.hidden) return;
    const controls = [...host.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
    const first = controls[0], last = controls.at(-1);
    if (!first) { e.preventDefault(); return; }
    if (!host.contains(document.activeElement) || (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      e.preventDefault(); (e.shiftKey ? last : first).focus();
    }
  }, true);
}
