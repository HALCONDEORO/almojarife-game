import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marketLabels,marketActionLabel} from '../src/view/marketlabels.mjs';
test('market headings distinguish unit price, total and chosen order size in both languages',()=>{
 assert.deepEqual(marketLabels('es'),{unitPrice:'Precio/ud.',buyTotal:'Compra: total',sellTotal:'Venta: total',quantity:'Cantidad a operar'});
 assert.equal(marketLabels('en').unitPrice,'Price/unit');
 assert.equal(marketLabels('en').buyTotal,'Buy: total');
 assert.equal(marketActionLabel('es','buy','Trigo',10,'327'),'Comprar 10 Trigo. Total: 327 monedas.');
 assert.equal(marketActionLabel('en','sell','Grain',5,'150'),'Sell 5 Grain. Total: 150 coins.');
});
test('real market wiring uses quote quantities and totals and marks selection without colour',()=>{
 const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.ok(source.includes('marketCopy.unitPrice, t.stock, t.hold, t.avgLbl, marketCopy.buyTotal, marketCopy.sellTotal'));
 assert.ok(source.includes('marketActionLabel(lang,"buy",t.goods[gd],pb.qty,fmtM(buyCost))'));
 assert.ok(source.includes('marketActionLabel(lang,"sell",t.goods[gd],ps.qty,fmtM(sellPay))'));
 assert.ok(source.includes('marketQty === v ? "✓ " : ""'));
 const css=readFileSync(new URL('../web/ui2d.css',import.meta.url),'utf8');
 assert.ok(css.includes('font-variant-numeric:tabular-nums lining-nums'));
 assert.match(css,/\.mkt-qtybar button\.on\{outline:2px solid/);
});
