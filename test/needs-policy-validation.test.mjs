import test from'node:test';import assert from'node:assert/strict';import{validateNeedsCalibration}from'../src/sim/needs-policy-validation.mjs';
const cells=()=>Object.fromEntries(['poor','middle','rich'].map(c=>[c,{perPersonDay:.1,kind:'game-assumption',assumption:'test scenario, not a historical claim'}]));
const row=()=>({physicalUnit:'kg',cargoPhysicalUnits:100,populationEquivalent:.7,populationEvidence:'scenario household coefficient, not census',classes:cells()});
test('named assumptions may be represented without laundering them into observation',()=>{assert.equal(validateNeedsCalibration({meat:row()}).ok,true);});
test('source rates require source population period and URL',()=>{const x=row();x.classes.poor={perPersonDay:.132,kind:'source-reconstruction'};assert.equal(validateNeedsCalibration({meat:x}).ok,false);x.classes.poor={...x.classes.poor,source:'https://example.invalid/source',sourcePopulation:'adult-worker',sourcePeriod:'1521-1540'};const r=validateNeedsCalibration({meat:x});assert.equal(r.ok,true);assert.equal(r.warnings.length,1);});
test('unknown chickpea preparation prevents cargo energy integration',()=>{const x={...row(),energyKcalPerKg:1200,energyPreparationState:'unknown',cargoPreparationState:'dry'};assert.equal(validateNeedsCalibration({legumes:x}).ok,false);});
test('cooked versus dry conversion needs explicit yield and evidence',()=>{const x={...row(),energyKcalPerKg:1200,energyPreparationState:'cooked',cargoPreparationState:'dry'};assert.equal(validateNeedsCalibration({legumes:x}).ok,false);x.preparationYield=2;x.preparationEvidence='explicit hypothetical test yield';assert.equal(validateNeedsCalibration({legumes:x}).ok,true);});
test('bread and cloth unit gaps are blockers, not defaults',()=>{const b={...row(),physicalUnit:'kg-bread-equivalent'};assert.equal(validateNeedsCalibration({grain:b}).ok,false);b.breadGrainFactor=1;b.breadGrainEvidence='test assumption';assert.equal(validateNeedsCalibration({grain:b}).ok,true);const c={...row(),physicalUnit:'metre',marketUnit:'kg'};assert.equal(validateNeedsCalibration({cloth:c}).ok,false);});
test('invalid quantities or missing class never silently produce a policy',()=>{const x=row();x.cargoPhysicalUnits=0;delete x.classes.rich;assert.equal(validateNeedsCalibration({food:x}).errors.length,2);});
test('all physical conversion factors reject negative zero nonfinite and string inputs',()=>{
 const invalid=[-1,0,Infinity,NaN,'bogus','1'];
 for(const value of invalid){
  for(const key of ['cargoPhysicalUnits','populationEquivalent'])assert.equal(validateNeedsCalibration({x:{...row(),[key]:value}}).ok,false,`${key} ${value}`);
  assert.equal(validateNeedsCalibration({cloth:{...row(),physicalUnit:'metre',marketUnit:'kg',fabricKgPerMetre:value,fabricEvidence:'explicit scenario'}}).ok,false,`fabric ${value}`);
  assert.equal(validateNeedsCalibration({grain:{...row(),physicalUnit:'kg-bread-equivalent',breadGrainFactor:value,breadGrainEvidence:'explicit scenario'}}).ok,false,`bread ${value}`);
  assert.equal(validateNeedsCalibration({legumes:{...row(),energyKcalPerKg:1200,energyPreparationState:'cooked',cargoPreparationState:'dry',preparationYield:value,preparationEvidence:'explicit scenario'}}).ok,false,`yield ${value}`);
  assert.equal(validateNeedsCalibration({food:{...row(),energyKcalPerKg:value,energyPreparationState:'raw',cargoPreparationState:'raw'}}).ok,false,`energy ${value}`);
 }
 const valid={...row(),physicalUnit:'metre',marketUnit:'kg',fabricKgPerMetre:.25,fabricEvidence:'explicit scenario'};assert.equal(validateNeedsCalibration({cloth:valid}).ok,true);
});
