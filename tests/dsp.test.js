import { test } from 'node:test';
import assert from 'node:assert/strict';
import { driveCurve, impulseResponse, midiToFrequency, pluck, seededRandom, vinylNoise } from '../js/dsp.js';

const SR = 44100;

/** Period in samples, from the autocorrelation peak near the expected period. */
function measurePeriod(data, expected) {
  const start = Math.round(expected * 20);
  const size = Math.round(expected * 40);
  let best = 0;
  let bestLag = 0;
  const corr = (lag) => {
    let sum = 0;
    for (let i = start; i < start + size; i++) sum += data[i] * data[i + lag];
    return sum;
  };
  const values = new Map();
  for (let lag = Math.floor(expected * 0.8); lag <= Math.ceil(expected * 1.2); lag++) {
    const c = corr(lag);
    values.set(lag, c);
    if (c > best) [best, bestLag] = [c, lag];
  }
  // Parabolic interpolation between neighbouring lags.
  const a = values.get(bestLag - 1);
  const b = values.get(bestLag);
  const c = values.get(bestLag + 1);
  return bestLag + (0.5 * (a - c)) / (a - 2 * b + c);
}

test('plucked strings report their true pitch, so the playback rate can tune them exactly', () => {
  for (const midi of [40, 45, 52, 59, 64, 69, 76]) {
    const target = midiToFrequency(midi);
    const { data, frequency } = pluck({ frequency: target, sampleRate: SR, seconds: 1, rng: seededRandom(midi) });
    const measured = SR / measurePeriod(data, SR / frequency);
    assert.ok(Math.abs(measured / frequency - 1) < 0.003, `midi ${midi}: measured ${measured} vs ${frequency}`);
    assert.ok(Math.abs(frequency / target - 1) < 0.03, `midi ${midi}: within a quarter tone before correction`);
  }
});

test('plucks are clean signals that die away', () => {
  for (const brightness of [0, 0.5, 1]) {
    const { data } = pluck({ frequency: 110, sampleRate: SR, seconds: 3, brightness, sustain: 1.5, rng: seededRandom(1) });
    let peak = 0;
    for (const v of data) {
      assert.ok(Number.isFinite(v));
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(Math.abs(peak - 1) < 1e-6, 'normalised');
    const energy = (from, to) => data.subarray(from, to).reduce((s, v) => s + v * v, 0);
    const tenth = Math.floor(data.length / 10);
    assert.ok(energy(data.length - tenth, data.length) < energy(0, tenth) / 100, 'decays');
  }
});

test('distortion curves stay within range and never fold back', () => {
  for (const [amount, asym] of [[2, 0], [7, 0.1], [30, 0.05], [14, 0.3]]) {
    const curve = driveCurve(amount, asym);
    for (let i = 0; i < curve.length; i++) {
      assert.ok(curve[i] >= -1 && curve[i] <= 1.000001);
      if (i) assert.ok(curve[i] >= curve[i - 1]);
    }
    assert.ok(Math.abs(curve[Math.floor(curve.length / 2)]) < 0.02, 'silence stays silent');
  }
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
