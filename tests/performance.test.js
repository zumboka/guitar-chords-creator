import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRE_IDS } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { buildPerformance, previewNotes } from '../js/performance.js';
import { chordTones, mod, STANDARD_TUNING } from '../js/theory.js';
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
          assert.equal(n.midi, STANDARD_TUNING[n.string] + chord.frets[n.string]);
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
