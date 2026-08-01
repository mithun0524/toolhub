#!/usr/bin/env node
/* Screenshot pages at real device widths.
 *   node tools/shoot.js http://localhost:8931 390 /  /image/compress/ ...
 *
 * Chrome's --window-size flag will not go below roughly 500 CSS px on macOS, so
 * plain headless screenshots of a phone layout are silently rendered wide and
 * cropped — which looks exactly like a broken layout. This drives
 * Emulation.setDeviceMetricsOverride over CDP instead, which has no such floor.
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [origin, widthArg, ...paths] = process.argv.slice(2);
const width = Number(widthArg);
if (!origin || !width || !paths.length) {
  console.error('Usage: node tools/shoot.js <origin> <width> <path...>');
  process.exit(1);
}

const PORT = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nought-shoot-'));
const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/json/version');
      return (await res.json()).webSocketDebuggerUrl;
    } catch (e) { await sleep(200); }
  }
  throw new Error('Chrome did not expose a debugging port');
}

(async () => {
  const ws = new WebSocket(await wsUrl());
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  const send = (method, params, sessionId) => new Promise((resolve, reject) => {
    const msg = { id: ++id, method, params: params || {} };
    if (sessionId) msg.sessionId = sessionId;
    pending.set(msg.id, { resolve, reject });
    ws.send(JSON.stringify(msg));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  // Session-scoped calls need the sessionId echoed back on every message.
  const call = (m, p) => send(m, p, sessionId);
  await call('Page.enable');

  for (const p of paths) {
    // mobile:true also switches on the mobile viewport + touch, which is what
    // actually decides how media queries and 100vw resolve.
    await call('Emulation.setDeviceMetricsOverride', {
      width, height: 900, deviceScaleFactor: 2, mobile: width < 768
    });
    await call('Page.navigate', { url: origin + p });
    await sleep(1400);
    const metrics = await call('Page.getLayoutMetrics');
    const doc = metrics.cssContentSize || metrics.contentSize;
    const shot = await call('Page.captureScreenshot', {
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: Math.min(doc.height, 4000), scale: 1 }
    });
    const name = 'shot-' + width + (p.replace(/\//g, '_') || '_') + '.png';
    fs.writeFileSync(path.join('/tmp', name), Buffer.from(shot.data, 'base64'));
    // scrollWidth > width is the horizontal-overflow smell. Naming the elements
    // that stick out is the whole point — the screenshot only shows the symptom.
    const { result } = await call('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right <= vw + 1) continue;
          // A wide table inside .table-wrap{overflow:auto} is doing its job —
          // it scrolls in place. Only unclipped overflow moves the page.
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            if (!/^(visible)$/.test(getComputedStyle(a).overflowX)) { clipped = true; break; }
          }
          if (clipped) continue;
          // Only report the outermost offender in each chain.
          if (out.some((o) => o.el.contains(el))) continue;
          out.push({ el, s: (el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\\s+/).join('.') : '')) +
            ' → ' + Math.round(r.right - vw) + 'px past' });
        }
        return { w: document.documentElement.scrollWidth, hits: out.map((o) => o.s).slice(0, 6) };
      })()`
    });
    const { w, hits } = result.value;
    console.log('/tmp/' + name + '  layout=' + w + 'px' +
      (w > width ? '  ⚠ OVERFLOWS by ' + (w - width) + 'px' : ''));
    hits.forEach((h) => console.log('      ' + h));
  }

  chrome.kill();
  process.exit(0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
