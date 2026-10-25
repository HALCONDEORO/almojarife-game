# PR404: almoneda building permits in the Buildings tab - the paper is visible, the redemption is
# an explicit choice, and a cash-0 player can still use it (Auditor block on e52d569).
# Scenarios (Spanish UI, city2d):
#  A. cash 0 + 1 permit: cash button disabled, "Usar permiso de obra" enabled; confirm card says
#     0 monedas; after confirming, the plot is owned and the counter is gone; cash stays 0.
#  B. cash 10000 + 1 permit: paying CASH does not spend the paper (counter still 1 afterwards).
import sys,os,tempfile
WT=sys.argv[1] if len(sys.argv)>1 else os.environ.get('MAPTEST_WT','.')
HERE=os.path.dirname(os.path.abspath(__file__))
PROFILE=tempfile.mkdtemp(prefix='maptest-profile-')
SHOTS=os.environ.get('MAPTEST_SHOTS') or tempfile.mkdtemp(prefix='maptest-shots-')
os.makedirs(SHOTS,exist_ok=True)
import socket
def _freeport():
 sk=socket.socket();sk.bind(('127.0.0.1',0));p=sk.getsockname()[1];sk.close();return p
HTTP_PORT=_freeport();CDP_PORT=_freeport()
import subprocess,time,json,urllib.request,websocket
SHA=subprocess.check_output(['git','-C',WT,'rev-parse','--short','HEAD'],text=True).strip()
SAVE_JS="""
import fs from 'node:fs';
import { buildWorld } from '%WT%/src/sim/world.mjs';
import { newGame } from '%WT%/src/game/game.mjs';
import { serialize } from '%WT%/src/game/gamesave.mjs';
const world = buildWorld(JSON.parse(fs.readFileSync('%WT%/data/world.json')));
const cash = Number(process.argv[1]);
const g = newGame(world, 'cadiz', { cash: 0, freePlay: true, townIndustry: true });
g.cash = cash;
g.almonedaPermits = { cadiz: 1 };
process.stdout.write(JSON.stringify(serialize(g, 'Casa Prueba')));
"""
def mint(cash):
 p=subprocess.run(['node','--input-type=module','-e',SAVE_JS.replace('%WT%',WT),str(cash)],capture_output=True,text=True)
 assert p.returncode==0,'save mint failed: '+p.stderr[:400]
 return p.stdout
errors=[]
s=None;c=None
try:
 s=subprocess.Popen(['python3','-m','http.server',str(HTTP_PORT),'--bind','127.0.0.1'],cwd=WT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 c=subprocess.Popen(['google-chrome','--headless','--no-sandbox','--enable-unsafe-swiftshader','--remote-debugging-port='+str(CDP_PORT),'--remote-allow-origins=http://127.0.0.1:%d'%HTTP_PORT,'--user-data-dir='+PROFILE,'--window-size=1366,768','http://127.0.0.1:%d/web/?city2d=1'%HTTP_PORT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 tabs=None
 for _ in range(40):
  try:tabs=json.load(urllib.request.urlopen('http://127.0.0.1:%d/json'%CDP_PORT,timeout=2));break
  except Exception:time.sleep(.25)
 if not tabs:raise SystemExit('chrome CDP did not become ready')
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
 def shot(name):
  d=call('Page.captureScreenshot',{'format':'png'});open(os.path.join(SHOTS,name),'wb').write(__import__('base64').b64decode(d['data']))
 call('Runtime.enable');call('Page.enable')
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 for _ in range(3):
  if js("(document.querySelector('#t-lang')?.textContent||'').trim()")=='EN':break
  js("document.querySelector('#t-lang')?.click()");time.sleep(.3)
 def loadsave(save):
  js('localStorage.setItem("almojarife.save.v1", %s)'%json.dumps(save))
  call('Page.reload',{'ignoreCache':True});time.sleep(3)
  for _ in range(20):
   try:
    if js('!!document.querySelector("#t-cont")'):break
   except Exception:pass
   time.sleep(.5)
  js('document.querySelector("#t-cont").click()');time.sleep(2.5)
 def click(x,y):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'left','buttons':0,'clickCount':1});time.sleep(.4)
 def framectx():
  tr=call('Page.getFrameTree')
  kid=tr['frameTree'].get('childFrames') or []
  fid=next(f['frame']['id'] for f in kid if '/city2d/' in f['frame']['url'] or '/proto3d/' in f['frame']['url'])
  return call('Page.createIsolatedWorld',{'frameId':fid,'worldName':'t','grantUniveralAccess':True})['executionContextId']
 def framejs(expr,ctx):
  r=call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'contextId':ctx})
  if 'exceptionDetails' in r: raise AssertionError('frame JS error: '+json.dumps(r['exceptionDetails'])[:300])
  return r['result'].get('value')
 def open_buildings():
  # the city window opens on continue; switch its nav to the Buildings tab and let the plot plan load
  assert js("!!document.querySelector('[data-city-tab=buildings]')"),'city window nav missing'
  js("""document.querySelector('[data-city-tab="buildings"]').click()""");time.sleep(1.2)
  for _ in range(30):
   if js("document.body.innerText.includes('solares libres') || document.body.innerText.includes('free plots')"):break
   time.sleep(.5)
 def open_plot(plotid):
  # a real plot click in the 2D scene posts {kind:"plot"} to the parent; drive the same protocol
  ctx=framectx()
  framejs("parent.postMessage({kind:'plot',id:'%s'},location.origin)"%plotid,ctx);time.sleep(1.2)
  assert js("document.body.innerText.includes('%s')"%plotid),'plot panel did not open for '+plotid
 def body(): return js('document.body.innerText')
 # ---- scenario A: cash 0 + 1 permit
 loadsave(mint(0));open_buildings()
 txt=body()
 assert 'Permisos de obra de la almoneda: 1' in txt,'A: permit counter missing in Buildings tab'
 shot('pr404-a-counter.png')
 open_plot('cadiz:7')
 assert js('!!document.querySelector("[data-bldact^=\'buy|\']:disabled")'),'A: cash button must be disabled at cash 0'
 pb=js("""(()=>{const b=document.querySelector('[data-bldact^="buypermit|"]');return b?{disabled:b.disabled,label:b.textContent,act:b.dataset.bldact}:null})()""")
 assert pb and not pb['disabled'],'A: permit button missing or disabled'
 shot('pr404-a-buttons.png')
 js("""document.querySelector('[data-bldact^="buypermit|"]').click()""");time.sleep(1)
 card=body()
 assert '0 monedas' in card,'A: confirm card must price the redemption at 0 monedas'
 assert js('!!document.querySelector("[data-bldconf]:not([disabled])")'),'A: confirm disabled with a permit in hand'
 shot('pr404-a-confirm.png')
 js('document.querySelector("[data-bldconf]").click()');time.sleep(1.5)
 txt=body()
 assert 'Permisos de obra de la almoneda' not in txt,'A: counter must be gone after the only permit is spent'
 assert js("(()=>{const s=JSON.parse(localStorage.getItem('almojarife.save.v1'));const b=s&&s.state&&s.state.buildings&&s.state.buildings.cadiz;return !!(b&&b['cadiz:7'])})()"),'A: plot cadiz:7 not owned in the save after redemption'
 shot('pr404-a-after.png')
 print('PASS A cash0: counter visible, permit button enabled, confirm at 0 monedas, plot owned, counter spent')
 # ---- scenario B: cash 10000 + 1 permit: the cash path never spends the paper
 loadsave(mint(10000));open_buildings()
 open_plot('cadiz:8')
 assert js('!!document.querySelector("[data-bldact^=\'buypermit|\']")'),'B: permit button must be offered next to the cash one'
 js("""document.querySelector('[data-bldact^="buy|"]').click()""");time.sleep(1)
 js('document.querySelector("[data-bldconf]:not([disabled])").click()');time.sleep(1.5)
 js("""document.querySelector('[data-city-tab="buildings"]').click()""");time.sleep(1)
 txt=body()
 assert 'Permisos de obra de la almoneda: 1' in txt,'B: a cash purchase must NOT spend the permit (silent consumption)'
 shot('pr404-b-cashpath.png')
 print('PASS B cash path: permit untouched (explicit choice only)')
 print('ALL PASS',SHA)
finally:
 for p in (c,s):
  try:p.terminate()
  except Exception:pass
 if errors:print('PAGE ERRORS:',*errors[:3],sep='\n')
