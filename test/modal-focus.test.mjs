import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const modal=readFileSync(new URL('../web/modalfocus.mjs',import.meta.url),'utf8');
test('pause dialog is named, modal and initially focuses Resume',()=>{
 assert.match(main,/role="dialog" aria-modal="true" aria-labelledby="pause-title"/);
 assert.ok(main.includes('$("m-res").focus();'));
});
test('title-hosted game dialogs isolate the background and wrap Tab in capture phase',()=>{
 assert.ok(main.includes('installModalFocus($("title"), () => !inTitle)'));
 assert.ok(modal.includes('held.set(el, el.inert)'));
 assert.ok(modal.includes('el.inert = true'));
 assert.ok(modal.includes('el.inert = inert'));
 assert.ok(modal.includes('if (e.key !== \'Tab\' || !active() || host.hidden) return;'));
 assert.ok(modal.includes('}, true)'));
});
