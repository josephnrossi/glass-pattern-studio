/* Glass Pattern Studio — short first-run beginner guide (4 cards). Advice paraphrased from the published guides listed in NOTES.md. */
const LINE_DEMO = {
  cut: '<svg viewBox="0 0 64 30"><rect x="1" y="1" width="62" height="28" rx="3" fill="#f3d27a"/><path d="M1 15 C20 4 40 26 63 13" stroke="#1a1a1a" stroke-width="3.2" fill="none"/></svg>',
  paint: '<svg viewBox="0 0 64 30"><rect x="1" y="1" width="62" height="28" rx="3" fill="#9cc7e6"/><path d="M8 20 C22 8 40 22 56 10" stroke="#6b6b6b" stroke-width="1.6" stroke-dasharray="4 3" fill="none"/></svg>',
  num: '<svg viewBox="0 0 64 30"><rect x="1" y="1" width="62" height="28" rx="3" fill="#fff" stroke="#999"/><text x="32" y="20" font-size="13" font-weight="700" text-anchor="middle" fill="#111">17</text></svg>',
  frame: '<svg viewBox="0 0 64 30"><rect x="1" y="1" width="62" height="28" fill="#5b3a2a"/><rect x="7" y="7" width="50" height="16" fill="#cfe6d2" stroke="#1a1a1a" stroke-width="1.5"/></svg>',
  star: '<svg viewBox="0 0 64 30"><text x="32" y="22" font-size="18" text-anchor="middle" fill="#a6620a">★</text></svg>',
};
const GUIDE = [
  { h: 'Welcome — stained glass from a photo', b: `<p>This app does one thing: turn a photo into <b>cuttable stained glass</b>.</p>
    <ol class="steps-list"><li><b>Photo</b> — take or pick one. Simple, high-contrast subjects (a bird, a flower, a house) work best.</li><li><b>Size</b> — crop and set how big the finished panel is.</li><li><b>Regions → Glass</b> — the app divides your photo into regions, then matches each region to the <b>best named glass color</b> from a real palette. Slide <b>Glass colors</b> to use fewer or more sheets.</li><li><b>Glass list</b> — each row is a matched glass with piece count and how much to buy.</li><li><b>Print</b> — full-size pattern at 100% and start cutting.</li></ol>` },
  { h: 'What the lines mean', b: `<div class="legend-demo">${LINE_DEMO.cut}<span><b>Solid black line</b> — a cut line. Two pieces of glass meet here, joined by copper foil or lead came.</span>${LINE_DEMO.num}<span><b>Number</b> — the piece number. It matches the cut sheet and the glass list.</span>${LINE_DEMO.paint}<span><b>Dashed grey line</b> — a <b>paint line</b>, not a cut. Details too small to cut (eyes, feathers, veins) are painted on the glass afterwards.</span>${LINE_DEMO.frame}<span><b>Border</b> — optional glass strips around the edge that frame the picture.</span>${LINE_DEMO.star}<span><b>★ on the cut list</b> — a small or tricky piece. Cut it last.</span></div>` },
  { h: 'Cutting with your tools', b: `<p class="small muted">Pick the tools you have on the Pattern step — the app keeps every piece big and smooth enough for them.</p>
    <div class="toolcard"><b>✂️ Hand cutting</b> — glass cutter + running and grozing pliers. Score <b>once</b> with steady pressure, then snap or “run” the score right away. Cuts go edge to edge, so deep inside curves are taken out in several small bites. Biggest pieces stay easiest.</div>
    <div class="toolcard"><b>⚙️ With a grinder</b> <small class="muted">(default)</small> — cut close to the line, then grind each piece to the line and check it on the pattern. Lets you make smaller pieces and tighter curves.</div>
    <div class="toolcard"><b>🪚 Ring saw</b> — cuts in any direction: deep inside curves and the smallest pieces. Slowest, but almost nothing is “uncuttable”.</div>
    <p class="small">Always wear safety glasses, keep the work area swept with a brush (never your hand), and ventilate when soldering.</p>` },
  { h: 'Printing and building', b: `<ol class="steps-list"><li>Print the <b>full-size pattern at 100% / Actual size</b>. Measure the <b>check square</b> — it must be exactly 1 inch. Tape the pages together using the red ⊕ marks.</li><li>Print it twice: cut one copy apart with <b>pattern shears</b> (they leave the gap for the foil or lead), keep one whole to build on.</li><li>Trace or glue each paper piece onto its glass color, then cut, then grind to fit.</li><li><b>Foil</b> each piece (or fit it into <b>lead came</b>), then solder the joints.</li><li>Paint lines go on with glass paint after cutting — use the <b>Paint guide</b>.</li></ol>
    <p class="small muted">Tip: start with a small panel (8 × 10 in) at Detail 3–5 for your first piece.</p>` },
];
function openGuide(i = 0, onDone) {
  const g = GUIDE[i], last = i === GUIDE.length - 1;
  openSheet(`<div class="guide-slide"><p class="small muted" style="margin:0">Beginner guide · ${i + 1} of ${GUIDE.length}</p><h2>${g.h}</h2>${g.b}</div>
    <div class="guide-dots">${GUIDE.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row gap"><button class="secondary" id="gdBack" style="flex:0 0 34%">${i ? '‹ Back' : 'Skip'}</button><button class="primary" id="gdNext" style="flex:1">${last ? 'Start' : 'Next ›'}</button></div>`);
  $('#gdBack').onclick = () => i ? openGuide(i - 1, onDone) : (closeSheet(), onDone && onDone());
  $('#gdNext').onclick = () => last ? (closeSheet(), onDone && onDone()) : openGuide(i + 1, onDone);
}
