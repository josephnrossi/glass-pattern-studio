/* v0.3 pipeline tests (Chromium). Plain Node + Playwright, exits non-zero on any failure.
   1 CIEDE2000 against Sharma et al. reference pairs  2 cuttability on 4 test photos × 3 tool/detail settings: no piece under the minimum size
   (pixel and drawn-polygon area), no enclosed pieces, every outline closed, numbering 1..n  3 palette: every piece's glass is a catalog glass with its
   catalog colour, ≤ the Glass colors limit, unique names, legend totals match, each piece gets (close to) its nearest chosen glass
   4 lighting-aware colour: glare + shadow specks don't shift a piece's colour  5 exports from the real UI on an iPad viewport: SVG (real size, key,
   data-code per piece), full-size PDF (page count, colour key page), cut sheet PDF, shopping list with codes; 0 console errors. */
const { chromium } = require('/workspace/tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = 'http://127.0.0.1:8777/glass-app/', DL = '/tmp/gps-v03-dl'; fs.mkdirSync(DL, { recursive: true });
const results = []; const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const PHOTOS = [['portrait', 'tests/photos/portrait.jpg', 15, 10], ['tulip', 'samples/tulip.jpg', 15, 10], ['logo', 'tests/photos/logo.jpg', 12, 12], ['house', 'samples/house.jpg', 13, 10]];
const SETS = [{ tool: 'grinder', detail: 6, tcolors: 10, line: 'foil116' }, { tool: 'hand', detail: 4, tcolors: 6, line: 'came316' }, { tool: 'ringsaw', detail: 8, tcolors: 14, line: 'foil18', smooth: 'high' }];
(async () => {
  const br = await chromium.launch(), page = await br.newPage({ viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 1, acceptDownloads: true }), errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await page.addInitScript(() => { localStorage.setItem('gps.guideSeen', '1'); window.__noShare = true; window.__noSW = true; });
  await page.goto(ROOT + 'index.html'); await page.addScriptTag({ url: ROOT + 'tests/metrics.js' });
  // 1 CIEDE2000 reference values (Sharma, Wu, Dalal 2005, table 1: pairs 1, 7, 17, 25)
  const ref = await page.evaluate(() => { const T = [[[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425], [[50, 0, 0], [50, -1, 2], 2.3669], [[50, 2.5, 0], [73, 25, -18], 27.1492], [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644]];
    return T.map(([a, b, e]) => [e, +PhotoTracer.de00(...a, ...b, 1).toFixed(4), +GPSMetrics.de00(a, b).toFixed(4)]); });
  check('CIEDE2000 matches the Sharma reference pairs (engine + test metric)', ref.every(([e, x, y]) => Math.abs(e - x) < 1e-3 && Math.abs(e - y) < 1e-3), JSON.stringify(ref));
  // 2 + 3 pipeline on the test photos
  for (const [k, src, w, h] of PHOTOS) for (const S of SETS) {
    const r = await page.evaluate(async ({ src, w, h, S }) => {
      const o = { ...glassDefaults(), method: 'trace', focus: false, zoom: false, widthIn: w, heightIn: h, frame: true, frameIn: 1, tpaint: false, ...S };
      const id = await glassImageData(src, o), G = glassGeometry(o, id.aspect), P = PhotoTracer.trace({ width: id.width, height: id.height, data: id.data, crop: id.crop, f: G.f }, o, glassTraceEnv(o)), m = GPSMetrics.measure(P);
      const cat = new Map(GLASS_CATALOG.map(c => [c[0], c])), inner = P.pieces.filter(p => !p.frame), lab = c => PhotoTracer.rgbLab(...c.map(Math.round));
      const badCat = inner.filter(p => { const c = cat.get(p.code); return !c || c[1] !== p.glass || c[3] !== p.rgb[0] || c[4] !== p.rgb[1] || c[5] !== p.rgb[2]; }).length;
      const chosen = [...new Set(inner.map(p => p.code))].map(c => cat.get(c)).filter(Boolean);
      const notNearest = inner.filter(p => { const L = lab(p.src), mine = PhotoTracer.de00(...L, ...lab(p.rgb), 1.15), best = Math.min(...chosen.map(c => PhotoTracer.de00(...L, ...lab([c[3], c[4], c[5]]), 1.15))); return mine > best + 2.5; }).length;
      const names = P.legend.map(e => e.glass), legSum = P.legend.reduce((a, e) => a + e.count, 0), nums = P.pieces.map(p => p.n).sort((a, b) => a - b);
      const closed = P.pieces.every(p => p.segs.length && p.segs.every(sg => sg[0][0] === 'M' && sg[sg.length - 1][0] === 'Z') && p.poly.every(r => r.length >= 3));
      return { n: inner.length, m, badCat, notNearest, distinct: chosen.length, limit: o.tcolors, dupNames: names.length - new Set(names).size, legOK: legSum === P.pieces.length, numsOK: nums.every((v, i) => v === i + 1), closed, holes: (P.stats.flagged.hole || []).length, ms: P.ms, engine: P.engine };
    }, { src: ROOT + src, w, h, S });
    const tag = `${k} · ${S.tool} · detail ${S.detail}`;
    check(`${tag}: no piece below the minimum size`, r.m.underMin === 0 && r.m.underPoly === 0, `${r.n} pieces, min ${r.m.minAreaIn} sq in (features ${r.m.featAreaIn}), smallest ${r.m.smallest}`);
    check(`${tag}: all outlines closed, no enclosed pieces, numbered 1..n`, r.closed && r.m.open === 0 && r.holes === 0 && r.numsOK, `holes ${r.holes}`);
    check(`${tag}: palette = catalog glasses, ≤ limit, unique, nearest`, r.engine === 'gps-v0.3' && r.badCat === 0 && r.distinct <= r.limit && r.dupNames === 0 && r.legOK && r.notNearest === 0,
      `${r.distinct}/${r.limit} glasses, ΔE00 mean ${r.m.dE00mean}, not-nearest ${r.notNearest}, bad ${r.badCat}`);
  }
  // 4 lighting-aware colour: flat red area with 12% white glare dots and 3% black specks
  const lit = await page.evaluate(() => { const W = 400, H = 300, d = new Uint8ClampedArray(W * H * 4), rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, left = x < 200, u = rnd(); let c = left ? [196, 40, 40] : [40, 70, 160]; if (u < 0.12) c = [255, 255, 255]; else if (u < 0.15) c = [10, 10, 10]; d.set([...c, 255], i); }
    const o = { ...glassDefaults(), method: 'trace', widthIn: 8, heightIn: 6, frame: false, detail: 1, tcolors: 6, tpaint: false }, P = PhotoTracer.trace({ width: W, height: H, data: d, f: 0 }, o, glassTraceEnv(o));
    const red = P.pieces.filter(p => p.label[0] < W / 2).sort((a, b) => b.areaIn - a.areaIn)[0], L = c => PhotoTracer.rgbLab(...c.map(Math.round));
    let mr = 0, mg = 0, mb = 0, n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < 200; x++) { const i = (y * W + x) * 4; mr += d[i]; mg += d[i + 1]; mb += d[i + 2]; n++; }
    return { src: red.src, glass: red.code + ' ' + red.glass, dRobust: +PhotoTracer.de00(...L(red.src), ...L([196, 40, 40]), 1).toFixed(2), dPlain: +PhotoTracer.de00(...L([mr / n, mg / n, mb / n]), ...L([196, 40, 40]), 1).toFixed(2) }; });
  check('lighting-aware colour ignores glare and shadow specks', lit.dRobust < 4 && lit.dRobust < lit.dPlain / 2, JSON.stringify(lit));
  // 5 exports from the real UI (iPad 1024×1366)
  await page.goto(ROOT + 'index.html'); await page.click('[data-sample=tulip]'); await page.waitForSelector('#v-crop:not([hidden])'); await page.click('#btnNext');
  await page.waitForFunction(() => window.__P && document.querySelector('#prev svg') && !document.querySelector('#prev').classList.contains('busy'), null, { timeout: 90000 });
  await page.click('#btnNext'); await page.waitForSelector('.gl'); const rows = await page.$$eval('.gl .code', a => a.length); check('glass list shows catalog codes', rows > 0, rows + ' rows');
  await page.click('#btnNext'); await page.waitForSelector('#tileMap svg');
  const dl = async k => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click(`[data-exp=${k}]`)]); const p = path.join(DL, d.suggestedFilename()); await d.saveAs(p); return p; };
  const svgP = await dl('svg'), svg = fs.readFileSync(svgP, 'utf8'), P0 = await page.evaluate(() => ({ w: __P.widthIn, h: __P.heightIn, n: __P.pieces.length, g: __P.legend.length }));
  const wIn = +(svg.match(/^<svg[^>]* width="([\d.]+)in"/) || [])[1], codes = (svg.match(/data-code="/g) || []).length, keyRows = (svg.match(/<g id="key"/g) || []).length;
  check('SVG export: real-size width, lead lines, key, data-code on every glass piece', Math.abs(wIn - P0.w) < 0.01 && /id="lead"/.test(svg) && keyRows === 1 && codes >= P0.n - 4, `${wIn} in wide, ${codes} coded pieces of ${P0.n}, key ${keyRows}`);
  const pdfP = await dl('full'), meta = await page.evaluate(() => window.__lastPDF), pages = +execSync(`pdfinfo "${pdfP}" | awk '/^Pages/{print $2}'`).toString().trim(), txt = execSync(`pdftotext -f 2 -l 2 "${pdfP}" -`).toString();
  check('full-size PDF: page count matches, page 2 is the color key with codes', pages === meta.pages && /Color key/.test(txt) && /[COS]-\d{3}/.test(txt), `${pages} pages`);
  const shP = await dl('sheet'), shTxt = execSync(`pdftotext "${shP}" -`).toString(); check('cut sheet PDF lists glass codes', /[COS]-\d{3}/.test(shTxt));
  const lsP = await dl('list'), ls = fs.readFileSync(lsP, 'utf8'); check('shopping list lists glass codes + family', /[COS]-\d{3} .+\((cathedral|opalescent|streaky)\)/.test(ls));
  fs.copyFileSync(svgP, '/tmp/gps-v03-tulip.svg'); fs.copyFileSync(pdfP, '/tmp/gps-v03-tulip-full.pdf');
  check('no console or page errors', !errs.length, errs.join(' | '));
  await br.close();
  const bad = results.filter(r => !r.ok); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('FAIL (crash)', e); process.exit(2); });
