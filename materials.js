/* Glass Pattern Studio — glass & materials estimate from a built pattern P (glass.js / tracer.js output).
   Rules of thumb (sources in NOTES.md):
   • Glass per color = area of that color's pieces × (1 + waste). Waste default 30% for beginners (Gordon's Glass: add 20–30%; madekeeper default 30%;
     everythingstainedglass: 15–25%, up to 30% if rusty; superglobalcalculator: 10–15% straight cuts, 20–30% gentle curves, 35–50% heavy curves). Rounded UP to whole sheets, per color
     (VArtGlass: "always rounded up because part of a standard piece cannot be purchased"). Also checks that the largest piece of each color fits on one sheet (EZGlassPattern: "each colour needs a sheet big enough for its largest piece").
   • Copper foil = sum of every piece's perimeter (shared seams count twice — both pieces are wrapped) + 10% (EZGlassPattern, VArtGlass). Sold in 36-yard (108 ft) rolls; 7/32″ suits standard 3 mm glass (superglobalcalculator).
   • Lead came = (sum of piece perimeters − panel perimeter) ÷ 2 for the inside seams (H came) + the panel perimeter for the border (U came or zinc), + 15% for trimming (superglobalcalculator, stainedglasswow). Sold in 6 ft strips.
   • A color needing less than 1/12 of a sheet (about 3 × 4 in of a 12 × 12 sheet) is shown as "scrap" (offcuts or a scrap bag will do) and isn't counted as a whole sheet.
   Perimeters are measured on the pattern's own traced outlines (centre of the lead line), so they're the real shapes, not a formula guess. */
const SHEETS_IN = [['8x10', 8, 10], ['8x12', 8, 12], ['12x12', 12, 12], ['12x16', 12, 16], ['12x24', 12, 24], ['16x24', 16, 24]];
const SHEETS_CM = [['20x30cm', 20 / 2.54, 30 / 2.54], ['30x30cm', 30 / 2.54, 30 / 2.54], ['30x40cm', 30 / 2.54, 40 / 2.54], ['30x60cm', 30 / 2.54, 60 / 2.54]];
const WASTE = [[15, 'Simple', 'mostly straight cuts'], [25, 'Average', 'some curves'], [30, 'Beginner', 'recommended'], [50, 'Streaky', 'grain must line up']];
const FOIL_ROLL_FT = 108, CAME_STRIP_IN = 72, FOIL_EXTRA = 0.10, CAME_EXTRA = 0.15;
function ringLen(r) { let L = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
function pieceBox(p) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of p.poly || []) for (const q of r) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } return [x1 - x0, y1 - y0]; }
function glassMaterials(P, { sheet = '12x12', waste = 30, line = 'foil' } = {}) {
  const sh = [...SHEETS_IN, ...SHEETS_CM].find(s => s[0] === sheet) || SHEETS_IN[2], sheetA = sh[1] * sh[2], w = waste / 100, ppi = P.ppi;
  const per = new Map(); let perim = 0;
  for (const p of P.pieces) {
    const L = (p.poly || []).reduce((a, r) => a + ringLen(r), 0) / ppi; perim += L;
    const [bw, bh] = pieceBox(p).map(v => v / ppi), e = per.get(p.glass) || { glass: p.glass, code: p.code || '', family: p.family || '', hex: gHex(p.rgb), count: 0, dEacc: 0, areaIn: 0, big: [0, 0], bigN: 0, pieces: [], srcAcc: [0, 0, 0], srcW: 0 };
    e.count++; e.areaIn += p.areaIn; if (p.dE != null && !p.frame) e.dEacc += p.dE * p.areaIn; e.pieces.push(p.n); if (bw * bh > e.big[0] * e.big[1]) { e.big = [bw, bh]; e.bigN = p.n; }
    if (p.src && p.src.length === 3 && !(p.frame && p.code)) { const w = Math.max(0.01, p.areaIn || 1); e.srcAcc[0] += p.src[0] * w; e.srcAcc[1] += p.src[1] * w; e.srcAcc[2] += p.src[2] * w; e.srcW += w; }
    per.set(p.glass, e);
  }
  const fits = (b) => (b[0] <= sh[1] && b[1] <= sh[2]) || (b[0] <= sh[2] && b[1] <= sh[1]);
  const colors = [...per.values()].sort((a, b) => b.areaIn - a.areaIn).map(e => {
    const buy = e.areaIn * (1 + w);
    const srcHex = e.srcW ? gHex([e.srcAcc[0] / e.srcW, e.srcAcc[1] / e.srcW, e.srcAcc[2] / e.srcW]) : null;
    const { srcAcc, srcW, dEacc, ...rest } = e; rest.dE = e.srcW && e.code ? Math.round(dEacc / e.srcW * 10) / 10 : null;
    return { ...rest, srcHex, areaIn: e.areaIn, buyIn: buy, sheets: Math.max(1, Math.ceil(buy / sheetA - 1e-9)), scrap: buy < sheetA / 12, bigFrame: !!(P.pieces.find(p => p.n === e.bigN) || {}).frame, fits: fits(e.big) };
  });
  const area = colors.reduce((a, c) => a + c.areaIn, 0), border = 2 * (P.widthIn + P.heightIn);
  const foilIn = perim * (1 + FOIL_EXTRA), inner = Math.max(0, (perim - border) / 2), cameInner = inner * (1 + CAME_EXTRA), cameBorder = border * (1 + CAME_EXTRA);
  return { sheet: sh, sheetAreaIn: sheetA, waste, colors, pieces: P.pieces.length, areaIn: area, buyIn: area * (1 + w), sheets: colors.reduce((a, c) => a + (c.scrap ? 0 : c.sheets), 0), scraps: colors.filter(c => c.scrap).length, perimIn: perim, borderIn: border,
    foil: { in: foilIn, ft: foilIn / 12, rolls: Math.max(1, Math.ceil(foilIn / 12 / FOIL_ROLL_FT)), width: P.lineIn > 0.1 ? '1/4″' : '7/32″' },
    came: { innerIn: cameInner, borderIn: cameBorder, innerStrips: Math.max(1, Math.ceil(cameInner / CAME_STRIP_IN)), borderStrips: Math.max(1, Math.ceil(cameBorder / CAME_STRIP_IN)) }, line };
}
