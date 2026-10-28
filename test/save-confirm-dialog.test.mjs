import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {slotError} from '../src/view/slotsview.mjs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('slot operations and previous-backup restore use game confirmations',()=>{
 const slots=src.slice(src.indexOf('function showSlots()'),src.indexOf('function showCredits()'));
 assert.doesNotMatch(slots,/[^A-Za-z]confirm\(/);
 assert.equal((slots.match(/await confirmDialog/g)||[]).length,3);
 assert.ok(src.includes('await confirmDialog(el, t.restConfirm, lang)'));
});
test('quota failure has a specific non-destructive message in both languages',()=>{
 assert.match(slotError({name:'QuotaExceededError'},'es'),/Almacenamiento lleno/);
 assert.match(slotError({name:'NS_ERROR_DOM_QUOTA_REACHED'},'en'),/Storage is full/);
 assert.match(slotError(Error('bad'),'en'),/Could not finish/);
});

test('confirmation Tab handler respects the outer modal capture handler',()=>{
 const dialog=readFileSync(new URL('../web/confirmdialog.mjs',import.meta.url),'utf8');
 assert.match(dialog,/e.key === 'Tab' && !e.defaultPrevented/);
});
