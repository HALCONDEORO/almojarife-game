import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
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

const source=readFileSync(new URL('../web/modalfocus.mjs',import.meta.url),'utf8').replace('export function','function');
function fixture(){
 const effects=[],observers=[],listeners=[];
 const button=name=>({name,focus(){document.activeElement=this;effects.push(name);},getClientRects:()=>[{}],closest:()=>null});
 const first=button('first'),last=button('last'),menu=button('menu'),resume=button('resume');
 const background={tagName:'MAIN',inert:false},alreadyInert={tagName:'ASIDE',inert:true},script={tagName:'SCRIPT',inert:false},style={tagName:'STYLE',inert:false};
 let active=true,controls=[first,last];
 const host={hidden:true,querySelectorAll:selector=>{assert.equal(selector,'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');return controls;},contains:element=>controls.includes(element)};
 const document={body:{children:[host,background,alreadyInert,script,style]},activeElement:null,querySelector:()=>menu,getElementById:id=>{assert.equal(id,'new');return resume;},addEventListener:(kind,handler,capture)=>{assert.equal(kind,'keydown');assert.equal(capture,true);listeners.push(handler);}};
 class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(target,options){this.target=target;this.options=options;}}
 vm.runInNewContext(source+'\ninstallModalFocus(host,active);',{host,active:()=>active,document,MutationObserver:Observer});
 return {host,document,background,alreadyInert,script,style,first,last,effects,observers,setActive:value=>{active=value;},setControls:value=>{controls=value;},setMenu:value=>{document.querySelector=()=>value;},button,
  sync:()=>observers[0].callback(),press(key='Tab',shiftKey=false){let prevented=false;listeners[0]({key,shiftKey,preventDefault:()=>{prevented=true;}});return prevented;}};
}
test('opening isolates existing and newly added background siblings without touching host or scripts',()=>{
 const view=fixture();view.host.hidden=false;view.sync();assert.equal(view.background.inert,true);assert.equal(view.alreadyInert.inert,true);assert.equal(view.host.inert,undefined);assert.equal(view.script.inert,false);assert.equal(view.style.inert,false);
 const added={tagName:'DIV',inert:false};view.document.body.children.push(added);view.observers[1].callback();assert.equal(added.inert,true);
});
test('closing restores each original inert state and returns focus to the city menu once',()=>{
 const view=fixture();view.host.hidden=false;view.sync();view.sync();view.host.hidden=true;view.sync();view.sync();assert.equal(view.background.inert,false);assert.equal(view.alreadyInert.inert,true);assert.deepEqual(view.effects,['menu']);
});
test('closing outside city view returns focus to the main menu button',()=>{
 const view=fixture();view.setMenu(null);view.host.hidden=false;view.sync();view.host.hidden=true;view.sync();assert.deepEqual(view.effects,['resume']);
});
test('title mode neither isolates the background nor intercepts keyboard navigation',()=>{
 const view=fixture();view.setActive(false);view.host.hidden=false;view.sync();assert.equal(view.background.inert,false);assert.equal(view.press(),false);assert.deepEqual(view.effects,[]);
});
test('Tab and Shift+Tab wrap at the visible modal boundaries',()=>{
 const view=fixture();view.host.hidden=false;view.document.activeElement=view.last;assert.equal(view.press(),true);assert.deepEqual(view.effects,['first']);assert.equal(view.press('Tab',true),true);assert.deepEqual(view.effects,['first','last']);
});
test('focus outside a modal is recovered in the requested tab direction',()=>{
 const view=fixture();view.host.hidden=false;view.document.activeElement={};assert.equal(view.press(),true);view.document.activeElement={};assert.equal(view.press('Tab',true),true);assert.deepEqual(view.effects,['first','last']);
});
test('middle controls retain native navigation and hidden modal ignores keys',()=>{
 const view=fixture(),middle=view.button('middle');view.setControls([view.first,middle,view.last]);view.host.hidden=false;view.document.activeElement=middle;assert.equal(view.press(),false);assert.equal(view.press('Tab',true),false);assert.equal(view.press('Enter'),false);view.host.hidden=true;assert.equal(view.press(),false);
});
test('hidden and unrendered controls are excluded from modal boundaries',()=>{
 const view=fixture(),hidden=view.button('hidden'),unrendered=view.button('unrendered');hidden.closest=()=>({});unrendered.getClientRects=()=>[];view.setControls([hidden,view.first,view.last,unrendered]);view.host.hidden=false;view.document.activeElement=view.last;assert.equal(view.press(),true);assert.deepEqual(view.effects,['first']);
});
test('an empty modal prevents tab escape without attempting to focus missing controls',()=>{
 const view=fixture();view.setControls([]);view.host.hidden=false;assert.equal(view.press(),true);assert.equal(view.press('Tab',true),true);assert.deepEqual(view.effects,[]);
});
test('observers cover host replacement and dynamic background additions',()=>{
 const view=fixture();assert.equal(view.observers.length,2);assert.equal(view.observers[0].target,view.host);assert.equal(view.observers[0].options.childList,true);assert.deepEqual([...view.observers[0].options.attributeFilter],['hidden']);assert.equal(view.observers[1].target,view.document.body);assert.equal(view.observers[1].options.childList,true);
});
