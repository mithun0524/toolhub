/* ===== RESIZE TO EXACT DIMENSIONS =====
   Powers the /image/resize/<preset>/ pages.

   "Resize for Instagram" is not the same request as "resize to 1080px". The
   user wants a file that fits a slot exactly, and a slot has a fixed aspect
   ratio — so squeezing the whole image into it (which is what a plain scale
   does) distorts faces. This centre-crops to the target aspect first, then
   scales: the same thing a human would do, and what every social preset in
   Photoshop does.

   The crop is honest about itself — the page reports how much was trimmed, so
   nobody is surprised that the edges of their photo are gone. */
(function () {
  'use strict';

  /** Draw `img` into exactly w x h, centre-cropping whatever does not fit. */
  function coverCrop(img, w, h) {
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const scale = Math.max(w / sw, h / sh);      // cover, not contain
    const cropW = Math.min(sw, w / scale);
    const cropH = Math.min(sh, h / scale);
    const sx = (sw - cropW) / 2;
    const sy = (sh - cropH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // White matte: a transparent PNG dropped here would otherwise turn black
    // once it is flattened to JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, w, h);

    const trimmed = Math.round((1 - (cropW * cropH) / (sw * sh)) * 100);
    return { canvas, trimmed, source: { w: sw, h: sh } };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('presetTool');
    if (!host) return;

    const outW = Number(host.dataset.w);
    const outH = Number(host.dataset.h);
    const zone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const result = document.getElementById('result');
    const preview = document.getElementById('resultImg');
    const stats = document.getElementById('resultStats');
    const note = document.getElementById('resultNote');
    const saveBtn = document.getElementById('saveBtn');
    let current = null;

    async function run(files) {
      const file = files[0];
      if (!file) return;
      result.hidden = false;
      note.hidden = true;
      stats.textContent = 'Working…';
      try {
        const { img, revoke } = await window.loadImageFile(file);
        const { canvas, trimmed, source } = coverCrop(img, outW, outH);
        const blob = await window.canvasToBlob(canvas, 'image/jpeg', 0.88);
        revoke();

        current = { blob, name: window.withExtension(file.name, 'image/jpeg') };
        preview.src = URL.createObjectURL(blob);
        preview.hidden = false;
        saveBtn.disabled = false;
        stats.textContent =
          `${source.w}×${source.h} → ${outW}×${outH} · ${window.formatBytes(blob.size)}`;

        if (trimmed > 1) {
          note.hidden = false;
          note.textContent =
            `Cropped from the centre to fit ${outW}×${outH} exactly — about ${trimmed}% of ` +
            `the original was outside that shape. Use the full resizer if you need to choose the crop.`;
        }
      } catch (e) {
        stats.textContent = e.message;
        saveBtn.disabled = true;
      }
    }

    saveBtn.addEventListener('click', () => {
      if (current) window.downloadBlob(current.blob, current.name);
    });
    window.initDropZone(zone, fileInput, run);
  });
})();
