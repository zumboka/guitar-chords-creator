import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRES, GENRE_IDS } from '../js/genres.js';
import { buildProgression, chordsInKey, generateProgression, keysFor } from '../js/generator.js';
import { QUALITIES, isDiatonic, parseRoman } from '../js/theory.js';
import { isPlayable, matchesChord } from '../js/voicings.js';
import { seededRandom } from '../js/dsp.js';

const RUNS = 1500;

// What each genre may use, and what every progression of it must show.
const RULES = {
  'neo-soul': {
    qualities: ['maj7', 'maj9', 'm7', 'm9', 'm11', '7', '9', '13', '7#9'],
    check: (p) => p.chords.some((c) => ['maj9', 'm9', 'm11', '9', '13', '7#9'].includes(c.quality)),
    why: 'has at least one 9th, 11th or 13th chord',
  },
  lofi: {
    qualities: ['maj7', 'm7', '7', 'maj9', 'm9', '9', 'm6'],
    check: (p) => p.chords.every((c) => QUALITIES[c.quality].intervals.length >= 4),
    why: 'uses only four-note (seventh or richer) chords',
  },
  punk: {
    qualities: ['5'],
    check: (p) => p.chords.every((c) => c.frets.filter((f) => f != null).length <= 3),
    why: 'plays power chords of at most three strings',
  },
  'post-rock': {
    qualities: ['maj7', 'm7', 'add9', 'madd9', 'sus2', 'sus4', '6'],
    check: (p) => p.chords.filter((c) => c.quality !== 'm7').length >= 3,
    why: 'colours at least three chords with add9, sus, 6 or maj7',
  },
  shoegaze: {
    qualities: ['maj7', 'm7', 'add9', 'madd9', '6', 'm6'],
    check: (p) => p.chords.some((c) => !isDiatonic(p.key, c)),
    why: 'borrows at least one chord from outside the key',
  },
  metalcore: {
    qualities: ['5'],
    check: (p) => p.key.mode === 'minor',
    why: 'is in a minor key',
  },
};

test('every genre has rules, templates and keys', () => {
  assert.deepEqual(GENRE_IDS.sort(), Object.keys(RULES).sort());
  for (const [id, genre] of Object.entries(GENRES)) {
    assert.ok(genre.templates.length >= 5, `${id} has at least 5 progressions`);
    assert.equal(new Set(genre.templates.map((t) => t.id)).size, genre.templates.length, `${id} template ids unique`);
    for (const t of genre.templates) {
      assert.equal(t.chords.length, 4, `${id}/${t.id} has four chords`);
      assert.equal(new Set(t.chords).size, 4, `${id}/${t.id} has four different chords`);
      assert.ok(keysFor(genre, t).length > 0, `${id}/${t.id} has a playable key`);
      for (const symbol of t.chords) {
        const r = parseRoman(symbol);
        assert.ok(RULES[id].qualities.includes(r.quality), `${id}/${t.id}: ${symbol} fits the genre`);
        if (r.quality !== '5') {
          assert.equal(r.lowercase, !!QUALITIES[r.quality].minor, `${id}/${t.id}: ${symbol} numeral case matches`);
        }
      }
    }
  }
});

test('every template spells cleanly in at least one key, and in all keys it is offered in', () => {
  for (const [id, genre] of Object.entries(GENRES)) {
    for (const t of genre.templates) {
      for (const tonic of keysFor(genre, t)) {
        const chords = chordsInKey(t, { tonic, mode: t.mode });
        assert.ok(chords, `${id}/${t.id} in ${tonic}`);
        assert.equal(new Set(chords.map((c) => c.name)).size, 4, `${id}/${t.id} in ${tonic}: four different chords`);
      }
    }
  }
});

for (const id of GENRE_IDS) {
  test(`${id}: ${RUNS} random progressions are all correct`, () => {
    const rng = seededRandom(id.length * 7919);
    let previous = null;
    for (let i = 0; i < RUNS; i++) {
      const p = generateProgression(id, rng, previous);
      assert.equal(p.genre, id);
      assert.equal(p.chords.length, 4);
      assert.equal(new Set(p.chords.map((c) => c.name)).size, 4, 'four different chords');
      for (const c of p.chords) {
        assert.ok(matchesChord(c.frets, c.rootPc, c.quality, GENRES[id].tuning), `${c.name} diagram spells the chord`);
        assert.ok(isPlayable(c.frets), `${c.name} diagram is playable`);
        assert.match(c.root, /^[A-G][#b]?$/, `${c.name} has a plain root name`);
        assert.ok(!['Cb', 'Fb', 'E#', 'B#'].includes(c.root), `${c.name} uses the common enharmonic name`);
        if (id === 'punk' || id === 'metalcore') {
          assert.ok(c.frets[0] != null || c.frets[1] != null, `${c.name} power chord sits on the low strings`);
        }
        if (id === 'metalcore' && c.frets[0] != null) {
          assert.ok(c.frets[1] === c.frets[0] && c.frets[2] === c.frets[0], `${c.name}: one-finger Drop C shape`);
        }
      }
      assert.ok(RULES[id].check(p), `${id} progression ${p.chords.map((c) => c.name).join(' ')} ${RULES[id].why}`);
      previous = p;
    }
  });
}

test('generation is reproducible with a seed and varies between calls', () => {
  const a = generateProgression('lofi', seededRandom(42));
  const b = generateProgression('lofi', seededRandom(42));
  assert.deepEqual(a, b);
  const names = new Set();
  const rng = seededRandom(1);
  for (let i = 0; i < 40; i++) names.add(generateProgression('neo-soul', rng).chords.map((c) => c.name).join(' '));
  assert.ok(names.size > 10, 'many different progressions');
});

test('a progression is never repeated twice in a row', () => {
  const rng = seededRandom(7);
  let previous = generateProgression('shoegaze', rng);
  for (let i = 0; i < 200; i++) {
    const next = generateProgression('shoegaze', rng, previous);
    assert.ok(next.templateId !== previous.templateId || next.key.tonic !== previous.key.tonic);
    previous = next;
  }
});

test('buildProgression rejects what the genre does not offer', () => {
  assert.equal(buildProgression('punk', 'nope', { tonic: 'E', mode: 'major' }), null);
  assert.equal(buildProgression('punk', 'axis', { tonic: 'E', mode: 'minor' }), null);
  assert.equal(buildProgression('punk', 'axis', { tonic: 'Gb', mode: 'major' }), null);
  assert.equal(buildProgression('jazz', 'axis', { tonic: 'E', mode: 'major' }), null);
  assert.ok(buildProgression('punk', 'axis', { tonic: 'E', mode: 'major' }));
});

test('the example progressions from the plan come out as promised', () => {
  const names = (genre, template, tonic, mode) =>
    buildProgression(genre, template, { tonic, mode }).chords.map((c) => c.name);
  assert.deepEqual(names('neo-soul', 'two-five-one-six', 'C', 'major'), ['Dm9', 'G13', 'Cmaj9', 'Am9']);
  assert.deepEqual(names('lofi', 'step-down', 'C', 'major'), ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7']);
  assert.deepEqual(names('punk', 'axis', 'E', 'major'), ['E5', 'B5', 'C#5', 'A5']);
  assert.deepEqual(names('post-rock', 'open-four', 'G', 'major'), ['Gmaj7', 'Em(add9)', 'Cadd9', 'Dsus4']);
  assert.deepEqual(names('shoegaze', 'drone-mixture', 'E', 'major'), ['Emaj7', 'Cmaj7', 'Aadd9', 'Am(add9)']);
  assert.deepEqual(names('metalcore', 'six-seven-one-three', 'C', 'minor'), ['Ab5', 'Bb5', 'C5', 'Eb5']);
});

test('metalcore is mostly in C minor, and its home chord mostly rings on the open low strings', () => {
  const rng = seededRandom(9);
  let inC = 0;
  let open = 0;
  for (let i = 0; i < 300; i++) {
    const p = generateProgression('metalcore', rng);
    if (p.key.tonic !== 'C') continue;
    inC++;
    const home = p.chords.find((c) => c.roman === 'i5');
    if (home.frets[0] === 0) open++;
    else assert.deepEqual(home.frets, [12, 12, 12, null, null, null], 'or an octave up');
  }
  assert.ok(inC > 120 && inC < 180, `${inC} of 300 in C minor`);
  assert.ok(open > 0.8 * inC, `${open} of ${inC} on the open strings`);
});

test('metalcore plays the progressions of metalcore choruses and riffs', () => {
  const names = (template) => buildProgression('metalcore', template, { tonic: 'C', mode: 'minor' }).chords.map((c) => c.name);
  // Killswitch Engage, Bring Me The Horizon, Demon Hunter: VI-VII-i-III.
  assert.deepEqual(names('six-seven-one-three'), ['Ab5', 'Bb5', 'C5', 'Eb5']);
  // Parkway Drive: i-v-VI-VII.
  assert.deepEqual(names('one-five-six-seven'), ['C5', 'G5', 'Ab5', 'Bb5']);
  // Phrygian: the half-step above the open string.
  assert.deepEqual(names('phrygian'), ['C5', 'Db5', 'Bb5', 'Ab5']);
  const shared = GENRES.metalcore.templates.filter((t) =>
    GENRES.punk.templates.some((p) => p.chords.join() === t.chords.join()),
  );
  assert.deepEqual(shared, [], 'none of them is a punk progression');
});

test('shoegaze in E keeps the open top strings ringing through the drone progression', () => {
  const rng = seededRandom(3);
  for (let i = 0; i < 20; i++) {
    const p = buildProgression('shoegaze', 'drone-mixture', { tonic: 'E', mode: 'major' }, null, rng);
    for (const c of p.chords) assert.deepEqual(c.frets.slice(4), [0, 0], `${c.name} rings open B and E`);
  }
});
