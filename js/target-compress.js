/* ===== COMPRESS TO A TARGET FILE SIZE =====
   Powers the /image/compress/to-<n>kb/ pages.

   "Compress to exactly 100 KB" is a real, high-intent search, and it is a
   genuinely different problem from "compress at quality 75": the user has a
   hard ceiling and does not care what quality gets them there. So this searches
   for the answer instead of asking for it.

   Quality first, dimensions second. Dropping quality is nearly free visually
   down to about 0.4; below that JPEG artefacts are worse than being slightly
   smaller, so past that point we shrink the image instead. Both loops are
   bounded — a target of 1 KB on a 40 MP photo has to terminate and say so
   rather than spin. */
(function () {
  'use strict';

  const MIN_QUALITY = 0.4;      // below this, artefacts beat any size win
  const QUALITY_STEPS = 7;      // binary search: 2^7 = ~1% precision, ~7 encodes
  const MIN_SCALE = 0.25;       // never shrink past a quarter of the original
  const SCALE_STEP = 0.8;

  /**
   * Encode `img` as JPEG no larger than `targetBytes`.
   * @returns {Promise<{blob:Blob, quality:number, scale:number, hitTarget:boolean}>}
   */
  async function compressToTarget(img, targetBytes) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    let best = null;

    for (let scale = 1; scale >= MIN_SCALE; scale *= SCALE_STEP) {
      const canvas = window.drawToCanvas(img, w * scale, h * scale, '#ffffff');

      // Binary search quality. Keep the largest blob that still fits, because
      // the biggest file under the ceiling is the best-looking one.
      let lo = MIN_QUALITY, hi = 0.95, fit = null;
      for (let i = 0; i < QUALITY_STEPS; i++) {
        const mid = (lo + hi) / 2;
        const blob = await window.canvasToBlob(canvas, 'image/jpeg', mid);
        if (blob.size <= targetBytes) { fit = { blob, quality: mid, scale }; lo = mid; }
        else { hi = mid; }
      }
      if (fit) return Object.assign(fit, { hitTarget: true });

      // Nothing fit at this scale; remember the smallest attempt so we can
      // still hand back a result if the target turns out to be unreachable.
      const floor = await window.canvasToBlob(canvas, 'image/jpeg', MIN_QUALITY);
      if (!best || floor.size < best.blob.size) {
        best = { blob: floor, quality: MIN_QUALITY, scale };
      }
    }
    return Object.assign(best, { hitTarget: false });
  }

  /* ---------- page wiring ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('sizeTool');
    if (!host) return;

    const targetKb = Number(host.dataset.targetKb);
    const targetBytes = targetKb * 1024;
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
        const out = await compressToTarget(img, targetBytes);
        revoke();

        current = { blob: out.blob, name: window.withExtension(file.name, 'image/jpeg') };
        preview.src = URL.createObjectURL(out.blob);
        preview.hidden = false;
        saveBtn.disabled = false;

        const pct = Math.max(0, Math.round((1 - out.blob.size / file.size) * 100));
        stats.textContent =
          `${window.formatBytes(file.size)} → ${window.formatBytes(out.blob.size)} · ${pct}% smaller`;

        if (!out.hitTarget) {
          note.hidden = false;
          note.textContent =
            `That is as small as this image goes without dropping below usable quality. ` +
            `${targetKb} KB was not reachable — try the full compressor for finer control.`;
        } else if (out.scale < 1) {
          note.hidden = false;
          note.textContent =
            `Quality alone could not reach ${targetKb} KB, so the image was scaled to ` +
            `${Math.round(out.scale * 100)}% of its original dimensions.`;
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
