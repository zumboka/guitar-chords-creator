import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRES, GENRE_IDS } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { buildPerformance, previewNotes, strokesOf } from '../js/performance.js';
import { TUNINGS, chordTones, mod } from '../js/theory.js';
import { seededRandom } from '../js/dsp.js';

const EPS = 1e-9;

for (const id of GENRE_IDS) {
  for (const mode of ['strum', 'arpeggio']) {
    test(`${id} ${mode}: only the chord's own notes, inside its own bar`, () => {
      const rng = seededRandom(99);
      for (let run = 0; run < 50; run++) {
        const p = generateProgression(id, rng);
        const bpm = 50 + Math.floor(rng() * 170);
        const perf = buildPerformance(p, { mode, bpm });
        assert.ok(Math.abs(perf.bar - 240 / bpm) < EPS);
        assert.ok(Math.abs(perf.duration - 4 * perf.bar) < EPS);
        for (let i = 0; i < 4; i++) assert.ok(perf.notes.some((n) => n.chord === i), `bar ${i + 1} has notes`);
        for (const n of perf.notes) {
          const chord = p.chords[n.chord];
          // The note is a fretted string of this chord's diagram...
          assert.equal(n.midi, TUNINGS[GENRES[id].tuning].notes[n.string] + chord.frets[n.string]);
          // ...and therefore a tone of the chord.
          assert.ok(chordTones(chord.rootPc, chord.quality).includes(mod(n.midi, 12)));
          assert.ok(n.time >= n.chord * perf.bar - EPS && n.time < (n.chord + 1) * perf.bar, 'starts in its bar');
          assert.ok(n.time + n.duration <= (n.chord + 1) * perf.bar + 0.2, 'stops by the end of its bar');
          assert.ok(n.duration > 0 && n.velocity > 0 && n.velocity <= 1);
        }
        // One note at a time per string.
        for (let s = 0; s < 6; s++) {
          const onString = perf.notes.filter((n) => n.string === s);
          for (let k = 1; k < onString.length; k++) {
            assert.ok(onString[k - 1].time + onString[k - 1].duration <= onString[k].time + EPS);
          }
        }
        if (mode === 'strum') {
          // Each bar opens with a downstroke across every string of the diagram, low to high.
          for (let i = 0; i < 4; i++) {
            const played = p.chords[i].frets.flatMap((f, s) => (f == null ? [] : [s]));
            const first = perf.notes.filter((n) => n.chord === i).slice(0, played.length);
            assert.deepEqual(
              first.map((n) => n.string),
              played,
            );
          }
        }
      }
    });
  }
}

test('metalcore strums whole power chords: ringing accents and palm-muted chugs', () => {
  const rng = seededRandom(21);
  for (let run = 0; run < 30; run++) {
    const p = generateProgression('metalcore', rng);
    const strokes = strokesOf(buildPerformance(p, { mode: 'strum', bpm: 140 }).notes);
    for (let i = 0; i < 4; i++) {
      const bar = strokes.filter((s) => s.chord === i);
      assert.ok(!bar[0].muted, 'each chord starts ringing');
      assert.ok(bar.some((s) => s.muted) && bar.filter((s) => !s.muted).length >= 3);
      for (const s of bar) {
        assert.deepEqual(
          s.midis.map((m) => m - s.midis[0]),
          [0, 7, 12],
        );
      }
    }
  }
});

test('metalcore never stops: every stroke lasts until the next, over chord changes and around the loop', () => {
  const rng = seededRandom(22);
  for (const mode of ['strum', 'arpeggio']) {
    for (let run = 0; run < 20; run++) {
      const bpm = 50 + Math.floor(rng() * 170);
      const perf = buildPerformance(generateProgression('metalcore', rng), { mode, bpm });
      const strokes = strokesOf(perf.notes);
      strokes.forEach((s, k) => {
        const next = k + 1 < strokes.length ? strokes[k + 1].time : perf.duration;
        assert.ok(Math.abs(s.time + s.duration - next) < 1e-6, `${mode} stroke ${k} ends at the next one`);
      });
    }
  }
});

test('the metalcore arpeggio picks single notes over a palm-muted root', () => {
  const p = generateProgression('metalcore', seededRandom(23));
  const strokes = strokesOf(buildPerformance(p, { mode: 'arpeggio', bpm: 140 }).notes);
  for (const s of strokes) {
    assert.equal(s.midis.length, 1);
    const open = TUNINGS.dropD.notes;
    const root = Math.min(...p.chords[s.chord].frets.flatMap((f, k) => (f == null ? [] : [open[k] + f])));
    assert.equal(s.muted, s.midis[0] === root);
  }
});

test('strokes group the notes hit together, lowest first', () => {
  const p = generateProgression('neo-soul', seededRandom(24));
  const { notes } = buildPerformance(p, { mode: 'strum', bpm: 80 });
  const strokes = strokesOf(notes);
  assert.equal(strokes.length, 4 * GENRES['neo-soul'].strum.pattern.length);
  assert.equal(
    strokes.reduce((sum, s) => sum + s.midis.length, 0),
    notes.length,
  );
  for (const s of strokes) assert.deepEqual(s.midis, s.midis.slice().sort((x, y) => x - y));
});

test('clicking a diagram strums each of its strings once, low to high', () => {
  const notes = previewNotes([null, 3, 2, 0, 1, 0], 'lofi');
  assert.deepEqual(
    notes.map((n) => n.string),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    notes.map((n) => n.midi),
    [48, 52, 55, 60, 64],
  );
  for (let k = 1; k < notes.length; k++) assert.ok(notes[k].time > notes[k - 1].time);
});
