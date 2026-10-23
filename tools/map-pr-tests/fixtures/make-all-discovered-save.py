# Regenerate the 33-port discovered fixture from any base save + the repo's coast lists.
# Usage: python3 make-all-discovered-save.py <base-save.json> <repo/src/game/charts.mjs> <out.json>
import json,re,sys
base,charts,out=sys.argv[1],sys.argv[2],sys.argv[3]
ids=set()
for m in re.finditer(r'ports:\s*Object\.freeze\(\[([^\]]+)\]\)',open(charts).read()):
 ids.update(re.findall(r'"([a-z_]+)"',m.group(1)))
d=json.load(open(base));st=d.get('state',d)
disc=st.get('discovered') or {}
for i in ids: disc.setdefault(i,1)
st['discovered']=disc
json.dump(d,open(out,'w'))
print('ports:',len(disc))
