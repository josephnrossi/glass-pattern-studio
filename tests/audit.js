/* v0.2 vs v0.3 pipeline audit on varied test photos. Runs the engine in Chromium on both builds (v0.2 = git worktree of 9b79db5 at /workspace/glass-app-v02),
   prints quality metrics (tests/metrics.js) and writes side-by-side comparison PNGs to shots/. Usage: node tests/audit.js [--no-shots] */
const { chromium } = require('/workspace/tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = 'http://127.0.0.1:8777', SH = path.join(__dirname, '..', 'shots'), noShots = process.argv.includes('--no-shots');
const BUILDS = { 'v0.2': ROOT + '/glass-app-v02/index.html', ...(process.env.ONLY02 ? {} : { 'v0.3': ROOT + '/glass-app/index.html' }) };
const PHOTOS = [
  { k: 'portrait', label: 'Portrait / face (backlit, lens flare)', src: 'tests/photos/portrait.jpg', w: 15, h: 10 },
  { k: 'tulip', label: 'Flower', src: 'samples/tulip.jpg', w: 15, h: 10 },
  { k: 'logo', label: 'Logo / graphic', src: 'tests/photos/logo.jpg', w: 12, h: 12 },
  { k: 'house', label: 'High-detail scene', src: 'samples/house.jpg', w: 13, h: 10 },
];
const OPTS = { detail: 6, tool: 'grinder', line: 'foil116', tcolors: 10, frame: true, frameIn: 1, tpaint: false };
async function runBuild(br, name, url) {
  const page = await br.newPage({ viewport: { width: 900, height: 900 } }), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.addInitScript(() => { localStorage.setItem('gps.guideSeen', '1'); window.__noSW = true; });
  await page.goto(url); await page.addScriptTag({ url: ROOT + '/glass-app/tests/metrics.js' });
  const out = {};
  for (const ph of PHOTOS) {
    const r = await page.evaluate(async ({ ph, OPTS, base }) => {
      const o = { ...glassDefaults(), method: 'trace', focus: false, zoom: false, widthIn: ph.w, heightIn: ph.h, ...OPTS };
      const id = await glassImageData(base + ph.src, o), G = glassGeometry(o, id.aspect), t0 = performance.now();
      const P = self.PhotoTracer.trace({ width: id.width, height: id.height, data: id.data, crop: id.crop, f: o.frame ? G.f : 0 }, o, glassTraceEnv(o)); P.ms = Math.round(performance.now() - t0);
      const m = GPSMetrics.measure(P, typeof GLASS_PALETTE !== 'undefined' ? GLASS_PALETTE : []);
      const fit = s => s.replace(/width="[^"]+in" height="[^"]+in"/, 'width="100%"');
      return { m, legend: P.legend.slice(0, 12).map(e => `${e.code ? e.code + ' ' : ''}${e.glass}×${e.count}`), color: fit(glassSVG(P, { numbers: false, scaleBar: false })), cut: fit(glassSVG(P, { cut: true, numbers: true, scaleBar: false })) };
    }, { ph, OPTS, base: url.replace('index.html', '') + (name === 'v0.2' ? '../glass-app/' : '') });
    out[ph.k] = r; console.log(name, ph.k, JSON.stringify(r.m)); console.log('   legend:', r.legend.join(' | '));
  }
  if (errs.length) console.log(name, 'errors', JSON.stringify(errs));
  await page.close(); return { out, errs };
}
(async () => {
  const br = await chromium.launch(), res = {};
  for (const [n, u] of Object.entries(BUILDS)) res[n] = await runBuild(br, n, u);
  fs.writeFileSync('/tmp/gps-audit.json', JSON.stringify(Object.fromEntries(Object.entries(res).map(([n, r]) => [n, Object.fromEntries(Object.entries(r.out).map(([k, v]) => [k, v.m]))])), null, 1));
  if (!noShots) {
    const pg = await br.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
    for (const ph of PHOTOS) for (const kind of ['color', 'cut']) {
      const a = res['v0.2'].out[ph.k], b = res['v0.3'].out[ph.k], row = (lab, r) => `<div class="c"><h2>${lab}</h2>${r[kind]}<p>${r.m.pieces} pieces · ${r.m.colors} glasses · under min size: <b>${r.m.underMin}</b> · ΔE00 photo→glass ${r.m.dE00mean} (p90 ${r.m.dE00p90}) · concave notches/piece ${r.m.notchesPerPiece}${r.m.dupNames ? ` · duplicate glass names ${r.m.dupNames}` : ''}</p></div>`;
      await pg.setContent(`<html><body style="margin:0;font:15px system-ui;background:#f4f2ec"><div style="padding:10px 16px"><b style="font-size:20px">${ph.label}</b> — ${kind === 'color' ? 'glass view' : 'numbered cut pattern'} · ${ph.w}×${ph.h} in · Detail 6 · grinder · 1/16″ foil · 10 glass colors
        <img src="${ROOT}/glass-app/${ph.src}" style="height:70px;vertical-align:middle;margin-left:12px;border-radius:4px"></div><style>.w{display:flex;gap:16px;padding:0 16px 16px}.c{flex:1;background:#fff;border-radius:8px;padding:8px}.c h2{margin:2px 0 6px;font-size:17px}.c svg{display:block;width:100%;height:auto}.c p{margin:6px 0 0;font-size:13px;color:#333}</style>
        <div class="w">${row('Before — v0.2', a)}${row('After — v0.3', b)}</div></body></html>`);
      await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(SH, `v03-compare-${ph.k}-${kind}.png`), fullPage: true });
    }
  }
  await br.close();
  process.exit(Object.values(res).some(r => r.errs.length) ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(2); });
