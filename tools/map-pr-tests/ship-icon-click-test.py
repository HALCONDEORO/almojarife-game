import sys,os,tempfile,time,json,subprocess,urllib.request,socket
WT=sys.argv[1];PREFIX=os.environ.get('PFX','shipfix');SHOTS='/downloads'
def _freeport():
 sk=socket.socket();sk.bind(('127.0.0.1',0));p=sk.getsockname()[1];sk.close();return p
HTTP_PORT=_freeport();CDP_PORT=_freeport()
import websocket
PROFILE=tempfile.mkdtemp(prefix='shipfix-')
errors=[];results=[]
s=subprocess.Popen(['python3','-m','http.server',str(HTTP_PORT),'--bind','127.0.0.1'],cwd=WT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
c=subprocess.Popen(['google-chrome','--headless','--no-sandbox','--enable-unsafe-swiftshader','--remote-debugging-port='+str(CDP_PORT),'--remote-allow-origins=http://127.0.0.1:%d'%HTTP_PORT,'--user-data-dir='+PROFILE,'--window-size=1366,768','http://127.0.0.1:%d/web/?city2d=1'%HTTP_PORT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def rec(name,ok,detail=''):
 results.append((name,ok,detail));print(('PASS ' if ok else 'FAIL ')+name+(' — '+detail if detail else ''))
try:
 tabs=None
 for _ in range(40):
  try:tabs=json.load(urllib.request.urlopen('http://127.0.0.1:%d/json'%CDP_PORT,timeout=2));break
  except Exception:time.sleep(.25)
 ws=websocket.create_connection(next(t['webSocketDebuggerUrl']for t in tabs if t['type']=='page'),origin='http://127.0.0.1:%d'%HTTP_PORT);i=0
 ws.settimeout(15)
 def call(m,p={}):
  global i;i+=1;ws.send(json.dumps({'id':i,'method':m,'params':p}))
  while True:
   r=json.loads(ws.recv())
   if r.get('id')==i:return r.get('result',{})
   if r.get('method')=='Runtime.exceptionThrown':errors.append(json.dumps(r['params'].get('exceptionDetails',{}))[:300])
 def js(s):
  r=call('Runtime.evaluate',{'expression':s,'returnByValue':True})
  if 'exceptionDetails' in r: raise AssertionError('JS error: '+json.dumps(r['exceptionDetails'])[:300])
  return r['result'].get('value')
 def press_release(x,y,delay=.07):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1});time.sleep(delay)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'left','buttons':0,'clickCount':1});time.sleep(.4)
 def rclick(x,y):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'right','buttons':2,'clickCount':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'right','buttons':0,'clickCount':1});time.sleep(.3)
 def key(k):
  call('Input.dispatchKeyEvent',{'type':'rawKeyDown','key':k});call('Input.dispatchKeyEvent',{'type':'keyUp','key':k});time.sleep(.4)
 def shot(name):
  from base64 import b64decode
  open(os.path.join(SHOTS,PREFIX+'-'+name),'wb').write(b64decode(call('Page.captureScreenshot',{'format':'png'})['data']))
 def shippt():
  return json.loads(js("""JSON.stringify((()=>{const el=document.querySelector('[data-ship]');if(!el)return null;const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}})())"""))
 def citypt(p):
  return json.loads(js("""JSON.stringify((()=>{const el=document.querySelector('g.city[data-c=\\"%s\\"]');const c=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return {x:c.x,y:c.y}})())"""%p))
 def ispaused():
  txt=(js("document.querySelector('#play')?.textContent||''") or '')
  return ('esume' in txt) or ('eanudar' in txt)  # Resume / Reanudar shown when paused
 def state(tag): print('  STATE[%s] v3d=%s title_hidden=%s shipwin=%s ctx=%s hint=%r'%(tag,js('!!document.querySelector("#v3d")'),js('document.querySelector("#title")?.hidden'),js('!!document.querySelector("#shipwin")'),js('!!document.querySelector("#ctx")'),(js('document.querySelector("#hint")?.textContent||""') or '')[:50]))
 call('Runtime.enable')
 js("")
 js("")
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 for _ in range(3):
  if js("(document.querySelector('#t-lang')?.textContent||'').trim()")=='EN':break
  js("document.querySelector('#t-lang')?.click()");time.sleep(.3)
 js("window.__cl=[];window.addEventListener('click',e=>{window.__cl.push([Math.round(e.clientX),Math.round(e.clientY),(e.target.tagName||'')+':'+(e.target.dataset&&e.target.dataset.ship!==undefined?'SHIP':(e.target.id||'?'))]);},true);window.addEventListener('contextmenu',e=>{window.__cl.push(['ctx',Math.round(e.clientX),Math.round(e.clientY)]);},true);")
 js('document.querySelector("#t-start").click()');time.sleep(.6)
 for _ in range(20):
  if js('!!document.querySelector("#p-home")'): break
  time.sleep(.3)
 js('''(()=>{const h=document.querySelector('#p-home');h.value='sevilla';h.dispatchEvent(new Event('change',{bubbles:true}));})()''')
 js('document.querySelector("#p-go").click()');time.sleep(4)
 state('after-newgame')
 js('document.querySelector("[data-map]")?.click()');time.sleep(1.5)
 state('after-map')
 # --- A: docked + PAUSED ---
 if not ispaused(): js("document.querySelector('#play').click()");time.sleep(.4)
 g=shippt();print('  A shippt:',g)
 js('window.__cl.length=0')
 press_release(g['x'],g['y'])
 print('  A clicklog:',js('JSON.stringify(window.__cl)'),'paused?',ispaused(),'#play text:',js("document.querySelector('#play')?.textContent"))
 state('A-after-click')
 rec('A docked+paused click ship icon opens city', js('!!document.querySelector("#v3d")'))
 shot('A-docked-paused.png')
 js('document.querySelector("[data-map]")?.click()');time.sleep(1.0)
 # --- B: docked + RUNNING ---
 if ispaused(): js("document.querySelector('#play').click()");time.sleep(1.2)
 g=shippt();press_release(g['x'],g['y'])
 rec('B docked+running click ship icon opens city', js('!!document.querySelector("#v3d")'))
 shot('B-docked-running.png')
 js('document.querySelector("[data-map]")?.click()');time.sleep(1.0)
 # --- sail to cadiz via target+Enter (ship docks at sevilla via the form above; clicking the port you are docked at opens its city instead) ---
 js('document.querySelector("[data-map]")?.click()');time.sleep(.8)
 if not ispaused(): js("document.querySelector('#play').click()");time.sleep(.4)  # port markers are rebuilt each tick while the clock runs (pre-existing): a player pauses to aim
 dz=citypt('cadiz');print('  cadiz pt:',dz);js('window.__cl.length=0');press_release(dz['x'],dz['y']);time.sleep(.3)
 print('  after cadiz click: clicklog=',js('JSON.stringify(window.__cl)'),'route-line=',js('!!document.querySelector("#map polyline")'),'v3d=',js('!!document.querySelector("#v3d")'))
 key('Enter');time.sleep(1.0)
 print('  after Enter: voyage-card=',(js('document.querySelector("#voyage-card")?.textContent||""') or '')[:80],'hint=',(js('document.querySelector("#hint")?.textContent||""') or '')[:60])
 rec('sail via target+Enter starts voyage', '\u2192' in (js('document.querySelector("#voyage-card")?.textContent||""')) or 'mar' in (js('document.querySelector("#voyage-card")?.textContent||""').lower()) or 'sea' in (js('document.querySelector("#voyage-card")?.textContent||""').lower()))
 # --- C: at-sea + RUNNING ---
 if ispaused(): js("document.querySelector('#play').click()");time.sleep(.6)
 time.sleep(1.0)
 g=shippt();press_release(g['x'],g['y'])
 rec('C at-sea+running click ship icon opens ship card', js('!!document.querySelector("#shipwin")'))
 shot('C-atsea-running.png')
 js('document.querySelector("[data-swclose]")?.click()');time.sleep(.4)
 # --- D: at-sea + PAUSED ---
 if not ispaused(): js("document.querySelector('#play').click()");time.sleep(.4)
 g=shippt();press_release(g['x'],g['y'])
 rec('D at-sea+paused click ship icon opens ship card', js('!!document.querySelector("#shipwin")'))
 shot('D-atsea-paused.png')
 js('document.querySelector("[data-swclose]")?.click()');time.sleep(.3)
 # --- preservation: port target + ctx menu + empty sea (flag OFF) ---
 sv=citypt('sevilla');press_release(sv['x'],sv['y']);time.sleep(.3)
 rec('preserve port click draws route', js('!!document.querySelector("#map path, #map polyline")'))
 js('window.__cl.length=0')
 rclick(sv['x'],sv['y'])
 print('  ctx-sevilla: log=',js('JSON.stringify(window.__cl)'),'ctxhtml=',js('(document.querySelector("#ctx")||{innerHTML:"ABSENT"}).innerHTML.slice(0,150)'))
 rec('preserve right-click port opens classic menu', js('!!document.querySelector("#ctx [data-m=\\"sail\\"]")'))
 shot('preserve-ctx.png')
 js('document.body.click()');time.sleep(.3)
 cz=citypt('cadiz')  # ship is at sea now: cadiz port has no docked ship
 rclick(cz['x'],cz['y'])
 rec('preserve right-click other port opens menu', js('!!document.querySelector("#ctx")'))
 rec('no JS exceptions', len(errors)==0, '; '.join(errors)[:200] if errors else '')
 print('SUMMARY %s: %d/%d PASS'%(WT,sum(1 for _,ok,_ in results if ok),len(results)))
finally:
 try:
  c.terminate();s.terminate()
 except Exception:pass
