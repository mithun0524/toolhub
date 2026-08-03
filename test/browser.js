/* Real-browser smoke test. No npm deps: launches Chrome with the DevTools
   protocol and drives it over Node's built-in WebSocket.

   Usage: node test/browser.js            (all pages)
          node test/browser.js compress   (pages matching a substring)

   Each page must load with zero console errors, expose the elements the page
   script depends on, and pass its own interaction script (run in the page). */
const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
const PORT = 8137;
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
].find((p) => fs.existsSync(p));

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

/* ---------- checks ---------- */
// A tiny 4x4 PNG used wherever a test needs a real image file.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVQI12P4z8DwHwAF' +
  'AAH/q842iQAAAABJRU5ErkJggg==';

const PAGES = [
  { url: '/', needs: ['searchInput', 'catPills'], test: `
    (async () => {
      const input = document.getElementById('searchInput');
      input.value = 'json'; input.dispatchEvent(new Event('input'));
      const visible = [...document.querySelectorAll('.tool-cell')].filter(c => !c.hidden);
      assert(visible.length === 1, 'search for json should leave 1 card, got ' + visible.length);
      input.value = ''; input.dispatchEvent(new Event('input'));
      assert([...document.querySelectorAll('.tool-cell')].filter(c => !c.hidden).length === 18, '18 cards visible');
      document.querySelector('.cat-pill[data-cat="pdf"]').click();
      assert([...document.querySelectorAll('.tool-cell')].filter(c => !c.hidden).length === 2, 'pdf filter shows 2');
      document.querySelector('.cat-pill[data-cat="all"]').click();
      assert(document.querySelectorAll('footer a').length > 15, 'footer links present');
      document.querySelector('.faq-q').click();
      assert(document.querySelector('.faq-item.open'), 'faq opens');
      window.dispatchEvent(new Event('resize'));
      assert(document.querySelector('[data-theme-toggle]'), 'theme toggle injected');
      // Don't assume the starting theme: headless honours the OS/emulated setting.
      const before = document.documentElement.dataset.theme;
      assert(before === 'dark' || before === 'light', 'a theme is stamped before paint');
      document.querySelector('[data-theme-toggle]').click();
      assert(document.documentElement.dataset.theme !== before, 'theme toggle flips the theme');
      assert(localStorage.getItem('nought:theme') === document.documentElement.dataset.theme,
        'choice is persisted');
      document.querySelector('[data-open-palette]').click();
      assert(!document.getElementById('palette').hidden, 'palette opens');

      // pin -> shelf -> unpin, the whole return-visit loop
      const cell = document.querySelector('.tool-cell[data-tool="dev-json"]');
      const pin = cell.querySelector('.pin-btn');
      assert(pin, 'pin button injected onto every card');
      assert(document.getElementById('shelf').hidden, 'shelf hidden with nothing pinned');
      pin.click();
      assert(pin.getAttribute('aria-pressed') === 'true', 'pin reflects pressed state');
      assert(JSON.parse(localStorage.getItem('nought:pins')).includes('dev-json'), 'pin persisted');
      assert(!document.getElementById('shelf').hidden, 'shelf appears once something is pinned');
      assert(document.querySelector('#shelf .shelf-chip.pinned'), 'pinned chip rendered');
      pin.click();
      assert(pin.getAttribute('aria-pressed') === 'false', 'unpin flips back');
      assert(document.getElementById('shelf').hidden, 'shelf hides again when empty');

      // Chrome only fires beforeinstallprompt once the manifest, icons and a
      // registered service worker all check out — so a visible install button
      // here is the installability criteria passing, not just markup existing.
      assert(document.querySelector('[data-install]'), 'install button present in the nav');
      const reg = await navigator.serviceWorker.getRegistration();
      assert(reg, 'service worker registered — the site is installable and offline-capable');
      // Registration alone proves nothing about offline; check the precache filled.
      await until(async () => (await caches.keys()).includes('nought-v4'), 'precache created');
      const cache = await caches.open('nought-v4');
      for (const url of ['css/style.css', 'js/main.js', 'developer/json-formatter/',
                         'assets/fonts/jetbrainsmono.woff2']) {
        assert(await cache.match(url), 'not precached, so unavailable offline: ' + url);
      }
    })()` },

  { url: '/image/compress/to-100kb/', needs: ['sizeTool', 'dropZone', 'result'], test: `
    (async () => {
      assert(document.getElementById('sizeTool').dataset.targetKb === '100',
        'page carries its own target');
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => !document.getElementById('result').hidden, 'result panel opens');
      await until(() => /→/.test(document.getElementById('resultStats').textContent),
        'before → after reported');
      assert(!document.getElementById('saveBtn').disabled, 'download enabled after a result');
      // The 4x4 test PNG is far under the ceiling, so it must fit without
      // scaling — a visible scaling note here would mean the search is wrong.
      assert(document.getElementById('resultNote').hidden,
        'a tiny image should hit the target without being scaled down');
    })()` },

  { url: '/image/resize/instagram-post/', needs: ['presetTool', 'dropZone', 'result'], test: `
    (async () => {
      const t = document.getElementById('presetTool');
      assert(t.dataset.w === '1080' && t.dataset.h === '1080', 'page carries its own dimensions');
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => !document.getElementById('result').hidden, 'result panel opens');
      await until(() => /1080\u00d71080/.test(document.getElementById('resultStats').textContent),
        'reports the exact output dimensions');
      assert(!document.getElementById('saveBtn').disabled, 'download enabled after a result');
      // The test PNG is already square, so a centre-crop must trim nothing.
      assert(document.getElementById('resultNote').hidden,
        'a square source should not report a crop');
    })()` },

  { url: '/404.html', needs: ['main'], test: `
    (async () => {
      assert(document.querySelector('footer a'), 'footer built on the 404 page');
      document.querySelector('[data-open-palette]').click();
      assert(!document.getElementById('palette').hidden, 'palette reachable from a dead URL');
    })()` },

  { url: '/image/compress/', needs: ['dropZone', 'qualityRange', 'fileList'], test: `
    (async () => {
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => document.querySelectorAll('#fileList li').length === 1, 'file row appears');
      await until(() => /B|KB/.test(document.getElementById('totalNew').textContent), 'compressed size shown');
      assert(!document.getElementById('workspace').hidden, 'workspace revealed');
      // The compare pane is wired after processing resolves, so wait for it.
      await until(() => !document.getElementById('compareWrap').hidden, 'compare visible');
      document.getElementById('formatSelect').value = 'image/png';
      document.getElementById('formatSelect').dispatchEvent(new Event('change'));
      assert(document.getElementById('qualityRange').disabled, 'quality disabled for png');
      await drop('fileInput', [file('b.png','image/png')]);
      await until(() => document.querySelectorAll('#fileList li').length === 2, 'second file added');
      await until(() => /ZIP/.test(document.getElementById('downloadAllBtn').textContent),
        'button offers a ZIP for multiple files');
      const zip = await window.__zipForTest();
      assert(zip.files === 2, 'zip holds both files, got ' + zip.files);
      assert(zip.size > 0, 'zip is not empty');
      document.querySelector('[data-remove]').click();
      document.querySelector('[data-remove]').click();
      assert(document.getElementById('workspace').hidden, 'clearing last file resets');
    })()` },

  { url: '/image/resize/', needs: ['dropZone', 'widthInput', 'heightInput'], test: `
    (async () => {
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => document.getElementById('widthInput').value === '4', 'width prefilled');
      const w = document.getElementById('widthInput');
      w.value = 8; w.dispatchEvent(new Event('input'));
      assert(document.getElementById('heightInput').value === '8', 'aspect lock kept square');
      document.getElementById('noUpscale').click();          // allow enlarging for the test
      document.getElementById('applyBtn').click();
      await until(() => document.getElementById('resultSection').hidden === false, 'result shown');
      await until(() => /8/.test(document.getElementById('outDims').textContent), 'output dims reported');
      document.querySelector('[data-preset="1080"]').click();
      assert(document.getElementById('widthInput').value === '1080', 'preset applied');
      document.getElementById('modePercent').click();
      assert(!document.getElementById('percentGroup').hidden, 'percent mode shows its input');
      await drop('fileInput', [file('b.png','image/png'), file('c.png','image/png')]);
      await until(() => document.querySelectorAll('#fileList li').length === 3, 'batch of 3 queued');
      document.getElementById('applyBtn').click();
      await until(() => document.querySelectorAll('#fileList [data-download]:not([disabled])').length === 3,
        'all three processed');
      await until(() => /ZIP/.test(document.getElementById('downloadAllBtn').textContent), 'zip offered');
    })()` },

  { url: '/image/convert/', needs: ['dropZone', 'formatSelect'], test: `
    (async () => {
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => !document.getElementById('workspace').hidden, 'workspace shown');
      document.getElementById('formatSelect').value = 'image/jpeg';
      document.getElementById('formatSelect').dispatchEvent(new Event('change'));
      await until(() => /jpg/.test(document.getElementById('outName').textContent), 'output name uses .jpg');
      await until(() => /B/.test(document.getElementById('newSize').textContent), 'new size computed');
      assert(!document.getElementById('bgGroup').hidden, 'jpeg exposes the background colour');
      await drop('fileInput', [file('b.png','image/png')]);
      await until(() => document.querySelectorAll('#fileList li').length === 2, 'batch queued');
      await until(() => document.querySelectorAll('#fileList [data-download]:not([disabled])').length === 2,
        'both converted');
      await until(() => /png → jpeg/.test(document.getElementById('fileList').textContent), 'conversion noted');
    })()` },

  { url: '/image/bg-remove/', needs: ['dropZone', 'toleranceRange'], test: `
    (async () => {
      await drop('fileInput', [file('a.png','image/png')]);
      await until(() => !document.getElementById('workspace').hidden, 'workspace shown');
      await until(() => document.getElementById('previewImg').src.startsWith('blob:')
        || document.getElementById('previewImg').src.startsWith('data:'), 'preview rendered');
      const t = document.getElementById('toleranceRange');
      t.value = 60; t.dispatchEvent(new Event('input')); t.dispatchEvent(new Event('change'));
      await until(() => document.getElementById('pickedSwatch').style.background !== '', 'picked colour shown');
      await until(() => /% removed/.test(document.getElementById('fileList').textContent), 'removal reported');
      document.getElementById('contiguousCheck').click();
      await until(() => document.querySelectorAll('#fileList [data-download]:not([disabled])').length === 1,
        'edge-connected mode still produces a PNG');
      await drop('fileInput', [file('b.png','image/png')]);
      await until(() => document.querySelectorAll('#fileList li').length === 2, 'batch queued');
      document.getElementById('perImageColor').click();
      await until(() => document.querySelectorAll('#fileList [data-download]:not([disabled])').length === 2,
        'shared-colour batch processed');
    })()` },

  { url: '/pdf/merge/', needs: ['dropZone', 'fileList'], test: `
    (async () => {
      await until(() => window.PDFLib, 'pdf-lib loaded');
      const a = await makePdf('One'), b = await makePdf('Two');
      await drop('fileInput', [a, b]);
      await until(() => document.querySelectorAll('#fileList li').length === 2, 'two rows');
      await until(() => /1 page/.test(document.getElementById('fileList').textContent), 'page count read');
      assert(!document.getElementById('mergeBtn').disabled, 'merge enabled with 2 files');
      const res = await window.__mergeForTest();
      assert(res.pages === 2, 'merged doc has 2 pages, got ' + res.pages);
    })()` },

  { url: '/pdf/compress/', needs: ['dropZone'], test: `
    (async () => {
      await until(() => window.PDFLib && window.pdfjsLib, 'pdf libs loaded');
      await drop('fileInput', [await makePdf('Hello compress')]);
      await until(() => !document.getElementById('workspace').hidden, 'workspace shown');
      document.getElementById('compressBtn').click();
      await until(() => /B/.test(document.getElementById('newSize').textContent), 'output size shown', 20000);
      assert(document.getElementById('downloadBtn').disabled === false, 'download enabled');
    })()` },

  { url: '/text/word-counter/', needs: ['textArea'], test: `
    (async () => {
      // breadcrumb: styled trail + matching structured data
      const crumb = document.querySelector('.breadcrumb');
      assert(crumb.querySelectorAll('a').length === 2, 'two ancestor links');
      assert(crumb.querySelector('[aria-current="page"]'), 'current page marked');
      const sep = crumb.querySelector('.breadcrumb-sep');
      assert(getComputedStyle(sep).maskImage.includes('svg') ||
        getComputedStyle(sep).webkitMaskImage.includes('svg'), 'separator renders as a chevron');
      assert(getComputedStyle(crumb.querySelector('[aria-current="page"]')).fontWeight >= 600,
        'current page is the emphasised item');
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map(s => JSON.parse(s.textContent))
        .find(j => j['@type'] === 'BreadcrumbList');
      assert(ld, 'BreadcrumbList JSON-LD injected');
      assert(ld.itemListElement.length === 3, '3 crumbs in schema, got ' + ld.itemListElement.length);
      assert(ld.itemListElement[0].name === 'Home', 'first crumb is Home');
      assert(ld.itemListElement[0].item.startsWith('http'), 'ancestors carry absolute URLs');
      assert(!ld.itemListElement[2].item, 'current page carries no URL');

      const ta = document.getElementById('textArea');
      ta.value = 'Hello world. How are you?\\n\\nSecond paragraph here';
      ta.dispatchEvent(new Event('input'));
      assert(document.getElementById('wordCount').textContent === '8', 'words=8, got ' + document.getElementById('wordCount').textContent);
      assert(document.getElementById('sentenceCount').textContent === '3', 'sentences=3');
      assert(document.getElementById('paraCount').textContent === '2', 'paragraphs=2');
      assert(document.getElementById('keywordList').children.length > 0, 'keyword density rendered');
      document.getElementById('clearBtn').click();
      assert(document.getElementById('wordCount').textContent === '0', 'cleared');
    })()` },

  { url: '/text/case-converter/', needs: ['inputArea', 'outputArea'], test: `
    (async () => {
      const inp = document.getElementById('inputArea');
      inp.value = 'hello world example'; inp.dispatchEvent(new Event('input'));
      document.querySelector('[data-case="camel"]').click();
      assert(document.getElementById('outputArea').value === 'helloWorldExample',
        'camel got: ' + document.getElementById('outputArea').value);
      document.querySelector('[data-case="constant"]').click();
      assert(document.getElementById('outputArea').value === 'HELLO_WORLD_EXAMPLE', 'constant');
      assert(inp.value === 'hello world example', 'input is never overwritten');
      document.getElementById('useOutputBtn').click();
      assert(inp.value === 'HELLO_WORLD_EXAMPLE', 'chaining moves output to input');
    })()` },

  { url: '/text/lorem-ipsum/', needs: ['outputArea', 'countInput'], test: `
    (async () => {
      assert(document.getElementById('outputArea').value.length > 50, 'generates on load');
      const c = document.getElementById('countInput');
      c.value = 2; c.dispatchEvent(new Event('input'));
      document.getElementById('unitSelect').value = 'paragraphs';
      document.getElementById('unitSelect').dispatchEvent(new Event('change'));
      await until(() => document.getElementById('outputArea').value.split('\\n\\n').length === 2, '2 paragraphs');
      const first = document.getElementById('outputArea').value;
      document.getElementById('generateBtn').click();
      assert(document.getElementById('outputArea').value !== first, 'regenerate gives new text');
      document.getElementById('htmlToggle').click();
      await until(() => /<p>/.test(document.getElementById('outputArea').value), 'html mode wraps in <p>');
    })()` },

  { url: '/text/diff/', needs: ['originalText', 'modifiedText'], test: `
    (async () => {
      document.getElementById('originalText').value = 'a\\nb\\nc';
      document.getElementById('modifiedText').value = 'x\\na\\nb\\nc';
      document.getElementById('compareBtn').click();
      await until(() => document.querySelectorAll('.diff-row').length === 4, 'four rows');
      assert(document.querySelectorAll('.diff-row.add').length === 1, 'exactly one added line');
      assert(document.querySelectorAll('.diff-row.del').length === 0, 'no deletions');
      assert(document.getElementById('diffStats').textContent.includes('1 added'), 'stats reported');
    })()` },

  { url: '/calculators/emi/', needs: ['loanAmount', 'interestRate'], test: `
    (async () => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); };
      set('loanAmount', 1000000); set('interestRate', 8.5); set('tenureValue', 15);
      await until(() => document.getElementById('monthlyEmi').textContent.replace(/[^0-9]/g,'').startsWith('9847'),
        'EMI ≈ 9,847 — got ' + document.getElementById('monthlyEmi').textContent);
      assert(document.querySelectorAll('#scheduleBody tr').length === 15, 'yearly rollup has 15 rows');
      document.querySelector('[data-view="monthly"]').click();
      await until(() => document.querySelectorAll('#scheduleBody tr').length === 180, 'monthly view has 180 rows');
      set('interestRate', 0);
      await until(() => document.getElementById('monthlyEmi').textContent.replace(/[^0-9]/g,'') === '5556',
        '0% loan → 1000000/180 = 5556, got ' + document.getElementById('monthlyEmi').textContent);
    })()` },

  { url: '/calculators/gst/', needs: ['amountInput'], test: `
    (async () => {
      const a = document.getElementById('amountInput');
      a.value = 10000; a.dispatchEvent(new Event('input'));
      await until(() => document.getElementById('gstAmountVal').textContent.replace(/[^0-9]/g,'') === '1800', 'gst 1800');
      assert(document.getElementById('grossAmountVal').textContent.replace(/[^0-9]/g,'') === '11800', 'gross 11800');
      assert(document.getElementById('cgstVal').textContent.replace(/[^0-9]/g,'') === '900', 'cgst 900');
      document.querySelector('[data-mode="remove"]').click();
      await until(() => document.getElementById('netAmountVal').textContent.replace(/[^0-9]/g,'') === '8475',
        'remove mode nets 8475, got ' + document.getElementById('netAmountVal').textContent);
      document.querySelector('[data-rate="28"]').click();
      await until(() => document.getElementById('gstAmountVal').textContent.length > 1, 'rate switch recalculates');
    })()` },

  { url: '/calculators/age/', needs: ['dobInput'], test: `
    (async () => {
      const dob = document.getElementById('dobInput');
      document.getElementById('targetDateInput').value = '2026-07-30';
      dob.value = '1990-05-15';
      dob.dispatchEvent(new Event('change'));
      await until(() => document.getElementById('yearsVal').textContent === '36', 'years=36');
      assert(document.getElementById('monthsVal').textContent === '2', 'months=2');
      assert(document.getElementById('daysVal').textContent === '15', 'days=15');
      assert(/13,225|13225/.test(document.getElementById('totalDaysVal').textContent), 'total days');
      assert(document.getElementById('birthdayVal').textContent.length > 1, 'next birthday shown');
      dob.value = '2030-01-01'; dob.dispatchEvent(new Event('change'));
      await until(() => !document.getElementById('errorBox').hidden, 'future DOB is rejected');
    })()` },

  { url: '/calculators/percentage/', needs: ['p1_percent'], test: `
    (async () => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); };
      set('p1_percent', 15); set('p1_total', 500);
      assert(document.getElementById('p1_result').textContent === '75', 'p1 = 75, got ' + document.getElementById('p1_result').textContent);
      set('p2_num', 25); set('p2_total', 200);
      assert(document.getElementById('p2_result').textContent === '12.5%', 'p2 = 12.5%');
      set('p3_val1', 150); set('p3_val2', 100);
      assert(document.getElementById('p3_result').textContent === '−33.33%', 'p3 shows decrease, got ' + document.getElementById('p3_result').textContent);
      set('p4_part', 25); set('p4_percent', 12.5);
      assert(document.getElementById('p4_result').textContent === '200', 'reverse percentage');
      set('p5_value', 200); set('p5_percent', -10);
      assert(document.getElementById('p5_result').textContent === '180', 'apply percentage');
    })()` },

  { url: '/developer/json-formatter/', needs: ['jsonInput', 'jsonOutput'], test: `
    (async () => {
      const inp = document.getElementById('jsonInput');
      inp.value = '{"b":1,"a":[2,3]}';
      document.getElementById('formatBtn').click();
      await until(() => document.getElementById('jsonOutput').textContent.includes('\\n'), 'pretty printed');
      assert(inp.value === '{"b":1,"a":[2,3]}', 'input untouched');
      document.getElementById('sortToggle').click();
      document.getElementById('formatBtn').click();
      await until(() => document.getElementById('jsonOutput').textContent.indexOf('"a"') <
        document.getElementById('jsonOutput').textContent.indexOf('"b"'), 'keys sorted');
      inp.value = '{\\n  "a": 1,\\n  "b": }\\n}';
      document.getElementById('formatBtn').click();
      await until(() => document.getElementById('statusBox').classList.contains('error'), 'error shown');
      assert(/line 3/i.test(document.getElementById('statusBox').textContent),
        'error names line 3 — got: ' + document.getElementById('statusBox').textContent);
      inp.value = '{"a":1}'; document.getElementById('minifyBtn').click();
      await until(() => document.getElementById('jsonOutput').textContent === '{"a":1}', 'minified');
    })()` },

  { url: '/developer/base64/', needs: ['inputArea', 'outputArea'], test: `
    (async () => {
      const inp = document.getElementById('inputArea');
      inp.value = 'héllo 🚀'; inp.dispatchEvent(new Event('input'));
      await until(() => document.getElementById('outputArea').value.length > 0, 'encoded');
      const encoded = document.getElementById('outputArea').value;
      document.querySelector('[data-mode="decode"]').click();
      inp.value = encoded; inp.dispatchEvent(new Event('input'));
      await until(() => document.getElementById('outputArea').value === 'héllo 🚀',
        'round-trip, got: ' + document.getElementById('outputArea').value);
      inp.value = 'not base64!!'; inp.dispatchEvent(new Event('input'));
      await until(() => !document.getElementById('statusBox').hidden, 'invalid input reported');
    })()` },

  { url: '/developer/password/', needs: ['passwordOutput', 'lenRange'], test: `
    (async () => {
      await until(() => document.getElementById('passwordOutput').value.length === 16, 'generated on load');
      const first = document.getElementById('passwordOutput').value;
      document.getElementById('generateBtn').click();
      assert(document.getElementById('passwordOutput').value !== first, 'regenerates');
      const len = document.getElementById('lenRange');
      len.value = 32; len.dispatchEvent(new Event('input'));
      assert(document.getElementById('passwordOutput').value.length === 32, 'length follows slider');
      document.getElementById('incSymbols').click();
      await until(() => !/[!@#$%^&*()_+\\-=\\[\\]{};:,.<>?]/.test(document.getElementById('passwordOutput').value),
        'unchecking symbols regenerates without them');
      assert(+document.getElementById('strengthMeter').dataset.score === 4, 'strength scored');
      document.getElementById('incUpper').click(); document.getElementById('incLower').click();
      document.getElementById('incNumbers').click();
      await until(() => !document.getElementById('poolWarning').hidden, 'empty pool warns instead of throwing');
    })()` },

  { url: '/developer/qr-code/', needs: ['qrInput', 'qrcode'], test: `
    (async () => {
      await until(() => document.querySelector('#qrcode canvas'), 'qr canvas rendered');
      const before = document.querySelector('#qrcode canvas').toDataURL();
      const inp = document.getElementById('qrInput');
      inp.value = 'https://example.com/changed'; inp.dispatchEvent(new Event('input'));
      await until(() => document.querySelector('#qrcode canvas').toDataURL() !== before, 'qr redraws on input', 4000);
      document.getElementById('sizeRange').value = 512;
      document.getElementById('sizeRange').dispatchEvent(new Event('input'));
      await until(() => document.querySelector('#qrcode canvas').width >= 512, 'size applied');
      inp.value = ''; inp.dispatchEvent(new Event('input'));
      await until(() => !document.getElementById('emptyHint').hidden, 'empty input hints instead of erroring');
    })()` }
];

/* ---------- helpers injected into every page ---------- */
const PRELUDE = `
window.__failures = [];
window.assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
window.until = (fn, msg, timeout) => new Promise((resolve, reject) => {
  const limit = Date.now() + (timeout || 6000);
  (function poll() {
    let ok = false;
    try { ok = fn(); } catch (e) {}
    if (ok) return resolve();
    if (Date.now() > limit) return reject(new Error('timeout waiting for: ' + (msg || fn)));
    setTimeout(poll, 40);
  })();
});
window.file = (name, type) => {
  const bin = atob('${PNG_B64}');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type });
};
window.makePdf = async (text) => {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawText(text || 'test', { x: 20, y: 100, size: 12 });
  const bytes = await doc.save();
  return new File([bytes], (text || 'test').replace(/\\W+/g, '') + '.pdf', { type: 'application/pdf' });
};
window.drop = async (inputId, files) => {
  const input = document.getElementById(inputId);
  const dt = new DataTransfer();
  files.forEach(f => dt.items.add(f));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 120));
};`;

/* ---------- static file server ---------- */
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

/* ---------- CDP ---------- */
function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

/* A Chrome left over from an earlier run still owns the port, so the freshly
   spawned one fails to bind and we silently attach to the *old* browser —
   carrying its localStorage and service workers. That produced a phantom
   failure once and could just as easily produce a phantom pass, so refuse to
   start instead of guessing whose browser this is. */
async function assertPortFree(port) {
  try {
    await getJSON(`http://127.0.0.1:${port}/json/version`);
  } catch (e) {
    return;   // nothing listening, which is what we want
  }
  throw new Error(
    `Something is already listening on the debug port ${port}.\n` +
    `  It is almost certainly a Chrome from an interrupted run. Kill it with:\n` +
    `    pkill -f "remote-debugging-port=${port}"`);
}

async function connect(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const version = await getJSON(`http://127.0.0.1:${port}/json/version`);
      return version.webSocketDebuggerUrl;
    } catch (e) { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error('Chrome did not expose a debugging port');
}

class Session {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }
  static async open(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const s = new Session(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && s.pending.has(msg.id)) {
        const { resolve, reject } = s.pending.get(msg.id);
        s.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) s.events.push(msg);
    };
    return s;
  }
  send(method, params, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(method + ' timed out')); }
      }, 40000);
    });
  }
}

/* ---------- runner ---------- */
(async () => {
  if (!CHROME) {
    console.error('No Chrome/Chromium/Edge found — install one to run browser tests.');
    process.exit(1);
  }
  const filter = process.argv[2];
  const pages = filter ? PAGES.filter((p) => p.url.includes(filter)) : PAGES;
  if (!pages.length) { console.error('No pages match', filter); process.exit(1); }

  const debugPort = 9223;
  await assertPortFree(debugPort);

  const server = await serve();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nought-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio', '--window-size=1280,900',
    '--remote-debugging-port=' + debugPort, '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore' });

  let failures = 0;
  try {
    const wsUrl = await connect(debugPort);
    const browser = await Session.open(wsUrl);

    for (const page of pages) {
      const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
      const errors = [];
      const consumeEvents = () => {
        for (const ev of browser.events.splice(0)) {
          if (ev.params && ev.params.sessionId && ev.params.sessionId !== sessionId) continue;
          if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') {
            errors.push(ev.params.args.map((a) => a.value || a.description || a.type).join(' '));
          }
          if (ev.method === 'Runtime.exceptionThrown') {
            const d = ev.params.exceptionDetails;
            errors.push((d.exception && d.exception.description) || d.text);
          }
          if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
            errors.push(ev.params.entry.text + ' ' + (ev.params.entry.url || ''));
          }
        }
      };

      await browser.send('Runtime.enable', {}, sessionId);
      await browser.send('Log.enable', {}, sessionId);
      await browser.send('Page.enable', {}, sessionId);
      await browser.send('Page.navigate', { url: `http://127.0.0.1:${PORT}${page.url}` }, sessionId);

      // Wait for load + a beat for CDN scripts and DOMContentLoaded wiring.
      await new Promise((r) => setTimeout(r, 1400));

      const evaluate = async (expression, awaitPromise) => {
        const res = await browser.send('Runtime.evaluate',
          { expression, awaitPromise: !!awaitPromise, returnByValue: true }, sessionId);
        if (res.exceptionDetails) {
          const d = res.exceptionDetails;
          throw new Error((d.exception && (d.exception.description || d.exception.value)) || d.text);
        }
        return res.result.value;
      };

      const problems = [];
      try {
        await evaluate(PRELUDE);
        const missing = await evaluate(
          `JSON.stringify(${JSON.stringify(page.needs || [])}.filter(id => !document.getElementById(id)))`);
        if (JSON.parse(missing).length) problems.push('missing element ids: ' + missing);
        if (page.test) await evaluate(page.test, true);

        /* Mobile overflow guard.
           Re-renders the page at 390 CSS px and fails it if anything sticks out
           sideways. Chrome's --window-size will not go below ~500px on macOS,
           so this has to come from setDeviceMetricsOverride — a plain narrow
           screenshot renders wide and crops, which hides the bug rather than
           showing it. Elements inside an overflow:auto ancestor are exempt:
           a wide data table scrolling in its own box is correct. */
        await browser.send('Emulation.setDeviceMetricsOverride',
          { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sessionId);
        await new Promise((r) => setTimeout(r, 350));
        const wide = await evaluate(`(() => {
          const vw = document.documentElement.clientWidth;
          const out = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= vw + 1) continue;
            let clipped = false;
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              if (getComputedStyle(a).overflowX !== 'visible') { clipped = true; break; }
            }
            if (clipped) continue;
            out.push(el.tagName.toLowerCase() +
              (el.className && typeof el.className === 'string'
                ? '.' + el.className.trim().split(/\\s+/)[0] : '') +
              ' (+' + Math.round(r.right - vw) + 'px)');
          }
          return JSON.stringify({ w: document.documentElement.scrollWidth, out: out.slice(0, 3) });
        })()`);
        const { w, out } = JSON.parse(wide);
        if (w > 391) {
          problems.push('overflows at 390px wide: ' + w + 'px' +
            (out.length ? ' — ' + out.join(', ') : ' (a pseudo-element or a decoration)'));
        }
        await browser.send('Emulation.clearDeviceMetricsOverride', {}, sessionId);
      } catch (e) {
        problems.push(e.message.split('\n')[0]);
      }
      consumeEvents();
      // favicon/font 404s from the CDN are noise, not page bugs.
      const realErrors = errors.filter((e) => !/favicon|fonts\.g|net::ERR_/.test(e));
      if (realErrors.length) problems.push(...realErrors.map((e) => 'console: ' + e.split('\n')[0]));

      if (problems.length) {
        failures++;
        console.log('✗ ' + page.url);
        problems.slice(0, 6).forEach((p) => console.log('    ' + p));
      } else {
        console.log('✓ ' + page.url);
      }
      await browser.send('Target.closeTarget', { targetId });
    }
  } finally {
    chrome.kill();
    server.close();
    // Chrome may still be flushing its profile; cleanup is best-effort.
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (e) { /* temp dir, the OS will reap it */ }
  }

  console.log(failures ? `\n${failures} page(s) failed` : `\nAll ${pages.length} page(s) passed`);
  process.exit(failures ? 1 : 0);
})();
