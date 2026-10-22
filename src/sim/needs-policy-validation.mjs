// Research integration guard. Having a numeric rate never proves its unit/evidence.
const CLASSES=['poor','middle','rich'];
export function validateNeedsCalibration(policy){
 const errors=[],warnings=[];
 for(const[g,row]of Object.entries(policy)){
  const at=s=>g+': '+s;
  if(!['kg','litre','metre','kg-bread-equivalent'].includes(row.physicalUnit))errors.push(at('unsupported or missing physical unit'));
  if(!Number.isFinite(row.cargoPhysicalUnits)||row.cargoPhysicalUnits<=0)errors.push(at('explicit positive physical units per cargo unit required'));
  if(!Number.isFinite(row.populationEquivalent)||row.populationEquivalent<=0)errors.push(at('explicit population equivalent required'));
  if(!row.populationEvidence)errors.push(at('population conversion provenance required'));
  for(const c of CLASSES){
   const cell=row.classes?.[c];if(!cell){errors.push(at('missing class '+c));continue;}
   if(!Number.isFinite(cell.perPersonDay)||cell.perPersonDay<0)errors.push(at(c+' invalid daily rate'));
   if(!['source-reconstruction','institutional-allowance','game-assumption'].includes(cell.kind))errors.push(at(c+' evidence type required'));
   if(cell.kind!=='game-assumption'&&(!cell.source||!cell.sourcePopulation||!cell.sourcePeriod))errors.push(at(c+' source population period and URL required'));
   if(cell.kind==='game-assumption'&&!cell.assumption)errors.push(at(c+' gameplay assumption must be named'));
   if(cell.kind!=='game-assumption'&&cell.sourcePopulation!=='all-inhabitants')warnings.push(at(c+' source population differs from full class; extrapolation must remain explicit'));
  }
  if(row.physicalUnit==='kg-bread-equivalent'&&(!Number.isFinite(row.breadGrainFactor)||row.breadGrainFactor<=0||!row.breadGrainEvidence))errors.push(at('bread to grain factor and evidence required'));
  if(row.physicalUnit==='metre'&&row.marketUnit==='kg'&&(!row.fabricKgPerMetre||!row.fabricEvidence))errors.push(at('fabric length cannot become cargo mass without conversion evidence'));
  if(row.energyKcalPerKg!==undefined){
   if(!Number.isFinite(row.energyKcalPerKg)||row.energyKcalPerKg<=0)errors.push(at('invalid energy density'));
   if(!row.energyPreparationState||row.energyPreparationState==='unknown')errors.push(at('preparation state required before energy/cargo integration'));
   if(!row.cargoPreparationState||row.energyPreparationState!==row.cargoPreparationState){if(!Number.isFinite(row.preparationYield)||row.preparationYield<=0||!row.preparationEvidence)errors.push(at('different preparation states need yield and provenance'));}
  }
 }
 return{ok:errors.length===0,errors,warnings};
}
