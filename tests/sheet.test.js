import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordSheet, imageName } from '../js/sheet.js';
import { fretLabel } from '../js/diagram.js';
import { GENRE_IDS } from '../js/genres.js';
import { buildProgression, generateProgression } from '../js/generator.js';
import { seededRandom } from '../js/dsp.js';

const ACCENT = '#b45309';
const texts = (svg, cls) => [...svg.matchAll(new RegExp(`<text class="${cls}"[^>]*>([^<]*)</text>`, 'g'))].map((m) => m[1]);
const count = (svg, cls) => (svg.match(new RegExp(`class="${cls}"`, 'g')) || []).length;

/** A browser draws an SVG image only if it is well-formed XML: tags nest, attributes are quoted, & starts an entity. */
function assertWellFormed(svg) {
  const bareAmpersand = /&(?!(?:amp|lt|gt|quot);)/;
  const open = [];
  for (const token of svg.split(/(<[^>]*>)/).filter(Boolean)) {
    if (!token.startsWith('<')) {
      assert.ok(!bareAmpersand.test(token), `bare & in ${token}`);
      continue;
    }
    const tag = /^<(\/?)([a-z]+)((?:\s+[a-z][\w-]*="[^"]*")*)\s*(\/?)>$/i.exec(token);
    assert.ok(tag, `malformed tag ${token}`);
    assert.ok(!bareAmpersand.test(tag[3]), `bare & in ${token}`);
    if (tag[1]) assert.equal(open.pop(), tag[2], `${token} closes the wrong tag`);
    else if (!tag[4]) open.push(tag[2]);
  }
  assert.deepEqual(open, [], 'every tag is closed');
}

test('the image shows the genre, key, numerals and the four chord cards of the page', () => {
  const p = buildProgression('neo-soul', 'two-five-one-six', { tonic: 'C', mode: 'major' }, null, seededRandom(1));
  const { svg, width, height } = chordSheet(p, ACCENT);
  assertWellFormed(svg);
  assert.deepEqual(texts(svg, 'genre'), ['Neo Soul']);
  assert.deepEqual(texts(svg, 'key'), ['Key of C major']);
  assert.deepEqual(texts(svg, 'romans'), ['ii9 – V13 – Imaj9 – vi9']);
  assert.deepEqual(texts(svg, 'tuning'), [], 'standard tuning goes unmentioned, as on the page');
  assert.deepEqual(texts(svg, 'name'), ['Dm9', 'G13', 'Cmaj9', 'Am9']);
  assert.deepEqual(texts(svg, 'roman'), ['ii9', 'V13', 'Imaj9', 'vi9']);
  assert.deepEqual(texts(svg, 'frets'), p.chords.map((c) => fretLabel(c.frets)));
  assert.equal(count(svg, 'card'), 4);
  assert.equal(count(svg, 'diagram'), 4);
  assert.ok(svg.includes(`.roman { font-size: 16px; font-weight: 700; fill: ${ACCENT}; }`), 'numerals in the accent colour');
  // Two pixels per unit, so the PNG stays sharp.
  const [, w, h] = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="\d+" height="\d+" viewBox="0 0 (\d+) (\d+)">/.exec(svg);
  assert.equal(width, 2 * w);
  assert.equal(height, 2 * h);
  assert.ok(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`));
});

test('Metalcore images name the B standard tuning and the strings under each diagram', () => {
  const p = buildProgression('metalcore', 'six-seven-one-three', { tonic: 'B', mode: 'minor' }, null, seededRandom(1));
  const { svg } = chordSheet(p, '#b91c1c');
  assertWellFormed(svg);
  assert.deepEqual(texts(svg, 'tuning'), ['B standard tuning: B E A D F♯ B']);
  assert.deepEqual(texts(svg, 'name'), ['G', 'A', 'Bm', 'D']);
  assert.equal(count(svg, 'tuning-note'), 24, 'six string names under each diagram');
});

test('every generated image is well-formed, with its cards inside it', () => {
  const rng = seededRandom(23);
  for (const id of GENRE_IDS) {
    for (let i = 0; i < 40; i++) {
      const { svg } = chordSheet(generateProgression(id, rng), ACCENT);
      assertWellFormed(svg);
      const [w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg).slice(1).map(Number);
      const cards = [...svg.matchAll(/class="card" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)];
      assert.equal(cards.length, 4);
      for (const [x, y, cw, ch] of cards.map((m) => m.slice(1).map(Number))) {
        assert.ok(x >= 30 && y >= 30 && x + cw <= w - 30 && y + ch <= h - 30, `${id}: card at ${x},${y} in ${w}x${h}`);
      }
    }
  }
});

test('text in the image is escaped', () => {
  const p = buildProgression('punk', 'axis', { tonic: 'E', mode: 'major' }, null, seededRandom(1));
  const { svg } = chordSheet({ ...p, chords: p.chords.map((c) => ({ ...c, name: '"<A&B>"' })) }, ACCENT);
  assertWellFormed(svg);
  assert.deepEqual(texts(svg, 'name'), Array(4).fill('&quot;&lt;A&amp;B&gt;&quot;'));
});

test('file names give genre and key, without symbols', () => {
  assert.equal(imageName({ genre: 'metalcore', key: { tonic: 'C', mode: 'minor' } }), 'metalcore-c-minor.png');
  assert.equal(imageName({ genre: 'punk', key: { tonic: 'C#', mode: 'major' } }), 'punk-c-sharp-major.png');
  assert.equal(imageName({ genre: 'lofi', key: { tonic: 'Bb', mode: 'major' } }), 'lofi-b-flat-major.png');
  assert.equal(imageName({ genre: 'post-rock', key: { tonic: 'B', mode: 'minor' } }), 'post-rock-b-minor.png');
});
