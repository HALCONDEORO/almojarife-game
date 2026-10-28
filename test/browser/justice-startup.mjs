// Optional browser regression: BASE_URL=http://localhost:8080 node test/browser/justice-startup.mjs
// Requires Playwright installed by the caller; no state injection.
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try{
 for(const mode of ['abort','json','503','slow']){
  const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('lang','es'));
  await page.route('**/data/courts.json',r=>mode==='slow'?new Promise(()=>{}):mode==='abort'?r.abort():r.fulfill({status:mode==='503'?503:200,contentType:'application/json',body:'broken'}));
  await page.goto(process.env.BASE_URL||'http://localhost:8080/web/');
  await page.locator('#t-start').waitFor({timeout:10000});
  await page.locator('#justice-startup-warning').waitFor();
  if(!await page.locator('#justice-startup-warning button').isVisible())throw Error('retry missing');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(mode+': title, warning and retry PASS');await page.close();
 }
}finally{await browser.close();}
