// Original Almojarife market labels. Presentation only; quotes stay in the trade engine.
export function marketLabels(lang='es'){
 return lang==='en'
  ? {unitPrice:'Price/unit',buyTotal:'Buy: total',sellTotal:'Sell: total',quantity:'Order size'}
  : {unitPrice:'Precio/ud.',buyTotal:'Compra: total',sellTotal:'Venta: total',quantity:'Cantidad a operar'};
}
export function marketActionLabel(lang,action,good,quantity,total){
 const buy=action==='buy';
 return lang==='en'
  ? `${buy?'Buy':'Sell'} ${quantity} ${good}. Total: ${total} coins.`
  : `${buy?'Comprar':'Vender'} ${quantity} ${good}. Total: ${total} monedas.`;
}
