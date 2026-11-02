# adlrocha.com

My personal website built with [Astro](https://astro.build).

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
/
├── public/           # Static assets (images, favicon)
├── src/
│   ├── components/   # Astro components
│   ├── content/      # Blog posts and TIL entries (Markdown)
│   ├── data/         # Projects JSON data
│   ├── layouts/      # Page layouts
│   ├── pages/        # Site pages and routes
│   └── styles/       # Global CSS and design tokens
└── dist/             # Build output
```

## Career map

`/career/` is a one-page career timeline generated from `career-map/`:

- `career-map/career.json`: the data (phases, lanes, items, logos registry). Edit this one.
- `career-map/template.html`: the page; `build.mjs` validates the data and inlines it.
- `career-map/logos/<key>.svg|png|jpg` and `career-map/assets/photo.jpg`: embedded images.

```bash
npm run career-map        # build public/career/{index.html,career-map.png,career-map.pdf}
npm run career-map:html   # page only (no browser needed); also runs before `npm run dev`
npm run career-map:logos  # download logos missing from career-map/logos/
npm run career-map:test   # validator, build and export tests
```

`npm run build` runs the tests and `npm run career-map` first, so every deploy publishes a fresh
map: edit `career.json`, push, done. `public/career/` is generated and not committed. The PNG and
PDF need Chromium (set `CHROMIUM=...` if it is not on PATH) and `pdftoppm` (poppler); the deploy
workflow installs poppler and uses the runner's Google Chrome.

Adding an organisation: add it to `logos` in `career.json` (a `domain`, or a direct `url` and an
optional SVG `crop` viewBox), set `"logo": "<key>"` on the item, run `npm run career-map:logos`.
If the downloaded icon looks poor, drop a better `career-map/logos/<key>.svg` in place;
hand-added files are never overwritten. Items whose logo is missing show initials.

## Analytics

- GoatCounter: https://adlrocha.goatcounter.com/
