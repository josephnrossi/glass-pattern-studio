# Glass Pattern Studio — mockup notes (v0.3 mock, not published; live site is still v0.2)

Standalone stained-glass pattern app spun off from Scan Lab's stained-glass mode. **Status: published** at https://josephnrossi.github.io/glass-pattern-studio/ — still iterate from `/workspace/glass-app`.
Folder: `/workspace/glass-app`. Scan Lab (`/workspace/scan-lab`, v7 `913db9a`) was not modified.

## v0.3 — refined, more accurate patterns (mock, waiting for approval)
Audit (tests/audit.js, Chromium, 4 photos: backlit portrait, tulip, flat logo, detailed house; 15×10 / 12×12 / 13×10 in, Detail 6, grinder, 1/16″ foil, 10 colors):
| | v0.2 | v0.3 |
|---|---|---|
| pieces below the tool minimum (portrait / tulip / logo / house) | 11 / 11 / 0 / 8 | **0 / 0 / 0 / 0** |
| ΔE00 photo → named glass, area-weighted mean | 16.3 / 13.9 / 4.7 / 9.5 | **8.9 / 6.1 / 3.5 / 6.6** |
| duplicate glass names ("Amber B") | 2 / 1 / 3 / 2 | **0** |
| glasses used (limit 10) | 10 / 10 / 10 / 10 | 9 / 10 / **7** / 10 |
| outline vertices per inch (lower = smoother) | 4.96 / 4.62 / 2.10 / 5.04 | 4.53 / 4.24 / 2.13 / 4.87 |
v0.2 weaknesses found: (1) the shown "glass" was the photo's own average colour, not a glass — names came from a 33-colour list by RGB distance, so the colour you saw was not what you'd buy; (2) the palette was k-means of photo colours, so near-identical clusters became "Charcoal" + "Charcoal B", and a 6-colour logo still used 10 sheets; (3) plain means — glare, lens flare and shadow specks skewed piece colours (the backlit portrait went grey/black); (4) small-piece clean-up ran at 55% of the minimum, leaving 8–11 under-size pieces per photo; (5) wobbly, stair-stepped outlines with tight notches; (6) feature pieces (eyes) could be slivers; (7) SVG had no key, PDFs no colour key / glass codes; (8) iPad got a 640 px phone column.
Changes:
- `catalog.js` (new): 103 glasses — Cathedral (C-), Opalescent (O-), Streaky/wispy (S-). **Codes are the app's own numbers, not manufacturer SKUs; colours are approximate.** Replace with a real supplier catalog before selling.
- `tracer.js` (app copy only; Scan Lab untouched): lighting-aware piece colour (15–85th lightness percentile trimmed mean of the unsmoothed photo); CIEDE2000 matching (kL 1.15) with a greedy + swap facility-location pick of at most N glasses (stops when another sheet would improve the average match by < 0.12 ΔE); same-glass neighbours merge but never below 85% of the Detail target; disc mode filter at the tool's inside-curve radius (hand 0.19″, grinder 0.125″ ≈ 1/4″ bit, ring saw 0.07″; Smooth curves Low ×0.6 / Medium / High ×1.45); long thin pieces (length ≳ 10× width) get a break line, very concave large pieces too; feature exemption only for compact features; strict final clean-up at 100% of the minimum area with no enclosed pieces. Pieces carry `code`, `family`, `glassRGB`, `dE`, `feature`; legend carries code/family/srcHex/dE. Engine id `gps-v0.3`, pattern version 4.
- UI: Convert step now leads with **Pieces** (shows target and actual count), **Glass colors** (a maximum), **Smooth curves** Low/Medium/High; tools & lines under More. iPad: two-column Convert step at ≥ 900 px (landscape), wider column 760–899 px. Glass list shows code, family and match quality (ΔE).
- Exports: SVG is real-size with lead lines, numbers, `data-code` per piece and a colour key strip below the panel (panel stays 1:1). Full-size PDF gets a colour-key page and the glass code under each piece number. Cut sheet and shopping list list codes (+ family).
- SW cache `glass-studio-v0-3` (adds catalog.js).
- Tests: `tests/pipeline.js` (44 checks), `tests/audit.js` (v0.2 vs v0.3, needs a worktree of 9b79db5 at /workspace/glass-app-v02), `tests/ipad-shots.js`, `tests/metrics.js`. Test photos: `tests/photos/portrait.jpg` (Wikimedia Commons “Young woman in leather jacket (Unsplash).jpg”, CC0) and `tests/photos/logo.jpg` (drawn for the test).
Deferred: face/subject-aware segmentation (keep eyes/nose/mouth lines on portraits); flowing "designed" background lines instead of segmenting blur (backgrounds still look like cracked mud); fixing the few 4-way joints; streaky-glass texture preview and grain direction; a real manufacturer catalog with SKUs and prices; DXF/PDF vector export for plotters; manual piece edit (merge/split/recolour); nesting pieces on sheets.

## v0.2 — conversion focus
- **Stained-glass only** UI copy: home is “Photo → regions → glass colors”; step 3 labeled **Convert**.
- Pattern step shows progress chips **Photo · Regions · Glass**, a **Regions** view (photo areas with outlines), and a **Glass** view with on-canvas legend of **named palette glasses**.
- Primary control: **Glass colors** (“How many glass sheets to match”). Detail / tools / foil-came / paint under **More**.
- Glass list rows show photo-average swatch → matched glass swatch + “best match”.
- SW cache: `glass-studio-v0-2`. Published as josephnrossi/glass-pattern-studio.

## Flow
1. **Photo**: take a photo, choose one, or tap a sample (bird, house, cat, tulip).
2. **Size**: drag/zoom a crop box locked to the panel shape; inches or cm; presets (Photo shape, 8×10, 11×14, 12×12, 12×16, 16×20, 18×24 in / 20×25 … 45×60 cm), swap orientation, custom W×H, optional 1 in glass border.
3. **Pattern**: views Photo trace / Color / Numbered / Paint guide / Overlay (with opacity). Detail 1–10, Tools (Hand / Grinder default / Ring saw), joining method (Copper foil / Lead came) + line width, Paint lines on/off + Light/Medium/Bold, glass color count under "More options".
4. **Glass**: one row per glass color with pieces, area, area to buy and sheets. Sheet size picker, waste 15/25/30/50%, largest-piece-fits-sheet check, and totals: pieces, sheets, glass area, foil length + rolls or came length + 6 ft strips.
5. **Print**: Letter/A4, an on-screen page map (A1, A2, B1 …), a full-size tiled cut pattern PDF, a full-size paint guide PDF, a numbered cut sheet PDF (color map + cut list by color), SVG at real size, a picture, and a shopping list (text).
- **My projects**: auto-saved on the device in IndexedDB (`glass-pattern-studio` → `projects`) with Rename, Duplicate and Delete (with Undo).
- **First-run guide**: 4 cards covering the flow, what the lines mean, cutting with each tool, and printing/building. Reopen it with "?".
- PWA with its own service worker (`glass-studio-v0-1`, offline reload verified in Chromium) and manifest. Portrait-first; light and dark follow the system setting.

## Engine (copied, not modified)
`tracer.js`, `tracer-worker.js` (comment line only), `glass.js` and `pdf.js` (PDF Producer string only) were copied from Scan Lab v7. The trace runs in a Web Worker and falls back to the page if needed.
New files: `app.js`, `materials.js`, `print.js`, `guide.js`, `db.js`, `styles.css`, `index.html`, `sw.js`, `manifest.json`, `icons/*` (placeholder icon).
Scan Lab's AI features (subject finder, Grok tips, recognisability check) were left out, so it needs no key and no server.

## Material estimate: assumptions and sources
| Item | Rule used | Source |
|---|---|---|
| Glass per color | area of that color's pieces × (1 + waste), rounded **up** to whole sheets per color | VArtGlass ch.6 ("always rounded up") https://vartglass.com/tutorial/chapter-6-calculate-materials/ |
| Waste default 30% (choices 15/25/30/50) | 20–30% for waste and breakage; 15–25% (30% if rusty); 10–15% straight cuts, 20–30% gentle curves, 35–50% heavy curves; 25–50%, default 30 | Gordon's Glass https://www.gordonsglass.net/calculating-how-much-stained-glass-youll-need/ · Everything Stained Glass https://everythingstainedglass.com/calculate-much-stained-glass-need · https://superglobalcalculator.com/calculators/stained-glass/cutting-waste-factor/ · https://madekeeper.com/stained-glass-calculator |
| Largest piece must fit one sheet | flagged per color (border strips get their own message) | EZGlassPattern https://ezglasspattern.com/stained-glass-calculator |
| Sheet sizes | 8×10, 8×12, 12×12 (default), 12×16, 12×24, 16×24 in; metric 20×30, 30×30, 30×40, 30×60 cm | common retail sizes per superglobalcalculator (waste page above); metric sizes are a placeholder |
| Copper foil | sum of every piece's perimeter (shared seams count twice) + 10%; 36 yd (108 ft) rolls; 7/32″ for 3 mm glass (1/4″ for the 1/8″ line option) | EZGlassPattern (above) · VArtGlass (above) · https://superglobalcalculator.com/calculators/stained-glass/copper-foil/ |
| Lead came | inside H came = (total perimeter − panel outline) ÷ 2; border U came/zinc = outline; +15%; 6 ft strips | https://superglobalcalculator.com/calculators/stained-glass/lead-came/ · https://stainedglasswow.com/blog/lead-came-calculator/ |
| Perimeters | measured on the pattern's own traced piece outlines (centre of the line), not estimated from piece count | (sanity check: the 8×10 bird, 96 pieces, measured 370 in vs 377 in from EZGlassPattern's 4.3·√(A·n) estimate) |
| "Scrap" label | a color needing < 1/12 of a sheet is shown as "scrap / offcut will do" and not counted as a sheet | **app's own heuristic, not from a source** |
Not modelled: how pieces nest on a real sheet, grain direction, solder quantity, and price.

Cuttability limits per tool, line allowances and the reinforcement note are inherited from Scan Lab's `tracer.js` header (EZGlassPattern, Delphi Glass lessons, Glass Campus, Dorset Stained Glass).
Beginner guide advice is paraphrased from the same sources: Delphi "How to Use a Ring Saw", Delphi KB 10/12, and Glass Campus "Lazy Man's Guide".

## Full-size PDF
- Tiles have ½ in overlap, red dashed overlap lines and red target alignment marks in every overlap. Each page carries its label (A1 …), which edges join which page, and a **1 in + 2 cm check square**.
- The cover has an assembly map and print-at-100% steps. Portrait or landscape pages are chosen automatically, whichever needs fewer pages.
- Page sizes have been verified: Letter is 612×792 pt and A4 is 595.28×841.89 pt.

## Placeholder "PRO" markers (no payment code, nothing locked)
- Full-size tiled cut pattern PDF
- Full-size paint guide PDF
- SVG export
- Detail 9–10 ("high detail")
- More than 3 projects ("x of 3 free · PRO unlimited")
- Duplicate project
Free: the whole flow, the glass list and estimates, the numbered cut sheet, the picture and the shopping list.

## Name check (quick web search, 23 Oct 2026)
- **Glass Pattern Studio** (working name) is **too close to an existing app**. "GlassPattern: Stained Glass" by Double Vision USA is on the App Store (iPad/Mac), and its $79.99 in-app tier is literally named **"GlassPattern Studio"**. It also already offers photo tracing, a materials list and full-size tiled printing. Rename before selling.
- **Shardwise**: no stained-glass app found (only a GitHub org and a Gradle plugin).
- **Photo to Pane**: no app by that name found (searches return generic "stained glass photo effect" apps).
- Rejected: "LeadLine" (LeadLine Studio, an upcoming stained-glass commission app, plus a UK studio and business apps), "Suncatcher Studio" (an existing pattern/printables website), "PaneCraft" (Panecraft, Inc. has Android apps), "Came & Cut" (too close to Camekeep and I.T.S. "Cutline").
These are quick search checks, not a trademark search.

## Competition seen during research
GlassPattern (iPad/Mac, one-time IAP $39.99/$79.99), EZGlassPattern (photo → pattern + material list, web), VArtGlass, Diafane (free web), Camekeep ($2.99 iPhone). The likely angle here is iPhone-first, photo → cuttable pattern in one flow, tool-aware cuttability and Android/web.

## Mockup verification
- `tests/shots.js` covers iPhone 15 (WebKit) for all 4 samples, Pixel 7 (Chromium) for bird and tulip, and an iPhone 15 dark-mode pass for cat. It also renders the exported PDFs.
- `tests/smoke.js` is the single-flow smoke test. `tests/sw-check.js` checks that the service worker installs and the app reloads offline.
- Result: **0 console errors and 0 page errors**. Only a smoke check was done, not a full test suite.
