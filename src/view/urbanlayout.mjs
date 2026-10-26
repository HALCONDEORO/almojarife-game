// Presentation-only districts. Canonical parcel IDs/types/dimensions stay untouched.
// A house sprite denotes a residential group, NOT one literal household.
export function housingScale(pop) {
  if(!Number.isFinite(pop)||pop<0)throw Error('invalid population');
  const groups=pop===0?0:Math.min(72,Math.max(1,Math.ceil(10*Math.pow(pop/3000,0.63))));
  return {groups,peoplePerGroup:groups?Math.round(pop/groups):0,level:pop>=25000?3:pop>=10000?2:1};
}
export function urbanLayout(canonical,pop) {
  const housing=housingScale(pop),plots=canonical.plots.map(p=>({...p}));
  // Keep original parcel economics and save references; only remap their screen positions.
  const regular=plots.slice(6),cols=Math.max(5,Math.ceil(Math.sqrt(regular.length))),pitch=7;
  const rows=Math.ceil(regular.length/cols);
  /* Cádiz c.1480 (fixed, historical): walled town, the civic square and its buildings right behind the Puerta del Mar on the bay quay, the shipyard and warehouse on the quay itself, the neighbours' quarter outside the walls as the arrabal. Other cities keep the generic layout for now. */
  const hf=canonical.id==='cadiz',G=3+cols*pitch,r0=Math.max(1,Math.round(rows/2));
  const width=cols*pitch+(hf?19:16),height=Math.max(rows*pitch+28,56);
  const plaza=hf?{x:G+2,y:3+r0*pitch-5,w:10,d:10}:{x:width/2-5,y:height/2-5,w:10,d:10};
  /* Each lot sits centred in its own block: the streets run at 3+k*pitch, so the block interior is [3+k*pitch, 3+(k+1)*pitch] and a 3-5 wide lot never touches or crosses a street. */
  regular.forEach((p,i)=>{p.x=3+(i%cols)*pitch+(pitch-p.w)/2;p.y=3+Math.floor(i/cols)*pitch+(pitch-p.d)/2;p.cell={x:3+(i%cols)*pitch,y:3+Math.floor(i/cols)*pitch,w:pitch,d:pitch}}); /* cell: the whole block between streets, presentation only; a lot for sale is drawn filling it */
  // Reserve a separate civic square and waterfront, away from the parcel grid.
  const gridBottom=5+rows*pitch,cy=hf?gridBottom+1:gridBottom+6;
  if(!hf){plaza.x=width/2-7;plaza.y=cy-1;}
  const servicePositions=hf?[[G+2,plaza.y-6],[width-6,plaza.y-14],[G+8,plaza.y+11],[G+8,plaza.y-6],[G+2,plaza.y+11],[width-6,plaza.y+16]]:[[plaza.x-6,cy],[width-6,height*.33],[plaza.x+12,cy],[plaza.x-6,cy+8],[plaza.x+12,cy+8],[width-6,height*.66]];
  // Space for service strip and plaza even with tall parcel grids.
  const maxY=Math.max(height,cy+18);
  plots.slice(0,6).forEach((p,i)=>{[p.x,p.y]=servicePositions[i];});
  const paths=[];
  const road=(x,y,X,Y)=>paths.push({beg:{x,y},end:{x:X,y:Y}});
  // Connected north/south streets between parcel blocks, transverse streets and quayside route.
  for(let c=0;c<=cols;c++)road(3+c*pitch,1,3+c*pitch,3+rows*pitch);
  for(let r=0;r<=rows;r++)road(1,3+r*pitch,3+cols*pitch,3+r*pitch);
  if(!hf)road(plaza.x+5,3+rows*pitch,plaza.x+5,cy+17);else{road(1,3+r0*pitch,width-1,3+r0*pitch);road(3+Math.round(cols/2)*pitch,3+rows*pitch,3+Math.round(cols/2)*pitch,cy+5);}
  road(1,cy+5,width-1,cy+5);
  for(const p of [plots[1],plots[5]].filter(Boolean))road(3+cols*pitch,p.y+p.d+1,width-1,p.y+p.d+1);
  road(width-1,1,width-1,maxY);
  if(!hf)road(plaza.x+5,cy-1,plaza.x+5,cy+16);
  // Fixed, bounded residential quarter south of civic square; counts, density and levels follow population.
  const existing=plots.filter(p=>p.type==='house').length;
  const count=housing.groups; /* house-type parcels are lots for sale (drawn empty), so every residential group is its own drawn neighbour house */
  housing.groups=Math.max(existing,housing.groups);housing.peoplePerGroup=housing.groups?Math.round(pop/housing.groups):0;
  const residential=[],houseCols=Math.max(1,Math.min(cols,Math.ceil(Math.sqrt(count)*1.3)));
  const houseY=hf?cy+7:cy+18,houseRows=Math.ceil(count/houseCols);
  for(let i=0;i<count;i++)residential.push({id:`residential-${canonical.id}-${i}`,type:'house',x:5+(i%houseCols)*5.5,y:houseY+Math.floor(i/houseCols)*6,w:4,d:4,level:housing.level});
  for(let r=0;r<=houseRows;r++)road(1,houseY-1+r*6,Math.max(width,houseCols*5.5+7)-1,houseY-1+r*6);
  road(width-1,cy+5,width-1,houseY+houseRows*6);
  return {...canonical,plots,paths,plaza,residential,housing,walled:hf?{minX:1,minY:1,maxX:width-1,maxY:gridBottom,gateN:3+Math.round(cols/2)*pitch,gateS:3+Math.round(cols/2)*pitch,gateE:3+r0*pitch}:undefined,visualBounds:{minX:0,minY:0,maxX:Math.max(width,houseCols*5.5+7),maxY:houseY+houseRows*6+3}};
}
