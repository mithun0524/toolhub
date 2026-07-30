# ToolBox

18 client-side utility tools. No build step, no dependencies, no backend — plain HTML, CSS and JS.

## Run locally

Directory URLs (`/image/compress/`) need a server; `file://` will not work.

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Tests

```sh
node test/test.js       # logic: 32 assertions on the pure functions in js/tools-core.js
node test/browser.js    # every page driven in real Chrome: 19 pages, zero deps
node test/browser.js emi   # filter to matching pages
```

`test/browser.js` launches headless Chrome over the DevTools protocol using Node's
built-in WebSocket. It fails a page on a console error, a missing element the page
script depends on, or a failed interaction (upload a file, click, assert the result).

## Layout

| Path | What |
|---|---|
| `js/tools-core.js` | All non-trivial logic as pure functions. Runs in Node and the browser — this is what `test/test.js` covers. |
| `js/main.js` | Shared chrome: toasts, clipboard, downloads, drop zones, theme toggle, ⌘K palette, related-tools and footer injection, tool registry. |
| `js/image-batch.js` | The multi-file queue behind all four image tools: rows, re-processing on any settings change, per-file save, zipped download-all. |
| `tools/set-domain.js` | Points the site at a real domain (sitemap, robots, canonicals). |
| `js/theme.js` | Blocking one-liner that stamps the theme before paint (no flash). |
| `css/style.css` | Design system. Dark by default, light via `html[data-theme="light"]`. |
| `<tool>/index.html` | One page per tool: markup, SEO metadata, JSON-LD, and only its own wiring. |

Adding a tool: add an entry to `TOOLS` in `js/main.js` (drives search, the palette and
related links), create the page, add a card to `index.html` and a row to `sitemap.xml`.

## Before going live

One command wires up the domain — it rewrites `sitemap.xml`, `robots.txt` and every page's
canonical + `og:url`. Re-running with a different domain is safe.

```sh
node tools/set-domain.js https://yourdomain.com
```

Until you run it, canonicals stay relative (`href="./"`) and the sitemap carries
`https://example.com` — valid but placeholder, so run it before submitting to Search Console.

Also: `pdf-lib`, `pdf.js`, `qrcodejs` and `JSZip` load from cdnjs. Vendor them locally if you
want the PDF, QR and zip features to work fully offline. JSZip is fetched only on the first
"Download all" click, and falls back to individual saves if the CDN is unreachable.

## Known ceilings

- Background removal is colour keying, not AI segmentation — flat backgrounds only.
- The diff falls back to a block diff above ~4M line-pair comparisons.
- Batch work is sequential on the main thread; a few dozen large images will block the tab.
  Move `image-batch.js`'s process loop into a Worker if that becomes a real complaint.
