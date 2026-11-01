import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  $("sl-back").onclick =');
const binding=source.slice(start,source.indexOf('  el.querySelectorAll("[data-sl-save]")',start));
function fixture(inTitle) {
 const effects=[],back={click(){this.onclick();},focus(){effects.push('focus');}},panel={};
 vm.runInNewContext(binding,{$:id=>{assert.equal(id,'sl-back');return back;},inTitle,
  showTitle:()=>effects.push('title'),showMenu:()=>effects.push('menu'),
  el:{querySelector:selector=>{assert.equal(selector,'.sl-win');return {addEventListener:(kind,handler)=>{assert.equal(kind,'keydown');panel.handler=handler;}};}}});
 return {effects,press(key,defaultPrevented=false){panel.handler({key,defaultPrevented,preventDefault:()=>effects.push('prevent'),stopPropagation:()=>effects.push('stop')});}};
}
test('the slots window starts at Back and Escape returns to the pause menu',()=>{
 const view=fixture(false);assert.deepEqual(view.effects,['focus']);view.press('Escape');assert.deepEqual(view.effects,['focus','prevent','stop','menu']);
});
test('Escape returns to the title when slots were opened there',()=>{
 const view=fixture(true);view.press('Escape');assert.equal(view.effects.at(-1),'title');
});
test('other keys and already-handled Escape never close the slots window',()=>{
 const view=fixture(false);view.press('Enter');view.press('Escape',true);assert.deepEqual(view.effects,['focus']);
});
