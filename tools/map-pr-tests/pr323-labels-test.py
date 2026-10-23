import sys,os,tempfile
WT=sys.argv[1] if len(sys.argv)>1 else os.environ.get('MAPTEST_WT','.')
HERE=os.path.dirname(os.path.abspath(__file__))
FIXTURE=os.environ.get('MAPTEST_SAVE',os.path.join(HERE,'fixtures','all-discovered-save.json'))
PROFILE=tempfile.mkdtemp(prefix='maptest-profile-')
import subprocess,time,json,urllib.request,websocket,base64,math
s=subprocess.Popen(['python3','-m','http.server','8889','--bind','127.0.0.1'],cwd=WT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
c=subprocess.Popen(['google-chrome','--headless','--no-sandbox','--enable-unsafe-swiftshader','--remote-debugging-port=9342','--remote-allow-origins=*','--user-data-dir='+PROFILE,'--window-size=1366,768','http://127.0.0.1:8889/web/?city2d=1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
errors=[]
try:
 time.sleep(2);tabs=json.load(urllib.request.urlopen('http://127.0.0.1:9342/json'));ws=websocket.create_connection(next(t['webSocketDebuggerUrl']for t in tabs if t['type']=='page'));i=0
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
 def wheel(x,y,dy): call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':x,'y':y,'deltaX':0,'deltaY':dy});time.sleep(.15)
 def drag(x,y,dx,dy):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1})
  for k in range(1,6):
   call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x+dx*k/5,'y':y+dy*k/5,'button':'left','buttons':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x+dx,'y':y+dy,'button':'left','buttons':0,'clickCount':1});time.sleep(.2)
 def portgeom(p):
  return json.loads(js("""JSON.stringify((()=>{const el=document.querySelector('g.city[data-c=\\"%s\\"]');if(!el)return null;const c=el.querySelector('circle');const t=el.querySelector('text');const ctr=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=+c.getAttribute('r');const rp=new DOMPoint(r,0).matrixTransform(el.getScreenCTM());const tb=t.getBoundingClientRect();return {x:ctr.x,y:ctr.y,rs:Math.hypot(rp.x-ctr.x,rp.y-ctr.y),l:tb.left,tp:tb.top,rr:tb.right,b:tb.bottom,w:tb.width}})())"""%p))
 def targetring(p):
  return js('!!document.querySelector(\'g.city[data-c="%s"] circle[stroke="#c0392b"]\')'%p)
 OVJS="""JSON.stringify((()=>{const out=[];const ps=[];document.querySelectorAll('g.city[data-c]').forEach(el=>{const c=el.querySelector('circle');const t=el.querySelector('text');const ctr=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=+c.getAttribute('r');const rp=new DOMPoint(r,0).matrixTransform(el.getScreenCTM());const tb=t.getBoundingClientRect();ps.push({id:el.dataset.c,x:ctr.x,y:ctr.y,rs:Math.hypot(rp.x-ctr.x,rp.y-ctr.y),l:tb.left,tp:tb.top,rr:tb.right,b:tb.bottom})});for(const a of ps){for(const b of ps){if(a.id===b.id)continue;const cx=Math.min(Math.max(b.x,a.l),a.rr);const cy=Math.min(Math.max(b.y,a.tp),a.b);if(Math.hypot(b.x-cx,b.y-cy)<b.rs){out.push(a.id+' label covers '+b.id+' hit')}}}return out})())"""
 call('Runtime.enable')
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 payload=open(FIXTURE).read()
 js('localStorage.setItem("almojarife.save.v1",'+json.dumps(payload)+')')
 call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True});call('Page.reload',{'ignoreCache':True});time.sleep(3)
 js("if(document.querySelector('#t-lang')?.textContent==='ES')document.querySelector('#t-lang').click()");time.sleep(.2)
 js('document.querySelector("#t-cont").click()');time.sleep(5)
 js('document.querySelector("[data-map]").click()');time.sleep(1)
 n=js('document.querySelectorAll("g.city[data-c]").length')
 assert n==33,'expected 33 ports, got '+str(n)
 ov=json.loads(js(OVJS));assert not ov,'zoom1 collisions: '+json.dumps(ov)
 print('zoom1 overlap audit (real rendered text): clean, 33 ports')
 fa=portgeom('faro');hu=portgeom('huelva')
 dist=math.hypot(fa['x']-hu['x'],fa['y']-hu['y'])
 print('faro hitR %.1f labelW %.1f | huelva hitR %.1f labelW %.1f | center dist %.1f'%(fa['rs'],fa['w'],hu['rs'],hu['w'],dist))
 for p in ['ceuta','tetuan','setubal','lisboa','huelva','tarragona','arcila','oran','faro']:
  g=portgeom(p);assert g,'missing port '+p
  click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2)
  assert targetring(p),'label click on %s did not target it'%p
 print('zoom1 label clicks: 9/9 target correct port')
 for p in ['ceuta','lisboa']:
  g=portgeom(p);click(g['x'],g['y']);assert targetring(p),'dot click %s failed'%p
 print('zoom1 dot clicks OK')
 ux=(fa['x']-hu['x'])/dist;uy=(fa['y']-hu['y'])/dist
 click(hu['x']+ux*(hu['rs']-2),hu['y']+uy*(hu['rs']-2));assert targetring('huelva'),'huelva edge toward faro failed'
 click(fa['x']-ux*(fa['rs']-2),fa['y']-uy*(fa['rs']-2));assert targetring('faro'),'faro edge toward huelva failed'
 lx=fa['l']+2 if fa['x']>hu['x'] else fa['rr']-2;ly=(fa['tp']+fa['b'])/2
 dh=math.hypot(lx-hu['x'],ly-hu['y'])
 click(lx,ly);assert targetring('faro'),'faro label near-edge click failed'
 assert dh>=hu['rs'],'faro label near-edge inside huelva hit: %.1f < %.1f'%(dh,hu['rs'])
 print('faro/huelva edges OK (faro label edge %.1fpx from huelva center vs hitR %.1f)'%(dh,hu['rs']))
 g=portgeom('tetuan');rclick((g['l']+g['rr'])/2,(g['tp']+g['b'])/2)
 m=js('(()=>{const d=document.getElementById("ctx");return d?d.textContent:""})()')
 assert 'Tetu' in m,'label right-click menu wrong: '+m[:60]
 js('document.getElementById("ctx")?.remove()')
 print('label right-click menu OK:',m.strip()[:50])
 g=portgeom('cadiz');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);time.sleep(1)
 assert js('!!document.getElementById("v3d") && !document.getElementById("v3d").hidden'),'cadiz label click did not open city'
 js('document.querySelector("[data-map]").click()');time.sleep(.5)
 print('home label click opens city OK')
 # zoomed Gibraltar cluster + drag-from-label pan
 g=portgeom('ceuta');wheel(g['x'],g['y'],-120);wheel(g['x'],g['y'],-120);time.sleep(.3)
 ov=json.loads(js(OVJS));assert not ov,'zoomed collisions: '+json.dumps(ov)
 g=portgeom('ceuta');click(g['x'],g['y']);assert targetring('ceuta'),'setup: target ceuta failed'
 vb0=js('document.getElementById("map").getAttribute("viewBox")')
 g=portgeom('tetuan');lx=(g['l']+g['rr'])/2;ly=(g['tp']+g['b'])/2
 drag(lx,ly,-50,-35)
 vb1=js('document.getElementById("map").getAttribute("viewBox")')
 assert vb0!=vb1,'drag from label did not pan'
 assert targetring('ceuta') and not targetring('tetuan'),'drag from tetuan label caused accidental selection'
 print('zoomed: audit clean; drag from tetuan label panned (vb moved) without selecting')
 g=portgeom('tetuan');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);assert targetring('tetuan'),'zoomed tetuan label click failed'
 g=portgeom('ceuta');click((g['l']+g['rr'])/2,(g['tp']+g['b'])/2);assert targetring('ceuta'),'zoomed ceuta label click failed'
 print('zoomed cluster label clicks correct')
 shot=call('Page.captureScreenshot',{'format':'png'})
 open('/downloads/main323-gibraltar-zoom.png','wb').write(base64.b64decode(shot['data']))
 js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.3)
 shot=call('Page.captureScreenshot',{'format':'png'})
 open('/downloads/main323-map-zoom1.png','wb').write(base64.b64decode(shot['data']))
 print('ERRORS:',len(errors))
 for e in errors[:5]:print(' -',e)
 assert not errors
 print('MAIN323 2d95bffd LABELS ALL PASS')
finally:c.terminate();c.wait();s.terminate();s.wait()
