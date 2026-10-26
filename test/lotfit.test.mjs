import test from 'node:test';
import assert from 'node:assert/strict';
import {cityPlots} from '../src/view3d/cityplots.mjs';
import {urbanLayout} from '../src/view/urbanlayout.mjs';

// Marco 26/10: every lot for sale must sit in its own block of the street grid.
for(const [id,pop] of [['cadiz',3000],['cadiz',12000],['sevilla',3000],['huelva',12000],['sevilla',30000]]){
  test(`lots fit their street blocks: ${id} ${pop}`,async()=>{
    const L=urbanLayout(await cityPlots(id,pop),pop),lots=L.plots.slice(6),cells=new Set();
    const roadsThrough=(c)=>L.paths.filter(r=>r.beg.x===r.end.x?(r.beg.x>c.x&&r.beg.x<c.x+c.w&&r.beg.y<c.y+c.d&&r.end.y>c.y):(r.beg.y>c.y&&r.beg.y<c.y+c.d&&r.beg.x<c.x+c.w&&r.end.x>c.x));
    for(const p of lots){
      assert.ok(p.cell,'lot has a cell');
      assert.equal(roadsThrough(p.cell).length,0,'no street crosses the block');
      assert.ok(p.x>=p.cell.x&&p.y>=p.cell.y&&p.x+p.w<=p.cell.x+p.cell.w&&p.y+p.d<=p.cell.y+p.cell.d,'lot inside its block');
      assert.ok(Math.abs(p.x+p.w/2-(p.cell.x+p.cell.w/2))<1e-9&&Math.abs(p.y+p.d/2-(p.cell.y+p.cell.d/2))<1e-9,'lot centred in its block');
      const k=`${p.cell.x},${p.cell.y}`;assert.ok(!cells.has(k),'one lot per block');cells.add(k);
    }
  });
}
test('lot sizes and ids are unchanged by the fit',async()=>{
  const c=await cityPlots('cadiz',3000),L=urbanLayout(c,3000);
  c.plots.forEach((p,i)=>{assert.equal(L.plots[i].id,p.id);assert.equal(L.plots[i].w,p.w);assert.equal(L.plots[i].d,p.d);assert.equal(L.plots[i].type,p.type)});
});
