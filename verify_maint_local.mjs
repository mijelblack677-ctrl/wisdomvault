import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

await page.setRequestInterception(true);
page.on('request', req => {
  if (req.url().includes('/api/')) { req.abort(); }
  else { req.continue(); }
});

await page.goto('http://localhost:4321/harness.html', { waitUntil: 'networkidle2', timeout: 30000 });

let found = false;
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector('.maint-screen'))) { found = true; break; }
  await new Promise(r => setTimeout(r, 1000));
}

if (!found) {
  console.log('NOT FOUND. body text:', JSON.stringify(await page.evaluate(() => document.body.innerText.slice(0, 300))));
  await page.screenshot({ path: '/tmp/maint_fail.png' });
} else {
  const info = await page.evaluate(() => {
    const el = s => document.querySelector(s);
    const gs = (e, p) => getComputedStyle(e)[p];
    const pseudoAnim = s => { const cs = getComputedStyle(el(s), '::after'); return `${cs.animationName} ${cs.animationDuration}`; };
    return {
      title: el('.maint-title')?.textContent,
      subtitle: el('.maint-screen p')?.textContent?.slice(0, 90),
      buttons: [...document.querySelectorAll('.maint-screen button')].map(b => b.textContent),
      ringAnim: el('.maint-ring') ? `${gs(el('.maint-ring'), 'animationName')} ${gs(el('.maint-ring'), 'animationDuration')} ${gs(el('.maint-ring'), 'animationIterationCount')}` : null,
      ringDelay2: el('.maint-ring--two') ? gs(el('.maint-ring--two'), 'animationDelay') : null,
      iconAnim: el('.maint-icon') ? gs(el('.maint-icon'), 'animationName') : null,
      titleAnim: el('.maint-title') ? `${gs(el('.maint-title'), 'animationName')} ${gs(el('.maint-title'), 'animationDuration')}` : null,
      dotAnim: el('.maint-dot') ? gs(el('.maint-dot'), 'animationName') : null,
      pillDotAnim: el('.maint-pill-dot') ? gs(el('.maint-pill-dot'), 'animationName') : null,
      scanAnim: el('.maint-scan') ? pseudoAnim('.maint-scan') : null,
      floatCount: document.querySelectorAll('.maint-float').length,
      countdown: el('#maint-countdown')?.textContent,
    };
  });
  console.log('MAINTENANCE SCREEN FOUND ✓');
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: '/tmp/maint_local.png', fullPage: true });

  const c1 = await page.evaluate(() => document.getElementById('maint-countdown')?.textContent);
  await new Promise(r => setTimeout(r, 2100));
  const c2 = await page.evaluate(() => document.getElementById('maint-countdown')?.textContent);
  console.log('countdown tick:', c1, '->', c2);
}
await browser.close();