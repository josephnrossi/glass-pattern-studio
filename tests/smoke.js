/* Glass Pattern Studio mockup smoke check: loads the app, walks Photo → Size → Pattern → Glass → Print with a sample, exports, collects console errors. */
const { webkit, chromium, devices } = require('/workspace/tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8777/glass-app/index.html', OUT = '/tmp/gps-dl';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const dev = process.env.DEV === 'iphone' ? { t: webkit, c: devices['iPhone 15'] } : { t: chromium, c: devices['Pixel 7'] };
  const br = await dev.t.launch(); const ctx = await br.newContext({ ...dev.c, serviceWorkers: 'block', acceptDownloads: true }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(() => { window.__noShare = true; window.__noSW = true; });
  await page.goto(BASE); await page.waitForSelector('#gdNext');
  for (let i = 0; i < 4; i++) await page.click('#gdNext');
  await page.click('[data-sample=' + (process.env.S || 'bird') + ']'); await page.waitForSelector('#v-crop:not([hidden])');
  await page.click('#sizeChips button:nth-child(2)');
  await page.click('#btnNext'); await page.waitForFunction(() => window.__P && document.querySelector('#prev svg') && !document.querySelector('#prev').classList.contains('busy'), null, { timeout: 60000 });
  const st = await page.evaluate(() => ({ pieces: __P.stats.pieces, w: __P.widthIn, h: __P.heightIn, ms: __P.ms, paint: !!(__P.paint && __P.paint.lines.length), colors: __P.legend.length, worker: !window.__noWorker }));
  console.log('pattern', JSON.stringify(st));
  for (const v of ['regions', 'cut', 'paint', 'overlay', 'color']) { await page.click(`[data-view=${v}]`); await page.waitForTimeout(100); }
  await page.click('#btnNext'); await page.waitForSelector('.gl');
  const M = await page.evaluate(() => ({ colors: __M.colors.length, sheets: __M.sheets, area: __M.areaIn, perim: __M.perimIn, border: __M.borderIn, foilFt: __M.foil.ft, rolls: __M.foil.rolls }));
  console.log('materials', JSON.stringify(M));
  await page.click('#btnNext'); await page.waitForSelector('#tileMap svg');
  for (const k of ['full', 'paint', 'sheet', 'svg', 'list']) { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(`[data-exp=${k}]`)]); const p = path.join(OUT, d.suggestedFilename()); await d.saveAs(p); console.log('export', k, d.suggestedFilename(), fs.statSync(p).size, JSON.stringify(await page.evaluate(() => window.__lastPDF))); }
  await page.click('#btnNext'); await page.waitForSelector('.proj');
  console.log('errors', JSON.stringify(errs));
  await br.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
