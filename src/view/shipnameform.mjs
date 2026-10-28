const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function shipNameForm(s,lang='es'){
 const en=lang==='en';return `<form data-ship-rename="${s.id}"><label>${en?'Ship name':'Nombre del barco'} <input name="shipname" value="${esc(s.name)}" maxlength="30" required autocomplete="off"></label> <button>${en?'Rename':'Renombrar'}</button><small role="status" data-name-error></small></form>`;
}
export function wireShipNames(root,g,rename,act,lang){
 root.querySelectorAll('[data-ship-rename]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const value=form.elements.shipname.value;let result;act(()=>result=rename(g,Number(form.dataset.shipRename),value));if(!result.ok){root.querySelector('[data-name-error]').textContent=lang==='es'?'Usa un nombre único de 1 a 30 caracteres.':'Use a unique name of 1 to 30 characters.';return;}});
}
