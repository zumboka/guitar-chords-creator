import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cabinetImpulse, clipCurve, impulseResponse, sampleSettings, seededRandom, vinylNoise } from '../js/dsp.js';
import { SOUNDS } from '../js/sounds.js';

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

/** Level in dB of an impulse response at a frequency. */
function magnitude(impulse, frequency, sampleRate) {
  let re = 0;
  let im = 0;
  impulse.forEach((v, n) => {
    const phase = (2 * Math.PI * frequency * n) / sampleRate;
    re += v * Math.cos(phase);
    im -= v * Math.sin(phase);
  });
  return 20 * Math.log10(Math.hypot(re, im));
}

test('clipping curves keep silence silent, rise steadily and level off', () => {
  for (const bias of [0, 0.25]) {
    const curve = clipCurve({ range: 5, bias });
    assert.equal(curve.length % 2, 1, 'has a middle point');
    assert.equal(curve[(curve.length - 1) / 2], 0);
    for (let i = 1; i < curve.length; i++) assert.ok(curve[i] >= curve[i - 1]);
    assert.ok(Math.abs(curve[0] + 1 + Math.tanh(bias)) < 1e-3 && Math.abs(curve.at(-1) - 1 + Math.tanh(bias)) < 1e-3);
  }
  const even = clipCurve({ range: 5, bias: 0 });
  assert.ok(Math.abs(even[100] + even.at(-101)) < 1e-6, 'symmetric without a bias');
});

test('a cabinet has the frequency response it is given, at any sample rate', () => {
  const { cabinet } = SOUNDS.metalcore.amp;
  for (const sampleRate of [44100, 48000, 96000]) {
    const impulse = cabinetImpulse({ sampleRate, points: cabinet });
    assert.ok(impulse.every(Number.isFinite));
    for (const [frequency, level] of cabinet) {
      if (frequency < 200 || frequency > 9000) continue;
      const got = magnitude(impulse, frequency, sampleRate);
      assert.ok(Math.abs(got - level) < 1.5, `${frequency} Hz at ${sampleRate}: ${got.toFixed(1)} instead of ${level} dB`);
    }
    // Minimum phase: the energy comes first, so the speaker adds no delay.
    const energy = impulse.reduce((sum, v) => sum + v * v, 0);
    const first = impulse.subarray(0, Math.round(0.005 * sampleRate)).reduce((sum, v) => sum + v * v, 0);
    assert.ok(first / energy > 0.8);
  }
});

test('two cabinets with different seeds differ, the same seed gives the same one', () => {
  const build = (seed) => cabinetImpulse({ sampleRate: SR, points: [[20, 0], [20000, 0]], ripple: 1.5, rng: seededRandom(seed) });
  assert.deepEqual(build(1), build(1));
  assert.notDeepEqual(build(1), build(2));
  for (const f of [100, 500, 2000, 6000]) assert.ok(Math.abs(magnitude(build(1), f, SR)) < 2, 'ripple stays small');
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
