import {escapeHtml as esc} from './escapehtml.mjs';
export function shipNameForm(s,lang='es'){
 const en=lang==='en';return `<form data-ship-rename="${s.id}"><label>${en?'Ship name':'Nombre del barco'} <input name="shipname" value="${esc(s.name)}" maxlength="30" required autocomplete="off"></label> <button>${en?'Rename':'Renombrar'}</button><small role="status" data-name-error></small></form>`;
}
export function wireShipNames(root,g,rename,act,lang){
 root.querySelectorAll('[data-ship-rename]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const value=form.elements.shipname.value;const id=Number(form.dataset.shipRename),result=rename(g,id,value,{validateOnly:true});if(!result.ok){form.querySelector('[data-name-error]').textContent=lang==='es'?'Usa un nombre único de 1 a 30 caracteres.':'Use a unique name of 1 to 30 characters.';return;}act(()=>rename(g,id,value));});
}
