import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseFret, diagramSVG } from '../js/diagram.js';
import { GENRE_IDS } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { seededRandom } from '../js/dsp.js';

const x = null;
const count = (svg, cls) => (svg.match(new RegExp(`class="${cls}"`, 'g')) || []).length;
const dotYs = (svg) => [...svg.matchAll(/class="dot" cx="[\d.]+" cy="([\d.]+)"/g)].map((m) => Number(m[1]));

test('open C: nut, one x, two o, three dots, like the reference boxes', () => {
  const svg = diagramSVG([x, 3, 2, 0, 1, 0], 'C');
  assert.equal(count(svg, 'string'), 6);
  assert.equal(count(svg, 'fret'), 6);
  assert.equal(count(svg, 'nut'), 1);
  assert.equal(count(svg, 'mute'), 1);
  assert.equal(count(svg, 'open'), 2);
  assert.equal(count(svg, 'dot'), 3);
  assert.equal(count(svg, 'barre'), 0);
  assert.ok(svg.includes('aria-label="C"'));
});

test('shapes up the neck get a fret label instead of the nut, and barres are drawn', () => {
  const svg = diagramSVG([x, 7, 9, 9, 9, 7], 'E');
  assert.equal(baseFret([x, 7, 9, 9, 9, 7]), 7);
  assert.equal(count(svg, 'nut'), 0);
  assert.ok(svg.includes('>7fr<'));
  assert.equal(count(svg, 'barre'), 1);
  assert.equal(count(svg, 'dot'), 3);
});

test('drone shapes show their open strings above a higher position', () => {
  const svg = diagramSVG([x, 0, 7, 6, 0, 0], 'Aadd9');
  assert.ok(svg.includes('>6fr<'));
  assert.equal(count(svg, 'open'), 3);
  assert.equal(count(svg, 'mute'), 1);
  assert.equal(count(svg, 'dot'), 2);
});

test('every generated diagram fits its five-fret box', () => {
  const rng = seededRandom(17);
  for (const id of GENRE_IDS) {
    for (let i = 0; i < 100; i++) {
      for (const chord of generateProgression(id, rng).chords) {
        for (const y of dotYs(diagramSVG(chord.frets))) assert.ok(y > 34 && y < 144, `${chord.name} dot at ${y}`);
      }
    }
  }
});

test('B standard diagrams name the strings, none set apart since all are tuned alike', () => {
  const svg = diagramSVG([0, 2, 2, 0, 0, 0], 'Bm', 'bStandard');
  assert.equal(count(svg, 'tuning-note'), 6);
  assert.equal(count(svg, 'tuning-note retuned'), 0);
  assert.deepEqual(
    [...svg.matchAll(/class="tuning-note[^"]*"[^>]*>([A-G]♯?)</g)].map((m) => m[1]),
    ['B', 'E', 'A', 'D', 'F♯', 'B'],
  );
  assert.equal(count(diagramSVG([0, 2, 2, x, x, x], 'E5'), 'tuning-note'), 0, 'standard tuning needs no labels');
});

test('every sounding string has a hidden dot, to light while an arpeggio picks it', () => {
  const picks = (svg) =>
    [...svg.matchAll(/<circle class="pick" data-string="(\d)" cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" opacity="0"\/>/g)].map(
      (m) => m.slice(1).map(Number),
    );
  const at = (svg, cls) => [...svg.matchAll(new RegExp(`class="${cls}" cx="([\\d.]+)" cy="([\\d.]+)"`, 'g'))].map((m) => `${m[1]},${m[2]}`);
  // Open C: on the dots of the fretted notes, on the o of the open strings, none on the muted one.
  const c = diagramSVG([x, 3, 2, 0, 1, 0], 'C');
  assert.deepEqual(picks(c).map(([s]) => s), [1, 2, 3, 4, 5]);
  const dots = at(c, 'dot');
  const opens = at(c, 'open');
  for (const [s, cx, cy] of picks(c)) {
    assert.ok((s === 3 || s === 5 ? opens : dots).includes(`${cx},${cy}`), `string ${s}`);
  }
  // A barre: the strings under the bar get theirs on the bar.
  const e = diagramSVG([x, 7, 9, 9, 9, 7], 'E');
  assert.deepEqual(picks(e).map(([s, , cy]) => [s, cy]), [[1, 45], [2, 89], [3, 89], [4, 89], [5, 45]]);
});

test('labels are escaped', () => {
  assert.ok(diagramSVG([0, 2, 2, 0, 0, 0], '"<Em>"').includes('aria-label="&quot;&lt;Em&gt;&quot;"'));
});
