import{test}from'node:test';import assert from'node:assert/strict';import{logText,logHtml}from'../src/view/logview.mjs';
const t={day:'Día',log:{buy:'Día {day}: compras {qty} {good} por {sum}'},goods:{grain:'Trigo'}};
test('localized reputation notices do not require host template',()=>{assert.equal(logText({key:'reputation',day:0,txt:{es:'Tu reputación empeora',en:'Your name suffers'}},t,'es'),'Día 0: Tu reputación empeora');});
test('existing templated log text is retained',()=>{assert.equal(logText({key:'buy',day:0,good:'grain',qty:10,sum:356},t,'es'),'Día 0: compras 10 Trigo por 356');});
test('unknown keys and translated fallback do not break rendering; player text escaped',()=>{assert.equal(logText({key:'future',day:2},t,'es'),'Día 2: La casa mercantil ha recibido noticias.');assert.match(logHtml([{key:'event',day:3,txt:{es:'<script>'}}],t,'en'),/&lt;script&gt;/);});
