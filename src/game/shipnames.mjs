// Rename only an owned ship. Names are plain text, never markup.
export function renameShip(g,id,value){
 if(g.over)return{ok:false,reason:'game over'};
 const ship=g.ships.find(s=>s.id===id);if(!ship)return{ok:false,reason:'not your ship'};
 if(typeof value!=='string')return{ok:false,reason:'bad name'};
 const name=value.trim();if(!name||name.length>30||/[\u0000-\u001f\u007f]/u.test(name))return{ok:false,reason:'bad name'};
 if(g.ships.some(s=>s!==ship&&s.name?.trim().normalize('NFKC').toLocaleLowerCase('es')===name.normalize('NFKC').toLocaleLowerCase('es')))return{ok:false,reason:'duplicate name'};
 ship.name=name;return{ok:true};
}
