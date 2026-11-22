import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUALITIES, chordInKey, isDiatonic, parseNote, pretty, spellDegree } from '../js/theory.js';

test('degrees are spelled with the letter the key calls for', () => {
  const name = (tonic, mode, degree, acc) => spellDegree({ tonic, mode }, degree, acc).name;
  assert.equal(name('C', 'major', 1, 0), 'D');
  assert.equal(name('F', 'major', 3, 0), 'Bb');
  assert.equal(name('E', 'major', 5, -1), 'C');
  assert.equal(name('E', 'major', 2, 0), 'G#');
  assert.equal(name('D', 'minor', 1, -1), 'Eb');
  assert.equal(name('A', 'minor', 6, -1), 'G');
  assert.equal(name('Ab', 'major', 2, 0), 'C');
  assert.equal(name('F#', 'minor', 1, -1), 'G');
});

test('Roman numerals become named chords', () => {
  const key = { tonic: 'C', mode: 'major' };
  assert.deepEqual(
    ['ii:m9', 'V:13', 'I:maj9', 'vi:m9', 'bII:9', 'III:7#9', 'iv:m6'].map((s) => chordInKey(key, s).name),
    ['Dm9', 'G13', 'Cmaj9', 'Am9', 'Db9', 'E7#9', 'Fm6'],
  );
  assert.equal(chordInKey(key, 'bVI:maj7').roman, 'bVImaj7');
  assert.equal(chordInKey(key, 'iii:m7').roman, 'iii7');
  assert.equal(chordInKey(key, 'vi:madd9').roman, 'vi(add9)');
  assert.equal(chordInKey({ tonic: 'E', mode: 'minor' }, 'i:madd9').name, 'Em(add9)');
});

test('chord qualities are consistent', () => {
  for (const [id, q] of Object.entries(QUALITIES)) {
    assert.ok(q.required.includes(0), `${id} requires its root`);
    for (const i of q.required) assert.ok(q.intervals.includes(i), `${id}: required ${i} is a chord tone`);
    assert.equal(new Set(q.intervals).size, q.intervals.length, `${id} has no duplicate tones`);
  }
});

test('diatonic check', () => {
  const key = { tonic: 'E', mode: 'major' };
  assert.equal(isDiatonic(key, chordInKey(key, 'IV:add9')), true);
  assert.equal(isDiatonic(key, chordInKey(key, 'bVI:maj7')), false);
  assert.equal(isDiatonic(key, chordInKey(key, 'iv:madd9')), false);
});

test('display formatting', () => {
  assert.equal(pretty('Bbm7'), 'B♭m7');
  assert.equal(pretty('E7#9'), 'E7♯9');
  assert.equal(pretty('bVImaj7'), '♭VImaj7');
  assert.equal(pretty('Bb major'), 'B♭ major');
  assert.equal(parseNote('C#').pc, 1);
});
