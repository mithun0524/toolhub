/* ===== TOOLBOX CORE LOGIC =====
   Pure functions shared by tool pages. No DOM access — so they run in Node
   for `node test/test.js`. Loaded in the browser as a plain script (globals). */
(function (root) {
  'use strict';

  /* ---------- formatting ---------- */
  function formatBytes(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const val = bytes / Math.pow(1024, i);
    return (i === 0 ? Math.round(val) : parseFloat(val.toFixed(val < 10 ? 2 : 1))) + ' ' + sizes[i];
  }

  /* ---------- text stats ---------- */
  function textStats(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    // Sentence = run of text closed by . ! ? … or end of input.
    const sentences = trimmed
      ? (trimmed.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) || []).filter(s => s.trim()).length
      : 0;
    // Paragraph = block separated by a blank line (falls back to single newlines).
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/).filter(p => p.trim()).length
      : 0;
    const lines = text ? text.split('\n').length : 0;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const longest = trimmed
      ? trimmed.split(/\s+/).reduce((a, w) => (w.length > a.length ? w : a), '')
      : '';
    return {
      words, sentences, paragraphs, lines,
      chars: text.length, charsNoSpaces, longestWord: longest,
      readingSeconds: Math.round((words / 225) * 60),   // 225 wpm silent reading
      speakingSeconds: Math.round((words / 130) * 60)   // 130 wpm spoken
    };
  }

  function humanDuration(seconds) {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60), s = seconds % 60;
    if (!m) return s + 's';
    if (m < 60) return m + 'm' + (s ? ' ' + s + 's' : '');
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  function wordFrequency(text, limit) {
    const counts = new Map();
    const words = text.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || [];
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit || 10)
      .map(([word, count]) => ({ word, count, pct: words.length ? (count / words.length) * 100 : 0 }));
  }

  /* ---------- case conversion ---------- */
  // Split into words across spaces, punctuation, and camelCase humps.
  function splitWords(text) {
    return text
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean);
  }

  const CASES = {
    upper: t => t.toUpperCase(),
    lower: t => t.toLowerCase(),
    title: t => t.replace(/\p{L}[\p{L}'’]*/gu, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
    sentence: t => t.toLowerCase().replace(/(^\s*\p{L})|([.!?…]\s+\p{L})/gu, m => m.toUpperCase()),
    camel: t => splitWords(t).map((w, i) =>
      i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
    pascal: t => splitWords(t).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
    snake: t => splitWords(t).map(w => w.toLowerCase()).join('_'),
    constant: t => splitWords(t).map(w => w.toUpperCase()).join('_'),
    kebab: t => splitWords(t).map(w => w.toLowerCase()).join('-'),
    slug: t => splitWords(t).map(w => w.toLowerCase()).join('-'),
    alternate: t => {
      let i = 0;
      return t.replace(/\p{L}/gu, ch => (i++ % 2 ? ch.toUpperCase() : ch.toLowerCase()));
    },
    invert: t => t.replace(/\p{L}/gu, ch =>
      ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())
  };

  function convertCase(text, type) {
    const fn = CASES[type];
    if (!fn) throw new Error('Unknown case type: ' + type);
    return text ? fn(text) : '';
  }

  /* ---------- lorem ipsum ---------- */
  const LOREM_WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
    'incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ' +
    'ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate ' +
    'velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt ' +
    'culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla ' +
    'gravida orci a odio nullam varius turpis et commodo pharetra est eros bibendum elit nec luctus').split(' ');

  // mulberry32 — small deterministic PRNG so a given seed reproduces output.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generateLorem(opts) {
    const o = Object.assign(
      { count: 3, unit: 'paragraphs', startWithLorem: true, seed: 1 }, opts);
    const count = Math.max(1, Math.min(500, Math.floor(o.count) || 1));
    const rng = makeRng(o.seed || 1);
    const pick = () => LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)];

    if (o.unit === 'words') {
      const out = [];
      for (let i = 0; i < count; i++) out.push(pick());
      if (o.startWithLorem) { out[0] = 'lorem'; if (count > 1) out[1] = 'ipsum'; }
      return out.join(' ');
    }

    const sentence = (first) => {
      const len = 6 + Math.floor(rng() * 12);
      const words = [];
      for (let i = 0; i < len; i++) words.push(pick());
      if (first && o.startWithLorem) words.splice(0, 4, 'lorem', 'ipsum', 'dolor', 'sit', 'amet');
      // A comma somewhere in longer sentences reads more like real copy.
      if (len > 9) words[Math.floor(len / 2)] += ',';
      const s = words.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    };

    if (o.unit === 'sentences') {
      const out = [];
      for (let i = 0; i < count; i++) out.push(sentence(i === 0));
      return out.join(' ');
    }

    const paras = [];
    for (let p = 0; p < count; p++) {
      const n = 3 + Math.floor(rng() * 3);
      const sents = [];
      for (let s = 0; s < n; s++) sents.push(sentence(p === 0 && s === 0));
      paras.push(sents.join(' '));
    }
    return paras.join('\n\n');
  }

  /* ---------- diff (LCS over lines) ---------- */
  // ponytail: O(n*m) DP, capped at MAX_CELLS; swap in Myers if huge files matter.
  const MAX_CELLS = 4e6;

  function diffLines(aText, bText, opts) {
    const o = Object.assign({ ignoreCase: false, ignoreWhitespace: false }, opts);
    const a = aText.split('\n'), b = bText.split('\n');
    const norm = s => {
      let v = s;
      if (o.ignoreWhitespace) v = v.trim().replace(/\s+/g, ' ');
      if (o.ignoreCase) v = v.toLowerCase();
      return v;
    };
    const na = a.map(norm), nb = b.map(norm);

    // Trim identical head/tail first — keeps the DP small for typical edits.
    let head = 0;
    while (head < na.length && head < nb.length && na[head] === nb[head]) head++;
    let tail = 0;
    while (tail < na.length - head && tail < nb.length - head &&
           na[na.length - 1 - tail] === nb[nb.length - 1 - tail]) tail++;

    const ma = na.slice(head, na.length - tail);
    const mb = nb.slice(head, nb.length - tail);
    const ops = [];
    for (let i = 0; i < head; i++) ops.push({ type: 'eq', a: a[i], b: b[i], ai: i + 1, bi: i + 1 });

    if (ma.length * mb.length > MAX_CELLS) {
      // Too big for the DP: emit as one replace block rather than lying about it.
      for (let i = 0; i < ma.length; i++) ops.push({ type: 'del', a: a[head + i], ai: head + i + 1 });
      for (let j = 0; j < mb.length; j++) ops.push({ type: 'add', b: b[head + j], bi: head + j + 1 });
      ops.truncated = true;
    } else {
      const n = ma.length, m = mb.length;
      const dp = new Int32Array((n + 1) * (m + 1));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          dp[i * (m + 1) + j] = ma[i] === mb[j]
            ? dp[(i + 1) * (m + 1) + (j + 1)] + 1
            : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + (j + 1)]);
        }
      }
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (ma[i] === mb[j]) {
          ops.push({ type: 'eq', a: a[head + i], b: b[head + j], ai: head + i + 1, bi: head + j + 1 });
          i++; j++;
        } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + (j + 1)]) {
          ops.push({ type: 'del', a: a[head + i], ai: head + i + 1 }); i++;
        } else {
          ops.push({ type: 'add', b: b[head + j], bi: head + j + 1 }); j++;
        }
      }
      while (i < n) { ops.push({ type: 'del', a: a[head + i], ai: head + i + 1 }); i++; }
      while (j < m) { ops.push({ type: 'add', b: b[head + j], bi: head + j + 1 }); j++; }
    }

    for (let t = 0; t < tail; t++) {
      const ai = a.length - tail + t, bi = b.length - tail + t;
      ops.push({ type: 'eq', a: a[ai], b: b[bi], ai: ai + 1, bi: bi + 1 });
    }

    const added = ops.filter(o2 => o2.type === 'add').length;
    const removed = ops.filter(o2 => o2.type === 'del').length;
    return { ops, added, removed, unchanged: ops.length - added - removed };
  }

  // Word-level diff of two lines, used to highlight inside a changed pair.
  function diffWords(aLine, bLine) {
    const a = aLine.match(/\s+|[^\s]+/g) || [];
    const b = bLine.match(/\s+|[^\s]+/g) || [];
    const n = a.length, m = b.length;
    if (n * m > 250000) return { a: [{ t: 'del', v: aLine }], b: [{ t: 'add', v: bLine }] };
    const dp = new Int32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i * (m + 1) + j] = a[i] === b[j]
          ? dp[(i + 1) * (m + 1) + (j + 1)] + 1
          : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + (j + 1)]);
    const outA = [], outB = [];
    let i = 0, j = 0;
    const push = (arr, t, v) => {
      const last = arr[arr.length - 1];
      if (last && last.t === t) last.v += v; else arr.push({ t, v });
    };
    while (i < n && j < m) {
      if (a[i] === b[j]) { push(outA, 'eq', a[i]); push(outB, 'eq', b[j]); i++; j++; }
      else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + (j + 1)]) { push(outA, 'del', a[i]); i++; }
      else { push(outB, 'add', b[j]); j++; }
    }
    while (i < n) { push(outA, 'del', a[i]); i++; }
    while (j < m) { push(outB, 'add', b[j]); j++; }
    return { a: outA, b: outB };
  }

  /* ---------- EMI ---------- */
  function emi(principal, annualRatePct, months) {
    const P = Number(principal), N = Math.round(Number(months));
    const r = Number(annualRatePct) / 12 / 100;
    if (!(P > 0) || !(N > 0)) return null;
    // 0% loans are legal (and divide by zero in the standard formula).
    const monthly = r === 0 ? P / N : (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    const total = monthly * N;
    return { monthly, total, interest: total - P, principal: P, months: N, monthlyRate: r };
  }

  function amortization(principal, annualRatePct, months) {
    const base = emi(principal, annualRatePct, months);
    if (!base) return null;
    const rows = [];
    let balance = base.principal;
    for (let m = 1; m <= base.months; m++) {
      const interest = balance * base.monthlyRate;
      let principalPart = base.monthly - interest;
      // Final instalment absorbs the rounding drift so the balance lands on 0.
      if (m === base.months || principalPart > balance) principalPart = balance;
      balance = Math.max(0, balance - principalPart);
      rows.push({ month: m, interest, principal: principalPart, payment: interest + principalPart, balance });
    }
    return { summary: base, rows };
  }

  function yearlyRollup(rows) {
    const years = [];
    rows.forEach((r, idx) => {
      const y = Math.floor(idx / 12);
      if (!years[y]) years[y] = { year: y + 1, principal: 0, interest: 0, payment: 0, balance: 0 };
      years[y].principal += r.principal;
      years[y].interest += r.interest;
      years[y].payment += r.payment;
      years[y].balance = r.balance;
    });
    return years;
  }

  /* ---------- GST ---------- */
  function gst(amount, ratePct, mode) {
    const a = Number(amount) || 0, rate = Number(ratePct) || 0;
    let net, tax, gross;
    if (mode === 'remove') { gross = a; net = a / (1 + rate / 100); tax = gross - net; }
    else { net = a; tax = (a * rate) / 100; gross = a + tax; }
    return { net, tax, gross, rate, cgst: tax / 2, sgst: tax / 2, igst: tax };
  }

  /* ---------- age ---------- */
  // Calendar arithmetic only (no timezone drift): expects YYYY-MM-DD strings.
  function parseISODate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const toUTC = p => Date.UTC(p.y, p.m - 1, p.d);

  // dob + n months, with the day clamped to the target month's length
  // (31 Jan + 1 month = 28/29 Feb, which is what calendars and courts use).
  function addMonths(p, n) {
    const total = (p.y * 12 + (p.m - 1)) + n;
    const y = Math.floor(total / 12), m = (total % 12) + 1;
    return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
  }

  function ageBetween(dobISO, targetISO) {
    const dob = parseISODate(dobISO), target = parseISODate(targetISO);
    if (!dob || !target) return null;
    if (toUTC(dob) > toUTC(target)) return { invalid: 'future' };

    // Largest whole-month count that still lands on or before the target,
    // then the leftover days. Avoids the negative-days borrow bug.
    let k = (target.y - dob.y) * 12 + (target.m - dob.m);
    if (toUTC(addMonths(dob, k)) > toUTC(target)) k--;
    const anniversary = addMonths(dob, k);
    const years = Math.floor(k / 12);
    const months = k % 12;
    const days = Math.round((toUTC(target) - toUTC(anniversary)) / 86400000);

    const totalDays = Math.round((toUTC(target) - toUTC(dob)) / 86400000);
    const totalMonths = k;

    // Next birthday, honouring Feb 29 (falls back to Mar 1 in common years).
    let by = target.y;
    const bMonth = dob.m, bDay = Math.min(dob.d, daysInMonth(target.y, dob.m));
    if (toUTC({ y: by, m: bMonth, d: bDay }) <= toUTC(target)) by++;
    const nextBirthday = { y: by, m: bMonth, d: Math.min(dob.d, daysInMonth(by, bMonth)) };
    const daysToBirthday = Math.round((toUTC(nextBirthday) - toUTC(target)) / 86400000);

    return {
      years, months, days, totalDays, totalMonths,
      totalWeeks: Math.floor(totalDays / 7),
      totalHours: totalDays * 24,
      totalMinutes: totalDays * 1440,
      daysToBirthday,
      nextBirthdayISO: `${nextBirthday.y}-${String(nextBirthday.m).padStart(2, '0')}-${String(nextBirthday.d).padStart(2, '0')}`,
      turns: years + 1
    };
  }

  /* ---------- percentage ---------- */
  const pct = {
    of: (p, total) => (p / 100) * total,
    what: (part, total) => (total ? (part / total) * 100 : 0),
    change: (from, to) => (from ? ((to - from) / from) * 100 : 0),
    total: (part, p) => (p ? (part / p) * 100 : 0),   // "X is P% of what?"
    apply: (value, p) => value * (1 + p / 100)        // increase/decrease by P%
  };

  /* ---------- base64 ---------- */
  // Round-trips any Unicode; escape()/unescape() are deprecated and lossy.
  function b64Encode(text, urlSafe) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (const byte of bytes) bin += String.fromCharCode(byte);
    const out = btoaImpl(bin);
    return urlSafe ? out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : out;
  }

  function b64Decode(input) {
    let s = String(input).trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('Not a valid Base64 string');
    while (s.length % 4) s += '=';
    const bin = atobImpl(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  const B64CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function btoaImpl(bin) {
    if (typeof btoa === 'function') return btoa(bin);
    let out = '';
    for (let i = 0; i < bin.length; i += 3) {
      const c1 = bin.charCodeAt(i), c2 = bin.charCodeAt(i + 1), c3 = bin.charCodeAt(i + 2);
      const n = (c1 << 16) | ((isNaN(c2) ? 0 : c2) << 8) | (isNaN(c3) ? 0 : c3);
      out += B64CHARS[(n >> 18) & 63] + B64CHARS[(n >> 12) & 63] +
        (isNaN(c2) ? '=' : B64CHARS[(n >> 6) & 63]) + (isNaN(c3) ? '=' : B64CHARS[n & 63]);
    }
    return out;
  }
  function atobImpl(s) {
    if (typeof atob === 'function') return atob(s);
    let out = '';
    const clean = s.replace(/=+$/, '');
    for (let i = 0; i < clean.length; i += 4) {
      const n = (B64CHARS.indexOf(clean[i]) << 18) | (B64CHARS.indexOf(clean[i + 1]) << 12) |
        ((clean[i + 2] ? B64CHARS.indexOf(clean[i + 2]) : 0) << 6) |
        (clean[i + 3] ? B64CHARS.indexOf(clean[i + 3]) : 0);
      out += String.fromCharCode((n >> 16) & 255);
      if (clean[i + 2]) out += String.fromCharCode((n >> 8) & 255);
      if (clean[i + 3]) out += String.fromCharCode(n & 255);
    }
    return out;
  }

  /* ---------- password ---------- */
  const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{};:,.<>?'
  };
  const AMBIGUOUS = /[Il1O0o|`'"{}[\]();:.,<>]/g;

  function buildPool(opts) {
    let pool = '';
    for (const key of ['upper', 'lower', 'numbers', 'symbols']) {
      if (opts[key]) pool += CHARSETS[key];
    }
    if (opts.excludeAmbiguous) pool = pool.replace(AMBIGUOUS, '');
    return [...new Set(pool)].join('');
  }

  // randInt must be unbiased: `% pool.length` skews toward early characters.
  function randomInt(max, randomBytes) {
    const limit = Math.floor(4294967296 / max) * max;
    let n;
    do { n = randomBytes(1)[0]; } while (n >= limit);
    return n % max;
  }

  function generatePassword(opts, randomBytes) {
    const o = Object.assign(
      { length: 16, upper: true, lower: true, numbers: true, symbols: true, excludeAmbiguous: false },
      opts);
    const length = Math.max(4, Math.min(128, Math.floor(o.length) || 16));
    const pool = buildPool(o);
    if (!pool) throw new Error('Select at least one character type');

    // Guarantee one character from every enabled set, then fill and shuffle.
    const required = [];
    for (const key of ['upper', 'lower', 'numbers', 'symbols']) {
      if (!o[key]) continue;
      let set = CHARSETS[key];
      if (o.excludeAmbiguous) set = set.replace(AMBIGUOUS, '');
      if (set) required.push(set[randomInt(set.length, randomBytes)]);
    }
    const chars = required.slice(0, length);
    while (chars.length < length) chars.push(pool[randomInt(pool.length, randomBytes)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1, randomBytes);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  function passwordEntropy(length, poolSize) {
    return poolSize > 1 ? length * (Math.log(poolSize) / Math.log(2)) : 0;
  }

  function strengthFromEntropy(bits) {
    if (bits < 40) return { score: 1, label: 'Weak' };
    if (bits < 60) return { score: 2, label: 'Fair' };
    if (bits < 90) return { score: 3, label: 'Strong' };
    return { score: 4, label: 'Very strong' };
  }

  // Rough offline-cracking estimate at 1e11 guesses/sec (modern GPU rig).
  // Huge results are worded, not written in scientific notation — "3.4e+19
  // centuries" tells a reader nothing useful.
  function crackTime(bits) {
    const seconds = Math.pow(2, bits - 1) / 1e11;
    if (seconds < 1) return 'instantly';

    const years = seconds / 31557600;
    if (years >= 1e15) return 'longer than the age of the universe';
    if (years >= 1e12) return 'trillions of years';
    if (years >= 1e9) return 'billions of years';
    if (years >= 1e6) return 'millions of years';
    if (years >= 1e3) return Math.round(years / 100) + ' centuries';

    const units = [['year', 31557600], ['day', 86400], ['hour', 3600],
      ['minute', 60], ['second', 1]];
    for (const [name, size] of units) {
      if (seconds >= size) {
        const v = seconds / size;
        const shown = v < 10 ? parseFloat(v.toFixed(1)) : Math.round(v);
        return shown + ' ' + name + (shown === 1 ? '' : 's');
      }
    }
    return 'instantly';
  }

  /* ---------- JSON ---------- */
  // Resolves a JSON.parse error to a line/column. V8 emits three shapes:
  // "...at position N (line L column C)", "...at position N", and (for short
  // inputs) only a quoted snippet — so fall back to locating the snippet.
  function jsonErrorLocation(text, err) {
    const msg = String((err && err.message) || err);
    const at = (pos) => {
      pos = Math.max(0, Math.min(pos, text.length));
      const before = text.slice(0, pos);
      const line = before.split('\n').length;
      return {
        message: msg, position: pos, line,
        column: pos - before.lastIndexOf('\n'),
        snippet: text.split('\n')[line - 1] || ''
      };
    };

    const lc = /line (\d+) column (\d+)/.exec(msg);
    const p = /position (\d+)/.exec(msg);
    if (p) return at(+p[1]);
    if (lc) {
      const lines = text.split('\n');
      const line = Math.min(+lc[1], lines.length);
      const offset = lines.slice(0, line - 1).reduce((s, l) => s + l.length + 1, 0);
      return at(offset + (+lc[2] - 1));
    }
    const snip = /\.\.\."([\s\S]*?)" is not valid JSON/.exec(msg);
    const tok = /Unexpected token '?(.)/.exec(msg);
    if (snip) {
      const start = text.indexOf(snip[1]);
      if (start >= 0) {
        const within = tok ? snip[1].indexOf(tok[1]) : snip[1].length - 1;
        return at(start + (within < 0 ? snip[1].length - 1 : within));
      }
    }
    return { message: msg };
  }

  function sortJsonKeys(value) {
    if (Array.isArray(value)) return value.map(sortJsonKeys);
    if (value && typeof value === 'object') {
      return Object.keys(value).sort().reduce((acc, k) => {
        acc[k] = sortJsonKeys(value[k]); return acc;
      }, {});
    }
    return value;
  }

  function jsonStats(value) {
    let keys = 0, arrays = 0, objects = 0, depth = 0, nodes = 0;
    (function walk(v, d) {
      nodes++;
      depth = Math.max(depth, d);
      if (Array.isArray(v)) { arrays++; v.forEach(x => walk(x, d + 1)); }
      else if (v && typeof v === 'object') {
        objects++;
        for (const k of Object.keys(v)) { keys++; walk(v[k], d + 1); }
      }
    })(value, 1);
    return { keys, arrays, objects, depth, nodes };
  }

  const api = {
    formatBytes, textStats, humanDuration, wordFrequency,
    convertCase, CASE_TYPES: Object.keys(CASES), splitWords,
    generateLorem, makeRng,
    diffLines, diffWords,
    emi, amortization, yearlyRollup,
    gst, ageBetween, parseISODate, pct,
    b64Encode, b64Decode,
    CHARSETS, buildPool, generatePassword, passwordEntropy, strengthFromEntropy, crackTime, randomInt,
    jsonErrorLocation, sortJsonKeys, jsonStats
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ToolCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
