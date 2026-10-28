import {escapeHtml as esc} from './escapehtml.mjs';
export function convoyNameInput(name='',lang='es',id='convoy-name') {return `<label>${lang==='es'?'Nombre del convoy':'Convoy name'} <input id="${id}" value="${esc(name)}" maxlength="30" autocomplete="off"></label>`;}
