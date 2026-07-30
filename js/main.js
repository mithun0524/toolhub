/* ===== SHARED SITE LAYER =====
   Chrome + helpers used by every page. Depends on js/tools-core.js. */
(function () {
  'use strict';

  // Site root, derived from this script's own URL, so pages at any depth work.
  const ROOT = (function () {
    const src = (document.currentScript && document.currentScript.src) || '';
    return src ? src.replace(/js\/main\.js.*$/, '') : '/';
  })();

  /* ---------- tool registry (drives search, ⌘K palette, related tools) ---------- */
  const ICONS = {
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5-11 11"/>',
    resize: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    convert: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    merge: '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3"/><path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    type: '<path d="m3 15 4-8 4 8"/><path d="M4 13h6"/><path d="M15 11v4a2 2 0 0 0 4 0v-4a2 2 0 0 0-4 0Z"/>',
    lines: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    diff: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    receipt: '<path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="M3 15h6"/><path d="M6 12v6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    key: '<path d="m21 2-2 2m-1.5 1.5L4 19.5a2.828 2.828 0 1 0 4 4L21.5 10.5m-3-3L21 10M15.5 5.5 17 7"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
  };

  const CATEGORIES = {
    image: { label: 'Image Tools', hash: 'image' },
    pdf:   { label: 'PDF Tools', hash: 'pdf' },
    text:  { label: 'Text Tools', hash: 'text' },
    calc:  { label: 'Calculators', hash: 'calculators' },
    dev:   { label: 'Developer Tools', hash: 'developer' }
  };

  const TOOLS = [
    { id: 'img-compress', cat: 'image', icon: 'image', name: 'Image Compressor', url: 'image/compress/index.html', desc: 'Shrink JPG, PNG and WebP files with a live before/after preview.', keys: 'compress reduce optimize size jpg png webp shrink' },
    { id: 'img-resize', cat: 'image', icon: 'resize', name: 'Image Resizer', url: 'image/resize/index.html', desc: 'Resize by pixels or percentage with aspect-ratio lock and presets.', keys: 'resize scale dimensions width height percent' },
    { id: 'img-convert', cat: 'image', icon: 'convert', name: 'Image Converter', url: 'image/convert/index.html', desc: 'Convert between JPG, PNG, WebP and AVIF in one click.', keys: 'convert format jpg png webp avif change' },
    { id: 'img-bg', cat: 'image', icon: 'scissors', name: 'Background Remover', url: 'image/bg-remove/index.html', desc: 'Key out a solid background and export a transparent PNG.', keys: 'background remove transparent chroma key cutout' },
    { id: 'pdf-compress', cat: 'pdf', icon: 'file', name: 'PDF Compressor', url: 'pdf/compress/index.html', desc: 'Re-render pages at a lower DPI to genuinely shrink scanned PDFs.', keys: 'pdf compress reduce size optimize shrink scan' },
    { id: 'pdf-merge', cat: 'pdf', icon: 'merge', name: 'PDF Merger', url: 'pdf/merge/index.html', desc: 'Combine PDFs, reorder pages by drag, download one file.', keys: 'pdf merge combine join append' },
    { id: 'txt-words', cat: 'text', icon: 'bars', name: 'Word Counter', url: 'text/word-counter/index.html', desc: 'Live words, characters, sentences, reading time and keyword density.', keys: 'word count character sentence reading time density seo' },
    { id: 'txt-case', cat: 'text', icon: 'type', name: 'Case Converter', url: 'text/case-converter/index.html', desc: 'UPPER, lower, Title, camelCase, snake_case, kebab-case and more.', keys: 'case upper lower title camel pascal snake kebab constant slug' },
    { id: 'txt-lorem', cat: 'text', icon: 'lines', name: 'Lorem Ipsum Generator', url: 'text/lorem-ipsum/index.html', desc: 'Placeholder text by paragraphs, sentences or words — plus HTML output.', keys: 'lorem ipsum dummy placeholder filler text generator' },
    { id: 'txt-diff', cat: 'text', icon: 'diff', name: 'Text Diff Checker', url: 'text/diff/index.html', desc: 'Real line-and-word diff with change stats and ignore options.', keys: 'diff compare difference change text merge' },
    { id: 'calc-emi', cat: 'calc', icon: 'card', name: 'EMI Calculator', url: 'calculators/emi/index.html', desc: 'Loan EMI, total interest and a full amortisation schedule.', keys: 'emi loan interest home car personal amortisation mortgage' },
    { id: 'calc-gst', cat: 'calc', icon: 'receipt', name: 'GST Calculator', url: 'calculators/gst/index.html', desc: 'Add or remove GST with CGST/SGST split for every slab.', keys: 'gst tax vat cgst sgst igst india inclusive exclusive' },
    { id: 'calc-age', cat: 'calc', icon: 'calendar', name: 'Age Calculator', url: 'calculators/age/index.html', desc: 'Exact age in years, months, days — plus next-birthday countdown.', keys: 'age birthday date of birth dob days years countdown' },
    { id: 'calc-pct', cat: 'calc', icon: 'percent', name: 'Percentage Calculator', url: 'calculators/percentage/index.html', desc: 'Five percentage modes: of, what percent, change, reverse and apply.', keys: 'percentage percent increase decrease change ratio discount' },
    { id: 'dev-json', cat: 'dev', icon: 'code', name: 'JSON Formatter', url: 'developer/json-formatter/index.html', desc: 'Prettify, minify, validate and sort keys with exact error position.', keys: 'json format validate prettify minify beautify lint sort' },
    { id: 'dev-b64', cat: 'dev', icon: 'lock', name: 'Base64 Encoder / Decoder', url: 'developer/base64/index.html', desc: 'Unicode-safe Base64 both ways, with URL-safe and file modes.', keys: 'base64 encode decode url safe binary data uri' },
    { id: 'dev-pass', cat: 'dev', icon: 'key', name: 'Password Generator', url: 'developer/password/index.html', desc: 'Crypto-random passwords with entropy scoring and crack-time estimate.', keys: 'password generator random secure strong entropy passphrase' },
    { id: 'dev-qr', cat: 'dev', icon: 'qr', name: 'QR Code Generator', url: 'developer/qr-code/index.html', desc: 'QR codes with size, colour and error-correction control; PNG or SVG.', keys: 'qr code generator url wifi vcard png svg barcode' }
  ];

  const svg = (paths, size) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${size ? ` width="${size}" height="${size}"` : ''} aria-hidden="true">${paths}</svg>`;

  /* ---------- toast ---------- */
  function showToast(msg, type) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = msg;
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, type === 'error' ? 4000 : 2400);
  }

  /* ---------- clipboard ---------- */
  async function copyToClipboard(text, btn) {
    if (!text) { showToast('Nothing to copy', 'warn'); return false; }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // file:// and plain http have no async clipboard — fall back.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (!ok) throw new Error('execCommand failed');
      }
      if (btn) {
        const label = btn.dataset.label || btn.textContent;
        btn.dataset.label = label;
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = label; }, 1600);
      }
      showToast('Copied to clipboard');
      return true;
    } catch (e) {
      showToast('Could not copy — select the text and press Ctrl/Cmd+C', 'error');
      return false;
    }
  }

  /* ---------- download ---------- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  function downloadFile(content, filename, mimeType) {
    downloadBlob(new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' }), filename);
  }

  /* ---------- misc format ---------- */
  const nf = new Intl.NumberFormat('en-IN');
  function formatNum(n) { return nf.format(Math.round(n)); }
  function formatCurrency(n, currency) {
    const cur = currency || (window.CURRENCY || 'INR');
    try {
      return new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US',
        { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
    } catch (e) { return '₹' + formatNum(n); }
  }
  const formatBytes = (b) => window.ToolCore.formatBytes(b);

  /* ---------- busy state ---------- */
  function setBusy(btn, busy, busyLabel) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span><span class="btn-label">' +
        (busyLabel || 'Working…') + '</span>';
      btn.classList.add('loading');
    } else {
      btn.disabled = false;
      if (btn.dataset.prev) btn.innerHTML = btn.dataset.prev;
      btn.classList.remove('loading');
    }
  }

  /* ---------- FAQ ---------- */
  function initFAQ() {
    document.querySelectorAll('.faq-q').forEach((btn) => {
      const item = btn.closest('.faq-item');
      const panel = item.querySelector('.faq-a');
      btn.setAttribute('aria-expanded', 'false');
      if (panel && !panel.id) panel.id = 'faq-' + Math.random().toString(36).slice(2, 8);
      if (panel) btn.setAttribute('aria-controls', panel.id);
      btn.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ---------- drop zone (keyboard accessible) ---------- */
  function initDropZone(zoneEl, fileInput, onFiles) {
    if (!zoneEl || !fileInput) return;
    zoneEl.setAttribute('role', 'button');
    zoneEl.setAttribute('tabindex', '0');
    if (!zoneEl.getAttribute('aria-label')) zoneEl.setAttribute('aria-label', 'Choose a file to upload');

    const open = () => fileInput.click();
    zoneEl.addEventListener('click', (e) => { if (e.target !== fileInput) open(); });
    zoneEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length) onFiles(fileInput.files);
    });

    let depth = 0;
    zoneEl.addEventListener('dragenter', (e) => {
      e.preventDefault(); depth++; zoneEl.classList.add('drag-over');
    });
    zoneEl.addEventListener('dragover', (e) => { e.preventDefault(); });
    zoneEl.addEventListener('dragleave', () => {
      // dragleave fires for child elements too; only clear on the real exit.
      if (--depth <= 0) { depth = 0; zoneEl.classList.remove('drag-over'); }
    });
    zoneEl.addEventListener('drop', (e) => {
      e.preventDefault(); depth = 0; zoneEl.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    });
    // Paste an image straight from the clipboard.
    document.addEventListener('paste', (e) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      onFiles(e.clipboardData.files);
    });
  }

  /* ---------- image loading (shared by the 4 image tools) ---------- */
  const MAX_IMAGE_BYTES = 40 * 1024 * 1024;

  function loadImageFile(file, accept) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file selected'));
      if (!/^image\//.test(file.type)) return reject(new Error('That is not an image file'));
      if (accept && accept.length && !accept.includes(file.type)) {
        return reject(new Error('Unsupported format: ' + (file.type || 'unknown')));
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return reject(new Error('Image is larger than ' + formatBytes(MAX_IMAGE_BYTES)));
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, file, revoke: () => URL.revokeObjectURL(url) });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode that image')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        // An unsupported MIME silently yields PNG; report the real type back.
        blob ? resolve(blob) : reject(new Error('Encoding to ' + type + ' failed'));
      }, type, quality);
    });
  }

  // Draw an image into a canvas of the given size with good downscale quality.
  function drawToCanvas(img, w, h, background) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
  function withExtension(name, mime) {
    const base = (name || 'image').replace(/\.[^/.]+$/, '');
    return base + '.' + (EXT[mime] || 'png');
  }

  // Feature-detect encoder support once: Safari has no AVIF encoder, etc.
  const encoderSupport = (function () {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const out = {};
    for (const mime of Object.keys(EXT)) {
      out[mime] = c.toDataURL(mime).startsWith('data:' + mime);
    }
    return out;
  })();

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('toolbox-theme', theme); } catch (e) {}
  }
  function initTheme() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        btn.setAttribute('aria-label', 'Switch to ' + (next === 'dark' ? 'light' : 'dark') + ' theme');
      });
    });
  }

  /* ---------- chrome: mobile nav + theme button + palette trigger ---------- */
  function buildChrome() {
    const nav = document.querySelector('nav .nav-inner');
    if (!nav) return;

    const actions = document.createElement('div');
    actions.className = 'nav-actions';
    actions.innerHTML =
      `<button class="icon-btn" data-open-palette aria-label="Search tools (press Control or Command K)" title="Search tools  ⌘K">${svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}</button>` +
      `<button class="icon-btn theme-toggle" data-theme-toggle aria-label="Toggle colour theme" title="Toggle theme">` +
        `<span class="icon-moon">${svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>')}</span>` +
        `<span class="icon-sun">${svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')}</span>` +
      `</button>` +
      `<button class="icon-btn nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button>`;
    nav.appendChild(actions);

    // Mobile menu: the desktop nav links are hidden under 720px.
    const menu = document.createElement('div');
    menu.id = 'mobileMenu';
    menu.innerHTML = Object.keys(CATEGORIES)
      .map((k) => `<a href="${ROOT}index.html#${CATEGORIES[k].hash}">${CATEGORIES[k].label}</a>`).join('');
    document.querySelector('nav').after(menu);

    const toggle = actions.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- ⌘K command palette ---------- */
  let palette = null;
  function buildPalette() {
    palette = document.createElement('div');
    palette.id = 'palette';
    palette.hidden = true;
    palette.style.cssText =
      'position:fixed;inset:0;z-index:500;display:flex;align-items:flex-start;justify-content:center;' +
      'padding:12vh 16px 16px;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px)';
    palette.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="Search tools" style="width:100%;max-width:520px;' +
      'background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);' +
      'box-shadow:var(--shadow-lg);overflow:hidden">' +
      '<input id="paletteInput" class="input-field" placeholder="Search 18 tools…" autocomplete="off" ' +
      'style="border:none;border-bottom:1px solid var(--border);border-radius:0;padding:14px 16px;font-size:0.95rem;box-shadow:none">' +
      '<div id="paletteList" role="listbox" style="max-height:min(50vh,360px);overflow:auto;padding:6px"></div>' +
      '</div>';
    document.body.appendChild(palette);

    const input = palette.querySelector('#paletteInput');
    const list = palette.querySelector('#paletteList');
    let items = [], active = 0;

    function render(query) {
      const q = query.trim().toLowerCase();
      items = TOOLS.filter((t) => !q ||
        (t.name + ' ' + t.keys + ' ' + t.desc).toLowerCase().includes(q)).slice(0, 8);
      active = 0;
      list.innerHTML = items.length
        ? items.map((t, i) =>
          `<a href="${ROOT}${t.url}" role="option" data-i="${i}" aria-selected="${i === 0}" ` +
          `style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:var(--radius-sm);` +
          `font-size:0.88rem;${i === 0 ? 'background:var(--bg-card-hover)' : ''}">` +
          `<span style="color:var(--text-muted);display:flex">${svg(ICONS[t.icon], 15)}</span>` +
          `<span>${t.name}</span>` +
          `<span style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">${CATEGORIES[t.cat].label}</span></a>`).join('')
        : '<p style="padding:16px;font-size:0.85rem;color:var(--text-muted);text-align:center">No tools match that search.</p>';
    }

    function highlight(next) {
      if (!items.length) return;
      active = (next + items.length) % items.length;
      list.querySelectorAll('a').forEach((a, i) => {
        a.setAttribute('aria-selected', String(i === active));
        a.style.background = i === active ? 'var(--bg-card-hover)' : '';
        if (i === active) a.scrollIntoView({ block: 'nearest' });
      });
    }

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
      else if (e.key === 'Enter' && items[active]) { window.location.href = ROOT + items[active].url; }
      else if (e.key === 'Escape') closePalette();
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
    render('');
  }

  let lastFocus = null;
  function openPalette() {
    if (!palette) buildPalette();
    lastFocus = document.activeElement;
    palette.hidden = false;
    const input = palette.querySelector('#paletteInput');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); palette && !palette.hidden ? closePalette() : openPalette();
      } else if (e.key === '/' && !typing) {
        const search = document.getElementById('searchInput');
        e.preventDefault();
        search ? search.focus() : openPalette();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-palette]')) openPalette();
    });
  }

  /* ---------- breadcrumb structured data ----------
     Built from the trail already in the markup, so the two can never drift.
     Google renders JS before parsing JSON-LD, so injecting it here is fine. */
  function initBreadcrumbSchema() {
    const nav = document.querySelector('.breadcrumb');
    if (!nav) return;
    const crumbs = [...nav.querySelectorAll('a, [aria-current="page"]')];
    if (crumbs.length < 2) return;

    const items = crumbs.map((el, i) => {
      const item = {
        '@type': 'ListItem',
        position: i + 1,
        name: el.textContent.trim()
      };
      // The current page needs no item URL; ancestors do.
      if (el.tagName === 'A') item.item = el.href;
      return item;
    });

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    });
    document.head.appendChild(script);
  }

  /* ---------- related tools (injected on tool pages) ---------- */
  function initRelated() {
    const host = document.getElementById('related');
    if (!host) return;
    const currentId = host.dataset.tool;
    const current = TOOLS.find((t) => t.id === currentId);
    const pool = TOOLS.filter((t) => t.id !== currentId);
    // Same category first, then fill from the rest, so the block is never thin.
    const picks = pool.filter((t) => current && t.cat === current.cat)
      .concat(pool.filter((t) => !current || t.cat !== current.cat)).slice(0, 4);
    host.className = 'related';
    host.innerHTML = '<h2>Related tools</h2><div class="related-grid">' +
      picks.map((t) => `<a class="related-card" href="${ROOT}${t.url}">${svg(ICONS[t.icon], 15)}${t.name}</a>`)
        .join('') + '</div>';
  }

  /* ---------- footer (single source of truth for every page) ---------- */
  function initFooter() {
    const host = document.querySelector('footer[data-auto]');
    if (!host) return;
    const cols = Object.keys(CATEGORIES).map((cat) =>
      `<div class="footer-col"><h4>${CATEGORIES[cat].label}</h4><ul>` +
      TOOLS.filter((t) => t.cat === cat)
        .map((t) => `<li><a href="${ROOT}${t.url}">${t.name}</a></li>`).join('') +
      '</ul></div>').join('');
    host.innerHTML =
      '<div class="footer-inner"><div class="footer-grid">' +
      '<div class="footer-brand"><div class="logo"><span class="logo-icon">' +
      `<img src="${ROOT}assets/logo-icon.svg" alt="" width="16" height="16"></span>ToolBox</div>` +
      '<p>Fast, private utility tools that run entirely in your browser. No uploads, no accounts, no limits.</p></div>' +
      cols + '</div>' +
      '<div class="footer-bottom"><p>© 2026 ToolBox · All processing happens on your device.</p>' +
      `<p><a href="${ROOT}index.html">All tools</a></p></div></div>`;
  }

  /* ---------- exports ---------- */
  Object.assign(window, {
    showToast, copyToClipboard, downloadFile, downloadBlob, formatBytes, formatNum, formatCurrency,
    setBusy, initDropZone, initFAQ, loadImageFile, canvasToBlob, drawToCanvas, withExtension,
    encoderSupport, openPalette, svgIcon: svg
  });
  window.ToolBox = { ROOT, TOOLS, CATEGORIES, ICONS, svg };

  document.addEventListener('DOMContentLoaded', () => {
    buildChrome();
    initTheme();
    initShortcuts();
    initFAQ();
    initBreadcrumbSchema();
    initRelated();
    initFooter();
  });
})();
