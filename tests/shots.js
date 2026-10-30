/* Mockup screenshots: iPhone 15 (WebKit) for every step with the four samples, plus a Pixel 7 (Chromium) pass. Also renders exported PDF pages. Collects console errors. */
const { webkit, chromium, devices } = require('/workspace/tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const BASE = 'http://127.0.0.1:8777/glass-app/index.html', SH = path.join(__dirname, '..', 'shots'), DL = '/tmp/gps-dl';
fs.mkdirSync(SH, { recursive: true }); fs.mkdirSync(DL, { recursive: true });
const PLAN = {
  bird: { size: [8, 10], crop: [0.34, 0.17, 0.36, 0.588], detail: 6, views: ['color', 'regions', 'cut', 'paint', 'overlay'], extra: true },
  house: { unit: 'cm', size: [50 / 2.54, 40 / 2.54], crop: null, detail: 6, views: ['color', 'cut'], paper: 'a4', join: 'came' },
  cat: { size: [12, 12], crop: [0.12, 0.06, 0.8, 0.6655], detail: 7, views: ['color', 'paint'] },
  tulip: { size: [12, 16], crop: [0.31, 0.06, 0.4, 0.8], detail: 4, tool: 'hand', views: ['color', 'cut'] },
};
const WK = process.env.BROWSER === 'chromium' ? chromium : webkit; // BROWSER=chromium where WebKit can't launch
const errors = [];
async function run(devName, type, ctxOpt, samples) {
  const br = await type.launch(), ctx = await br.newContext({ ...ctxOpt, serviceWorkers: 'block', acceptDownloads: true }), page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${devName} pageerror: ${e.message}`)); page.on('console', m => { if (m.type() === 'error') errors.push(`${devName} console: ${m.text()}`); });
  await page.addInitScript(() => { window.__noShare = true; window.__noSW = true; });
  const shot = async (n, opt = {}) => { await page.waitForTimeout(250); await page.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; }); await page.screenshot({ path: path.join(SH, `mock-${devName}-${n}.png`), ...opt }); };
  const ready = () => page.waitForFunction(() => window.__P && document.querySelector('#prev svg') && !document.querySelector('#prev').classList.contains('busy'), null, { timeout: 90000 });
  await page.goto(BASE); await page.waitForSelector('#gdNext');
  if (devName === 'iphone15') { await shot('00-guide-1'); await page.click('#gdNext'); await shot('00-guide-2-lines'); await page.click('#gdNext'); await shot('00-guide-3-tools'); await page.click('#gdNext'); await shot('00-guide-4-print'); await page.click('#gdNext'); }
  else { for (let i = 0; i < 4; i++) await page.click('#gdNext'); }
  await shot('01-home-photo');
  for (const s of samples) {
    const c = PLAN[s];
    await page.evaluate(() => window.scrollTo(0, 0)); await page.click(`[data-sample=${s}]`); await page.waitForSelector('#v-crop:not([hidden])');
    await page.evaluate(c => { if (c.unit) cur.unit = c.unit; cur.widthIn = Math.round(c.size[0] * 100) / 100; cur.heightIn = Math.round(c.size[1] * 100) / 100; cur.preset = c.unit === 'cm' ? Math.round(c.size[0] * 2.54) + 'x' + Math.round(c.size[1] * 2.54) : c.size[0] + 'x' + c.size[1]; cur.crop = c.crop; if (!c.crop) { cur.crop = [0, 0, 1, 1]; fitCrop(); } cur.detail = c.detail; if (c.tool) cur.tool = c.tool; if (c.join) { cur.join = c.join; cur.line = 'came316'; } if (c.paper) cur.paper = c.paper; cropURL = null; renderCrop(); }, c);
    await page.waitForTimeout(300); await shot(`02-${s}-size`);
    await page.click('#btnNext'); await ready();
    for (const v of c.views) { await page.click(`[data-view=${v}]`); await page.waitForTimeout(200); if (v === 'overlay') { await page.fill('#op', '45'); await page.$eval('#op', e => e.dispatchEvent(new Event('input'))); } await shot(`03-${s}-pattern-${v}`); }
    if (c.extra) { await page.click('[data-view=color]'); await page.evaluate(() => document.querySelector('#det').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -70)); await page.evaluate(() => document.querySelector('details.more').open = true); await shot('03-bird-pattern-controls');
      await page.evaluate(() => { document.querySelector('#det').value = 9; document.querySelector('#det').dispatchEvent(new Event('input')); }); await page.waitForTimeout(300); await ready(); await page.evaluate(() => window.scrollTo(0, 0)); await shot('03-bird-pattern-detail9-pro');
      await page.evaluate(() => { document.querySelector('#det').value = 6; document.querySelector('#det').dispatchEvent(new Event('input')); }); await page.waitForTimeout(300); await ready(); }
    await page.click('#btnNext'); await page.waitForSelector('.gl'); await page.evaluate(() => document.querySelector('#toast').hidden = true); await shot(`04-${s}-glass`);
    await page.evaluate(() => document.querySelector('#matCard').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -110)); await shot(`04-${s}-glass-totals`);
    if (c.extra) { await page.evaluate(() => { const d = document.querySelector('#assume').closest('details'); d.open = true; d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); }); await shot('04-bird-glass-assumptions'); }
    await page.click('#btnNext'); await page.waitForSelector('#tileMap svg'); await shot(`05-${s}-print`);
    if (s === 'bird' || s === 'house') { await page.evaluate(() => { document.querySelector('.exports').scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }); await shot(`05-${s}-print-exports`); }
    if (devName === 'iphone15') for (const k of ['full', 'paint', 'sheet']) { if (k === 'paint' && !(await page.evaluate(() => !!(__P.paint && __P.paint.lines.length)))) continue; const [d] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click(`[data-exp=${k}]`)]); const p = path.join(DL, `${s}-${k}.pdf`); await d.saveAs(p); }
    await page.click('#btnNext'); await page.waitForSelector('.proj');
  }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.evaluate(() => document.querySelector('#projects').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -120)); await page.evaluate(() => document.querySelector('#toast').hidden = true); await shot('06-my-projects');
  await br.close();
}
(async () => {
  await run('iphone15', WK, devices['iPhone 15'], ['bird', 'house', 'cat', 'tulip']);
  await run('pixel7', chromium, devices['Pixel 7'], ['bird', 'tulip']);
  await run('iphone15-dark', WK, { ...devices['iPhone 15'], colorScheme: 'dark' }, ['cat']);
  // PDF pages → PNG
  const r = (f, pg, out, res = 45) => fs.existsSync(path.join(DL, f)) && execSync(`pdftoppm -r ${res} -png -f ${pg} -l ${pg} -singlefile ${path.join(DL, f)} ${path.join(SH, out)}`);
  r('bird-full.pdf', 1, 'mock-pdf-bird-fullsize-cover'); r('bird-full.pdf', 2, 'mock-pdf-bird-fullsize-A1'); r('bird-paint.pdf', 2, 'mock-pdf-bird-paintguide-A1'); r('bird-sheet.pdf', 1, 'mock-pdf-bird-cutsheet'); r('bird-sheet.pdf', 2, 'mock-pdf-bird-cutlist');
  r('house-full.pdf', 1, 'mock-pdf-house-a4-cover'); r('tulip-full.pdf', 1, 'mock-pdf-tulip-cover'); r('tulip-full.pdf', 2, 'mock-pdf-tulip-A1');
  console.log('errors', JSON.stringify(errors));
})().catch(e => { console.error('FAIL', e); console.log('errors', JSON.stringify(errors)); process.exit(1); });
