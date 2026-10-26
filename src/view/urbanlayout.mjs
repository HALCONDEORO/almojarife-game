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
  const rows=Math.ceil(regular.length/cols),width=cols*pitch+16,height=Math.max(rows*pitch+28,56);
  const plaza={x:width/2-5,y:height/2-5,w:10,d:10};
  regular.forEach((p,i)=>{p.x=5+(i%cols)*pitch;p.y=5+Math.floor(i/cols)*pitch;});
  // Reserve a separate civic square and waterfront, away from the parcel grid.
  const gridBottom=5+rows*pitch,cy=gridBottom+6;
  plaza.x=width/2-7;plaza.y=cy-1;
  const servicePositions=[[plaza.x-6,cy],[width-6,height*.33],[plaza.x+12,cy],[plaza.x-6,cy+8],[plaza.x+12,cy+8],[width-6,height*.66]];
  // Space for service strip and plaza even with tall parcel grids.
  const maxY=Math.max(height,cy+18);
  plots.slice(0,6).forEach((p,i)=>{[p.x,p.y]=servicePositions[i];});
  const paths=[];
  const road=(x,y,X,Y)=>paths.push({beg:{x,y},end:{x:X,y:Y}});
  // Connected north/south streets between parcel blocks, transverse streets and quayside route.
  for(let c=0;c<=cols;c++)road(3+c*pitch,1,3+c*pitch,3+rows*pitch);
  for(let r=0;r<=rows;r++)road(1,3+r*pitch,3+cols*pitch,3+r*pitch);
  road(plaza.x+5,3+rows*pitch,plaza.x+5,cy+17);
  road(1,cy+5,width-1,cy+5);
  for(const p of [plots[1],plots[5]].filter(Boolean))road(3+cols*pitch,p.y+p.d+1,width-1,p.y+p.d+1);
  road(width-1,1,width-1,maxY);
  road(plaza.x+5,cy-1,plaza.x+5,cy+16);
  // Fixed, bounded residential quarter south of civic square; counts, density and levels follow population.
  const existing=plots.filter(p=>p.type==='house').length;
  const count=housing.groups; /* house-type parcels are lots for sale (drawn empty), so every residential group is its own drawn neighbour house */
  housing.groups=Math.max(existing,housing.groups);housing.peoplePerGroup=housing.groups?Math.round(pop/housing.groups):0;
  const residential=[],houseCols=Math.max(1,Math.min(cols,Math.ceil(Math.sqrt(count)*1.3)));
  const houseY=cy+18,houseRows=Math.ceil(count/houseCols);
  for(let i=0;i<count;i++)residential.push({id:`residential-${canonical.id}-${i}`,type:'house',x:5+(i%houseCols)*5.5,y:houseY+Math.floor(i/houseCols)*6,w:4,d:4,level:housing.level});
  for(let r=0;r<=houseRows;r++)road(1,houseY-1+r*6,Math.max(width,houseCols*5.5+7)-1,houseY-1+r*6);
  road(width-1,cy+5,width-1,houseY+houseRows*6);
  return {...canonical,plots,paths,plaza,residential,housing,visualBounds:{minX:0,minY:0,maxX:Math.max(width,houseCols*5.5+7),maxY:houseY+houseRows*6+3}};
}
