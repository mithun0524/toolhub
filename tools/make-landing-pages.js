#!/usr/bin/env node
/* Generates the long-tail landing pages.
 *   node tools/make-landing-pages.js
 *
 * Head terms are unwinnable — "image compressor" belongs to iLoveIMG. These
 * target the family underneath it, where intent is specific and the incumbents
 * have no page: "compress image to 100kb", "resize image for instagram".
 *
 * Two families, one shell. Each page is a working single-purpose tool with copy
 * explaining why its particular number exists — that is the line between a
 * useful page and a doorway page, and Google has been good at telling them
 * apart for years.
 *
 * Editing a generated file by hand is pointless: the next run overwrites it.
 * Edit this table and re-run.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/* ---------- family 1: compress to an exact file size ---------- */
const SIZES = [
  { kb: 20, slug: 'to-20kb', label: '20 KB',
    why: 'Government and exam portals are the usual reason for a 20 KB ceiling — many ' +
      'Indian application forms cap the photo or signature upload at exactly this size.',
    q: 'Will a photo still be legible at 20 KB?',
    a: 'For a passport-style headshot, yes. 20 KB is tight for a full scene, so if quality ' +
      'alone cannot get there the image is scaled down and you are told by how much.' },
  { kb: 50, slug: 'to-50kb', label: '50 KB',
    why: 'A 50 KB ceiling is common for forum avatars, email signatures and older upload ' +
      'forms written when bandwidth was expensive.',
    q: 'Which format do I get back?',
    a: 'JPEG. It is the only widely-accepted format that hits a small hard ceiling ' +
      'predictably — PNG is lossless, so it cannot be dialled down to an arbitrary size.' },
  { kb: 100, slug: 'to-100kb', label: '100 KB',
    why: '100 KB is the usual advice for images on a web page: small enough not to hurt ' +
      'your Largest Contentful Paint, large enough to still look right on a retina screen.',
    q: 'Is 100 KB actually the right size for a web image?',
    a: 'It is a good default for a content image. Hero images can justify more, thumbnails ' +
      'far less. If page speed is the goal, WebP at the same visual quality is smaller again.' },
  { kb: 200, slug: 'to-200kb', label: '200 KB',
    why: '200 KB is the sweet spot for a blog header or product shot — noticeably better ' +
      'detail than 100 KB while still loading instantly on mobile data.',
    q: 'Why not just use the quality slider?',
    a: 'Because a fixed quality gives a different file size for every image. When the limit ' +
      'is the requirement rather than the quality, searching for the quality is the right way round.' },
  { kb: 500, slug: 'to-500kb', label: '500 KB',
    why: 'Instagram, WhatsApp and most email attachments are comfortable around 500 KB — ' +
      'small enough to send instantly, big enough to keep detail in a full photograph.',
    q: 'Should I compress before uploading to Instagram?',
    a: 'Yes. Instagram re-compresses whatever you give it, and it is gentler on an image ' +
      'already close to its target than on a 12 MB original.' },
  { kb: 1024, slug: 'to-1mb', label: '1 MB',
    why: 'A 1 MB cap is what most job portals, ticketing systems and web forms settle on ' +
      'for a document scan or a high-detail photo.',
    q: 'Is 1 MB small enough to email?',
    a: 'Comfortably. Gmail and Outlook allow 20–25 MB per message, so a 1 MB image leaves ' +
      'plenty of room for several attachments.' },
  { kb: 2048, slug: 'to-2mb', label: '2 MB',
    why: 'Visa applications, insurance claims and university portals commonly allow up to ' +
      '2 MB per upload, which keeps a full-resolution scan readable.',
    q: 'Will 2 MB keep my scan readable?',
    a: 'Yes — at 2 MB a full-page scan keeps its text sharp. This only re-encodes; it never ' +
      'reduces resolution unless it has to in order to meet the limit.' }
];

/* ---------- family 2: resize to an exact slot ---------- */
const PRESETS = [
  { slug: 'instagram-post', w: 1080, h: 1080, name: 'Instagram post',
    title: 'Resize Image for Instagram Post — 1080×1080, Free',
    why: 'Instagram displays feed posts in a 1080 px square. Handing it exactly that means ' +
      'it has no resizing left to do, so none of your detail is spent on its re-compression.',
    q: 'Why square and not 4:5?',
    a: 'Square is the safest default — it is never cropped further in the feed or the grid. ' +
      'A 4:5 portrait post gets more screen height but is cropped to square on your profile grid.' },
  { slug: 'instagram-story', w: 1080, h: 1920, name: 'Instagram story',
    title: 'Resize Image for Instagram Story — 1080×1920, Free',
    why: 'Stories and Reels are a 9:16 portrait frame at 1080×1920. Anything else gets ' +
      'letterboxed or cropped by Instagram, usually across the part you cared about.',
    q: 'Will text near the edges be safe?',
    a: 'Keep important content roughly 250 px away from the top and bottom — Instagram lays ' +
      'its own profile row and reply bar over those areas.' },
  { slug: 'youtube-thumbnail', w: 1280, h: 720, name: 'YouTube thumbnail',
    title: 'Resize Image for YouTube Thumbnail — 1280×720, Free',
    why: "YouTube asks for 1280×720 (16:9) and rejects thumbnails under 640 px wide. It is " +
      'also the frame your video is judged in, so it is worth getting exactly right.',
    q: 'What about the 2 MB thumbnail limit?',
    a: 'This exports well under it. If you have added heavy artwork and need to get below ' +
      'a hard cap, run the result through the compress-to-2MB page afterwards.' },
  { slug: 'linkedin-banner', w: 1584, h: 396, name: 'LinkedIn banner',
    title: 'Resize Image for LinkedIn Banner — 1584×396, Free',
    why: 'LinkedIn personal profile banners are 1584×396 — an unusually wide 4:1 strip, ' +
      'which is why ordinary photos look badly cropped up there.',
    q: 'Why does my banner look cropped on mobile?',
    a: 'LinkedIn overlays your profile photo on the lower-left of the banner and crops the ' +
      'edges on narrow screens. Keep anything important in the middle third.' },
  { slug: 'passport-photo', w: 413, h: 531, name: 'Passport photo',
    title: 'Passport Photo Resizer — 35×45 mm at 300 DPI, Free',
    why: 'The standard passport and visa photo is 35×45 mm, which is 413×531 pixels at ' +
      '300 DPI — the resolution print shops and online forms expect.',
    q: 'Is this accepted for Indian passport and visa forms?',
    a: 'The dimensions match the 35×45 mm specification. Requirements about background ' +
      'colour, expression and head coverage still apply, and this cannot check those for you.' }
];

/* ---------- shared shell ---------- */
const UP = '../../../';

function shell(o) {
  return `<!DOCTYPE html>
<!-- GENERATED by tools/make-landing-pages.js — edit that file, not this one. -->
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${o.title}</title>
  <meta name="description" content="${o.desc}"/>
  <meta name="robots" content="index, follow, max-image-preview:large"/>
  <link rel="canonical" href="./"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${o.title}"/>
  <meta property="og:description" content="${o.desc}"/>
  <meta property="og:image" content="${UP}assets/og.png"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)"/>
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"/>
  <link rel="icon" href="${UP}assets/favicon.svg" type="image/svg+xml"/>
  <link rel="apple-touch-icon" href="${UP}assets/apple-touch-icon.png"/>
  <link rel="manifest" href="${UP}manifest.json"/>
  <link rel="stylesheet" href="${UP}css/style.css"/>
  <script src="${UP}js/theme.js"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<nav>
  <div class="nav-inner">
    <a href="${UP}index.html" class="logo" aria-label="Nought home">
      <span class="logo-icon"><img src="${UP}assets/logo-icon.svg" alt="" width="18" height="18"/></span>
      Nought
    </a>
    <div class="nav-links">
      <a href="${UP}index.html#image" class="active">Image</a>
      <a href="${UP}index.html#pdf">PDF</a>
      <a href="${UP}index.html#text">Text</a>
      <a href="${UP}index.html#calculators">Calculators</a>
      <a href="${UP}index.html#developer">Developer</a>
    </div>
  </div>
</nav>

<div class="page-wrapper container" id="main">
  <header class="tool-page-header">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${UP}index.html">Home</a> <span class="breadcrumb-sep">/</span>
      <a href="../index.html">${o.parentName}</a> <span class="breadcrumb-sep">/</span>
      <span aria-current="page">${o.crumb}</span>
    </nav>
    <h1 class="tool-page-title">${o.h1}</h1>
    <p class="tool-page-desc">${o.lede}</p>
    <div class="tool-badges">
      <span class="badge">Runs on your device</span>
      <span class="badge">Nothing uploaded</span>
      <span class="badge">${o.badge}</span>
    </div>
  </header>

  <div class="tool-panel" id="${o.toolId}" ${o.toolData}>
    <div class="drop-zone" id="dropZone" aria-label="${o.dropLabel}">
      <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
      <p class="drop-zone-text">Drop an image here, or click to choose</p>
      <p class="drop-zone-sub">JPG, PNG or WebP · pasting from the clipboard works too</p>
      <input type="file" id="fileInput" accept="image/*"/>
    </div>

    <div id="result" hidden>
      <div class="preview-frame" style="margin-top:14px">
        <img id="resultImg" alt="Result" hidden/>
      </div>
      <p class="live-status ok" id="resultStats" style="margin-top:10px"></p>
      <p class="input-hint" id="resultNote" hidden></p>
      <div class="btn-group" style="margin-top:12px">
        <button class="btn btn-primary" id="saveBtn" disabled>Download</button>
        <a class="btn btn-secondary" href="../index.html">Need finer control?</a>
      </div>
    </div>
  </div>

  <section class="faq-section">
    <h2>${o.aboutHeading}</h2>
    <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.65;margin-bottom:14px">${o.why}</p>
    <div class="faq-item">
      <button class="faq-q">${o.howQ}
        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="faq-a"><div>${o.howA}</div></div>
    </div>
    <div class="faq-item">
      <button class="faq-q">${o.q}
        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="faq-a"><div>${o.a}</div></div>
    </div>
    <div class="faq-item">
      <button class="faq-q">Is my image uploaded anywhere?
        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="faq-a"><div>No. The work happens in this tab using Canvas. Your image never touches a
        server, which is also why it keeps working with no network once the page has loaded.</div></div>
    </div>
  </section>

  <nav class="related" aria-label="Related presets">
    <h2>${o.relatedHeading}</h2>
    <div class="related-grid">
      ${o.related}
    </div>
  </nav>
</div>

<footer data-auto></footer>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": ${JSON.stringify(o.appName)},
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any browser",
  "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}
}
</script>

<script src="${UP}js/tools-core.js"></script>
<script src="${UP}js/main.js"></script>
<script src="${UP}${o.script}"></script>
</body>
</html>
`;
}

const card = (href, text) => `<a class="related-card" href="${href}">${text}</a>`;

let paths = [];

/* ---------- emit: compress-to-size ---------- */
for (const t of SIZES) {
  const related = SIZES.filter((o) => o.slug !== t.slug)
    .map((o) => card(`../${o.slug}/index.html`, `To ${o.label}`))
    .concat([card('../index.html', 'Full image compressor')])
    .join('\n      ');

  const html = shell({
    title: `Compress Image to ${t.label} — Free, Exact Size, No Upload`,
    desc: `Compress a JPG or PNG down to ${t.label} or under, free and in your browser. ` +
      `Drop the file, get it back at the size you need. Nothing is uploaded.`,
    parentName: 'Image Compressor', crumb: `To ${t.label}`,
    h1: `Compress an image to ${t.label}`,
    lede: `Drop in a JPG or PNG and get it back at ${t.label} or under. It searches for the ` +
      `highest quality that still fits, so you get the best-looking file that meets the limit ` +
      `rather than the smallest one.`,
    badge: 'Exact ceiling',
    toolId: 'sizeTool', toolData: `data-target-kb="${t.kb}"`,
    dropLabel: `Choose an image to compress to ${t.label}`,
    aboutHeading: `About the ${t.label} limit`, why: t.why,
    howQ: 'How does it hit the size exactly?',
    howA: `It binary-searches the JPEG quality setting and keeps the largest file that still ` +
      `fits under ${t.label} — the biggest file under a ceiling is the best-looking one. If even ` +
      `low quality is too big it scales the image down in steps and searches again, and tells you so.`,
    q: t.q, a: t.a,
    relatedHeading: 'Other sizes', related,
    appName: `Compress Image to ${t.label}`,
    script: 'js/target-compress.js'
  });

  const dir = path.join(ROOT, 'image', 'compress', t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  paths.push(`image/compress/${t.slug}`);
}

/* ---------- emit: resize-to-preset ---------- */
for (const p of PRESETS) {
  const related = PRESETS.filter((o) => o.slug !== p.slug)
    .map((o) => card(`../${o.slug}/index.html`, o.name))
    .concat([card('../index.html', 'Full image resizer')])
    .join('\n      ');

  const html = shell({
    title: p.title,
    desc: `Resize any photo to exactly ${p.w}×${p.h} for a ${p.name.toLowerCase()}, free and ` +
      `in your browser. Centre-cropped to fit, nothing uploaded.`,
    parentName: 'Image Resizer', crumb: p.name,
    h1: `Resize for a ${p.name.toLowerCase()}`,
    lede: `Drop in a photo and get it back at exactly ${p.w}×${p.h} pixels. It centre-crops to ` +
      `that shape first so faces are not stretched, then scales.`,
    badge: `${p.w}×${p.h}`,
    toolId: 'presetTool', toolData: `data-w="${p.w}" data-h="${p.h}"`,
    dropLabel: `Choose an image to resize to ${p.w} by ${p.h}`,
    aboutHeading: `Why ${p.w}×${p.h}`, why: p.why,
    howQ: 'What happens to the parts that do not fit?',
    howA: `The image is centre-cropped to the target shape and then scaled, which is what keeps ` +
      `proportions correct — squeezing a whole photo into a different aspect ratio is what makes ` +
      `faces look stretched. The page reports roughly how much was trimmed, and the full resizer ` +
      `lets you control the crop yourself.`,
    q: p.q, a: p.a,
    relatedHeading: 'Other presets', related,
    appName: p.title.split(' — ')[0],
    script: 'js/target-resize.js'
  });

  const dir = path.join(ROOT, 'image', 'resize', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  paths.push(`image/resize/${p.slug}`);
}

paths.forEach((p) => console.log('  ' + p + '/'));
console.log(`${paths.length} landing pages generated.`);

module.exports = { paths };
