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
 call('Runtime.enable')
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 for _ in range(3): # deterministic Spanish: the #t-lang button shows the OTHER language
  if js("(document.querySelector('#t-lang')?.textContent||'').trim()")=='EN':break
  js("document.querySelector('#t-lang')?.click()");time.sleep(.3)
 def card(): return js('document.querySelector("#voyage-card")?.textContent||""')
 def ctxopen(): return js('!!document.querySelector("#ctx [data-m=\\"sail\\"]")')
 def portgeom(p):
  return json.loads(js("""JSON.stringify((()=>{const el=document.querySelector('g.city[data-c=\\"%s\\"]');if(!el)return null;const ctr=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=+el.querySelector('circle').getAttribute('r');const rp=new DOMPoint(r,0).matrixTransform(el.getScreenCTM());return {x:ctr.x,y:ctr.y,rs:Math.hypot(rp.x-ctr.x,rp.y-ctr.y)}})())"""%p))
 def homeport():
  # the only discovered port whose marker uses the home fill colour
  return js("""(()=>{const el=[...document.querySelectorAll('g.city[data-c]')].find(e=>e.querySelectorAll('circle')[1]?.getAttribute('fill')==='#2a7');return el?el.dataset.c:null})()""")
 # an empty sea point NEAR the home marker: real map content, not an overlay/port/ship (d5151628 criterion)
 def emptypoint(hp):
  return json.loads(js("""JSON.stringify((()=>{const g=%s;for(const [dx,dy] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.3,1.3],[-1.3,1.3],[1.3,-1.3],[-1.3,-1.3],[2.2,0],[0,2.2]]){const x=g.x+g.rs*dx+12*Math.sign(dx),y=g.y+g.rs*dy+12*Math.sign(dy);if(y>innerHeight-10||x>innerWidth-10||x<0||y<0)continue;const el=document.elementFromPoint(x,y);if(el&&el.closest('#map')&&!el.closest('[data-c],[data-ship]'))return [x,y]}return null})())"""%json.dumps(hp)))
 def hinttxt(): return js('document.querySelector("#hint")?.textContent||""')
 def navhint():
  h=hinttxt();return 'mar navegable' in h or 'navigable sea' in h
 # a point outside the navigable network (far from every lane): real map content, not an overlay/port/ship
 def farpoint(cands):
  return json.loads(js("""JSON.stringify((()=>{const r=document.getElementById('map').getBoundingClientRect();for(const [fx,fy] of %s){const x=r.left+r.width*fx,y=r.top+r.height*fy;const el=document.elementFromPoint(x,y);if(el&&el.closest('#map')&&!el.closest('[data-c],[data-ship]'))return [x,y]}return null})())"""%json.dumps(cands)))
 def newgame(checkfn):
  js('document.querySelector("#t-start").click()');time.sleep(.6)
  assert js('!!document.querySelector("#p-freenav")'),'setup form lacks #p-freenav'
  before=js('document.querySelector("#p-freenav").checked')
  assert before==False,'freeNav checkbox must default to OFF, got %s'%before
  if checkfn: js('document.querySelector("#p-freenav").click()')
  js('document.querySelector(".sw")?.click()');time.sleep(.4) # crest swatch redraws the form
  kept=js('document.querySelector("#p-freenav") && document.querySelector("#p-freenav").checked')
  js('document.querySelector("#p-go").click()');time.sleep(3.5)
  js('document.querySelector("[data-map]")?.click()');time.sleep(1.2)
  return kept
 def quittotitle():
  js('document.querySelector("#new")?.click()');time.sleep(.4)
  js('document.querySelector("#m-quit")?.click()');time.sleep(1.2)
 def continuetomap():
  js('document.querySelector("#t-cont").click()');time.sleep(4)
  js('document.querySelector("[data-map]")?.click()');time.sleep(1.2)

 # 1) OFF by default: form redraw keeps it OFF, right click on a port opens the CLASSIC menu, empty sea does nothing
 kept=newgame(False)
 assert kept==False,'OFF game: checkbox must stay unchecked across form redraws, got %s'%kept
 print('PASS OFF default: checkbox starts unchecked and survives a form redraw')
 hp=homeport();assert hp,'no home port marker found'
 g=portgeom(hp);assert g,'no geom for home '+hp
 others=json.loads(js("JSON.stringify([...document.querySelectorAll('g.city[data-c]')].map(e=>e.dataset.c).filter(c=>c!=='%s'))"%hp))
 assert others,'no other discovered ports in a fresh game'
 op=portgeom(others[0]);assert op
 rclick(op['x'],op['y'])
 assert ctxopen(),'OFF: right click on %s must open the classic menu'%others[0]
 print('PASS OFF: right click on port %s opens the classic menu (Zarpar/Elegir)'%others[0])
 ep=emptypoint(g);assert ep,'no empty map point found near home'
 click(ep[0],ep[1]);time.sleep(.2) # left click away closes the menu without ordering
 c0=card()
 rclick(ep[0],ep[1])
 assert not ctxopen(),'OFF: right click on empty sea must not open a menu'
 assert card()==c0,'OFF: right click on empty sea must not start a voyage (card changed: %r -> %r)'%(c0,card())
 print('PASS OFF: right click on empty sea opens no menu and starts no voyage')
 # OFF: a click outside the navigable network stays inert with the flag off: no menu, no freeNav hint, no voyage
 far=farpoint([[.03,.55],[.03,.35],[.06,.6],[.03,.75],[.06,.3]]);assert far,'no far Atlantic point found (OFF)'
 c0=card()
 rclick(far[0],far[1])
 assert not ctxopen(),'OFF: right click far from every lane must not open a menu'
 assert not navhint(),'OFF: the freeNav refusal hint must not appear with the flag off, #hint=%r'%hinttxt()
 assert card()==c0,'OFF: right click far from every lane must not start a voyage (card changed: %r -> %r)'%(c0,card())
 print('PASS OFF: right click on far open Atlantic is inert (no menu, no hint, no voyage)')
 # 2) OFF persistence across save/quit/continue
 quittotitle();continuetomap()
 op=portgeom(others[0]);assert op
 rclick(op['x'],op['y'])
 assert ctxopen(),'OFF after continue: classic menu must still open'
 click(ep[0],ep[1]) # close menu
 print('PASS OFF persistence: classic menu still opens after quit+continue')
 # 3) ON via the real form: checkbox survives a redraw, right click orders directly (no menu), empty sea orders open water
 quittotitle()
 kept=newgame(True)
 assert kept==True,'ON game: checkbox must survive the form redraw (43f49e2), got %s'%kept
 print('PASS ON activation: checkbox checked via the form survives a form redraw')
 # ON, ship still docked: clicks outside the navigable network (beyond the 90 km lane corridor: far Atlantic, inland) are refused with the navNoSea hint and no voyage starts. Checked in port because render() rewrites #hint to hintSea on every tick while under way.
 far=farpoint([[.03,.55],[.03,.35],[.06,.6],[.03,.75],[.06,.3]]);assert far,'no far Atlantic point found (ON)'
 c0=card()
 rclick(far[0],far[1])
 assert not ctxopen(),'ON: right click on far open sea must not open a menu'
 assert navhint(),'ON: far open sea must be refused with the navNoSea hint, #hint=%r'%hinttxt()
 assert card()==c0,'ON: a refused click must not start a voyage (card changed: %r -> %r)'%(c0,card())
 print('PASS ON: right click on far Atlantic is refused with the hint, no voyage')
 time.sleep(2.7) # the refusal hint auto-clears after 2.5 s; prove causality for the next click
 assert not navhint(),'the refusal hint must auto-clear, #hint=%r'%hinttxt()
 land=farpoint([[.42,.35],[.5,.3],[.45,.42]]);assert land,'no inland point found (ON)'
 rclick(land[0],land[1])
 assert navhint(),'ON: an inland click must be refused with the navNoSea hint, #hint=%r'%hinttxt()
 assert card()==c0,'ON: a refused inland click must not start a voyage (card changed: %r -> %r)'%(c0,card())
 print('PASS ON: right click on inland Spain is refused with the hint, no voyage')
 op=portgeom(others[0]);assert op
 rclick(op['x'],op['y'])
 assert not ctxopen(),'ON: right click on a port must NOT open the classic menu'
 assert '→' in card() and others[0] not in card().lower() or '→' in card(),'ON: voyage card must show a direct order, got %r'%card()
 assert '→' in card(),'ON: voyage card must show a route after the direct order, got %r'%card()
 print('PASS ON: right click on port %s orders directly, no menu, card: %s'%(others[0],card().splitlines()[0][:80]))
 g=portgeom(hp);ep=emptypoint(g);assert ep,'no empty map point found near home (ON)'
 rclick(ep[0],ep[1])
 assert not ctxopen(),'ON: right click on open sea must not open a menu'
 assert ('mar abierto' in card() or 'open sea' in card()),'ON: right click on open sea must order open water, card: %r'%card()
 print('PASS ON: right click on open sea orders open water, card: %s'%card().splitlines()[0][:80])
 # 4) ON persistence across save/quit/continue
 quittotitle();continuetomap()
 op=portgeom(others[0]);assert op
 rclick(op['x'],op['y'])
 assert not ctxopen(),'ON after continue: classic menu must NOT open'
 assert '→' in card(),'ON after continue: card must show the direct order, got %r'%card()
 print('PASS ON persistence: direct order still works after quit+continue, no menu')
 assert not errors,'page JS exceptions: '+json.dumps(errors)[:800]
 print('PASS no JS exceptions during the whole flow')
 print('ALL PASS pr327-freenav (%s)'%SHA)
except SystemExit:raise
except Exception as e:
 try:
  from base64 import b64decode
  shot=os.path.join(SHOTS,'pr327-fail.png')
  open(shot,'wb').write(b64decode(call('Page.captureScreenshot',{'format':'png'})['data']))
  print('screenshot kept at '+shot)
 except Exception:pass
 print('FAIL: %s'%e);raise SystemExit(1)
finally:
 try:
  if c:c.terminate()
  if s:s.terminate()
 except Exception:pass
