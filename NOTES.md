# Glass Pattern Studio — mockup notes (v0.2, not published)

Standalone stained-glass pattern app spun off from Scan Lab's stained-glass mode. **Status: published** at https://josephnrossi.github.io/glass-pattern-studio/ — still iterate from `/workspace/glass-app`.
Folder: `/workspace/glass-app`. Scan Lab (`/workspace/scan-lab`, v7 `913db9a`) was not modified.

## v0.2 — conversion focus (this pass)
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
