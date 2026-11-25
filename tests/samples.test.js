import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GENRES, GENRE_IDS } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { buildPerformance, previewNotes, strokesOf } from '../js/performance.js';
import { notesOf, sampleUrl } from '../js/samples.js';
import { SOUNDS, recordingsNeeded, takesOf, voicesFor } from '../js/sounds.js';
import { RECORDINGS, centsOf, highest, nearest } from '../js/recordings.js';
import { SHAPES, voicingsFor } from '../js/voicings.js';
import { QUALITIES } from '../js/theory.js';
import { seededRandom } from '../js/dsp.js';

const root = new URL('../', import.meta.url);
const path = (url) => fileURLToPath(new URL(url, root));

/** Every set of notes a diagram of this quality list can sound in a tuning. */
function allShapes(tuning, qualities = Object.keys(QUALITIES)) {
  const shapes = SHAPES[tuning].open.filter((s) => qualities.includes(s.quality)).map((s) => s.frets);
  for (const quality of qualities) {
    for (let rootPc = 0; rootPc < 12; rootPc++) shapes.push(...voicingsFor(rootPc, quality, tuning));
  }
  return shapes;
}

test('every genre has a sound made of recorded instruments', () => {
  assert.deepEqual(Object.keys(SOUNDS).sort(), Object.keys(GENRES).sort());
  for (const sound of Object.values(SOUNDS)) {
    const used = takesOf(sound).map((t) => t.instrument);
    if (sound.chords) used.push(...sound.chords.ringing, ...sound.chords.muted);
    for (const instrument of used) assert.ok(RECORDINGS[instrument], instrument);
  }
});

test('every recording in the table is there, in the format it claims, and none is left over', () => {
  for (const [instrument, { type, low }] of Object.entries(RECORDINGS)) {
    const files = new Set(readdirSync(path(`audio/${instrument}`)));
    for (let midi = low; midi <= highest(instrument); midi++) {
      const head = readFileSync(path(sampleUrl(instrument, midi)));
      assert.ok(head.length > 1000, `${instrument}/${midi} has content`);
      const tag = head.subarray(0, 4).toString('latin1');
      const mp3 = (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) || tag.startsWith('ID3');
      assert.ok(type === 'flac' ? tag === 'fLaC' : mp3, `${instrument}/${midi} is ${type}`);
      files.delete(`${midi}.${type}`);
    }
    assert.equal(files.size, 0, `${instrument}: unused ${[...files]}`);
  }
  for (const entry of readdirSync(path('audio'), { withFileTypes: true })) {
    if (entry.isDirectory()) assert.ok(RECORDINGS[entry.name], `audio/${entry.name} is used`);
  }
});

test('the tuning corrections are small', () => {
  for (const [instrument, { cents }] of Object.entries(RECORDINGS)) {
    for (const c of cents) assert.ok(Number.isInteger(c) && Math.abs(c) <= 30, `${instrument}: ${c} cents`);
  }
  assert.equal(centsOf('strat_neck', 40), 9);
  assert.equal(centsOf('strat_bridge', 78), 5);
  assert.equal(nearest('power_chord_a', 38), 40);
  assert.equal(nearest('power_chord_a', 45), 45);
  assert.equal(nearest('power_chord_a', 60), 51);
});

test('every note any chord shape can play has a recording in the note-by-note sounds', () => {
  for (const id of GENRE_IDS) {
    if (SOUNDS[id].chords) continue;
    for (const [instrument, notes] of recordingsNeeded(SOUNDS[id], allShapes(GENRES[id].tuning), GENRES[id].tuning)) {
      for (const midi of notes) assert.ok(existsSync(path(sampleUrl(instrument, midi))), `${instrument} ${midi}`);
    }
  }
});

test('metalcore: every power chord shape plays from existing recordings, moved by a few semitones at most', () => {
  const sound = SOUNDS.metalcore;
  const { tuning } = GENRES.metalcore;
  for (const frets of allShapes(tuning, ['5'])) {
    for (const [instrument, notes] of recordingsNeeded(sound, [frets], tuning)) {
      for (const midi of notes) assert.ok(existsSync(path(sampleUrl(instrument, midi))), `${instrument} ${midi}`);
    }
  }
  const rng = seededRandom(31);
  for (let run = 0; run < 200; run++) {
    for (const mode of ['strum', 'arpeggio']) {
      const { notes } = buildPerformance(generateProgression('metalcore', rng), { mode, bpm: 140 });
      strokesOf(notes).forEach((stroke, k) => {
        for (const { rate } of voicesFor(sound, stroke, k)) {
          const semitones = 12 * Math.log2(rate);
          assert.ok(Math.abs(semitones) < 3.01, `moved by ${semitones}`);
        }
      });
    }
  }
});

test('every guitar part of a genre has a guitar to play it', () => {
  const rng = seededRandom(33);
  for (const id of GENRE_IDS) {
    const guitars = takesOf(SOUNDS[id]).length;
    for (const mode of ['strum', 'arpeggio']) {
      const { notes } = buildPerformance(generateProgression(id, rng), { mode, bpm: 100 });
      for (const n of notes) assert.ok(n.part === null || (n.part >= 0 && n.part < guitars), `${id}: part ${n.part}`);
    }
  }
});

test('Neo Soul and Post Rock share no recordings', () => {
  const instruments = (id) => takesOf(SOUNDS[id]).map((t) => t.instrument);
  for (const instrument of instruments('neo-soul')) assert.ok(!instruments('post-rock').includes(instrument));
});

test('what is loaded for a playback is what it plays', () => {
  const rng = seededRandom(32);
  for (const id of GENRE_IDS) {
    const sound = SOUNDS[id];
    const p = generateProgression(id, rng);
    const frets = p.chords.map((c) => c.frets);
    for (const mode of ['strum', 'arpeggio']) {
      const needed = recordingsNeeded(sound, frets, GENRES[id].tuning, mode);
      const both = recordingsNeeded(sound, frets, GENRES[id].tuning);
      const { notes } = buildPerformance(p, { mode, bpm: 100 });
      const preview = previewNotes(frets[0], id);
      const strokes = sound.chords ? strokesOf(notes) : notes.map((n) => ({ ...n, midis: [n.midi] }));
      if (mode === 'strum') {
        strokes.push(...(sound.chords ? strokesOf(preview) : preview.map((n) => ({ ...n, midis: [n.midi] }))));
      }
      strokes.forEach((stroke, k) => {
        for (const voice of voicesFor(sound, stroke, k)) {
          assert.ok(needed.get(voice.instrument)?.has(voice.midi), `${id} ${mode}: ${voice.instrument} ${voice.midi}`);
          assert.ok(both.get(voice.instrument).has(voice.midi));
        }
      });
    }
  }
});

test('the two metalcore guitars never play the same recording, and repeated strokes vary', () => {
  const sound = SOUNDS.metalcore;
  const key = (v) => `${v.instrument}/${v.midi}`;
  for (const stroke of [
    { midis: [38, 45, 50], muted: true },
    { midis: [51, 58, 63], muted: true },
    { midis: [45, 52, 57], muted: false },
    { midis: [38], muted: true },
    { midis: [70], muted: false },
  ]) {
    for (let k = 0; k < 8; k++) {
      const [left, right] = voicesFor(sound, stroke, k);
      assert.notEqual(key(left), key(right));
      const [nextLeft, nextRight] = voicesFor(sound, stroke, k + 1);
      assert.notEqual(key(left), key(nextLeft));
      assert.notEqual(key(right), key(nextRight));
    }
  }
  const chug = [0, 1, 2, 3].map((k) => key(voicesFor(sound, { midis: [38, 45, 50], muted: true }, k)[0]));
  assert.equal(new Set(chug).size, 4, 'four different chugs before one comes back');
});

test('notesOf lists each sounding note once, lowest first', () => {
  assert.deepEqual(
    notesOf([
      [null, 3, 2, 0, 1, 0],
      [3, 2, 0, 0, 0, 3],
    ]),
    [43, 47, 48, 50, 52, 55, 59, 60, 64, 67],
  );
  assert.deepEqual(notesOf([[0, 0, 0, null, null, null]], 'dropD'), [38, 45, 50]);
});
