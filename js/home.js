/* ===== LANDING PAGE =====
   Filtering, plus the live tiles. The featured tiles are not screenshots or
   mock-ups: they run the same pure functions from js/tools-core.js that the
   real tool pages run, so the landing page cannot drift away from the product
   it is advertising. Every widget degrades to a plain link if anything here
   throws — the tile is wrapped in a stretched <a> either way. */
(function () {
  'use strict';

  const T = window.ToolCore;

  /* ---------- filtering ---------- */
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const noResults = document.getElementById('noResults');
  const pills = [...document.querySelectorAll('.cat-pill')];
  const cells = [...document.querySelectorAll('.tool-cell')];
  const grid = document.getElementById('bento');

  function filterTools() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = (pills.find((p) => p.getAttribute('aria-pressed') === 'true') || {}).dataset;
    const active = cat ? cat.cat : 'all';
    let visible = 0;

    cells.forEach((cell) => {
      const match = (active === 'all' || cell.dataset.cat === active) &&
        (!query || cell.textContent.toLowerCase().includes(query));
      cell.hidden = !match;
      if (match) visible++;
    });

    noResults.style.display = visible === 0 ? 'block' : 'none';
    searchClear.classList.toggle('visible', query.length > 0);
    // Filtering collapses the bento to one uniform size: with only four tiles
    // left, a 2×-tall feature tile beside three small ones reads as breakage.
    grid.classList.toggle('is-filtered', active !== 'all' || query.length > 0);
  }

  pills.forEach((pill) => pill.addEventListener('click', () => {
    pills.forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
    filterTools();
  }));
  searchInput.addEventListener('input', filterTools);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; filterTools(); }
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = ''; filterTools(); searchInput.focus();
  });

  /* The nav still links to #image, #pdf and friends. There are no category
     sections to jump to any more, so a hash selects the filter instead. */
  const HASH_TO_CAT = { image: 'image', pdf: 'pdf', text: 'text', calculators: 'calc', developer: 'dev' };
  function applyHash() {
    const cat = HASH_TO_CAT[location.hash.replace('#', '')];
    if (!cat) return;
    const pill = pills.find((p) => p.dataset.cat === cat);
    if (!pill) return;
    pills.forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
    filterTools();
    grid.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  window.addEventListener('hashchange', applyHash);

  const q = new URLSearchParams(location.search).get('q');
  if (q) searchInput.value = q;
  filterTools();
  applyHash();

  /* ---------- live tile: password ---------- */
  (function password() {
    const out = document.getElementById('livePass');
    if (!out || !T) return;
    const meter = document.getElementById('livePassMeter');
    const bits = document.getElementById('livePassBits');
    const opts = { length: 16, upper: true, lower: true, numbers: true, symbols: true };
    // tools-core stays pure: the caller supplies the randomness, exactly as the
    // full password page does.
    const randomBytes = (n) => crypto.getRandomValues(new Uint32Array(n));

    function roll() {
      const value = T.generatePassword(opts, randomBytes);
      out.textContent = value;
      const entropy = T.passwordEntropy(value.length, T.buildPool(opts).length);
      const strength = T.strengthFromEntropy(entropy);
      meter.dataset.score = strength.score;
      bits.textContent = Math.round(entropy) + ' bits · ' + strength.label;
    }

    document.getElementById('livePassRoll').addEventListener('click', roll);
    document.getElementById('livePassCopy').addEventListener('click', (e) => {
      window.copyToClipboard(out.textContent, e.currentTarget);
    });
    roll();
  })();

  /* ---------- live tile: word counter ---------- */
  (function words() {
    const input = document.getElementById('liveText');
    if (!input || !T) return;
    const out = document.getElementById('liveTextOut');
    const update = () => {
      const s = T.textStats(input.value);
      out.innerHTML =
        `<b>${s.words}</b> words <i>·</i> <b>${s.chars}</b> chars <i>·</i> <b>${T.humanDuration(s.readingSeconds)}</b> read`;
    };
    input.addEventListener('input', update);
    update();
  })();

  /* ---------- live tile: JSON ---------- */
  (function json() {
    const input = document.getElementById('liveJson');
    if (!input) return;
    const out = document.getElementById('liveJsonOut');
    const update = () => {
      const raw = input.value.trim();
      if (!raw) { out.className = 'live-status'; out.textContent = 'Paste JSON to validate'; return; }
      try {
        const parsed = JSON.parse(raw);
        input.value = input.dataset.pretty === '1' ? input.value : input.value;
        out.className = 'live-status ok';
        const stats = T.jsonStats(parsed);
        out.textContent = `Valid · ${stats.keys} keys · depth ${stats.depth}`;
      } catch (err) {
        const loc = T.jsonErrorLocation(raw, err);
        out.className = 'live-status bad';
        out.textContent = loc ? `Invalid at line ${loc.line}, column ${loc.column}` : 'Invalid JSON';
      }
    };
    input.addEventListener('input', update);
    update();
  })();

  /* ---------- live tile: image compressor ----------
     Uses the same canvas helpers as the real tool. Nothing is uploaded here
     either, which is the entire point of showing it working on the front page. */
  (function compress() {
    const zone = document.getElementById('liveDrop');
    if (!zone || !window.loadImageFile) return;
    const out = document.getElementById('liveDropOut');
    const preview = document.getElementById('liveDropImg');
    const input = document.getElementById('liveDropInput');

    async function run(files) {
      const file = files[0];
      if (!file) return;
      out.className = 'live-status';
      out.textContent = 'Compressing…';
      try {
        const { img, revoke } = await window.loadImageFile(file);
        const canvas = window.drawToCanvas(img, img.naturalWidth, img.naturalHeight);
        const blob = await window.canvasToBlob(canvas, 'image/jpeg', 0.75);
        revoke();
        const saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
        preview.src = URL.createObjectURL(blob);
        preview.hidden = false;
        zone.classList.add('has-result');
        out.className = 'live-status ok';
        out.textContent =
          `${window.formatBytes(file.size)} → ${window.formatBytes(blob.size)} · ${saved}% smaller`;
      } catch (e) {
        out.className = 'live-status bad';
        out.textContent = e.message;
      }
    }

    window.initDropZone(zone, input, run);
  })();

  /* ---------- live tile: QR ----------
     qrcodejs is vendored and deferred; if it has not arrived (or fails), the
     tile just stays a link to the full tool rather than showing a broken box. */
  (function qr() {
    const host = document.getElementById('liveQr');
    if (!host) return;
    const draw = () => {
      if (typeof window.QRCode !== 'function') return;
      host.innerHTML = '';
      new window.QRCode(host, {
        text: location.origin + location.pathname,
        width: 132, height: 132,
        colorDark: '#09090b', colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    };
    if (typeof window.QRCode === 'function') draw();
    else window.addEventListener('load', draw, { once: true });
  })();
})();
