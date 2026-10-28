// Optional browser regression: BASE_URL=http://localhost:8080 node test/browser/justice-startup.mjs
// Requires Playwright installed by the caller; no state injection.
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try{
 for(const [file,mode] of [['courts','abort'],['courts','json'],['courts','503'],['courts','slow'],['realms','slow'],['leagues','slow'],['peaces','slow']]){
  const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('lang','es'));
  await page.route(`**/data/${file}.json`,r=>mode==='slow'?new Promise(()=>{}):mode==='abort'?r.abort():r.fulfill({status:mode==='503'?503:200,contentType:'application/json',body:'broken'}));
  await page.goto(process.env.BASE_URL||'http://localhost:8080/web/');
  await page.locator('#t-start').waitFor({timeout:10000});
  if(['courts','realms'].includes(file))await page.locator('#justice-startup-warning').waitFor();
  if(['courts','realms'].includes(file)&&!await page.locator('#justice-startup-warning button').isVisible())throw Error('retry missing');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(file+' '+mode+': startup PASS');await page.close();
 }
}finally{await browser.close();}
