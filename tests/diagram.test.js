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

test('Drop B diagrams name the strings and highlight the dropped one', () => {
  const svg = diagramSVG([0, 0, 0, 2, 3, 1], 'Bm', 'dropB');
  assert.equal(count(svg, 'tuning-note'), 5);
  assert.equal(count(svg, 'tuning-note retuned'), 1);
  assert.deepEqual(
    [...svg.matchAll(/class="tuning-note[^"]*"[^>]*>([A-G]♯?)</g)].map((m) => m[1]),
    ['B', 'F♯', 'B', 'E', 'G♯', 'C♯'],
  );
  assert.ok(/class="tuning-note retuned" x="24"/.test(svg), 'the low string');
  assert.equal(count(diagramSVG([0, 2, 2, x, x, x], 'E5'), 'tuning-note'), 0, 'standard tuning needs no labels');
});

test('labels are escaped', () => {
  assert.ok(diagramSVG([0, 2, 2, 0, 0, 0], '"<Em>"').includes('aria-label="&quot;&lt;Em&gt;&quot;"'));
});
