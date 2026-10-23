import{test}from'node:test';import assert from'node:assert/strict';import{logText,logHtml}from'../src/view/logview.mjs';
const t={day:'Día',log:{buy:'Día {day}: compras {qty} {good} por {sum}'},goods:{grain:'Trigo'}};
test('localized reputation notices do not require host template',()=>{assert.equal(logText({key:'reputation',day:0,txt:{es:'Tu reputación empeora',en:'Your name suffers'}},t,'es'),'Día 0: Tu reputación empeora');});
test('existing templated log text is retained',()=>{assert.equal(logText({key:'buy',day:0,good:'grain',qty:10,sum:356},t,'es'),'Día 0: compras 10 Trigo por 356');});
test('unknown keys and translated fallback do not break rendering; player text escaped',()=>{assert.equal(logText({key:'future',day:2},t,'es'),'Día 2: La casa mercantil ha recibido noticias.');assert.match(logHtml([{key:'event',day:3,txt:{es:'<script>'}}],t,'en'),/&lt;script&gt;/);});

test('rumor template localizes both ports ({at} and {city})',()=>{const tt={day:'Día',log:{rumor:'Día {day}: pagas una ronda ({price}) en la taberna de {at}: te cuentan cómo anda el mercado de {city}. Rumor, impreciso.'},goods:{}};assert.equal(logText({key:'rumor',day:5,city:'sevilla',at:'cadiz',price:40},tt,'es',x=>({cadiz:'Cádiz',sevilla:'Sevilla'}[x]??x)),'Día 5: pagas una ronda (40) en la taberna de Cádiz: te cuentan cómo anda el mercado de Sevilla. Rumor, impreciso.');});
