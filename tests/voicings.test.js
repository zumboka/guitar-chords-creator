import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRES } from '../js/genres.js';
import { QUALITIES, parseRoman } from '../js/theory.js';
import {
  SHAPES,
  findBarre,
  fingerCount,
  fretsToString,
  isPlayable,
  matchesChord,
  parseFrets,
  voicingsFor,
} from '../js/voicings.js';

const x = null;
const label = (shape) => `${shape.quality} @${shape.rootPc} ${fretsToString(shape.frets)}`;

test('every shape in the library is the chord it claims and can be played, in its tuning', () => {
  for (const [tuning, library] of Object.entries(SHAPES)) {
    for (const shape of [...library.movable, ...library.open]) {
      assert.ok(matchesChord(shape.frets, shape.rootPc, shape.quality, tuning), `${tuning} ${label(shape)} spells its chord`);
      assert.ok(isPlayable(shape.frets), `${tuning} ${label(shape)} is playable`);
    }
  }
});

test('movable shapes have no open strings', () => {
  for (const library of Object.values(SHAPES)) {
    for (const shape of library.movable) assert.ok(!shape.frets.includes(0), label(shape));
  }
});

test('every quality the genres use has shapes for all twelve roots, in the tuning of each genre', () => {
  const used = new Set();
  for (const genre of Object.values(GENRES)) {
    for (const t of genre.templates) for (const c of t.chords) used.add(`${genre.tuning}/${parseRoman(c).quality}`);
  }
  for (const pair of used) {
    const [tuning, quality] = pair.split('/');
    for (let root = 0; root < 12; root++) {
      const found = voicingsFor(root, quality, tuning);
      assert.ok(found.length > 0, `${pair} on pitch class ${root}`);
      for (const frets of found) {
        assert.ok(matchesChord(frets, root, quality, tuning), `${pair}@${root} ${fretsToString(frets)} spells the chord`);
        assert.ok(isPlayable(frets), `${pair}@${root} ${fretsToString(frets)} is playable`);
      }
    }
  }
});

test('Drop C: full chords on root, fifth and octave under one finger, or the A shape', () => {
  assert.ok(matchesChord([0, 0, 0, 2, 3, 1], 0, 'm', 'dropC'), 'Cm on the open low strings');
  assert.ok(!matchesChord([0, 0, 0, 2, 3, 1], 0, 'm'), 'not in standard tuning');
  assert.deepEqual(voicingsFor(0, 'm', 'dropC').map(fretsToString), ['000231', 'x57765'], 'Cm open or at fret 5');
  assert.deepEqual(voicingsFor(8, 'maj', 'dropC').map(fretsToString), ['888aba', 'x13331'], 'Ab at fret 8 or 1');
  assert.deepEqual(voicingsFor(7, 'm7', 'dropC').map(fretsToString), ['x02010', '777988', 'xcecdc'], 'Gm7 open, at fret 7 or 12');
  for (const quality of ['maj', 'm', '7', 'm7']) {
    for (let root = 0; root < 12; root++) {
      for (const frets of voicingsFor(root, quality, 'dropC')) {
        const [low, fifth, octave] = frets;
        assert.ok(low == null ? frets[1] != null : fifth === low && octave === low, `${fretsToString(frets)}`);
      }
    }
  }
});

test('the chord check rejects wrong notes, missing tones and a wrong bass', () => {
  assert.ok(matchesChord([x, 3, 2, 0, 1, 0], 0, 'maj')); // C
  assert.ok(!matchesChord([x, 3, 2, 0, 1, 0], 0, 'maj7')); // no B
  assert.ok(!matchesChord([3, 3, 2, 0, 1, 0], 0, 'maj')); // G in the bass
  assert.ok(!matchesChord([x, 3, 2, 0, 1, 1], 0, 'maj')); // stray F
  assert.ok(matchesChord([x, 0, 7, 6, 0, 0], 9, 'add9')); // A add9 with open strings
  assert.ok(!matchesChord([x, 0, 2, 2, 0, 0], 9, 'add9')); // Asus2 has no third
  assert.ok(Object.keys(QUALITIES).length > 10);
});

test('finger counting and barres', () => {
  assert.equal(fingerCount([1, 3, 3, 2, 1, 1]), 3); // F barre (ring finger flattens over two strings)
  assert.equal(fingerCount([x, 3, 2, 0, 1, 0]), 3); // C
  assert.equal(fingerCount([3, x, 3, 4, 3, x]), 4); // G7 jazz shape
  assert.equal(fingerCount([0, 0, 0, 0, 0, 0]), 0);
  assert.deepEqual(findBarre([1, 3, 3, 2, 1, 1]), { fret: 1, from: 0, to: 5 });
  assert.deepEqual(findBarre([x, 2, 4, 2, 3, 2]), { fret: 2, from: 1, to: 5 });
  assert.equal(findBarre([x, 0, 2, 2, 2, 0]), null); // open A: three fingers side by side, no barre drawn
  assert.equal(findBarre([3, x, 3, 3, 3, x]), null); // muted string under it
  assert.ok(!isPlayable([1, 5, 6, x, x, x])); // too wide
  assert.ok(!isPlayable([1, 2, 3, 4, 5, x])); // too wide and five fingers
});

test('share-link fret strings round-trip', () => {
  assert.equal(fretsToString([x, 10, 12, 11, 12, x]), 'xacbcx');
  assert.deepEqual(parseFrets('xacbcx'), [x, 10, 12, 11, 12, x]);
  assert.equal(parseFrets('xx'), null);
  assert.equal(parseFrets('xxxxxz'), null);
});
