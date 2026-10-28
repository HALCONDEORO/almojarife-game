// Expose existing pardon prices and blockers without changing the rule.
import {infamyOf,pardonFee,pardonBlocker} from '../game/pardon.mjs';
export function pardonHtml(g,realms,port,lang='es'){
 if(g.pardon!==true)return '';
 const es=lang==='es',why=pardonBlocker(g,realms,port);
 const labels={es:{'nothing to pardon':'No tienes mala fama que perdonar.','port hostile':'Este puerto es hostil.','too soon':'Este reino solo concede un perdón al año.','no cash':'No tienes suficientes monedas.','no council':'No hay concejo aquí.','no ship here':'Necesitas un barco atracado aquí.','game over':'La partida ha terminado.'},en:{'nothing to pardon':'No bad name to forgive.','port hostile':'This port is hostile.','too soon':'This realm grants one pardon a year.','no cash':'Not enough coins.','no council':'No council here.','no ship here':'A ship must be docked here.','game over':'The game is over.'}};
 return `<section class="card" data-pardon><h3>${es?'Perdón del concejo':'Council pardon'}</h3><p>${es?'Mala fama':'Infamy'}: ${infamyOf(g)}. ${es?'El perdón borra la mala fama, no cancela cargos abiertos. Un perdón por reino y año.':'A pardon clears infamy, not open charges. One pardon per realm per year.'}</p><button data-buy-pardon ${why?'disabled':''}>${es?'Pedir perdón':'Request pardon'} (${pardonFee(g)})</button>${why?`<p>${labels[es?'es':'en'][why]??why}</p>`:''}</section>`;
}
