const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function convoyNameInput(name='',lang='es',id='convoy-name') {return `<label>${lang==='es'?'Nombre del convoy':'Convoy name'} <input id="${id}" value="${esc(name)}" maxlength="30" autocomplete="off"></label>`;}
