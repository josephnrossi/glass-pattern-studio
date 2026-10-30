/* v0.3 iPad screenshots (WebKit iPad Pro 11, Chromium fallback): Convert step (portrait + landscape two-column), glass list, print, and renders of the exported SVG / PDF. */
const pw = require('/workspace/tools/node_modules/playwright'), { devices } = pw;
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = 'http://127.0.0.1:8777/glass-app/', SH = path.join(__dirname, '..', 'shots'), DL = '/tmp/gps-v03-dl'; fs.mkdirSync(DL, { recursive: true });
(async () => {
  let type = pw.webkit, br; try { br = await type.launch(); } catch (e) { console.log('webkit unavailable, using chromium:', e.message.split('\n')[0]); type = pw.chromium; br = await type.launch(); }
  const dev = devices['iPad Pro 11'], errs = [], engine = type === pw.webkit ? 'webkit' : 'chromium';
  const ctx = await br.newContext({ ...(type === pw.webkit ? dev : { viewport: dev.viewport, deviceScaleFactor: 2, userAgent: dev.userAgent, hasTouch: true }), serviceWorkers: 'block', acceptDownloads: true }), page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.addInitScript(() => { localStorage.setItem('gps.guideSeen', '1'); window.__noShare = true; window.__noSW = true; });
  const shot = async n => { await page.waitForTimeout(300); await page.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; }); await page.screenshot({ path: path.join(SH, n) }); console.log('shot', n); };
  const ready = () => page.waitForFunction(() => window.__P && document.querySelector('#prev svg') && !document.querySelector('#prev').classList.contains('busy'), null, { timeout: 90000 });
  await page.goto(ROOT + 'index.html'); await shot('v03-ipad-01-home.png');
  await page.click('[data-sample=tulip]'); await page.waitForSelector('#v-crop:not([hidden])');
  await page.evaluate(() => { cur.widthIn = 15; cur.heightIn = 10; cur.preset = null; cur.crop = [0, 0, 1, 1]; fitCrop(); renderCrop(); });
  await page.click('#btnNext'); await ready(); await page.click('[data-view=color]'); await shot('v03-ipad-02-convert-glass.png');
  await page.click('[data-view=cut]'); await shot('v03-ipad-03-convert-numbered.png');
  await page.evaluate(() => document.querySelector('#refineCard').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -80)); await shot('v03-ipad-04-controls.png');
  await page.setViewportSize({ width: dev.viewport.height, height: dev.viewport.width }); await page.evaluate(() => window.scrollTo(0, 0)); await page.click('[data-view=color]'); await shot('v03-ipad-05-landscape-convert.png');
  await page.setViewportSize(dev.viewport);
  await page.click('#btnNext'); await page.waitForSelector('.gl'); await shot('v03-ipad-06-glass-list.png');
  await page.click('#btnNext'); await page.waitForSelector('#tileMap svg'); await page.evaluate(() => { document.querySelector('.exports').scrollIntoView({ block: 'center' }); }); await shot('v03-ipad-07-print.png');
  const dl = async k => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click(`[data-exp=${k}]`)]); const p = path.join(DL, 'ipad-' + d.suggestedFilename()); await d.saveAs(p); return p; };
  const svgP = await dl('svg'), pdfP = await dl('full'), sheetP = await dl('sheet');
  await br.close();
  // render the exported files
  const cb = await pw.chromium.launch(), pg = await cb.newPage({ viewport: { width: 1400, height: 1200 } });
  await pg.setContent(`<body style="margin:0;background:#fff"><img src="data:image/svg+xml;base64,${fs.readFileSync(svgP).toString('base64')}" style="width:1400px;display:block"></body>`); await pg.waitForTimeout(500);
  await pg.screenshot({ path: path.join(SH, 'v03-export-svg-tulip.png'), fullPage: true }); await cb.close(); console.log('shot v03-export-svg-tulip.png');
  execSync(`pdftoppm -r 60 -png -f 2 -l 2 -singlefile "${pdfP}" "${path.join(SH, 'v03-export-pdf-colorkey')}"`); execSync(`pdftoppm -r 60 -png -f 3 -l 3 -singlefile "${pdfP}" "${path.join(SH, 'v03-export-pdf-A1')}"`);
  execSync(`pdftoppm -r 60 -png -f 1 -l 1 -singlefile "${pdfP}" "${path.join(SH, 'v03-export-pdf-cover')}"`); execSync(`pdftoppm -r 60 -png -f 1 -l 1 -singlefile "${sheetP}" "${path.join(SH, 'v03-export-cutsheet')}"`);
  console.log('engine', engine, 'errors', JSON.stringify(errs)); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(2); });
