import { test } from 'node:test';
import assert from 'node:assert/strict';
import { impulseResponse, sampleSettings, seededRandom, vinylNoise } from '../js/dsp.js';

const SR = 44100;

/** A fake recording: `silence` seconds of nothing, then a decaying tone of the given peak. */
function recording(silence, peak, seconds = 1) {
  const data = new Float32Array(Math.round(seconds * SR));
  const start = Math.round(silence * SR);
  for (let i = start; i < data.length; i++) {
    data[i] = peak * Math.exp(-(i - start) / SR) * Math.sin((2 * Math.PI * 220 * (i - start)) / SR);
  }
  return data;
}

test('a sample starts at its attack, not at the silence before it', () => {
  const s = sampleSettings([recording(0.02, 0.1), recording(0.02, 0.1)], SR);
  assert.ok(Math.abs(s.offset - 0.018) < 0.0015, `offset ${s.offset}`);
  assert.equal(sampleSettings([recording(0, 0.1)], SR).offset, 0);
});

test('quiet and loud recordings come out at the same level, without clipping', () => {
  const quiet = sampleSettings([recording(0, 0.05)], SR);
  const loud = sampleSettings([recording(0, 0.5)], SR);
  assert.ok(Math.abs(quiet.gain * 0.05 - loud.gain * 0.5) < 1e-6);
  const spiky = new Float32Array(SR);
  spiky[10] = 1;
  for (let i = 11; i < SR; i++) spiky[i] = 0.001 * Math.sin(i / 7);
  assert.ok(sampleSettings([spiky], SR).gain <= 0.95, 'peak stays below full scale');
  assert.equal(sampleSettings([new Float32Array(100)], SR).gain, 0, 'silence gets no gain');
});

test('tuning correction: a sharp recording plays slower', () => {
  assert.equal(sampleSettings([recording(0, 0.1)], SR, 0).rate, 1);
  assert.ok(Math.abs(sampleSettings([recording(0, 0.1)], SR, 18).rate - 2 ** (-18 / 1200)) < 1e-12);
  assert.ok(sampleSettings([recording(0, 0.1)], SR, -9).rate > 1);
});

test('reverb tails and vinyl noise are finite and fade or stay quiet', () => {
  const [l, r] = impulseResponse({ sampleRate: SR, seconds: 2, rng: seededRandom(2) });
  assert.equal(l.length, 2 * SR);
  assert.notDeepEqual(l.subarray(0, 100), r.subarray(0, 100));
  const head = l.subarray(0, SR / 10).reduce((s, v) => s + v * v, 0);
  const tail = l.subarray(l.length - SR / 10).reduce((s, v) => s + v * v, 0);
  assert.ok(tail < head / 100);
  const noise = vinylNoise({ sampleRate: SR, seconds: 2, rng: seededRandom(3) });
  assert.ok(noise.every((v) => Number.isFinite(v) && Math.abs(v) < 2));
});
