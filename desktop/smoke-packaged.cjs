// Launch the packaged app on its native CI runner. This is not an installer test.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
(async () => {
  const dist = path.join(__dirname, 'dist');
  const walk = p => fs.readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(p,e.name)) : [path.join(p,e.name)]);
  const files = walk(dist);
  const exe = process.platform === 'win32' ? files.find(p => p.includes('win-unpacked') && p.endsWith('El Almojarife.exe'))
    : process.platform === 'darwin' ? files.find(p => p.includes('.app/Contents/MacOS/') && path.basename(p) === 'El Almojarife')
    : files.find(p => path.basename(path.dirname(p)) === 'linux-unpacked' && /almojarife/i.test(path.basename(p)) && !path.extname(p));
  assert.ok(exe, 'packaged executable exists');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'almojarife-smoke-'));
  const args = ['--remote-debugging-port=9223', '--remote-debugging-address=127.0.0.1', '--user-data-dir='+profile, '--disable-gpu'];
  const child = process.platform === 'linux' ? spawn('xvfb-run',['-a',exe,...args],{stdio:'inherit'}) : spawn(exe,args,{stdio:'inherit'});
  let socket;
  try {
    let target;
    for (let i=0;i<90;i++) {
      try { const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json(); target = targets.find(t => t.type==='page' && t.url.includes('127.0.0.1:8737')); if(target) break; } catch {}
      await new Promise(r=>setTimeout(r,1000));
    }
    assert.ok(target, 'packaged app serves its game window');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
    let seq=0; const pending=new Map();
    socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const {r,j}=pending.get(m.id);pending.delete(m.id);m.error?j(Error(JSON.stringify(m.error))):r(m.result)}};
    const call=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,{r,j});socket.send(JSON.stringify({id,method,params}));});
    let result;
    for(let i=0;i<90;i++) {
      const x=await call('Runtime.evaluate',{expression:'JSON.stringify({title:document.title,start:!!document.querySelector("#t-start"),text:document.body.innerText.slice(0,300)})',returnByValue:true});
      result=JSON.parse(x.result.value); if(result.start)break; await new Promise(r=>setTimeout(r,1000));
    }
    assert.ok(result.start,'real packaged title menu loaded');
    const shot=await call('Page.captureScreenshot',{format:'png'});
    fs.mkdirSync(path.join(dist,'smoke'),{recursive:true});
    fs.writeFileSync(path.join(dist,'smoke',process.platform+'.png'),Buffer.from(shot.data,'base64'));
    fs.writeFileSync(path.join(dist,'smoke',process.platform+'.json'),JSON.stringify({platform:process.platform,executable:exe,scope:'Packaged app launch and title menu only; installation and OS trust prompts not tested',...result},null,2));
    console.log('PACKAGED MENU PASS',process.platform);
  } finally {
    if(socket)socket.close();child.kill();fs.rmSync(profile,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exit(1)});
