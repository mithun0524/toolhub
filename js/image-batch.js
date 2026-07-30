/* ===== SHARED IMAGE BATCH QUEUE =====
   Used by all four image tools. Owns the file list, its rendering, re-processing
   on any settings change, single saves and the zipped "download all".
   Depends on js/main.js (loadImageFile, formatBytes, downloadBlob, setBusy). */
(function () {
  'use strict';

  const ZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  let zipPromise = null;

  // Loaded on first use only: most visits never click "download all".
  function loadZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (!zipPromise) {
      zipPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = ZIP_URL;
        s.onload = () => resolve(window.JSZip);
        s.onerror = () => { zipPromise = null; reject(new Error('Could not load the zip library')); };
        document.head.appendChild(s);
      });
    }
    return zipPromise;
  }

  /**
   * @param {object} opts
   *  listEl, countEl        — <ul> for rows, element for the count
   *  accept                 — array of allowed MIME types (optional)
   *  process(item)          — async, returns { blob, name } for one item
   *  onChange(queue)        — called after the queue's contents change
   *  onSelect(item, index)  — called when a row's thumbnail is clicked
   *  statEls                — { orig, out, saved } stat-card value elements
   *  downloadAllBtn, processBtn, zipName
   */
  window.createImageQueue = function (opts) {
    const items = [];
    let selected = 0;

    const queue = {
      items,
      get selected() { return items[selected]; },
      get selectedIndex() { return selected; },
      get ready() { return items.some((i) => i.blob); }
    };

    async function add(files) {
      let rejected = 0;
      for (const file of files) {
        try {
          const loaded = await loadImageFile(file, opts.accept);
          items.push({
            file, img: loaded.img, blob: null, name: file.name,
            keptOriginal: false, note: '', error: null
          });
        } catch (e) { rejected++; showToast(file.name + ': ' + e.message, 'error'); }
      }
      if (rejected > 1) showToast(rejected + ' files were skipped', 'warn');
      if (opts.onChange) opts.onChange(queue);
      return items.length;
    }

    async function processAll() {
      if (!items.length) return;
      setBusy(opts.processBtn, true, opts.busyLabel || 'Working…');
      // Yield so the spinner paints before a big image blocks the thread.
      await new Promise((r) => setTimeout(r, 0));
      try {
        for (const item of items) {
          try {
            const result = await opts.process(item);
            item.blob = result.blob;
            item.name = result.name;
            item.keptOriginal = !!result.keptOriginal;
            item.note = result.note || '';
            item.error = null;
          } catch (e) {
            item.blob = null;
            item.error = e.message || 'failed';
          }
        }
        render();
      } finally { setBusy(opts.processBtn, false); }
    }

    function removeAt(index) {
      items.splice(index, 1);
      selected = Math.min(selected, Math.max(0, items.length - 1));
      if (opts.onChange) opts.onChange(queue);
      render();
    }

    function clear() {
      items.length = 0;
      selected = 0;
      render();
      if (opts.onChange) opts.onChange(queue);
    }

    function render() {
      if (opts.countEl) opts.countEl.textContent = items.length;
      const list = opts.listEl;
      if (!list) return;
      list.innerHTML = '';

      let origTotal = 0, outTotal = 0;
      items.forEach((item, i) => {
        origTotal += item.file.size;
        outTotal += item.blob ? item.blob.size : item.file.size;
        const saved = item.blob ? 1 - item.blob.size / item.file.size : 0;
        const status = item.error
          ? `<span style="color:var(--danger)">${item.error}</span>`
          : item.keptOriginal ? 'original kept'
          : item.blob ? (saved > 0.005 ? '−' + Math.round(saved * 100) + '%'
            : saved < -0.005 ? '+' + Math.round(-saved * 100) + '%' : '—')
          : '…';

        const li = document.createElement('li');
        li.className = 'file-item';
        if (i === selected) li.style.borderColor = 'var(--accent)';
        li.innerHTML =
          `<button data-select="${i}" aria-label="Preview ${item.file.name}" ` +
          'style="padding:0;border:none;background:none;line-height:0;cursor:pointer">' +
          `<img src="${item.img.src}" alt="" width="34" height="34" ` +
          'style="width:34px;height:34px;object-fit:cover;border-radius:4px"></button>' +
          `<span class="file-name" title="${item.file.name}">${item.file.name}` +
          `<span class="file-meta" style="display:block">${item.img.naturalWidth}×${item.img.naturalHeight}` +
          `${item.note ? ' · ' + item.note : ''}</span></span>` +
          `<span class="file-meta">${formatBytes(item.file.size)} → ` +
          `<strong style="color:var(--text-primary)">${item.blob ? formatBytes(item.blob.size) : '…'}</strong></span>` +
          `<span class="file-meta" style="min-width:56px;text-align:right;color:${
            saved > 0.005 && !item.error ? 'var(--success)' : 'var(--text-muted)'}">${status}</span>` +
          `<button class="copy-btn" data-download="${i}"${item.blob ? '' : ' disabled'}>Save</button>` +
          `<button class="file-remove" data-remove="${i}" aria-label="Remove ${item.file.name}">` +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M18 6 6 18M6 6l12 12"/></svg></button>';
        list.appendChild(li);
      });

      if (opts.statEls) {
        const { orig, out, saved } = opts.statEls;
        if (orig) orig.textContent = origTotal ? formatBytes(origTotal) : '–';
        if (out) out.textContent = outTotal ? formatBytes(outTotal) : '–';
        if (saved) {
          const pct = origTotal ? (1 - outTotal / origTotal) * 100 : 0;
          saved.textContent = origTotal ? (pct >= 0 ? '' : '+') + Math.round(Math.abs(pct)) + '%' : '–';
          saved.classList.toggle('good', pct > 0);
        }
      }
      if (opts.downloadAllBtn) {
        opts.downloadAllBtn.disabled = !queue.ready;
        opts.downloadAllBtn.textContent = items.length > 1
          ? 'Download all as ZIP' : 'Download';
      }
    }

    async function downloadAll() {
      const done = items.filter((i) => i.blob);
      if (!done.length) return showToast('Nothing to download yet', 'warn');
      if (done.length === 1) return downloadBlob(done[0].blob, done[0].name);

      const btn = opts.downloadAllBtn;
      setBusy(btn, true, 'Zipping…');
      try {
        const JSZipLib = await loadZip();
        const zip = new JSZipLib();
        const used = new Set();
        for (const item of done) {
          // Two source folders can hold the same filename; keep both.
          let name = item.name, n = 2;
          while (used.has(name)) {
            name = item.name.replace(/(\.[^.]+)?$/, ' (' + n++ + ')$1');
          }
          used.add(name);
          zip.file(name, item.blob);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, opts.zipName || 'images.zip');
        showToast(done.length + ' files zipped');
      } catch (e) {
        // Falling back beats failing: save them one at a time instead.
        showToast(e.message + ' — saving files individually', 'error');
        for (const item of done) {
          downloadBlob(item.blob, item.name);
          await new Promise((r) => setTimeout(r, 350));
        }
      } finally { setBusy(btn, false); }
    }

    if (opts.listEl) {
      opts.listEl.addEventListener('click', (e) => {
        const dl = e.target.closest('[data-download]');
        const rm = e.target.closest('[data-remove]');
        const sel = e.target.closest('[data-select]');
        if (dl) {
          const item = items[+dl.dataset.download];
          if (item.blob) downloadBlob(item.blob, item.name);
        } else if (rm) {
          removeAt(+rm.dataset.remove);
        } else if (sel) {
          selected = +sel.dataset.select;
          render();
          if (opts.onSelect) opts.onSelect(items[selected], selected);
        }
      });
    }
    if (opts.downloadAllBtn) opts.downloadAllBtn.addEventListener('click', downloadAll);
    if (opts.processBtn) opts.processBtn.addEventListener('click', processAll);

    Object.assign(queue, { add, processAll, removeAt, clear, render, downloadAll });
    return queue;
  };
})();
