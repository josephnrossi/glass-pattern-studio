/* Pattern quality metrics used by tests/audit.js and tests/pipeline.spec.js (runs in the page). Works on v0.2 and v0.3 pattern objects. */
(function () {
  const LIN = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }, f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const lab = ([r, g, b]) => { const R = LIN(r), G = LIN(g), B = LIN(b), X = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), Y = f(0.2126 * R + 0.7152 * G + 0.0722 * B), Z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883); return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]; };
  function de00(a, b) { // Sharma et al. 2005 reference implementation
    const [L1, a1, b1] = a, [L2, a2, b2] = b, rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
    const ap1 = a1 * (1 + G), ap2 = a2 * (1 + G), Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2), hp = (x, y) => { if (!x && !y) return 0; const h = Math.atan2(y, x) / rad; return h < 0 ? h + 360 : h; }, h1 = hp(ap1, b1), h2 = hp(ap2, b2);
    const dL = L2 - L1, dC = Cp2 - Cp1; let dh = 0; if (Cp1 * Cp2) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; } const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh / 2 * rad);
    const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2; let hb = h1 + h2; if (Cp1 * Cp2) { if (Math.abs(h1 - h2) > 180) hb = h1 + h2 < 360 ? hb + 360 : hb - 360; hb /= 2; }
    const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad), dT = 30 * Math.exp(-(((hb - 275) / 25) ** 2)), RC = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
    const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cpb, SH = 1 + 0.015 * Cpb * T, RT = -Math.sin(2 * dT * rad) * RC;
    return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
  }
  function ringStats(r, ppi) { // r: [[x,y]...] closed
    const n = r.length; let per = 0, sharp = 0, notch = 0; const ar = (() => { let a = 0; for (let i = 0; i < n; i++) { const p = r[i], q = r[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; })(), sg = Math.sign(ar) || 1;
    for (let i = 0; i < n; i++) { const a = r[(i + n - 1) % n], b = r[i], c = r[(i + 1) % n], ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1], cr = ux * vy - uy * vx, dt = ux * vx + uy * vy, t = Math.atan2(cr, dt) * 180 / Math.PI; per += Math.hypot(vx, vy); if (Math.abs(t) > 60) sharp++; if (t * sg < -60) notch++; }
    return { per: per / ppi, verts: n, sharp, notch };
  }
  function measure(P, palette) {
    const inner = P.pieces.filter(p => !p.frame), s = P.stats, minA = s.minAreaIn, featA = s.featAreaIn || minA * 0.35;
    const isFeat = p => p.feature || (p.flags || []).includes('advanced');
    const under = inner.filter(p => isFeat(p) ? p.areaIn < featA - 1e-6 : p.areaIn < minA - 1e-6);
    const polyA = p => Math.abs(p.poly.reduce((acc, r) => { let x = 0; for (let i = 0; i < r.length; i++) { const u = r[i], v = r[(i + 1) % r.length]; x += u[0] * v[1] - v[0] * u[1]; } return acc + (r === p.poly.reduce((a, q) => q.length > a.length ? q : a, p.poly[0]) ? 1 : -1) * Math.abs(x / 2); }, 0)) / P.ppi / P.ppi;
    const underPoly = inner.filter(p => polyA(p) < (isFeat(p) ? featA : minA) * 0.8);
    const tiny = inner.map(p => [p.n, +polyA(p).toFixed(3), p.areaIn, isFeat(p) ? 'F' : '']).sort((a, b) => a[1] - b[1]).slice(0, 6);
    const open = P.pieces.filter(p => !p.segs.length || p.segs.some(sg => !sg.length || sg[0][0] !== 'M' || sg[sg.length - 1][0] !== 'Z'));
    let per = 0, verts = 0, sharp = 0, notch = 0; for (const p of inner) { const r = p.poly.reduce((a, q) => q.length > a.length ? q : a, p.poly[0]); const k = ringStats(r, P.ppi); per += k.per; verts += k.verts; sharp += k.sharp; notch += k.notch; }
    const pal = new Map((palette || []).map(g => [g[0], [g[1], g[2], g[3]]]));
    let wde = 0, wA = 0; const des = [];
    for (const p of inner) { const nm = String(p.glass).replace(/ [B-F]$/, ''), g = p.glassRGB || pal.get(nm) || p.rgb, d = de00(lab(p.src), lab(g)); des.push([d, p.areaIn]); wde += d * p.areaIn; wA += p.areaIn; }
    des.sort((a, b) => a[0] - b[0]); let acc = 0, p90 = 0; for (const [d, a] of des) { acc += a; if (acc >= 0.9 * wA) { p90 = d; break; } }
    const names = P.legend.map(e => e.glass), dup = names.filter(n => / [B-F]$/.test(n)).length;
    return { pieces: inner.length, colors: P.legend.length, underMin: under.length, underPoly: underPoly.length, tiny, minAreaIn: minA, featAreaIn: featA, smallest: +Math.min(...inner.map(p => p.areaIn)).toFixed(3), open: open.length,
      flags: Object.fromEntries(Object.entries(s.flagged || {}).map(([k, v]) => [k, v.length])), junctions4: s.junctions4, perimIn: +per.toFixed(1), vertsPerIn: +(verts / per).toFixed(2), sharpPerPiece: +(sharp / inner.length).toFixed(2), notchesPerPiece: +(notch / inner.length).toFixed(2),
      dE00mean: +(wde / wA).toFixed(2), dE00p90: +p90.toFixed(2), dupNames: dup, outlineKept: s.outlineKept, ms: P.ms };
  }
  self.GPSMetrics = { de00, lab, measure };
})();
