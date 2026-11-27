import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GENRES, GENRE_IDS } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { buildPerformance, previewNotes } from '../js/performance.js';
import { SampleBank, notesOf, sampleUrl } from '../js/samples.js';
import { SOUNDS, recordingsNeeded, soundFor, takesOf, voicesFor } from '../js/sounds.js';
import { RECORDINGS, centsOf, highest } from '../js/recordings.js';
import { SHAPES, voicingsFor } from '../js/voicings.js';
import { QUALITIES } from '../js/theory.js';
import { seededRandom } from '../js/dsp.js';

const MODES = ['strum', 'arpeggio'];
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
  for (const id of GENRE_IDS) {
    for (const mode of MODES) {
      const sound = soundFor(id, mode);
      for (const { instrument } of takesOf(sound)) assert.ok(RECORDINGS[instrument], instrument);
    }
  }
});

test('Neo Soul and Post Rock each have a world of their own, strummed or picked', () => {
  const neoSoul = soundFor('neo-soul', 'strum');
  const postRock = soundFor('post-rock', 'strum');
  assert.ok(neoSoul.chorus && neoSoul.compress && !neoSoul.delay, 'lush, close and without an echo');
  assert.ok(postRock.delay && !postRock.chorus, 'echoes');
  assert.ok(postRock.reverb.seconds > 2 * neoSoul.reverb.seconds, 'a hall against a plate');
  // Strums must not ring on and on (the user's complaint about an earlier version).
  assert.ok(postRock.reverb.mix <= 0.3 && postRock.reverb.seconds <= 4 && postRock.delay.mix <= 0.25 && postRock.delay.feedback <= 0.35);
  const instruments = (sound) => takesOf(sound).map((t) => t.instrument);
  for (const mode of MODES) {
    for (const instrument of instruments(soundFor('neo-soul', mode))) {
      assert.ok(!instruments(soundFor('post-rock', mode)).includes(instrument));
    }
  }
  assert.equal(takesOf(neoSoul).length, 1);
  const [left, right] = takesOf(postRock);
  assert.ok(left.pan < 0 && right.pan > 0);
  assert.notEqual(left.instrument, right.instrument, 'two performances, not a copy');
});

test('Shoegaze is two swaying fuzz guitars with a crisp clean one between them', () => {
  for (const mode of MODES) {
    const sound = soundFor('shoegaze', mode);
    const [left, right, clean, ...others] = takesOf(sound);
    assert.equal(others.length, 0);
    assert.ok(left.pan < 0 && right.pan > 0 && clean.pan === 0);
    assert.equal(new Set([left, right, clean].map((t) => t.instrument)).size, 3, 'three performances');
    for (const fuzz of [left, right]) assert.equal(fuzz.amp, sound.amp);
    const gainOf = (amp) => amp.drive.reduce((a, b) => a * b);
    assert.ok(gainOf(sound.amp) > 4 * gainOf(clean.amp));
    // The chord stays in tune: one guitar holds it while the others move around it.
    assert.ok(left.sway && right.sway && left.sway.rate !== right.sway.rate && !clean.sway);
    assert.ok(!sound.delay, 'echoes are for Post Rock');
  }
  const [strummed, picked] = MODES.map((mode) => soundFor('shoegaze', mode).amp.drive[0]);
  assert.ok(strummed > picked, 'more fuzz for strums');
});

test('a take plays through its own amp, or else the one of the sound', () => {
  const own = { drive: [1] };
  const shared = { drive: [2] };
  assert.deepEqual(
    takesOf({ instrument: 'strat_neck', amp: shared, takes: [{ amp: own }, {}] }).map((t) => t.amp),
    [own, shared],
  );
  assert.equal(takesOf({ instrument: 'strat_neck' })[0].amp, undefined);
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
  assert.equal(centsOf('di_guitar', 76), -6);
});

test('every note any chord shape can play has a recording', () => {
  for (const id of GENRE_IDS) {
    const { tuning } = GENRES[id];
    for (const mode of MODES) {
      for (const [instrument, notes] of recordingsNeeded(id, mode, allShapes(tuning), tuning)) {
        for (const midi of notes) assert.ok(existsSync(path(sampleUrl(instrument, midi))), `${instrument} ${midi}`);
      }
    }
  }
});

test('metalcore plays every note from its own recording or its neighbour\'s, moved a semitone at most', () => {
  const rng = seededRandom(31);
  for (let run = 0; run < 200; run++) {
    for (const mode of MODES) {
      const { notes } = buildPerformance(generateProgression('metalcore', rng), { mode, bpm: 184 });
      notes.forEach((note, k) => {
        for (const voice of voicesFor(SOUNDS.metalcore, note, k)) {
          assert.equal(voice.instrument, 'di_guitar');
          assert.ok(Math.abs(voice.midi - note.midi) <= 1);
          assert.ok(Math.abs(voice.rate - 2 ** ((note.midi - voice.midi) / 12)) < 1e-9);
        }
      });
    }
  }
});

test('every guitar part of a genre has a guitar to play it', () => {
  const rng = seededRandom(33);
  for (const id of GENRE_IDS) {
    for (const mode of MODES) {
      const guitars = takesOf(soundFor(id, mode)).length;
      const { notes } = buildPerformance(generateProgression(id, rng), { mode, bpm: 100 });
      for (const n of notes) assert.ok(n.part === null || (n.part >= 0 && n.part < guitars), `${id}: part ${n.part}`);
    }
  }
});

test('what is loaded for a playback is what it plays', () => {
  const rng = seededRandom(32);
  for (const id of GENRE_IDS) {
    const p = generateProgression(id, rng);
    const frets = p.chords.map((c) => c.frets);
    for (const mode of MODES) {
      const sound = soundFor(id, mode);
      const needed = recordingsNeeded(id, mode, frets, GENRES[id].tuning);
      const { notes } = buildPerformance(p, { mode, bpm: 100 });
      if (mode === 'strum') notes.push(...previewNotes(frets[0], id));
      notes.forEach((note, k) => {
        for (const voice of voicesFor(sound, note, k)) {
          assert.ok(needed.get(voice.instrument)?.has(voice.midi), `${id} ${mode}: ${voice.instrument} ${voice.midi}`);
        }
      });
    }
  }
});

test('the two metalcore guitars never play the same recording, and a repeated note varies', () => {
  const key = (v) => `${v.instrument}/${v.midi}`;
  for (const midi of [36, 43, 48, 55, 62, 75, 76]) {
    for (let k = 0; k < 8; k++) {
      const [left, right] = voicesFor(SOUNDS.metalcore, { midi }, k);
      assert.notEqual(key(left), key(right));
      const [nextLeft, nextRight] = voicesFor(SOUNDS.metalcore, { midi }, k + 1);
      assert.notEqual(key(left), key(nextLeft));
      assert.notEqual(key(right), key(nextRight));
    }
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
  assert.deepEqual(notesOf([[0, 0, 0, null, null, null]], 'dropB'), [35, 42, 47]);
});

/** An audio context that decodes anything into a short tone. */
const fakeContext = {
  decodeAudioData: async () => ({
    numberOfChannels: 1,
    sampleRate: 22050,
    getChannelData: () => Float32Array.from({ length: 22050 }, (_, i) => Math.sin(i / 10)),
  }),
};

test('a briefly unavailable server does not stop playback; a lasting failure does, and can be retried', async () => {
  const realFetch = globalThis.fetch;
  const asked = [];
  let failures = 2;
  globalThis.fetch = async (url) => {
    asked.push(url);
    if (failures-- > 0) return { ok: false, status: 503 };
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  try {
    const bank = new SampleBank(fakeContext);
    await bank.load('strat_neck', [60]);
    assert.equal(asked.length, 3, 'two failures, then the file');
    assert.ok(bank.get('strat_neck', 60).gain > 0);

    failures = Infinity;
    await assert.rejects(bank.load('strat_neck', [61]), /HTTP 503/);
    assert.throws(() => bank.get('strat_neck', 61));
    failures = 0;
    await bank.load('strat_neck', [61]);
    assert.ok(bank.get('strat_neck', 61));
  } finally {
    globalThis.fetch = realFetch;
  }
});
