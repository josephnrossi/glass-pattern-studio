/* Glass Pattern Studio — print & export.
   Full-size PDFs are tiled onto Letter or A4 with a 1/2″ overlap, target alignment marks in every overlap, page labels (A1, A2 …) with "joins" arrows,
   an assembly map on the cover, and a scale-check square (1 in + 2 cm) on every page. Drawing reuses drawPieces() from glass.js (copied from Scan Lab). */
const PAPERS = { letter: { w: 612, h: 792, label: 'Letter (8.5 × 11 in)' }, a4: { w: 595.28, h: 841.89, label: 'A4 (210 × 297 mm)' } };
const PM = { side: 30, top: 30, bottom: 100 }, OV = 0.5; // pt margins; overlap in inches
const rowL = r => String.fromCharCode(65 + r);
/* how a panel tiles onto a paper; tries portrait and landscape pages and keeps the one with fewer pages */
function tileLayout(P, paper = 'letter') {
  const pp = PAPERS[paper] || PAPERS.letter, opts = [[pp.w, pp.h], [pp.h, pp.w]].map(([PW, PH]) => {
    const tw = (PW - 2 * PM.side) / 72, th = (PH - PM.top - PM.bottom) / 72, fits = P.widthIn <= tw && P.heightIn <= th;
    const cols = fits || P.widthIn <= tw ? 1 : Math.ceil((P.widthIn - OV) / (tw - OV)), rows = fits || P.heightIn <= th ? 1 : Math.ceil((P.heightIn - OV) / (th - OV));
    return { PW, PH, tw, th, cols, rows, n: cols * rows, sx: tw - OV, sy: th - OV, land: PW > PH };
  });
  return opts[1].n < opts[0].n ? opts[1] : opts[0];
}
function checkSquare(p, x, y) { // x,y = bottom-left in pt
  p.stroke(0, 0, 0).lw(0.75).rect(x, y, 72, 72, 'S'); p.textAt(x + 18, y + 32, 9, '1 inch', true); p.textAt(x + 9, y + 20, 6.5, 'measure: 25.4 mm');
  const c = 2 / 2.54 * 72; p.rect(x + 84, y, c, c, 'S'); p.textAt(x + 89, y + c / 2 - 3, 8, '2 cm', true);
  p.textAt(x + 84, y + c + 6, 6.5, 'Check with a ruler before cutting', false, [90, 90, 90]);
}
function pdfFooter(p, PW, txt, n, N) { p.text(PM.side, p.h - 22, 8, `${txt} · page ${n} of ${N}`, false, [90, 90, 90]); }
function glassFullPDF(P, { paper = 'letter', kind = 'cut', name = 'Pattern' } = {}) {
  const L = tileLayout(P, paper), doc = new PDFDoc(), lw = P.lineIn * P.ppi, cut = kind !== 'color', pm = P.paint && P.paint.lines.length ? (kind === 'paint' ? 'guide' : kind === 'color' ? 'color' : '') : '';
  const keyPage = !!(P.legend && P.legend.length), lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], N = 1 + L.n + (keyPage ? 1 : 0), title = kind === 'paint' ? 'Paint guide — full size' : kind === 'color' ? 'Color pattern — full size' : 'Cut pattern — full size';
  // cover
  const c = doc.page(L.PW, L.PH); let y = PM.top;
  c.text(PM.side, y, 18, `${name} — ${title}`, true); y += 26;
  c.text(PM.side, y, 10.5, `Finished size ${P.widthIn} × ${P.heightIn} in (${(P.widthIn * 2.54).toFixed(1)} × ${(P.heightIn * 2.54).toFixed(1)} cm) · ${P.stats.pieces} pieces · ${P.lineLabel}`); y += 15;
  c.text(PM.side, y, 10.5, `Printed on ${L.n} ${PAPERS[paper].label} page${L.n === 1 ? '' : 's'}${L.n > 1 ? ` (${L.rows} row${L.rows > 1 ? 's' : ''} × ${L.cols} column${L.cols > 1 ? 's' : ''}, ${L.land ? 'landscape' : 'portrait'})` : ''}.`); y += 20;
  // assembly map
  const mapW = L.PW - 2 * PM.side, mapH = 300, s = Math.min(mapW / P.gridW, mapH / P.gridH), ox = PM.side + (mapW - s * P.gridW) / 2, top = L.PH - y;
  c.op(`q ${f2(s)} 0 0 ${f2(-s)} ${f2(ox)} ${f2(top)} cm`); drawPieces(c, P, cut, lw, pm); c.op('Q');
  const sIn = s * P.ppi; c.stroke(220, 0, 0).lw(1);
  for (let r = 0; r < L.rows; r++) for (let q = 0; q < L.cols; q++) { const x0 = ox + q * L.sx * sIn, y0 = top - r * L.sy * sIn, w = Math.min(L.tw, P.widthIn - q * L.sx) * sIn, h = Math.min(L.th, P.heightIn - r * L.sy) * sIn; c.rect(x0, y0 - h, w, h, 'S'); c.textAt(x0 + 4, y0 - 14, 11, rowL(r) + (q + 1), true, [220, 0, 0]); }
  y += s * P.gridH + 16;
  const steps = ['Print every page at 100% / “Actual size” — not “Fit to page”. Measure the check square: it must be exactly 1 inch (or 2 cm).',
    L.n > 1 ? 'Lay the pages out like the map above (red boxes). Each page overlaps its neighbours by 1/2 inch: line up the red target marks (+ in a circle), then tape.' : 'The whole pattern fits on one page.',
    kind === 'paint' ? 'Dashed grey lines are paint lines: trace them onto the cut pieces with glass paint. Solid lines show where the pieces meet.' : 'Print two copies: cut one apart on the lines (pattern shears) to trace onto glass; keep the other whole to build on.',
    'Numbers match the cut sheet and glass list — write each number on the back of its glass piece.'];
  for (const t of steps) y = c.para(PM.side, y, mapW, 9.5, '• ' + t) + 2;
  checkSquare(c, L.PW - PM.side - 150, 30); pdfFooter(c, L.PW, `Glass Pattern Studio · ${name} · ${title} · cover`, 1, N);
  // v0.3 colour key: which glass each numbered piece is cut from (code + name + family + piece numbers)
  let pg = 2;
  if (keyPage) { const k = doc.page(L.PW, L.PH), FAM = { C: 'Cathedral', O: 'Opalescent', S: 'Streaky', M: 'Your glass' }; let ky = PM.top;
    k.text(PM.side, ky, 16, 'Color key — glass for each numbered piece', true); ky += 22;
    k.text(PM.side, ky, 9, 'Write the number (and the glass code) on the back of every glass piece as you cut it.', false, [80, 80, 80]); ky += 18;
    for (const e of P.legend) { if (ky > L.PH - PM.bottom - 10) break; const rgb = [1, 3, 5].map(i => parseInt(e.hex.slice(i, i + 2), 16));
      k.fill(...rgb).stroke(60, 60, 60).lw(0.6).rect(PM.side, L.PH - ky - 20, 26, 20, 'B');
      k.text(PM.side + 34, ky, 11, `${e.code ? e.code + '  ' : ''}${e.glass}${e.family ? ' · ' + (FAM[e.family] || '') : ''}`, true);
      k.text(PM.side + 34, ky + 13, 8.5, `${e.count} piece${e.count === 1 ? '' : 's'} · ${e.areaIn.toFixed(1)} sq in${e.dE != null && e.code ? ` · color match dE ${e.dE} (CIEDE2000)` : ''}`, false, [70, 70, 70]);
      ky = k.para(PM.side + 34, ky + 25, L.PW - 2 * PM.side - 34, 8, 'Pieces ' + e.pieces.join(', '), false, [90, 90, 90]) + 8; }
    pdfFooter(k, L.PW, `Glass Pattern Studio · ${name} · color key`, pg++, N); }
  for (let r = 0; r < L.rows; r++) for (let q = 0; q < L.cols; q++) {
    const p = doc.page(L.PW, L.PH), x0 = q * L.sx, y0 = r * L.sy, sc = 72 / P.ppi, Lx = PM.side, Ty = L.PH - PM.top, Wt = L.tw * 72, Ht = L.th * 72;
    p.op('q').op(`${f2(Lx)} ${f2(Ty - Ht)} ${f2(Wt)} ${f2(Ht)} re W n`);
    p.op(`${f2(sc)} 0 0 ${f2(-sc)} ${f2(Lx - x0 * 72)} ${f2(Ty + y0 * 72)} cm`); drawPieces(p, P, cut, lw, pm); p.op('Q');
    p.op('q').op(`${f2(Lx)} ${f2(Ty - Ht)} ${f2(Wt)} ${f2(Ht)} re W n`);
    for (const pc of P.pieces) { const px = Lx + (pc.label[0] / P.ppi - x0) * 72, py = Ty - (pc.label[1] / P.ppi - y0) * 72, fs = Math.max(6, Math.min(14, pc.font * sc)); if (px < Lx - 20 || px > Lx + Wt + 20 || py < Ty - Ht - 20 || py > Ty + 20) continue; const t = String(pc.n), w = t.length * fs * 0.55; p.textAt(px - w / 2, py - fs * 0.35, fs, t, true, cut || lum(pc.rgb) > 140 ? [0, 0, 0] : [255, 255, 255]);
      if (cut && pc.code && pc.font * sc >= 7) { const f2s = Math.max(4.5, fs * 0.5); p.textAt(px - pc.code.length * f2s * 0.28, py - fs * 0.35 - f2s * 1.25, f2s, pc.code, false, [110, 110, 110]); } }
    // overlap strips (dashed) + ⊕ marks
    p.stroke(220, 0, 0).lw(0.6).op('[3 3] 0 d');
    const PX = X => Lx + (X - x0) * 72, PY = Y => Ty - (Y - y0) * 72;
    if (q < L.cols - 1) p.line(PX((q + 1) * L.sx), Ty, PX((q + 1) * L.sx), Ty - Ht); if (q > 0) p.line(PX(q * L.sx + OV), Ty, PX(q * L.sx + OV), Ty - Ht);
    if (r < L.rows - 1) p.line(Lx, PY((r + 1) * L.sy), Lx + Wt, PY((r + 1) * L.sy)); if (r > 0) p.line(Lx, PY(r * L.sy + OV), Lx + Wt, PY(r * L.sy + OV));
    p.op('[] 0 d');
    const mark = (X, Y) => { const px = PX(X), py = PY(Y); if (px < Lx - 1 || px > Lx + Wt + 1 || py < Ty - Ht - 1 || py > Ty + 1) return; p.line(px - 9, py, px + 9, py).line(px, py - 9, px, py + 9).op(`${f2(px + 5)} ${f2(py)} m ${f2(px + 5)} ${f2(py + 2.76)} ${f2(px + 2.76)} ${f2(py + 5)} ${f2(px)} ${f2(py + 5)} c ${f2(px - 2.76)} ${f2(py + 5)} ${f2(px - 5)} ${f2(py + 2.76)} ${f2(px - 5)} ${f2(py)} c ${f2(px - 5)} ${f2(py - 2.76)} ${f2(px - 2.76)} ${f2(py - 5)} ${f2(px)} ${f2(py - 5)} c ${f2(px + 2.76)} ${f2(py - 5)} ${f2(px + 5)} ${f2(py - 2.76)} ${f2(px + 5)} ${f2(py)} c S`); };
    for (let k = 1; k < L.cols; k++) for (const Y of [0.5, P.heightIn / 2, P.heightIn - 0.5]) mark(k * L.sx + OV / 2, Y);
    for (let k = 1; k < L.rows; k++) for (const X of [0.5, P.widthIn / 2, P.widthIn - 0.5]) mark(X, k * L.sy + OV / 2);
    for (let a = 1; a < L.cols; a++) for (let b = 1; b < L.rows; b++) mark(a * L.sx + OV / 2, b * L.sy + OV / 2);
    p.op('Q');
    // page label + neighbours
    const id = rowL(r) + (q + 1), nb = [q < L.cols - 1 ? `right edge joins ${rowL(r)}${q + 2}` : '', r < L.rows - 1 ? `bottom edge joins ${rowL(r + 1)}${q + 1}` : ''].filter(Boolean).join(' · ');
    p.fill(220, 0, 0).text(Lx, L.PH - PM.bottom + 12, 22, id, true, [220, 0, 0]);
    p.text(Lx + 44, L.PH - PM.bottom + 14, 9, L.n > 1 ? `Page ${id} of the ${L.rows}×${L.cols} map${nb ? ' — ' + nb : ''}` : 'Full size — one page', false, [60, 60, 60]);
    p.text(Lx + 44, L.PH - PM.bottom + 27, 8, L.n > 1 ? 'Line up the red target marks with the neighbouring page; the dashed red line shows where it overlaps.' : '', false, [90, 90, 90]);
    checkSquare(p, L.PW - PM.side - 150, 12); pdfFooter(p, L.PW, `Glass Pattern Studio · ${name} · ${title}`, pg++, N);
  }
  doc.meta = { pages: N, rows: L.rows, cols: L.cols, land: L.land, paper };
  return doc;
}
/* numbered cut sheet: page 1 = colour map with numbers fitted to one page; page 2+ = cut list by glass colour */
function glassCutSheetPDF(P, M, { paper = 'letter', name = 'Pattern' } = {}) {
  const pp = PAPERS[paper] || PAPERS.letter, doc = new PDFDoc(), PW = pp.w, PH = pp.h, lw = P.lineIn * P.ppi, lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const a = doc.page(PW, PH); let y = PM.top;
  a.text(PM.side, y, 18, `${name} — numbered cut sheet`, true); y += 24;
  a.text(PM.side, y, 10, `Reference only, NOT to scale · ${P.widthIn} × ${P.heightIn} in · ${P.stats.pieces} pieces · ${M.colors.length} glass colors · ${P.stats.difficulty}`, false, [70, 70, 70]); y += 18;
  const bw = PW - 2 * PM.side, bh = PH - y - 60, s = Math.min(bw / P.gridW, bh / P.gridH), ox = PM.side + (bw - s * P.gridW) / 2, top = PH - y;
  a.op(`q ${f2(s)} 0 0 ${f2(-s)} ${f2(ox)} ${f2(top)} cm`); drawPieces(a, P, false, lw, P.paint && P.paint.lines.length ? 'color' : ''); a.op('Q');
  for (const pc of P.pieces) { const fs = Math.max(4.5, Math.min(11, pc.font * s * 1.1)), t = String(pc.n), w = t.length * fs * 0.55; a.textAt(ox + pc.label[0] * s - w / 2, top - pc.label[1] * s - fs * 0.35, fs, t, true, lum(pc.rgb) > 140 ? [0, 0, 0] : [255, 255, 255]); }
  pdfFooter(a, PW, `Glass Pattern Studio · ${name} · cut sheet`, 1, 2);
  // list
  const b = doc.page(PW, PH); y = PM.top; b.text(PM.side, y, 16, 'Cut list by glass color', true); y += 22;
  b.text(PM.side, y, 9, 'Cut the biggest pieces of each sheet first. * = small or tricky piece (cut last; a grinder or ring saw helps).', false, [70, 70, 70]); y += 16;
  const flag = new Set([...(P.stats.flagged.advanced || []), ...(P.stats.flagged.small || []), ...(P.stats.flagged.narrow || []), ...(P.stats.flagged.grind || []), ...(P.stats.flagged.saw || [])]);
  let page = b, pg = 2;
  for (const e of M.colors) {
    if (y > PH - 80) { page = doc.page(PW, PH); y = PM.top; pg++; }
    const rgb = [1, 3, 5].map(i => parseInt(e.hex.slice(i, i + 2), 16)); page.fill(...rgb).stroke(80, 80, 80).lw(0.5).rect(PM.side, PH - y - 14, 18, 14, 'B');
    page.text(PM.side + 26, y, 11, `${e.code ? e.code + ' ' : ''}${e.glass} — ${e.count} piece${e.count === 1 ? '' : 's'}, ${e.areaIn.toFixed(1)} sq in (${e.scrap ? 'a scrap piece is enough' : `buy ${e.sheets} × ${M.sheet[0].replace('cm', ' cm')} sheet${e.sheets === 1 ? '' : 's'}`})`, true); y += 16;
    y = page.para(PM.side + 26, y, PW - 2 * PM.side - 26, 9, e.pieces.map(n => '#' + n + (flag.has(n) ? '*' : '')).join('  '), false, [40, 40, 40]) + 8;
  }
  doc.pages.forEach((p, i) => { if (i) pdfFooter(p, PW, `Glass Pattern Studio · ${name} · cut list`, i + 1, doc.pages.length); });
  doc.pages[0].ops = doc.pages[0].ops.map(o => o.replace(/page 1 of 2/, `page 1 of ${doc.pages.length}`));
  doc.meta = { pages: doc.pages.length }; return doc;
}
function fmtLen(inches, cm) { return cm ? (inches * 2.54 / 100).toFixed(1) + ' m' : (inches / 12).toFixed(1) + ' ft'; }
function fmtArea(sqin, cm) { return cm ? Math.round(sqin * 6.4516).toLocaleString() + ' cm²' : sqin.toFixed(1) + ' sq in'; }
function shoppingListText(P, M, { name = 'Pattern', cm = false } = {}) {
  const l = [`${name} — stained glass shopping list`, `${P.widthIn} × ${P.heightIn} in panel · ${P.stats.pieces} pieces`, '', `GLASS (${M.sheet[0].replace('cm', ' cm')} sheets, +${M.waste}% for waste):`];
  for (const c of M.colors) l.push(`• ${c.code ? c.code + ' ' : ''}${c.glass}${c.family ? ` (${({ C: 'cathedral', O: 'opalescent', S: 'streaky' })[c.family] || 'your glass'})` : ''}: ${c.scrap ? 'scrap piece' : c.sheets + ' sheet' + (c.sheets === 1 ? '' : 's')} (${fmtArea(c.areaIn, cm)} in ${c.count} piece${c.count === 1 ? '' : 's'})${c.scrap ? ' — offcuts will do' : ''}${c.fits ? '' : ' — largest piece is bigger than one sheet: buy a bigger sheet'}`);
  l.push('');
  if (M.line === 'came') l.push(`LEAD CAME: ${fmtLen(M.came.innerIn, cm)} of H came inside (${M.came.innerStrips} × 6 ft strips) + ${fmtLen(M.came.borderIn, cm)} border U came or zinc (${M.came.borderStrips} strips), incl. 15% extra.`, 'Also: lead knife, horseshoe nails, 60/40 or 50/50 solder, flux, cement.');
  else l.push(`COPPER FOIL: ${fmtLen(M.foil.in, cm)} incl. 10% extra — ${M.foil.rolls} roll${M.foil.rolls === 1 ? '' : 's'} of ${M.foil.width} foil (36 yd each).`, 'Also: 60/40 solder, flux, burnisher; patina optional.');
  l.push('', 'Estimates only — buy all of one color from the same batch so it matches.', 'Made with Glass Pattern Studio');
  return l.join('\n');
}
/* v0.3 SVG export: the real-size pattern (glass fills, lead lines at their true width, numbered pieces, data-code per piece)
   plus a color key strip BELOW the panel — the panel itself stays at exact scale (1 in = 1 in), the key only adds height. */
function patternExportSVG(P, { key = true } = {}) {
  const inner = glassSVG(P, { cut: false, numbers: true }).replace(/^<svg [^>]*>/, m => m.replace(/width="[^"]+in" height="[^"]+in"/, `x="0" y="0" width="${P.gridW}" height="${P.gridH}"`));
  if (!key || !(P.legend && P.legend.length)) return inner;
  const u = P.ppi, fs = 0.16 * u, rowH = 0.42 * u, cols = P.widthIn >= 14 ? 3 : P.widthIn >= 9 ? 2 : 1, colW = P.gridW / cols, rows = Math.ceil(P.legend.length / cols), pad = 0.25 * u, keyH = pad * 2 + 0.3 * u + rows * rowH;
  const FAM = { C: 'cathedral', O: 'opalescent', S: 'streaky', M: 'your glass' }, x = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const items = P.legend.map((e, i) => { const cx = (i % cols) * colW + pad, cy = P.gridH + pad + 0.3 * u + Math.floor(i / cols) * rowH, nums = e.pieces.length > 14 ? e.pieces.slice(0, 14).join(', ') + ' …' : e.pieces.join(', ');
    return `<g><rect x="${+cx.toFixed(1)}" y="${+cy.toFixed(1)}" width="${+(0.36 * u).toFixed(1)}" height="${+(0.3 * u).toFixed(1)}" fill="${e.hex}" stroke="#333" stroke-width="${+(0.01 * u).toFixed(2)}"/><text x="${+(cx + 0.46 * u).toFixed(1)}" y="${+(cy + fs * 0.9).toFixed(1)}" font-size="${+fs.toFixed(1)}" font-weight="700">${x((e.code ? e.code + ' ' : '') + e.glass)}<tspan font-weight="400" fill="#555"> · ${e.count} pc · ${e.areaIn.toFixed(1)} sq in${e.family ? ' · ' + (FAM[e.family] || '') : ''}</tspan></text><text x="${+(cx + 0.46 * u).toFixed(1)}" y="${+(cy + fs * 2).toFixed(1)}" font-size="${+(fs * 0.75).toFixed(1)}" fill="#666">#${x(nums)}</text></g>`; }).join('');
  const H = P.gridH + keyH;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${P.widthIn}in" height="${+(H / u).toFixed(3)}in" viewBox="0 0 ${P.gridW} ${+H.toFixed(1)}" data-ppi="${P.ppi}">
<desc>Glass Pattern Studio ${P.widthIn}×${P.heightIn} in pattern, ${P.stats.pieces} pieces, ${P.legend.length} glasses. Panel at real size (top); color key below the panel.</desc>
${inner}
<g id="key" font-family="Helvetica, Arial, sans-serif"><rect x="0" y="${P.gridH}" width="${P.gridW}" height="${+keyH.toFixed(1)}" fill="#fff"/><text x="${+pad.toFixed(1)}" y="${+(P.gridH + pad + fs).toFixed(1)}" font-size="${+(fs * 1.1).toFixed(1)}" font-weight="700">Color key</text>${items}</g>
</svg>`;
}
