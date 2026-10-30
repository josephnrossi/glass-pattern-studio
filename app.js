/* Glass Pattern Studio — stained glass from a photo: Photo → Size → Regions/Glass → Glass list → Print.
   My Projects (IndexedDB) + beginner guide. Engine (tracer.js, glass.js, pdf.js) offline, no AI key. */
const APP_VERSION = '0.3';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = n => Math.round(n * 10) / 10;
const FREE_PROJECTS = 3; // placeholder Pro marker: free tier would keep 3 projects (nothing is enforced in this mockup)
let toastT;
function toast(msg, undo) { const t = $('#toast'); $('#toastText').textContent = msg; const u = $('#toastUndo'); u.hidden = !undo; u.onclick = async () => { t.hidden = true; if (undo) await undo(); }; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, undo ? 6000 : 2800); }
function download(name, data, type) { const blob = data instanceof Blob ? data : new Blob([data], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); window.__lastDownload = { name, size: blob.size, type: blob.type }; }
async function shareOrDownload(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  try { const f = new File([blob], name, { type: blob.type || type }); if (navigator.canShare && navigator.canShare({ files: [f] }) && !window.__noShare) { await navigator.share({ files: [f], title: name }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  download(name, blob, type);
}
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Couldn’t read that image. Try a JPEG or PNG.')); i.src = src; }); }
async function toJPEG(src, max = 1600, q = 0.85) {
  const url = src instanceof Blob ? URL.createObjectURL(src) : src, el = await loadImg(url), w = el.naturalWidth, h = el.naturalHeight, s = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(el, 0, 0, c.width, c.height); if (src instanceof Blob) URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', q);
}
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; $('#sheetBg').hidden = false; $('#sheet').scrollTop = 0; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBg').hidden = true; }

/* ---------- sizes & units ---------- */
const SIZES_IN = [[8, 10], [11, 14], [12, 12], [12, 16], [16, 20], [18, 24]];
const SIZES_CM = [[20, 25], [30, 30], [30, 40], [40, 50], [45, 60]];
const TOOLS = [['hand', 'Hand', 'Cutter + pliers only: pieces stay at least about 0.3 sq in (196 mm²) and 7 mm wide, curves gentle.'], ['grinder', 'Grinder', 'Cut close, grind to the line: pieces down to about 0.16 sq in (100 mm²) and 5 mm wide.'], ['ringsaw', 'Ring saw', 'Saw cuts any direction: deep inside curves, pieces down to about 0.1 sq in (64 mm²), 4 mm wide.']];
const LINES = { foil: [['foil116', '1/16″'], ['foil18', '1/8″']], came: [['came316', '3/16″'], ['came14', '1/4″']] };
const SMOOTH = [['low', 'Low', 'Follows the photo closely; some tighter curves.'], ['medium', 'Medium', 'Inside curves no tighter than your tool cuts (about a 1/4″ grinder bit with a grinder).'], ['high', 'High', 'Extra-smooth, flowing lines — easiest to cut and foil.']];
const MATCH = d => d == null ? '' : d < 3 ? 'near-exact match' : d < 6 ? 'very close match' : d < 10 ? 'close match' : 'nearest in catalog';
const FAMN = { C: 'Cathedral', O: 'Opalescent', S: 'Streaky', M: 'Your glass' };
const VIEWS = [['regions', 'Regions'], ['color', 'Glass'], ['cut', 'Numbered'], ['paint', 'Paint guide'], ['overlay', 'Overlay']];
const cmU = () => cur && cur.unit === 'cm';
const toU = v => cmU() ? r1(v * 2.54) : Math.round(v * 100) / 100, fromU = v => cmU() ? v / 2.54 : v;
const lenU = (inch) => cmU() ? (inch * 2.54 / 100).toFixed(1) + ' m' : (inch / 12).toFixed(1) + ' ft';
const areaU = (sq) => cmU() ? Math.round(sq * 6.4516).toLocaleString() + ' cm²' : (sq < 10 ? sq.toFixed(1) : Math.round(sq).toLocaleString()) + ' sq in';
const sizeU = (w, h) => `${toU(w)} × ${toU(h)} ${cmU() ? 'cm' : 'in'}`;

/* ---------- state ---------- */
let cur = null, P = null, cropURL = null, step = 'home', view = 'color', op = 0.5, buildSeq = 0, buildT = 0, imgEl = null;
const ORDER = ['home', 'crop', 'pattern', 'glass', 'print'];
function newProject(orig, name) { return { id: uid(), name, created: Date.now(), updated: Date.now(), orig, crop: null, unit: 'in', widthIn: 12, heightIn: 12, preset: null, frame: true, frameIn: 1, detail: 5, tool: 'grinder', tpaint: true, tpaintAmt: 'medium', join: 'foil', line: 'foil116', tcolors: 10, smooth: 'medium', sheet: '12x12', waste: 30, paper: 'letter', P: null, thumb: null }; }
const engineOpts = () => ({ ...glassDefaults(), method: 'trace', widthIn: cur.widthIn, heightIn: cur.heightIn, frame: cur.frame, frameIn: cur.frameIn, detail: cur.detail, tool: cur.tool, tpaint: cur.tpaint, tpaintAmt: cur.tpaintAmt, line: cur.line, tcolors: cur.tcolors, smooth: cur.smooth || 'medium', unit: cur.unit, focus: false, zoom: false });

/* ---------- navigation ---------- */
function go(s) {
  if (s !== 'home' && !cur) s = 'home';
  step = s; ORDER.forEach(k => $('#v-' + k).hidden = k !== s);
  $('#steps').hidden = s === 'home'; $('#nav').hidden = s === 'home'; $('#btnHome').hidden = s === 'home';
  $$('#steps button').forEach(b => { const i = ORDER.indexOf(b.dataset.step), j = ORDER.indexOf(s); b.setAttribute('aria-current', b.dataset.step === s ? 'step' : 'false'); b.classList.toggle('done', i < j); });
  $('#title').textContent = s === 'home' ? 'Glass Pattern Studio' : (s === 'pattern' ? 'Photo → glass' : cur.name);
  const next = { crop: 'Convert to glass ›', pattern: 'Glass list ›', glass: 'Print ›', print: 'Done ✓' }[s]; if (next) $('#btnNext').textContent = next;
  window.scrollTo(0, 0);
  if (s === 'home') renderHome(); else if (s === 'crop') renderCrop(); else if (s === 'pattern') renderPattern(); else if (s === 'glass') renderGlass(); else if (s === 'print') renderPrint();
}
$('#btnNext').onclick = async () => { const i = ORDER.indexOf(step); if (step === 'print') { await save(); toast('Saved to My projects'); go('home'); } else go(ORDER[i + 1]); };
$('#btnBack').onclick = () => { const i = ORDER.indexOf(step); if (i <= 1) { save(); go('home'); } else go(ORDER[i - 1]); };
$('#btnHome').onclick = () => { save(); go('home'); };
$$('#steps button').forEach(b => b.onclick = () => { if (b.dataset.step === 'home') save(); go(b.dataset.step); });
$('#btnHelp').onclick = () => openGuide(0);
$('#sheetBg').onclick = closeSheet;

/* ---------- home: photo + projects ---------- */
const SAMPLES = ['bird', 'house', 'cat', 'tulip'];
$('#samples').innerHTML = SAMPLES.map(s => `<button data-sample="${s}" aria-label="Sample: ${s}"><img src="samples/${s}.jpg" alt="" loading="lazy"><span>${s}</span></button>`).join('');
$$('#samples button').forEach(b => b.onclick = () => startFrom(`samples/${b.dataset.sample}.jpg`, b.dataset.sample[0].toUpperCase() + b.dataset.sample.slice(1)));
for (const id of ['#fileCam', '#fileLib']) $(id).onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) startFrom(f, 'Pattern ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })); };
async function startFrom(src, name) {
  try { const orig = await toJPEG(src); cur = newProject(orig, name); P = null; cropURL = null; imgEl = await loadImg(orig);
    const a = imgEl.naturalHeight / imgEl.naturalWidth; cur.widthIn = 12; cur.heightIn = Math.round(12 * a * 2) / 2; cur.preset = 'photo'; cur.crop = [0, 0, 1, 1]; go('crop'); }
  catch (e) { toast(e.message); }
}
async function renderHome() {
  let list = []; try { list = (await DB.all()).sort((a, b) => b.updated - a.updated); } catch (_) {}
  $('#projCount').innerHTML = `${list.length} of ${FREE_PROJECTS} free <span class="pro">PRO</span> unlimited`;
  $('#projects').innerHTML = list.length ? list.map(p => `<div class="proj" data-id="${p.id}" role="button" tabindex="0"><img src="${p.thumb || p.orig}" alt=""><div><b>${esc(p.name)}</b><small>${p.P ? p.P.stats.pieces + ' pieces · ' : ''}${p.unit === 'cm' ? `${r1(p.widthIn * 2.54)} × ${r1(p.heightIn * 2.54)} cm` : `${p.widthIn} × ${p.heightIn} in`}</small></div><button class="more-btn" data-more="${p.id}" aria-label="More for ${esc(p.name)}">⋯</button></div>`).join('')
    : '<div class="empty">Your patterns will appear here.<br>Start with a photo above — or tap a sample.</div>';
  $$('.proj').forEach(el => el.onclick = e => { if (e.target.closest('[data-more]')) return; openProject(el.dataset.id); });
  $$('[data-more]').forEach(b => b.onclick = () => projMenu(list.find(p => p.id === b.dataset.more)));
}
async function openProject(id) { const p = await DB.get(id); if (!p) return; cur = p; P = p.P || null; cropURL = null; imgEl = await loadImg(p.orig); go(P ? 'pattern' : 'crop'); }
function projMenu(p) {
  openSheet(`<h3>${esc(p.name)}</h3><div class="menu-list"><button id="pmOpen">Open</button><button id="pmRen">Rename</button><button id="pmDup">Duplicate <span class="pro">PRO</span> <small class="muted">counts as a project</small></button><button id="pmDel" class="danger">Delete</button><button id="pmX">Cancel</button></div>`);
  $('#pmOpen').onclick = () => { closeSheet(); openProject(p.id); };
  $('#pmRen').onclick = async () => { const n = prompt('Project name', p.name); if (n && n.trim()) { p.name = n.trim().slice(0, 60); await DB.put(p); } closeSheet(); renderHome(); };
  $('#pmDup').onclick = async () => { await DB.put({ ...p, id: uid(), name: p.name + ' copy', created: Date.now(), updated: Date.now() }); closeSheet(); renderHome(); };
  $('#pmDel').onclick = async () => { await DB.del(p.id); closeSheet(); renderHome(); toast(`Deleted “${p.name}”`, async () => { await DB.put(p); renderHome(); }); };
  $('#pmX').onclick = closeSheet;
}
async function save() {
  if (!cur) return; cur.updated = Date.now(); cur.P = P;
  try { if (P) cur.thumb = await patternJPEG(P, 360); await DB.put(cur); } catch (e) { toast('Couldn’t save: ' + e.message); }
}
async function patternJPEG(P, max) {
  const svg = glassSVG(P, { numbers: false, scaleBar: false }).replace(/width="[^"]+in" height="[^"]+in"/, `width="${P.gridW}" height="${P.gridH}"`), im = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const s = max / Math.max(P.gridW, P.gridH), c = document.createElement('canvas'); c.width = Math.round(P.gridW * s); c.height = Math.round(P.gridH * s); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.8);
}

/* ---------- step 2: crop & size ---------- */
function fitCrop() { // biggest box of the panel's shape inside the photo, centred on the old crop
  const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight, a = cur.heightIn / cur.widthIn, old = cur.crop || [0, 0, 1, 1], cx = old[0] + old[2] / 2, cy = old[1] + old[3] / 2;
  let w = Math.min(1, ih / a / iw), h = w * iw * a / ih; if (h > 1) { h = 1; w = ih / a / iw; }
  const k = Math.min(1, Math.max(old[2] / w, old[3] / h, 0.35)); w *= k; h *= k;
  cur.crop = [Math.max(0, Math.min(1 - w, cx - w / 2)), Math.max(0, Math.min(1 - h, cy - h / 2)), w, h]; cropURL = null;
}
function renderCrop() {
  const img = $('#cropImg'); if (img.src !== cur.orig) img.src = cur.orig;
  $$('[data-unit]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.unit === cur.unit)));
  const land = cur.widthIn > cur.heightIn, list = (cmU() ? SIZES_CM : SIZES_IN).map(([a, b]) => land ? [b, a] : [a, b]);
  $('#sizeChips').innerHTML = `<button data-size="photo" aria-pressed="${cur.preset === 'photo'}">Photo shape</button>` + list.map(([w, h]) => `<button data-size="${w}x${h}" aria-pressed="${cur.preset === w + 'x' + h}">${w} × ${h}</button>`).join('');
  $$('[data-size]').forEach(b => b.onclick = () => { const k = b.dataset.size; cur.preset = k;
    if (k === 'photo') { const a = imgEl.naturalHeight / imgEl.naturalWidth; cur.heightIn = Math.round(cur.widthIn * a * 4) / 4; cur.crop = [0, 0, 1, 1]; }
    else { const [w, h] = k.split('x').map(Number); cur.widthIn = fromU(w); cur.heightIn = fromU(h); }
    cur.widthIn = Math.round(cur.widthIn * 100) / 100; cur.heightIn = Math.round(cur.heightIn * 100) / 100; P = null; fitCrop(); renderCrop(); });
  $('#inW').value = toU(cur.widthIn); $('#inH').value = toU(cur.heightIn); $('#unitL').textContent = cmU() ? 'cm' : 'in';
  $('#frameOn').checked = cur.frame; $('#frameNote').textContent = `— ${cmU() ? '2.5 cm' : '1 in'} strips, adds ${cur.frame ? '4' : 'no'} pieces`;
  if (!cur.crop) fitCrop();
  img.decode ? img.decode().then(placeBox).catch(placeBox) : (img.onload = placeBox); placeBox();
}
function placeBox() { const st = $('#cropStage'), img = $('#cropImg'), b = $('#cropBox'), r = img.getBoundingClientRect(), sr = st.getBoundingClientRect(); if (!r.width) return; const c = cur.crop; Object.assign(b.style, { left: (r.left - sr.left + c[0] * r.width) + 'px', top: (r.top - sr.top + c[1] * r.height) + 'px', width: c[2] * r.width + 'px', height: c[3] * r.height + 'px', backgroundImage: `url("${cur.orig}")`, backgroundSize: `${r.width}px ${r.height}px`, backgroundPosition: `${-c[0] * r.width}px ${-c[1] * r.height}px` }); }
(() => { // drag to move, corners to resize (aspect locked to the panel size)
  const b = $('#cropBox'); let st = null;
  b.addEventListener('pointerdown', e => { const r = $('#cropImg').getBoundingClientRect(); st = { x: e.clientX, y: e.clientY, c: cur.crop.slice(), h: e.target.dataset.h || null, W: r.width, H: r.height }; try { b.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
  b.addEventListener('pointermove', e => { if (!st) return; const dx = (e.clientX - st.x) / st.W, dy = (e.clientY - st.y) / st.H, c = st.c.slice(), ar = c[3] / c[2];
    if (!st.h) { c[0] = Math.max(0, Math.min(1 - c[2], c[0] + dx)); c[1] = Math.max(0, Math.min(1 - c[3], c[1] + dy)); }
    else { const sx = st.h.includes('e') ? 1 : -1, sy = st.h.includes('s') ? 1 : -1; let w = Math.max(0.12, c[2] + sx * Math.max(dx * sx, dy * sy / ar * 1) * 1); let h = w * ar;
      const ax = sx > 0 ? c[0] : c[0] + c[2], ay = sy > 0 ? c[1] : c[1] + c[3], maxW = Math.min(sx > 0 ? 1 - ax : ax, (sy > 0 ? 1 - ay : ay) / ar); if (w > maxW) { w = maxW; h = w * ar; }
      c[2] = w; c[3] = h; c[0] = sx > 0 ? ax : ax - w; c[1] = sy > 0 ? ay : ay - h; }
    cur.crop = c; cropURL = null; P = null; placeBox(); });
  const end = () => { st = null; }; b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
  window.addEventListener('resize', () => step === 'crop' && placeBox());
})();
$$('[data-unit]').forEach(b => b.onclick = () => { cur.unit = b.dataset.unit; cur.preset = cur.preset === 'photo' ? 'photo' : null; renderCrop(); });
$('#inW').onchange = e => { const v = fromU(+e.target.value); if (v >= 3 && v <= 72) { const a = cur.heightIn / cur.widthIn; cur.widthIn = Math.round(v * 100) / 100; if (cur.preset === 'photo') cur.heightIn = Math.round(v * a * 100) / 100; else cur.preset = null; P = null; fitCrop(); } renderCrop(); };
$('#inH').onchange = e => { const v = fromU(+e.target.value); if (v >= 3 && v <= 72) { cur.heightIn = Math.round(v * 100) / 100; cur.preset = null; P = null; fitCrop(); } renderCrop(); };
$('#btnRotate').onclick = () => { [cur.widthIn, cur.heightIn] = [cur.heightIn, cur.widthIn]; if (cur.preset && cur.preset !== 'photo') cur.preset = cur.preset.split('x').reverse().join('x'); else cur.preset = null; P = null; fitCrop(); renderCrop(); };
$('#frameOn').onchange = e => { cur.frame = e.target.checked; P = null; renderCrop(); };
async function croppedImage() {
  if (cropURL) return cropURL; const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight, c = cur.crop, sw = c[2] * iw, sh = c[3] * ih, s = Math.min(1, 1200 / Math.max(sw, sh)), cv = document.createElement('canvas');
  cv.width = Math.max(8, Math.round(sw * s)); cv.height = Math.max(8, Math.round(sh * s)); cv.getContext('2d').drawImage(imgEl, c[0] * iw, c[1] * ih, sw, sh, 0, 0, cv.width, cv.height); return cropURL = cv.toDataURL('image/jpeg', 0.9);
}

/* ---------- engine: tracer in a worker (falls back to the page) ---------- */
let _gw = null, _gwId = 0; const _gwWait = new Map();
function traceRun(id, o) {
  const G = glassGeometry(o, id.aspect), img = { width: id.width, height: id.height, data: id.data, crop: id.crop, f: o.frame ? G.f : 0 }, env = glassTraceEnv(o), oo = JSON.parse(JSON.stringify(o));
  const inline = () => self.PhotoTracer.trace(img, oo, env);
  if (typeof Worker === 'undefined' || window.__noWorker) return Promise.resolve().then(inline);
  try { if (!_gw) { _gw = new Worker('tracer-worker.js'); _gw.onmessage = e => { const w = _gwWait.get(e.data.id); if (!w) return; _gwWait.delete(e.data.id); e.data.error ? w[1](new Error(e.data.error)) : w[0](e.data.P); }; _gw.onerror = e => { e.preventDefault && e.preventDefault(); for (const [, w] of _gwWait) w[2](); _gwWait.clear(); _gw = null; window.__noWorker = true; }; } }
  catch (_) { window.__noWorker = true; return Promise.resolve().then(inline); }
  return new Promise((res, rej) => { const k = ++_gwId; _gwWait.set(k, [res, rej, () => { try { res(inline()); } catch (e) { rej(e); } }]); _gw.postMessage({ id: k, img, o: oo, env }); });
}
function buildPattern(delay = 200) {
  const seq = ++buildSeq; $('#prev').classList.add('busy'); clearTimeout(buildT);
  buildT = setTimeout(async () => {
    try { const src = await croppedImage(), o = engineOpts(), id = await glassImageData(src, o), t0 = performance.now(), R = await traceRun(id, o); if (seq !== buildSeq) return; R.ms = Math.round(performance.now() - t0); P = R; window.__P = P; view = view === 'trace' ? 'regions' : view; $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.view === view))); drawPattern(); renderControls(); save(); }
    catch (e) { if (seq === buildSeq) $('#prev').innerHTML = `<p class="wait">Couldn’t build the pattern: ${esc(e.message)}</p>`; }
    finally { if (seq === buildSeq) $('#prev').classList.remove('busy'); }
  }, delay);
}

/* ---------- step 3: pattern ---------- */
const svgFit = s => s.replace(/width="[^"]+in" height="[^"]+in"/, 'width="100%" preserveAspectRatio="xMidYMid meet"');
function regionsSVG(P) {
  const T = P.trace; if (!T) return '<p class="wait">No regions yet…</p>';
  const sx = ((P.gridW - 2 * P.f) / T.w).toFixed(5), sy = ((P.gridH - 2 * P.f) / T.h).toFixed(5);
  // soft photo colors + dark outlines so the region division is obvious
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.gridW} ${P.gridH}" width="100%"><rect width="${P.gridW}" height="${P.gridH}" fill="#1a1a1a"/><rect x="${P.f}" y="${P.f}" width="${P.gridW - 2 * P.f}" height="${P.gridH - 2 * P.f}" fill="${T.bg || '#888'}"/><g transform="translate(${P.f} ${P.f}) scale(${sx} ${sy})">${T.paths.map(([d, c]) => `<path d="${d}" fill="${c}" fill-opacity="0.92" stroke="#111" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}</g></svg>`;
}
function renderPattern() {
  $('#viewChips').innerHTML = VIEWS.map(([k, l]) => `<button data-view="${k}" aria-pressed="${k === view}">${l}</button>`).join('');
  $$('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawPattern(); });
  $('#toolSeg').innerHTML = TOOLS.map(([k, l]) => `<button data-tool="${k}" aria-pressed="${cur.tool === k}">${l}</button>`).join('');
  $$('[data-tool]').forEach(b => b.onclick = () => { cur.tool = b.dataset.tool; renderControls(); buildPattern(); });
  $('#lineSeg').innerHTML = `<button data-join="foil" aria-pressed="${cur.join === 'foil'}">Copper foil<small>Tiffany method</small></button><button data-join="came" aria-pressed="${cur.join === 'came'}">Lead came<small>traditional</small></button>`;
  $$('[data-join]').forEach(b => b.onclick = () => { cur.join = b.dataset.join; cur.line = LINES[cur.join][0][0]; renderControls(); buildPattern(); });
  $('#smoothSeg').innerHTML = SMOOTH.map(([k, l]) => `<button data-smooth="${k}">${l}</button>`).join('');
  $$('[data-smooth]').forEach(b => b.onclick = () => { cur.smooth = b.dataset.smooth; renderControls(); buildPattern(); });
  $('#paintSeg').innerHTML = [['light', 'Light'], ['medium', 'Medium'], ['bold', 'Bold']].map(([k, l]) => `<button data-pamt="${k}">${l}</button>`).join('');
  $$('[data-pamt]').forEach(b => b.onclick = () => { cur.tpaintAmt = b.dataset.pamt; renderControls(); buildPattern(); });
  renderControls();
  if (P) drawPattern(); else { setConvertPhase('photo'); $('#prev').innerHTML = '<p class="wait">Dividing your photo into regions…</p>'; $('#sum').textContent = ''; $('#glassLegend').hidden = true; buildPattern(0); }
}
function renderControls() {
  $('#det').value = cur.detail; $('#detV').textContent = cur.detail; $('#detPro').hidden = cur.detail < 9;
  { const t = self.PhotoTracer.rules({ detail: cur.detail, tool: cur.tool, line: cur.line }, 1).target; $('#detHint').textContent = P && P.stats ? `aiming for ~${t} · now ${P.stats.pieces}` : `aiming for ~${t} pieces`; }
  const sm = cur.smooth || 'medium'; $$('[data-smooth]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.smooth === sm))); $('#smoothNote').textContent = SMOOTH.find(x => x[0] === sm)[2];
  $$('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === cur.tool))); $('#toolNote').textContent = TOOLS.find(t => t[0] === cur.tool)[2];
  $$('[data-join]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.join === cur.join)));
  $('#lwSeg').innerHTML = LINES[cur.join].map(([k, l]) => `<button data-lw="${k}" aria-pressed="${cur.line === k}">${l}</button>`).join(''); $$('[data-lw]').forEach(b => b.onclick = () => { cur.line = b.dataset.lw; renderControls(); buildPattern(); });
  $('#paintOn').checked = cur.tpaint; $$('[data-pamt]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.pamt === cur.tpaintAmt)); b.disabled = !cur.tpaint; });
  $('#col').value = cur.tcolors; $('#colV').textContent = cur.tcolors;
}
$('#det').oninput = e => { cur.detail = +e.target.value; renderControls(); buildPattern(); };
$('#paintOn').onchange = e => { cur.tpaint = e.target.checked; renderControls(); buildPattern(); };
$('#col').oninput = e => { cur.tcolors = +e.target.value; $('#colV').textContent = cur.tcolors; buildPattern(); };
$('#op').oninput = e => { op = +e.target.value / 100; drawPattern(); };
function setConvertPhase(ph) {
  $$('#convertLine [data-ph]').forEach(el => { el.classList.toggle('on', el.dataset.ph === ph); el.classList.toggle('done', ['photo','regions','glass'].indexOf(el.dataset.ph) < ['photo','regions','glass'].indexOf(ph)); });
}
function renderLegend() {
  const box = $('#glassLegend'); if (!box || !P) return;
  const show = view === 'color' || view === 'regions';
  box.hidden = !show;
  if (!show) return;
  if (view === 'regions') {
    const n = P.trace ? P.trace.regions : 0;
    box.innerHTML = `<p class="leg-note"><b>Regions from your photo</b> — ${n.toLocaleString()} color areas found. Next, each area is matched to a named glass.</p>`;
    return;
  }
  box.innerHTML = `<p class="leg-note"><b>Best-match glass</b> — the fewest catalog sheets that match your photo closely (code · name · pieces).</p><div class="leg-row">` +
    P.legend.map(e => `<div class="leg"><span class="sw" style="background:${e.hex}"></span><span class="nm">${e.code ? `<small class="code">${esc(e.code)}</small> ` : ''}${esc(e.glass)}</span><span class="ct">${e.count}</span></div>`).join('') + `</div>`;
}
function drawPattern() {
  if (!P || step !== 'pattern') return; const prev = $('#prev'), hasPaint = !!(P.paint && P.paint.lines.length);
  $$('[data-view=paint]').forEach(b => b.hidden = !hasPaint); if (view === 'paint' && !hasPaint) view = 'cut';
  // migrate old saved view id
  if (view === 'trace') view = 'regions';
  $('#opWrap').hidden = view !== 'overlay';
  setConvertPhase(view === 'regions' ? 'regions' : (view === 'color' ? 'glass' : 'glass'));
  if (view === 'regions') prev.innerHTML = regionsSVG(P);
  else if (view === 'cut') prev.innerHTML = svgFit(glassSVG(P, { cut: true, numbers: true }));
  else if (view === 'paint') prev.innerHTML = svgFit(glassSVG(P, { cut: true, numbers: true, paintGuide: true }));
  else if (view === 'overlay') prev.innerHTML = svgFit(glassSVG(P, { photo: cropURL, opacity: op, numbers: false }));
  else prev.innerHTML = svgFit(glassSVG(P, { numbers: false }));
  renderLegend();
  const s = P.stats;
  $('#sum').innerHTML = view === 'regions'
    ? `<b>Regions</b> — your photo divided into ${P.trace ? P.trace.regions.toLocaleString() : ''} color areas. Tap <b>Glass</b> to see each area filled with its best-match stained-glass color. The cuttable pattern has <b>${s.pieces} pieces</b>.`
    : view === 'color'
    ? `<b>${s.pieces} pieces</b> filled with <b>${P.legend.length} glass colors</b> matched from the ${P.match ? P.match.catalog + '-glass catalog' : 'palette'} · <span class="diff ${s.difficulty === 'Beginner' ? 'beg' : 'int'}">${esc(s.difficulty)}</span><br><span class="muted">Smallest piece ${areaU(s.smallestIn)} · ${sizeU(P.widthIn, P.heightIn)} · ${esc(s.toolLabel || '')}</span>`
    : `<b>${s.pieces} pieces</b> · ${P.legend.length} glass colors · <span class="diff ${s.difficulty === 'Beginner' ? 'beg' : 'int'}">${esc(s.difficulty)}</span><br><span class="muted">Smallest piece ${areaU(s.smallestIn)} · ${sizeU(P.widthIn, P.heightIn)} · ${esc(s.toolLabel || '')}${view === 'paint' ? ' · dashed lines = paint, not cuts' : ''}</span>`;
}

/* ---------- step 4: glass & materials ---------- */
function renderGlass() {
  if (!P) { $('#glassList').innerHTML = '<p class="wait">Building your pattern first…</p>'; $('#matCard').innerHTML = ''; go('pattern'); return; }
  const sheets = cmU() ? [...SHEETS_CM, ...SHEETS_IN] : SHEETS_IN; if (!sheets.find(s => s[0] === cur.sheet)) cur.sheet = sheets[cmU() ? 1 : 2][0];
  $('#sheetSel').innerHTML = sheets.map(s => `<option value="${s[0]}" ${s[0] === cur.sheet ? 'selected' : ''}>${s[0].endsWith('cm') ? s[0].replace('cm', '').replace('x', ' × ') + ' cm' : s[1] + ' × ' + s[2] + ' in'}</option>`).join('');
  $('#sheetSel').onchange = e => { cur.sheet = e.target.value; renderGlass(); save(); };
  $('#wasteSeg').innerHTML = WASTE.map(([v, l, t]) => `<button data-waste="${v}" aria-pressed="${cur.waste === v}" title="${t}">+${v}%<small>${l}</small></button>`).join('');
  $$('[data-waste]').forEach(b => b.onclick = () => { cur.waste = +b.dataset.waste; renderGlass(); save(); });
  const M = glassMaterials(P, { sheet: cur.sheet, waste: cur.waste, line: cur.join }); window.__M = M;
  $('#glassList').innerHTML = M.colors.map(c => {
    const match = c.srcHex ? `<span class="match"><i class="dot" style="background:${c.srcHex}" title="Average photo color"></i><span class="arr">→</span><i class="dot" style="background:${c.hex}" title="${esc(c.glass)}"></i><em>${c.code ? esc(MATCH(c.dE)) + (c.dE != null ? ` · ΔE ${c.dE}` : '') : 'best match'}</em></span>` : `<span class="match"><em>best match from palette</em></span>`;
    return `<div class="gl"><span class="sw" style="background:${c.hex}"></span><div><b>${c.code ? `<span class="code">${esc(c.code)}</span> ` : ''}${esc(c.glass)}</b>${c.family ? `<small class="fam">${esc(FAMN[c.family] || '')}</small>` : ''}${match}<small>${c.count} piece${c.count === 1 ? '' : 's'} · ${areaU(c.areaIn)} → buy ${areaU(c.buyIn)}</small>${c.fits ? '' : `<small class="warnline">${c.bigFrame ? `Border strip #${c.bigN} is longer than this sheet — buy a longer sheet or cut the strip in two` : `Piece #${c.bigN} is bigger than one sheet — buy a larger sheet`}</small>`}${c.scrap ? '<small>Tiny amount: a scrap or offcut will do</small>' : ''}</div><div class="n">${c.scrap ? '<small>scrap</small>' : `${c.sheets}<small> sheet${c.sheets === 1 ? '' : 's'}</small>`}</div></div>`;
  }).join('');
  const foil = cur.join === 'foil';
  $('#matCard').innerHTML = `<h3>Totals</h3><div class="tot"><div><b>${M.pieces}</b><small>pieces to cut</small></div><div><b>${M.sheets}</b><small>sheets${M.scraps ? ` + ${M.scraps} scrap${M.scraps === 1 ? '' : 's'}` : ''} · ${M.colors.length} colors</small></div><div><b>${areaU(M.areaIn)}</b><small>glass in the panel</small></div><div><b>${areaU(M.buyIn)}</b><small>to buy (+${M.waste}%)</small></div></div>
    ${foil ? `<div class="matrow"><b>Copper foil: ${lenU(M.foil.in)}</b> <span class="muted">→ ${M.foil.rolls} roll${M.foil.rolls === 1 ? '' : 's'} of ${M.foil.width} (36 yd)</span><br><span class="small muted">Every piece is wrapped all round (${lenU(M.perimIn)} of edges) + 10%.</span></div>`
      : `<div class="matrow"><b>Lead came: ${lenU(M.came.innerIn)} H came</b> <span class="muted">→ ${M.came.innerStrips} × 6 ft strips</span><br><span class="small muted">Inside seams counted once, + 15%.</span></div><div class="matrow"><b>Border: ${lenU(M.came.borderIn)} U came or zinc</b> <span class="muted">→ ${M.came.borderStrips} strip${M.came.borderStrips === 1 ? '' : 's'}</span></div>`}
    <div class="matrow small muted">Also: ${foil ? '60/40 solder, flux, a burnisher' : 'lead knife, horseshoe nails, solder, flux, cement'}. Buy each color from one batch so it matches.</div>`;
  $('#assume').innerHTML = `<ul>
    <li><b>Glass</b> = the area of each color’s pieces × (1 + waste), rounded <b>up</b> to whole sheets, per color. Waste covers offcuts, curves and the odd bad break: suppliers suggest <b>20–30%</b> (<a href="https://www.gordonsglass.net/calculating-how-much-stained-glass-youll-need/" target="_blank" rel="noopener">Gordon’s Glass</a>), 10–15% for straight cuts up to 35–50% for heavy curves (<a href="https://superglobalcalculator.com/calculators/stained-glass/cutting-waste-factor/" target="_blank" rel="noopener">waste guide</a>). 30% is the beginner default; streaky glass whose grain must line up can need 50%.</li>
    <li>Each color also needs a sheet big enough for its <b>largest piece</b> (<a href="https://ezglasspattern.com/stained-glass-calculator" target="_blank" rel="noopener">EZGlassPattern</a>) — flagged in orange if not.</li>
    <li><b>Copper foil</b> = the total edge length of every piece (seams count twice, both pieces get wrapped) + 10% (<a href="https://ezglasspattern.com/stained-glass-calculator" target="_blank" rel="noopener">EZGlassPattern</a>, <a href="https://vartglass.com/tutorial/chapter-6-calculate-materials/" target="_blank" rel="noopener">VArtGlass</a>). Rolls are 36 yd; 7/32″ suits standard 3 mm glass.</li>
    <li><b>Lead came</b> = (edge length − panel outline) ÷ 2 for inside seams + the outline for the border, + 15% for trimming; sold in 6 ft strips (<a href="https://superglobalcalculator.com/calculators/stained-glass/lead-came/" target="_blank" rel="noopener">came guide</a>).</li>
    <li>Edges are measured on this pattern’s actual traced outlines, not guessed from the piece count. It can’t know how pieces nest on a real sheet or which way the grain must run, so treat these as a shopping guide.</li></ul>`;
}

/* ---------- step 5: print & export ---------- */
function renderPrint() {
  if (!P) { go('pattern'); return; }
  $$('[data-paper]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.paper === cur.paper)); b.onclick = () => { cur.paper = b.dataset.paper; renderPrint(); save(); }; });
  const L = tileLayout(P, cur.paper), k = 10, W = P.widthIn * k, H = P.heightIn * k, pad = 4;
  let g = ''; for (let r = 0; r < L.rows; r++) for (let q = 0; q < L.cols; q++) { const x = q * L.sx * k, y = r * L.sy * k, w = Math.min(L.tw, P.widthIn - q * L.sx) * k, h = Math.min(L.th, P.heightIn - r * L.sy) * k; g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#d01c1c" stroke-width="1.2" stroke-dasharray="4 2"/><text x="${x + 5}" y="${y + 16}" font-size="13" font-weight="700" fill="#d01c1c" font-family="system-ui">${rowL(r)}${q + 1}</text>`; }
  const pat = glassSVG(P, { cut: true, numbers: false, scaleBar: false }).replace(/width="[^"]+in" height="[^"]+in"/, `x="0" y="0" width="${W}" height="${H}"`);
  $('#tileMap').innerHTML = `<svg viewBox="${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}" xmlns="http://www.w3.org/2000/svg">${pat}${g}</svg>`;
  $('#tileNote').innerHTML = `<b>${sizeU(P.widthIn, P.heightIn)}</b> prints full size on <b>${L.n} ${cur.paper === 'a4' ? 'A4' : 'Letter'} page${L.n === 1 ? '' : 's'}</b>${L.n > 1 ? ` (${L.rows} × ${L.cols}${L.land ? ', landscape' : ''}) + a cover with this map` : ' + a cover'}. Pages overlap ½ in; line up the red ⊕ marks and tape.`;
  $$('.export').forEach(b => b.onclick = () => doExport(b.dataset.exp, b));
}
const fname = ext => `${(cur.name || 'pattern').replace(/[^\w-]+/g, '-').toLowerCase()}-${P.stats.pieces}pc-${P.widthIn}x${P.heightIn}in.${ext}`;
async function doExport(kind, btn) {
  if (!P) return; btn && btn.classList.add('busy');
  try {
    const M = glassMaterials(P, { sheet: cur.sheet, waste: cur.waste, line: cur.join });
    if (kind === 'full') { const d = glassFullPDF(P, { paper: cur.paper, kind: 'cut', name: cur.name }); window.__lastPDF = d.meta; await shareOrDownload(fname('pdf').replace('.pdf', '-fullsize.pdf'), d.blob(), 'application/pdf'); }
    else if (kind === 'paint') { if (!(P.paint && P.paint.lines.length)) { toast('Turn on Paint lines on the Pattern step first'); return; } const d = glassFullPDF(P, { paper: cur.paper, kind: 'paint', name: cur.name }); window.__lastPDF = d.meta; await shareOrDownload(fname('pdf').replace('.pdf', '-paintguide.pdf'), d.blob(), 'application/pdf'); }
    else if (kind === 'sheet') { const d = glassCutSheetPDF(P, M, { paper: cur.paper, name: cur.name }); window.__lastPDF = d.meta; await shareOrDownload(fname('pdf').replace('.pdf', '-cutsheet.pdf'), d.blob(), 'application/pdf'); }
    else if (kind === 'svg') { const svg = patternExportSVG(P); window.__lastSVG = svg; await shareOrDownload(fname('svg'), svg, 'image/svg+xml'); }
    else if (kind === 'png') { const u = await patternJPEG(P, 2000); const b = await (await fetch(u)).blob(); await shareOrDownload(fname('jpg'), b, 'image/jpeg'); }
    else if (kind === 'list') { const t = shoppingListText(P, M, { name: cur.name, cm: cmU() }); try { await navigator.clipboard.writeText(t); toast('Shopping list copied'); } catch (_) {} await shareOrDownload(fname('txt').replace('.txt', '-shopping-list.txt'), t, 'text/plain'); }
  } catch (e) { toast('Export failed: ' + e.message); } finally { btn && btn.classList.remove('busy'); }
}

/* ---------- about ---------- */
$('#btnAbout').onclick = () => openSheet(`<h3>Glass Pattern Studio <small class="muted">${APP_VERSION}</small></h3>
  <p class="small"><b>Stained glass from a photo.</b> Take a picture, the app divides it into regions, then fills each region with the closest glass from a ${typeof GLASS_CATALOG !== 'undefined' ? GLASS_CATALOG.length : ''}-sheet catalog (cathedral, opalescent, streaky), matched by CIEDE2000.</p><p class="small">Pieces are kept cuttable for your tools: no slivers or tiny islands, every piece at least the tool’s minimum size, and inside curves no tighter than the tool can cut. Catalog codes are this app’s own numbers, not manufacturer SKUs — colors are approximate, so check the real sheet. You get numbered pieces, a shopping list and a full-size print. No account, no AI key, no server — everything stays on this device.</p>
  <p class="small"><span class="pro">PRO</span> marks features that could be part of a paid version later (full-size tiled PDFs, SVG export, Detail 9–10, more than ${FREE_PROJECTS} projects). Nothing is locked or charged in this preview.</p>
  <p class="small muted">Working name — rename before selling (see NOTES.md). Sample photos: Wikimedia Commons, CC0. Cutting and material rules from published stained-glass guides.</p>
  <button class="primary" style="width:100%" onclick="closeSheet()">Close</button>`);

/* ---------- boot ---------- */
go('home');
if (!localStorage.getItem('gps.guideSeen')) { openGuide(0, () => localStorage.setItem('gps.guideSeen', '1')); }
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.__noSW) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__state = () => ({ step, view, cur, P });
