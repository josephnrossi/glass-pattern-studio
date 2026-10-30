# Glass Pattern Studio

**Stained glass from a photo.** Take or choose a picture → the app divides it into regions → each piece is matched (CIEDE2000) to a glass from a 103-sheet cathedral / opalescent / streaky catalog, pieces are kept cuttable for your tools. Numbered pieces, shopping list, full-size printable pattern. Works offline as a PWA — no account, no AI key.

Live: **https://josephnrossi.github.io/glass-pattern-studio/**

## Flow
1. **Photo** — take or pick one (or try a sample)
2. **Size** — crop and set panel size
3. **Convert** — Regions view, then Glass view with named best-match colors
4. **Glass** — shopping list (sheets, foil/came)
5. **Print** — full-size tiled PDF, cut sheet, SVG, shopping list

Everything stays on your device (IndexedDB). Service worker cache: `glass-studio-v0-3` (v0.3 mock; the live site is v0.2).

## Note on the name
Working title. “Glass Pattern Studio” is close to an existing App Store app — rename before selling (see `NOTES.md`).
