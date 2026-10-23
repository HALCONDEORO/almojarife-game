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
import subprocess,time,json,urllib.request,websocket
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
 ws.settimeout(10)
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
 def geom():
  return json.loads(js('''JSON.stringify((()=>{const m=document.getElementById("map"),r=m.getBoundingClientRect(),v=m.viewBox.baseVal,s=Math.min(r.width/v.width,r.height/v.height);return {w:r.width,h:r.height,left:r.left,top:r.top,vw:v.width,vh:v.height,ox:(r.width-v.width*s)/2,oy:(r.height-v.height*s)/2}})())'''))
 def portxy(name):
  return json.loads(js('''JSON.stringify((()=>{const el=document.querySelector('g.city[data-c="%s"]');if(!el)return null;const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return [p.x,p.y]})())'''%name))
 def pick_port():
  a=json.loads(js('''JSON.stringify([...document.querySelectorAll("g.city[data-c]")].map(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());const r=document.getElementById("map").getBoundingClientRect();const cx=(Math.max(r.left,0)+Math.min(r.right,innerWidth))/2,cy=(Math.max(r.top,0)+Math.min(r.bottom,innerHeight))/2;return {id:el.dataset.c,vis:p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-8,d:Math.abs(p.x-cx)+Math.abs(p.y-cy)}}).filter(p=>p.vis).sort((a,b)=>a.d-b.d).map(p=>p.id))'''))
  assert a,'no visible ports'
  return a[0]
 def emptypoint():
  return json.loads(js('''JSON.stringify((()=>{const r=document.getElementById("map").getBoundingClientRect();for(const [fx,fy] of [[.5,.55],[.35,.6],[.65,.55],[.5,.5],[.4,.4],[.6,.4]]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(y>innerHeight-10||x>innerWidth-10)continue;const el=document.elementFromPoint(x,y);if(el&&el.closest("#map")&&!el.closest("[data-c],[data-ship]"))return [x,y]}return null})())'''))
 def wheel(x,y,dy): call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':x,'y':y,'deltaX':0,'deltaY':dy});time.sleep(.15)
 def drag(x,y,dx,dy):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','buttons':1,'clickCount':1})
  for k in range(1,6):
   call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x+dx*k/5,'y':y+dy*k/5,'button':'left','buttons':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x+dx,'y':y+dy,'button':'left','buttons':0,'clickCount':1});time.sleep(.2)
 def rclick(x,y):
  call('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'right','buttons':2,'clickCount':1});time.sleep(.05)
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'right','buttons':0,'clickCount':1});time.sleep(.3)
 def follow_test(port):
  p0=portxy(port);assert p0,'no port '+port
  wheel(p0[0],p0[1],-120);wheel(p0[0],p0[1],-120)
  vb=js('document.getElementById("map").getAttribute("viewBox")')
  p1=portxy(port);d1=(abs(p1[0]-p0[0]),abs(p1[1]-p0[1]))
  assert d1[0]<=3 and d1[1]<=3,'zoom-in moved port by '+str(d1)
  assert not vb.startswith('0 0 800 829'),'zoom-in had no effect'
  ep=emptypoint();assert ep,'no empty map point'
  p3=portxy(port);dd=(36,24);drag(ep[0],ep[1],*dd)
  p4=portxy(port)
  if abs(p4[0]-p3[0])<1 and abs(p4[1]-p3[1])<1:
   dd=(-36,-24);drag(ep[0],ep[1],*dd);p4=portxy(port)
  d3=(abs(p4[0]-p3[0]-dd[0]),abs(p4[1]-p3[1]-dd[1]))
  assert d3[0]<=3 and d3[1]<=3,'pan mismatch '+str(d3)+' moved '+str((p4[0]-p3[0],p4[1]-p3[1]))
  wheel(p4[0],p4[1],120);wheel(p4[0],p4[1],120)
  p5=portxy(port);d2=(abs(p5[0]-p0[0]),abs(p5[1]-p0[1]))
  assert d2[0]<=3 and d2[1]<=3,'zoom-out did not restore port, off by '+str(d2)
  js('document.getElementById("map").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');time.sleep(.2)
  return d1,d2,d3
 call('Runtime.enable')
 for _ in range(20):
  try:
   if js('!!document.querySelector("#t-start")'):break
  except Exception:pass
  time.sleep(.5)
 js("if(document.querySelector('#t-lang')?.textContent==='ES')document.querySelector('#t-lang').click();document.querySelector('#t-start').click()");time.sleep(.3)
 js("document.querySelector('#p-home').value='cadiz';document.querySelector('#p-home').dispatchEvent(new Event('change'));document.querySelector('#p-go').click()");time.sleep(4)
 js('document.querySelector("[data-map]").click()');time.sleep(.6)
 g=geom();print('GEOM 1366x768:',json.dumps(g))
 port1=pick_port();print('port 1366:',port1)
 d1,d2,d3=follow_test(port1);print('WIDE-LOW bands: zoom-in drift',d1,'| zoom-out restore',d2,'| pan err',d3)
 for _ in range(6):
  g=geom()
  if max(g['ox'],g['oy'])<2:break
  target_w=round(g['vw']/g['vh']*g['h'])
  cur=json.loads(js('JSON.stringify({w:innerWidth,h:innerHeight})'))
  nw=max(380,cur['w']-round(g['w']-target_w))
  call('Emulation.setDeviceMetricsOverride',{'width':nw,'height':cur['h'],'deviceScaleFactor':1,'mobile':False});time.sleep(.4)
 g=geom();print('GEOM no-bands:',json.dumps(g))
 assert max(g['ox'],g['oy'])<2,'still bands: '+json.dumps(g)
 js('window.scrollTo(0, window.scrollY + document.getElementById("map").getBoundingClientRect().top - 12)');time.sleep(.3)
 print('DIAG dims:',js('JSON.stringify({iw:innerWidth,ih:innerHeight,sy:scrollY})'))
 print('DIAG ports:',js('JSON.stringify([...document.querySelectorAll("g.city[data-c]")].slice(0,6).map(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return [el.dataset.c,Math.round(p.x),Math.round(p.y)]}))'))
 port2=pick_port();print('port no-bands:',port2)
 d1,d2,d3=follow_test(port2);print('NO-BANDS: zoom-in drift',d1,'| zoom-out restore',d2,'| pan err',d3)
 # context menu on docked own ship vs its port (flag OFF, free navigation)
 sp=json.loads(js('''JSON.stringify((()=>{const el=document.querySelector("g[data-ship]");if(!el)return null;const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return [p.x,p.y]})())'''))
 assert sp,'no ship marker'
 rclick(sp[0],sp[1])
 m1=js('(()=>{const d=document.getElementById("ctx");return d?d.textContent.trim():""})()')
 assert m1,'no context menu from docked ship right-click'
 print('ship right-click menu:',m1[:90])
 js('document.getElementById("ctx")?.remove()')
 pp=portxy('cadiz')
 assert pp,'no cadiz port'
 rclick(pp[0],pp[1])
 m2=js('(()=>{const d=document.getElementById("ctx");return d?d.textContent.trim():""})()')
 assert m2,'no context menu from port right-click'
 print('port right-click menu:',m2[:90])
 assert m1==m2,'menus differ: ship vs port'
 ok=js('(()=>{const d=document.getElementById("ctx");const b=d&&d.querySelector("button[data-m=select]:not([disabled])");if(b){b.click();return true}return false})()')
 assert ok,'no enabled select action in menu'
 time.sleep(.3)
 assert js('!document.getElementById("ctx")'),'menu did not close after select'
 print('menu select action closes OK')
 print('ERRORS:',len(errors))
 for e in errors[:5]:print(' -',e)
 assert not errors
 print('MAP321',SHA,': LETTERBOX ZOOM/PAN + NO-BANDS + DOCKED-SHIP CONTEXT MENU ALL PASS')
finally:
 for p in (c,s):
  if p:p.terminate();p.wait()
 import shutil;shutil.rmtree(PROFILE,ignore_errors=True)
 if not os.environ.get('MAPTEST_SHOTS'):shutil.rmtree(SHOTS,ignore_errors=True)
