import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const writer = source.slice(source.indexOf('function autosave() {'), source.indexOf('// Besides the daily save:'));
function fixture(mode = 'ok', inTitle = false) {
 const values = new Map([['save', 'previous committed save']]), nodes = new Map(), exported = [];
 const makeNode = () => ({
  children: [], style: {},
  setAttribute(name, value) { this[name] = value; },
  append(...children) { this.children.push(...children); },
  replaceChildren() { this.children = []; },
  remove() { this.removed = true; }
 });
 const context = {inTitle,g:{day:7,cash:100},company:'Casa',SAVE_KEY:'save',lang:'es',
  packGame:(game,company)=>({state:game,company}),slotError:()=> 'No se pudo guardar',exportSave:raw=>exported.push(raw),
  localStorage:{getItem:key=>values.get(key),setItem(key,value){if(mode==='quota')throw new Error('quota');if(mode!=='silent')values.set(key,value);}},
  document:{getElementById:id=>nodes.get(id),createElement:makeNode,body:{append(node){nodes.set(node.id,node);}}}};
 vm.createContext(context);vm.runInContext(writer,context);
 return {context,values,nodes,exported,save:()=>context.autosave()};
}
test('the production autosave returns success only after read-back matches its captured payload',()=>{
 const setup=fixture(); assert.equal(setup.save(),true);
 assert.deepEqual(JSON.parse(setup.values.get('save')),{state:{day:7,cash:100},company:'Casa'});
 assert.equal(setup.nodes.size,0);
});
test('quota failure keeps the prior commit and offers an export of the unsaved current state',()=>{
 const setup=fixture('quota');assert.equal(setup.save(),false);assert.equal(setup.values.get('save'),'previous committed save');
 const warning=setup.nodes.get('save-warning');assert.equal(warning.role,'alert');assert.match(warning.children[0].textContent,/guardar/);
 setup.context.g.day = 8; // Export the live unsaved game, not the stale prior commit.
 warning.children[1].onclick();assert.equal(JSON.parse(setup.exported[0]).state.day,8);
});
test('a storage write that silently drops data is not reported as committed',()=>{
 const setup=fixture('silent');assert.equal(setup.save(),false);assert.equal(setup.values.get('save'),'previous committed save');
 assert.equal(setup.nodes.get('save-warning').role,'alert');
});
test('title-screen background state never overwrites the real save',()=>{
 const setup=fixture('ok',true);assert.equal(setup.save(),false);assert.equal(setup.values.get('save'),'previous committed save');assert.equal(setup.nodes.size,0);
});
test('a later successful commit retires the prior failure warning',()=>{
 const setup=fixture('silent');assert.equal(setup.save(),false);const warning=setup.nodes.get('save-warning');
 setup.context.localStorage.setItem=(key,value)=>setup.values.set(key,value);
 assert.equal(setup.save(),true);assert.equal(warning.removed,true);
});
test('the unchanged-payload wrapper retries failed persistence rather than treating it as saved',()=>{
 const setup=fixture('silent');
 const wrapper=source.split('\n').find(line=>line.startsWith('function autosaveIfChanged()'));
 vm.runInContext(wrapper,setup.context);setup.context.autosaveIfChanged();assert.equal(setup.nodes.get('save-warning').role,'alert');
 setup.context.localStorage.setItem=(key,value)=>setup.values.set(key,value);
 setup.context.autosaveIfChanged();assert.equal(JSON.parse(setup.values.get('save')).state.day,7);
 assert.equal(setup.nodes.get('save-warning').removed,true);
});
