import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRE_IDS, GENRES } from '../js/genres.js';
import { generateProgression } from '../js/generator.js';
import { decodeState, encodeState } from '../js/share.js';
import { seededRandom } from '../js/dsp.js';

test('a shared link brings back exactly the same progression', () => {
  const rng = seededRandom(5);
  for (const id of GENRE_IDS) {
    for (let i = 0; i < 30; i++) {
      const p = generateProgression(id, rng);
      const bpm = 60 + i;
      const back = decodeState('#' + encodeState(p, bpm));
      assert.ok(back, `${id} decodes`);
      assert.equal(back.bpm, bpm);
      assert.deepEqual(back.progression, p);
    }
  }
});

test('sharp keys survive the URL', () => {
  const rng = seededRandom(11);
  let p;
  do p = generateProgression('punk', rng);
  while (!p.key.tonic.includes('#'));
  const fragment = encodeState(p, 168);
  assert.ok(fragment.includes('%23'), fragment);
  assert.deepEqual(decodeState(fragment).progression.key, p.key);
});

test('broken or tampered links are handled', () => {
  assert.equal(decodeState(''), null);
  assert.equal(decodeState('#g=jazz&k=C-major&p=x'), null);
  assert.equal(decodeState('#g=toString&k=C-major&p=x'), null);
  assert.equal(decodeState('#g=punk&k=H-major&p=axis'), null);
  assert.equal(decodeState('#g=punk&k=E-major&p=nope'), null);

  // A diagram that is not the chord is replaced with a correct one.
  const good = decodeState('#g=punk&k=E-major&p=axis&v=022xxx.x244xx.x466xx.x022xx&t=168');
  assert.deepEqual(good.progression.chords[0].frets, [0, 2, 2, null, null, null]);
  const bad = decodeState('#g=punk&k=E-major&p=axis&v=000000.x244xx.x466xx.x022xx&t=999');
  assert.notDeepEqual(bad.progression.chords[0].frets, [0, 0, 0, 0, 0, 0]);
  assert.equal(bad.bpm, GENRES.punk.tempo);
  const missing = decodeState('#g=punk&k=E-major&p=axis');
  assert.equal(missing.progression.chords.length, 4);
});
