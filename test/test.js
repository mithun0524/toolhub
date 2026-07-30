// Self-check for every tool's logic: `node test/test.js`
const assert = require('node:assert/strict');
const T = require('../js/tools-core.js');

let pass = 0;
function it(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error('FAIL:', name, '\n  ', e.message); process.exitCode = 1; }
}

/* --- formatBytes --- */
it('formatBytes', () => {
  assert.equal(T.formatBytes(0), '0 B');
  assert.equal(T.formatBytes(512), '512 B');
  assert.equal(T.formatBytes(1024), '1 KB');
  assert.equal(T.formatBytes(1536), '1.5 KB');
  assert.equal(T.formatBytes(5 * 1024 * 1024), '5 MB');
});

/* --- word counter --- */
it('textStats counts words/sentences/paragraphs', () => {
  const s = T.textStats('Hello world. How are you?\n\nSecond para here');
  assert.equal(s.words, 8);
  assert.equal(s.sentences, 3);      // 3rd sentence has no terminator
  assert.equal(s.paragraphs, 2);
  assert.equal(s.charsNoSpaces, 35);
  assert.equal(T.textStats('').words, 0);
  assert.equal(T.textStats('   ').sentences, 0);
});
it('textStats single sentence without punctuation', () => {
  assert.equal(T.textStats('just some words').sentences, 1);
});
it('wordFrequency ranks', () => {
  const f = T.wordFrequency('a b a c a b', 2);
  assert.equal(f[0].word, 'a');
  assert.equal(f[0].count, 3);
  assert.equal(f[1].word, 'b');
});
it('humanDuration', () => {
  assert.equal(T.humanDuration(0), '0s');
  assert.equal(T.humanDuration(45), '45s');
  assert.equal(T.humanDuration(90), '1m 30s');
  assert.equal(T.humanDuration(3720), '1h 2m');
});

/* --- case converter --- */
it('convertCase all modes', () => {
  const t = 'hello world example';
  assert.equal(T.convertCase(t, 'upper'), 'HELLO WORLD EXAMPLE');
  assert.equal(T.convertCase(t, 'title'), 'Hello World Example');
  assert.equal(T.convertCase(t, 'camel'), 'helloWorldExample');
  assert.equal(T.convertCase(t, 'pascal'), 'HelloWorldExample');
  assert.equal(T.convertCase(t, 'snake'), 'hello_world_example');
  assert.equal(T.convertCase(t, 'constant'), 'HELLO_WORLD_EXAMPLE');
  assert.equal(T.convertCase(t, 'kebab'), 'hello-world-example');
  assert.equal(T.convertCase('MyVarName here', 'snake'), 'my_var_name_here');
  assert.equal(T.convertCase('hello. world here', 'sentence'), 'Hello. World here');
  assert.equal(T.convertCase('AbC', 'invert'), 'aBc');
  assert.equal(T.convertCase('', 'upper'), '');
  assert.throws(() => T.convertCase('x', 'nope'));
});
it('slug strips punctuation and edges', () => {
  assert.equal(T.convertCase('  Hello, World! ', 'slug'), 'hello-world');
});

/* --- lorem --- */
it('lorem generates requested counts and is seed-stable', () => {
  assert.equal(T.generateLorem({ count: 7, unit: 'words' }).split(' ').length, 7);
  assert.equal(T.generateLorem({ count: 4, unit: 'paragraphs' }).split('\n\n').length, 4);
  const a = T.generateLorem({ count: 2, unit: 'paragraphs', seed: 42 });
  const b = T.generateLorem({ count: 2, unit: 'paragraphs', seed: 42 });
  const c = T.generateLorem({ count: 2, unit: 'paragraphs', seed: 43 });
  assert.equal(a, b);
  assert.notEqual(a, c);                                   // seed actually varies output
  assert.ok(a.startsWith('Lorem ipsum dolor sit amet'));
  const sentences = T.generateLorem({ count: 5, unit: 'sentences' });
  assert.equal(sentences.match(/\./g).length, 5);
  assert.ok(!T.generateLorem({ count: 5, unit: 'words', startWithLorem: false }).startsWith('lorem ipsum'));
});

/* --- diff --- */
it('diff detects a pure insertion without rewriting the rest', () => {
  const d = T.diffLines('a\nb\nc', 'x\na\nb\nc');
  assert.equal(d.added, 1);
  assert.equal(d.removed, 0);
  assert.equal(d.unchanged, 3);
});
it('diff detects deletion, change, and equality', () => {
  assert.deepEqual(
    (({ added, removed }) => ({ added, removed }))(T.diffLines('a\nb\nc', 'a\nc')),
    { added: 0, removed: 1 });
  assert.deepEqual(
    (({ added, removed }) => ({ added, removed }))(T.diffLines('a\nb', 'a\nB')),
    { added: 1, removed: 1 });
  const same = T.diffLines('a\nb', 'a\nb');
  assert.equal(same.added + same.removed, 0);
});
it('diff ignore options', () => {
  assert.equal(T.diffLines('Hello', 'hello', { ignoreCase: true }).added, 0);
  assert.equal(T.diffLines('a  b', 'a b', { ignoreWhitespace: true }).added, 0);
  assert.equal(T.diffLines('Hello', 'hello').added, 1);
});
it('diffWords highlights only the changed word', () => {
  const w = T.diffWords('the quick brown fox', 'the slow brown fox');
  assert.deepEqual(w.a.filter(p => p.t === 'del').map(p => p.v.trim()), ['quick']);
  assert.deepEqual(w.b.filter(p => p.t === 'add').map(p => p.v.trim()), ['slow']);
});

/* --- EMI --- */
it('emi matches a known loan', () => {
  const r = T.emi(1000000, 8.5, 180);
  assert.ok(Math.abs(r.monthly - 9847) < 2, 'monthly was ' + r.monthly);
  assert.ok(Math.abs(r.total - r.monthly * 180) < 0.01);
  assert.ok(Math.abs(r.interest - (r.total - 1000000)) < 0.01);
});
it('emi handles a 0% loan instead of NaN', () => {
  const r = T.emi(120000, 0, 12);
  assert.equal(r.monthly, 10000);
  assert.equal(r.interest, 0);
});
it('emi rejects bad input', () => {
  assert.equal(T.emi(0, 8, 12), null);
  assert.equal(T.emi(1000, 8, 0), null);
});
it('amortization closes the balance at zero', () => {
  const a = T.amortization(500000, 9, 60);
  assert.equal(a.rows.length, 60);
  assert.ok(Math.abs(a.rows[59].balance) < 0.01, 'final balance ' + a.rows[59].balance);
  const paidPrincipal = a.rows.reduce((s, r) => s + r.principal, 0);
  assert.ok(Math.abs(paidPrincipal - 500000) < 0.01);
  assert.equal(T.yearlyRollup(a.rows).length, 5);
});

/* --- GST --- */
it('gst add and remove are inverses', () => {
  const add = T.gst(10000, 18, 'add');
  assert.equal(add.tax, 1800);
  assert.equal(add.gross, 11800);
  assert.equal(add.cgst, 900);
  const rem = T.gst(11800, 18, 'remove');
  assert.ok(Math.abs(rem.net - 10000) < 1e-9);
  assert.ok(Math.abs(rem.tax - 1800) < 1e-9);
});

/* --- age --- */
it('age computes calendar years/months/days', () => {
  const a = T.ageBetween('1990-05-15', '2026-07-30');
  assert.equal(a.years, 36);
  assert.equal(a.months, 2);
  assert.equal(a.days, 15);
  assert.equal(a.totalDays, 13225);
});
it('age borrows across month/year boundaries', () => {
  const a = T.ageBetween('2000-01-31', '2000-03-01');
  assert.equal(a.years, 0);
  assert.equal(a.months, 1);
  assert.equal(a.days, 1);                       // Feb 2000 had 29 days
  const b = T.ageBetween('1999-12-31', '2000-01-01');
  assert.deepEqual([b.years, b.months, b.days], [0, 0, 1]);
});
it('age flags future DOB and bad input', () => {
  assert.equal(T.ageBetween('2030-01-01', '2026-07-30').invalid, 'future');
  assert.equal(T.ageBetween('', '2026-07-30'), null);
});
it('next birthday is always ahead', () => {
  const a = T.ageBetween('1990-07-30', '2026-07-30');   // birthday today
  assert.equal(a.daysToBirthday, 365);
  assert.equal(a.nextBirthdayISO, '2027-07-30');
  const leap = T.ageBetween('2000-02-29', '2026-03-01');
  assert.equal(leap.nextBirthdayISO, '2027-02-28');     // no Feb 29 in 2027
});

/* --- percentage --- */
it('percentage modes', () => {
  assert.equal(T.pct.of(15, 500), 75);
  assert.equal(T.pct.what(25, 200), 12.5);
  assert.equal(T.pct.change(100, 150), 50);
  assert.ok(Math.abs(T.pct.change(150, 100) + 100 / 3) < 1e-9);
  assert.equal(T.pct.total(25, 12.5), 200);
  assert.equal(T.pct.apply(200, -10), 180);
  assert.equal(T.pct.what(5, 0), 0);              // no divide-by-zero
  assert.equal(T.pct.change(0, 5), 0);
});

/* --- base64 --- */
it('base64 round-trips unicode and emoji', () => {
  for (const s of ['hello', 'héllo wörld', '日本語テキスト', '🚀 rocket', '']) {
    assert.equal(T.b64Decode(T.b64Encode(s)), s, 'round-trip failed for ' + s);
  }
  assert.equal(T.b64Encode('hello'), 'aGVsbG8=');
  assert.equal(T.b64Decode('aGVsbG8='), 'hello');
});
it('base64 url-safe and lenient decode', () => {
  const enc = T.b64Encode('??>>??>>', true);
  assert.ok(!/[+/=]/.test(enc));
  assert.equal(T.b64Decode(enc), '??>>??>>');
  assert.equal(T.b64Decode('aGVs\nbG8'), 'hello');   // whitespace + missing padding
  assert.throws(() => T.b64Decode('not base64!!'), /valid Base64/);
});

/* --- password --- */
const bytes = n => {                        // deterministic stand-in for crypto
  const out = new Uint32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 4294967296);
  return out;
};
it('password honours length and character classes', () => {
  for (let i = 0; i < 200; i++) {
    const p = T.generatePassword({ length: 20 }, bytes);
    assert.equal(p.length, 20);
    assert.match(p, /[A-Z]/); assert.match(p, /[a-z]/);
    assert.match(p, /[0-9]/); assert.match(p, /[!@#$%^&*()_+\-=[\]{};:,.<>?]/);
  }
  const lettersOnly = T.generatePassword({ length: 30, numbers: false, symbols: false }, bytes);
  assert.match(lettersOnly, /^[A-Za-z]{30}$/);
});
it('password excludes ambiguous chars on request', () => {
  for (let i = 0; i < 100; i++) {
    const p = T.generatePassword({ length: 40, excludeAmbiguous: true }, bytes);
    assert.doesNotMatch(p, /[Il1O0o|`'"{}[\]();:.,<>]/);
  }
});
it('password rejects an empty pool', () => {
  assert.throws(() => T.generatePassword(
    { upper: false, lower: false, numbers: false, symbols: false }, bytes), /at least one/);
});
it('randomInt is unbiased over the range', () => {
  const counts = new Array(6).fill(0);
  for (let i = 0; i < 60000; i++) counts[T.randomInt(6, bytes)]++;
  for (const c of counts) assert.ok(Math.abs(c - 10000) < 600, 'skewed: ' + counts.join(','));
});
it('entropy and strength scale with the pool', () => {
  assert.equal(Math.round(T.passwordEntropy(16, 64)), 96);
  assert.equal(T.strengthFromEntropy(30).label, 'Weak');
  assert.equal(T.strengthFromEntropy(96).label, 'Very strong');
  assert.equal(T.crackTime(10), 'instantly');
  assert.equal(T.crackTime(50), '1.6 hours');
  assert.match(T.crackTime(80), /centuries|years/);
  assert.equal(T.crackTime(100), 'billions of years');
  assert.equal(T.crackTime(128), 'longer than the age of the universe');
  assert.doesNotMatch(T.crackTime(200), /e\+|NaN/);   // never scientific notation
});

/* --- JSON --- */
it('jsonErrorLocation reports line and column', () => {
  const bad = '{\n  "a": 1,\n  "b": }\n}';
  try { JSON.parse(bad); assert.fail('should throw'); }
  catch (e) {
    const loc = T.jsonErrorLocation(bad, e);
    assert.equal(loc.line, 3);
    assert.ok(loc.column > 0);
  }
});
it('sortJsonKeys is deep and stable', () => {
  const out = T.sortJsonKeys({ b: 1, a: { d: 2, c: [{ f: 1, e: 2 }] } });
  assert.equal(JSON.stringify(out), '{"a":{"c":[{"e":2,"f":1}],"d":2},"b":1}');
});
it('jsonStats measures shape', () => {
  const s = T.jsonStats({ a: [1, 2, { b: { c: 3 } }] });
  assert.equal(s.arrays, 1);
  assert.equal(s.objects, 3);
  assert.equal(s.keys, 3);
  assert.equal(s.depth, 5);
});

console.log(pass + ' checks passed' + (process.exitCode ? ' (with failures above)' : ''));
