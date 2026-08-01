# Nought

18 client-side utility tools. No build step, no dependencies, no backend, and no
third-party requests at runtime — plain HTML, CSS and JS.

The name is the promise: nought uploads, nought accounts, nought network calls once the
page is open. The mark is a slashed zero, in the same face the tools print their output in.

## Run locally

Directory URLs (`/image/compress/`) need a server; `file://` will not work, and the
service worker only registers on `https:` or `localhost`.

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Tests

```sh
node test/test.js       # 42 assertions: tool logic + site integrity
node test/browser.js    # every page driven in real Chrome: 20 pages, zero deps
node test/browser.js emi   # filter to matching pages
```

`test/test.js` covers the pure functions in `js/tools-core.js` **and** guards the four
places a tool has to be registered — the registry, the home grid, the sitemap and the
service-worker precache list. Adding a tool to three of them and forgetting the fourth
fails here instead of 404ing for a visitor. It also fails on any absolute `http(s)://`
reference sneaking back into a page.

`test/browser.js` launches headless Chrome over the DevTools protocol using Node's
built-in WebSocket. It fails a page on a console error, a missing element the page
script depends on, or a failed interaction (upload a file, click, assert the result).

## Layout

| Path | What |
|---|---|
| `js/tools-core.js` | All non-trivial logic as pure functions. Runs in Node and the browser — this is what `test/test.js` covers. |
| `js/main.js` | Shared chrome: toasts, clipboard, downloads, drop zones, theme toggle, ⌘K palette, pins + recents, install prompt, service-worker registration, related-tools and footer injection, tool registry. |
| `js/image-batch.js` | The multi-file queue behind all four image tools: rows, re-processing on any settings change, per-file save, zipped download-all. |
| `js/theme.js` | Blocking one-liner that stamps the theme before paint (no flash). |
| `css/style.css` | Design system and self-hosted fonts. Dark by default, light via `html[data-theme="light"]`. |
| `sw.js` | Service worker. Precaches the shell + all 19 pages; heavy vendored libraries are cached on first use. |
| `manifest.json` | PWA manifest: installable, with four jump-list shortcuts. |
| `vendor/` | pdf-lib, pdf.js, qrcodejs, JSZip — vendored, not CDN-loaded. |
| `assets/fonts/` | Bricolage Grotesque, Public Sans, JetBrains Mono (latin subsets, ~135 KB total). |
| `tools/set-domain.js` | Points the site at a real domain (sitemap, robots, canonicals, og:image). |
| `tools/make-icons.sh` | Regenerates the PNG brand rasters from the SVG sources via headless Chrome. |
| `<tool>/index.html` | One page per tool: markup, SEO metadata, JSON-LD, and only its own wiring. |

Adding a tool: add an entry to `TOOLS` in `js/main.js`, create the page, add a card to
`index.html`, a row to `sitemap.xml`, and an entry to `PRECACHE` in `sw.js`. Then run
`node test/test.js` — it tells you which of those you forgot.

## Brand

| Asset | Use |
|---|---|
| `assets/logo-icon.svg` | The mark alone. Header, footer, offline page. |
| `assets/logo.svg` | Mark + wordmark, for anywhere the name has to travel with it. |
| `assets/favicon.svg` | Rounded-tile mark. Browser tab. |
| `assets/logo-maskable.svg` | Same mark inside Android's 80% mask safe zone. |
| `assets/icon-192.png` `icon-512.png` `icon-maskable-512.png` | PWA install icons. |
| `assets/apple-touch-icon.png` | iOS home screen. |
| `assets/og.png` | 1200×630 share card. Built from `tools/og.html`. |

Colours: ink `#0b0b0c`, amber `#ffb020`. Amber is a *fill* colour — as text it drops to
`--accent-ink` (`#8a5a00`) in light mode to hold contrast. Regenerate the rasters with
`./tools/make-icons.sh` after editing any SVG.

## Offline and install

The site is a PWA. Chrome and Edge show an **Install** button in the header once the
install criteria are met; on iOS it is Share → Add to Home Screen. Either way the service
worker precaches every tool page on the first visit, so the whole site works with no
network afterwards.

Bump `CACHE_VERSION` in `sw.js` when you change anything in its `PRECACHE` list —
otherwise returning visitors keep serving the old copy.

## Before going live

One command wires up the domain — it rewrites `sitemap.xml`, `robots.txt` and every page's
canonical, `og:url` and `og:image`. Re-running with a different domain is safe.

```sh
node tools/set-domain.js https://yourdomain.com
```

Until you run it, canonicals stay relative (`href="./"`) and the sitemap carries
`https://example.com` — valid but placeholder, so run it before submitting to Search
Console. `og:image` in particular *must* be absolute: Twitter, Slack and WhatsApp all drop
a relative preview image.

## Known ceilings

- Background removal is colour keying, not AI segmentation — flat backgrounds only.
- The diff falls back to a block diff above ~4M line-pair comparisons.
- Batch work is sequential on the main thread; a few dozen large images will block the tab.
  Move `image-batch.js`'s process loop into a Worker if that becomes a real complaint.
- The PDF and zip engines (2 MB between them) are cached on first use, not at install. A
  PDF tool opened for the very first time while offline will not have its engine.
- Navigations are served cache-first and refreshed in the background, so a deploy reaches
  an existing visitor on their *second* load, not their first.
