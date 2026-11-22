import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GENRES } from '../js/genres.js';
import { notesOf, sampleUrl } from '../js/samples.js';
import { SOUNDS } from '../js/sounds.js';
import { SAMPLE_RANGE, TUNING } from '../js/tuning.js';
import { SHAPES, voicingsFor } from '../js/voicings.js';
import { QUALITIES } from '../js/theory.js';

const root = new URL('../', import.meta.url);
const file = (instrument, midi) => fileURLToPath(new URL(sampleUrl(instrument, midi), root));

test('every genre has a sound with a recorded instrument', () => {
  assert.deepEqual(Object.keys(SOUNDS).sort(), Object.keys(GENRES).sort());
  for (const sound of Object.values(SOUNDS)) assert.ok(TUNING[sound.instrument], sound.instrument);
});

test('every instrument has an MP3 for every note in the range', () => {
  for (const instrument of new Set(Object.values(SOUNDS).map((s) => s.instrument))) {
    for (let midi = SAMPLE_RANGE.low; midi <= SAMPLE_RANGE.high; midi++) {
      const path = file(instrument, midi);
      assert.ok(statSync(path).size > 1000, `${instrument}/${midi}.mp3 has content`);
      const head = readFileSync(path).subarray(0, 3);
      const mpegFrame = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
      assert.ok(mpegFrame || head.toString('latin1') === 'ID3', `${instrument}/${midi}.mp3 is an MP3`);
    }
  }
});

test('the tuning table covers the range with small corrections', () => {
  for (const [instrument, cents] of Object.entries(TUNING)) {
    assert.equal(cents.length, SAMPLE_RANGE.high - SAMPLE_RANGE.low + 1, instrument);
    for (const c of cents) assert.ok(Number.isInteger(c) && Math.abs(c) <= 30, `${instrument}: ${c} cents`);
  }
});

test('every note any chord shape can play has a recording', () => {
  const frets = SHAPES.open.map((s) => s.frets);
  for (const quality of Object.keys(QUALITIES)) {
    for (let rootPc = 0; rootPc < 12; rootPc++) frets.push(...voicingsFor(rootPc, quality));
  }
  for (const midi of notesOf(frets)) {
    assert.ok(midi >= SAMPLE_RANGE.low && midi <= SAMPLE_RANGE.high, `MIDI ${midi}`);
  }
});

test('notesOf lists each sounding note once, lowest first', () => {
  assert.deepEqual(
    notesOf([
      [null, 3, 2, 0, 1, 0],
      [3, 2, 0, 0, 0, 3],
    ]),
    [43, 47, 48, 50, 52, 55, 59, 60, 64, 67],
  );
});
