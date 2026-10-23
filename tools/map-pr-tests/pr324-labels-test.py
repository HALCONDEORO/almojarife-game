import sys,os,tempfile
WT=sys.argv[1] if len(sys.argv)>1 else os.environ.get('MAPTEST_WT','.')
HERE=os.path.dirname(os.path.abspath(__file__))
FIXTURE=os.environ.get('MAPTEST_SAVE',os.path.join(HERE,'fixtures','all-discovered-save.json'))
PROFILE=tempfile.mkdtemp(prefix='maptest-profile-')
SHOTS=os.environ.get('MAPTEST_SHOTS') or tempfile.mkdtemp(prefix='maptest-shots-')
os.makedirs(SHOTS,exist_ok=True)
import socket
def _freeport():
 sk=socket.socket();sk.bind(('127.0.0.1',0));p=sk.getsockname()[1];sk.close();return p
HTTP_PORT=_freeport();CDP_PORT=_freeport()
import subprocess,time,json,urllib.request,websocket,base64,math
SHA=subprocess.check_output(['git','-C',WT,'rev-parse','--short','HEAD'],text=True).strip()
import re as _re
_charts=open(os.path.join(WT,'src','game','charts.mjs')).read()
EXPECTED_PORTS=len(set(_re.findall(r'"([a-z_]+)"'," ".join(_re.findall(r'ports:\s*Object\.freeze\(\[([^\]]+)\]\)',_charts)))))
errors=[]
s=None;c=None
try:
 s=subprocess.Popen(['python3','-m','http.server',str(HTTP_PORT),'--bind','127.0.0.1'],cwd=WT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 c=subprocess.Popen(['google-chrome','--headless','--no-sandbox','--enable-unsafe-swiftshader','--remote-debugging-port='+str(CDP_PORT),'--remote-allow-origins=http://127.0.0.1:%d'%HTTP_PORT,'--user-data-dir='+PROFILE,'--window-size=1366,768','http://127.0.0.1:%d/web/?city2d=1'%HTTP_PORT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 tabs=None
 for _ in range(40):
  try:tabs=json.load(urllib.request.urlopen('http://127.0.0.1:%d/json'%CDP_PORT,timeout=2));break
  except Exception:time.sleep(.25)
 if not tabs:raise SystemExit('chrome CDP did not become ready on 127.0.0.1:%d (is google-chrome installed?)'%CDP_PORT)
 ws=websocket.create_connection(next(t['webSocketDebuggerUrl']for t in tabs if t['type']=='page'),origin='http://127.0.0.1:%d'%HTTP_PORT);i=0
 ws.settimeout(15)
 def call(m,p={}):
  global i;i+=1;ws.send(json.dumps({'id':i,'method':m,'params':p}))
  while True:
   r=json.loads(ws.recv())
   if r.get('id')==i:return r.get('result',{})
   if r.get('method')=='Runtime.exceptionThrown':errors.append(json.dumps(r['params'].get('exceptionDetails',{}))[:600])
 def js(s):
  r=call('Runtime.evaluate',{'expression':s,'returnByValue':True})
  if 'exceptionDetails' in r: raise AssertionError('JS error: '+json.dumps(r['exceptionDetails'])[:400])
  return r['result'].get('value')
 def click(x,y):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'left','buttons':0,'clickCount':1});time.sleep(.25)
 def rclick(x,y):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'right','buttons':2,'clickCount':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'right','buttons':0,'clickCount':1});time.sleep(.3)
 def wheel(x,y,dy): call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':x,'y':y,'deltaX':0,'deltaY':dy});time.sleep(.18)
 def drag(x,y,dx,dy):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1})
  for k in range(1,6):
   call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x+dx*k/5,'y':y+dy*k/5,'button':'left','buttons':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x+dx,'y':y+dy,'button':'left','buttons':0,'clickCount':1});time.sleep(.2)
 def portgeom(p):
  return json.loads(js("""JSON.stringify((()=>{const el=document.querySelector('g.city[data-c=\\"%s\\"]');if(!el)return null;const c=el.querySelector('circle');const t=el.querySelector('text');const ctr=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=+c.getAttribute('r');const rp=new DOMPoint(r,0).matrixTransform(el.getScreenCTM());const tb=t.getBoundingClientRect();return {x:ctr.x,y:ctr.y,rs:Math.hypot(rp.x-ctr.x,rp.y-ctr.y),l:tb.left,tp:tb.top,rr:tb.right,b:tb.bottom,w:tb.width,h:tb.height,fs:getComputedStyle(t).fontSize}})())"""%p))
 def targetring(p):
  return js('!!document.querySelector(\'g.city[data-c="%s"] circle[stroke="#c0392b"]\')'%p)
 def zoomlevel():
  vb=js('document.getElementById("map").getAttribute("viewBox")').split()
  return 800/float(vb[2])
 OVJS="""JSON.stringify((()=>{const out=[];const ps=[];document.querySelectorAll('g.city[data-c]').forEach(el=>{const c=el.querySelector('circle');const t=el.querySelector('text');const ctr=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=+c.getAttribute('r');const rp=new DOMPoint(r,0).matrixTransform(el.getScreenCTM());const tb=t.getBoundingClientRect();ps.push({id:el.dataset.c,x:ctr.x,y:ctr.y,rs:Math.hypot(rp.x-ctr.x,rp.y-ctr.y),l:tb.left,tp:tb.top,rr:tb.right,b:tb.bottom})});for(const a of ps){for(const b of ps){if(a.id===b.id)continue;const cx=Math.min(Math.max(b.x,a.l),a.rr);const cy=Math.min(Math.max(b.y,a.tp),a.b);if(Math.hypot(b.x-cx,b.y-cy)<b.rs){out.push(a.id+' label covers '+b.id+' hit')}}}return out})())"""
 call('Runtime.enable')
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 payload=open(FIXTURE).read()
 js('localStorage.setItem("almojarife.save.v1",'+json.dumps(payload)+')')
 call('Page.reload',{'ignoreCache':True});time.sleep(3)
 for _ in range(3):
  if js("(document.querySelector('#t-lang')?.textContent||'').trim()")=='EN':break
  js("document.querySelector('#t-lang')?.click()");time.sleep(.3)
 js('document.querySelector("#t-cont").click()');time.sleep(5)
 js('document.querySelector("[data-map]").click()');time.sleep(1)
 n=js('document.querySelectorAll("g.city[data-c]").length')
 assert n==EXPECTED_PORTS,'expected %d ports, got '%EXPECTED_PORTS+str(n)
 # multi-zoom overlap audit
 g=portgeom('ceuta');ax,ay=g['x'],g['y']
 for steps in [0,2,4,6,8,10]:
  if steps: 
   for _ in range(steps if steps==2 else 2): wheel(ax,ay,-120)
  ov=json.loads(js(OVJS))
  z=zoomlevel()
  assert not ov,'collisions at zoom %.2f: %s'%(z,json.dumps(ov))
  print('overlap audit clean at zoom %.2f'%z)
  if steps==10:break
 js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.3)
 # legibility numbers
 ca=portgeom('casablanca');fa=portgeom('faro')
 print('zoom1: casablanca label %.1fx%.1fpx font %s | faro %.1fpx wide font %s'%(ca['w'],ca['h'],ca['fs'],fa['w'],fa['fs']))
 # label clicks zoom1 incl. new placements
 for p in ['mazagan','casablanca','arcila','ceuta','tetuan','setubal','lisboa','huelva','faro']:
  g=portgeom(p);assert g,'missing '+p
  click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2)
  assert targetring(p),'label click %s failed zoom1'%p
 print('zoom1 label clicks 9/9 (incl. mazagan/casablanca/arcila)')
 # Faro/Huelva edges
 fa=portgeom('faro');hu=portgeom('huelva');dist=math.hypot(fa['x']-hu['x'],fa['y']-hu['y'])
 ux=(fa['x']-hu['x'])/dist;uy=(fa['y']-hu['y'])/dist
 click(hu['x']+ux*(hu['rs']-2),hu['y']+uy*(hu['rs']-2));assert targetring('huelva'),'huelva edge failed'
 click(fa['x']-ux*(fa['rs']-2),fa['y']-uy*(fa['rs']-2));assert targetring('faro'),'faro edge failed'
 lx=fa['l']+2 if fa['x']>hu['x'] else fa['rr']-2;ly=(fa['tp']+fa['b'])/2;dh=math.hypot(lx-hu['x'],ly-hu['y'])
 click(lx,ly);assert targetring('faro'),'faro label near-edge failed'
 assert dh>=hu['rs'],'faro label edge inside huelva hit'
 print('faro/huelva edges OK (label edge %.1f vs hitR %.1f)'%(dh,hu['rs']))
 # Tetuan/Melilla real-font edge (real-font edge margin)
 te=portgeom('tetuan');me=portgeom('melilla');assert te and me,'missing tetuan/melilla'
 dtm=math.hypot(te['x']-me['x'],te['y']-me['y'])
 print('tetuan/melilla: center dist %.1f, hitR %.1f/%.1f, labelW %.1f/%.1f'%(dtm,te['rs'],me['rs'],te['w'],me['w']))
 ux=(me['x']-te['x'])/dtm;uy=(me['y']-te['y'])/dtm
 click(me['x']-ux*(me['rs']-2),me['y']-uy*(me['rs']-2));assert targetring('melilla'),'melilla edge toward tetuan failed'
 click(te['x']+ux*(te['rs']-2),te['y']+uy*(te['rs']-2));assert targetring('tetuan'),'tetuan edge toward melilla failed'
 # nearest tetuan label edge point to melilla center must be outside melilla hit
 ex=max(te['l'],min(me['x'],te['rr']));ey=max(te['tp'],min(me['y'],te['b']))
 dee=math.hypot(ex-me['x'],ey-me['y'])
 assert dee>=me['rs'],'tetuan label inside melilla hit: %.1f < %.1f'%(dee,me['rs'])
 print('tetuan label edge-to-melilla margin %.1fpx (hitR %.1f) OK'%(dee-me['rs'],me['rs']))
 # context menu on label
 g=portgeom('casablanca');rclick((g['l']+g['rr'])/2,(g['tp']+g['b'])/2)
 m=js('(()=>{const d=document.getElementById("ctx");return d?d.textContent:""})()')
 assert 'Casablanca' in m,'label menu wrong: '+m[:60]
 js('document.getElementById("ctx")?.remove()')
 print('label right-click menu OK:',m.strip()[:50])
 # home label opens city
 g=portgeom('cadiz');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);time.sleep(1)
 assert js('!!document.getElementById("v3d") && !document.getElementById("v3d").hidden'),'cadiz label click failed'
 js('document.querySelector("[data-map]").click()');time.sleep(.5)
 # zoom 2 Gibraltar: clicks, drag-from-label pan, font growth
 g=portgeom('ceuta')
 for _ in range(4): wheel(g['x'],g['y'],-120)
 time.sleep(.3);z=zoomlevel()
 ca2=portgeom('casablanca');fa2=portgeom('faro')
 print('zoom %.2f: casablanca %.1fpx wide font %s | faro %.1fpx wide font %s'%(z,ca2['w'],ca2['fs'],fa2['w'],fa2['fs']))
 vis=[]
 for p in ['mazagan','casablanca','tetuan','ceuta']:
  g=portgeom(p)
  inside=g and g['l']>4 and g['rr']<js('innerWidth')-4 and g['tp']>4 and g['b']<js('innerHeight')-4
  if inside:
   click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);assert targetring(p),'zoom2 label click %s failed'%p
   vis.append(p)
 print('zoom2 label clicks OK (visible:',vis,')')
 # dedicated zoom anchored at mazagan
 js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.3)
 g=portgeom('mazagan')
 for _ in range(4): wheel(g['x'],g['y'],-120)
 time.sleep(.3)
 ov=json.loads(js(OVJS));assert not ov,'collisions anchored mazagan: '+json.dumps(ov)
 g=portgeom('mazagan');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);assert targetring('mazagan'),'mazagan anchored zoom label click failed'
 g=portgeom('casablanca');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);assert targetring('casablanca'),'casablanca anchored zoom label click failed'
 print('mazagan-anchored zoom %.2f: audit clean, mazagan/casablanca clicks OK'%zoomlevel())
 js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.3)
 g=portgeom('ceuta')
 for _ in range(4): wheel(g['x'],g['y'],-120)
 time.sleep(.3)
 g=portgeom('ceuta');click(g['x'],g['y']);assert targetring('ceuta')
 vb0=js('document.getElementById("map").getAttribute("viewBox")')
 g=portgeom('tetuan');drag((g['l']+g['rr'])/2,(g['tp']+g['b'])/2,-50,-35)
 vb1=js('document.getElementById("map").getAttribute("viewBox")')
 assert vb0!=vb1 and targetring('ceuta') and not targetring('tetuan'),'drag from label failed'
 print('drag from tetuan label pans without selecting OK')
 shot=call('Page.captureScreenshot',{'format':'png'})
 open(os.path.join(SHOTS,'pr324-gibraltar-zoom2.png'),'wb').write(base64.b64decode(shot['data']))
 js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.3)
 shot=call('Page.captureScreenshot',{'format':'png'})
 open(os.path.join(SHOTS,'pr324-map-zoom1.png'),'wb').write(base64.b64decode(shot['data']))
 print('ERRORS:',len(errors))
 for e in errors[:5]:print(' -',e)
 assert not errors
 print('PR324-LABELS',SHA,'ALL PASS (shots in %s)'%SHOTS)
finally:
 for p in (c,s):
  if p:p.terminate();p.wait()
 import shutil;shutil.rmtree(PROFILE,ignore_errors=True)
 if not os.environ.get('MAPTEST_SHOTS'):shutil.rmtree(SHOTS,ignore_errors=True)
