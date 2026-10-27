const { chromium, devices } = require('/workspace/tools/node_modules/playwright');
(async () => { const br = await chromium.launch(), ctx = await br.newContext({ ...devices['Pixel 7'], serviceWorkers: 'allow' }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto('http://127.0.0.1:8777/glass-app/index.html'); await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), null, { timeout: 15000 });
  await page.waitForTimeout(1500); const keys = await page.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k[0]); return { k, n: (await c.keys()).length }; });
  await ctx.setOffline(true); await page.reload(); await page.waitForSelector('#samples button'); const ok = await page.evaluate(() => !!document.querySelector('#gdNext'));
  console.log(JSON.stringify({ keys, offlineReload: ok, errs })); await br.close(); })();
