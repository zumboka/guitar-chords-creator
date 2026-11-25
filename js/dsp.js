// Sound building blocks as plain arrays, so they can be tested outside the browser.

/** Small seeded random number generator (mulberry32). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ONSET_THRESHOLD = 0.05;
const PRE_ROLL = 0.002;
const LEVEL_WINDOW = 0.3;
const TARGET_RMS = 0.1;
const MAX_PEAK = 0.95;

/**
 * How to play one recorded note: where its attack starts (the files begin with a few to 20 ms
 * of silence, which would smear a strum), a gain that brings the first 300 ms of the note to a
 * common level without clipping, and the playback rate that corrects its tuning.
 * @param channels Float32Array per channel. @param cents how sharp the recording is.
 */
export function sampleSettings(channels, sampleRate, cents = 0) {
  const length = channels[0].length;
  let peak = 0;
  for (const data of channels) for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
  let onset = 0;
  while (onset < length && !channels.some((data) => Math.abs(data[onset]) >= ONSET_THRESHOLD * peak)) onset++;
  const end = Math.min(length, onset + Math.floor(LEVEL_WINDOW * sampleRate));
  let sum = 0;
  for (const data of channels) for (let i = onset; i < end; i++) sum += data[i] * data[i];
  const rms = Math.sqrt(sum / Math.max(1, (end - onset) * channels.length));
  return {
    offset: Math.max(0, onset / sampleRate - PRE_ROLL),
    gain: rms > 0 ? Math.min(TARGET_RMS / rms, MAX_PEAK / peak) : 0,
    rate: 2 ** (-cents / 1200),
  };
}

/** Stereo reverb impulse: decaying noise that gets darker as it fades. */
export function impulseResponse({ sampleRate, seconds, decay = 2.5, rng = Math.random }) {
  const length = Math.max(1, Math.ceil(seconds * sampleRate));
  return [0, 1].map(() => {
    const data = new Float32Array(length);
    let y = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      y += (0.9 - 0.75 * t) * (rng() * 2 - 1 - y);
      data[i] = y * (1 - t) ** decay;
    }
    return data;
  });
}

/**
 * Soft-clipping curve (tanh) for a WaveShaper, covering inputs of +-range. A bias moves the
 * operating point and so adds even harmonics, like a tube stage. Silence stays silence.
 */
export function clipCurve({ range, bias = 0, points = 4097 }) {
  const centre = (points - 1) / 2;
  return Float32Array.from({ length: points }, (_, i) => Math.tanh(((i - centre) / centre) * range + bias) - Math.tanh(bias));
}

/** Level in dB at a frequency, from [Hz, dB] points joined by straight lines over log frequency. */
function levelAt(points, frequency) {
  if (frequency <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [f1, db1] = points[i];
    if (frequency > f1) continue;
    const [f0, db0] = points[i - 1];
    return db0 + ((db1 - db0) * Math.log(frequency / f0)) / Math.log(f1 / f0);
  }
  return points[points.length - 1][1];
}

/**
 * Impulse response of a speaker cabinet: the minimum-phase filter with the given magnitude
 * ([Hz, dB] points). `ripple` adds random bumps of up to that many dB, a third of an octave wide.
 */
export function cabinetImpulse({ sampleRate, points, ripple = 0, rng = Math.random, length = 1024 }) {
  const bins = 2048;
  const bumps = Float64Array.from({ length: 40 }, () => (rng() * 2 - 1) * ripple);
  const bumpAt = (frequency) => {
    const p = Math.min(38.999, Math.max(0, 3 * Math.log2(Math.max(1, frequency) / 20)));
    const i = Math.floor(p);
    const t = 0.5 - 0.5 * Math.cos(Math.PI * (p - i));
    return bumps[i] * (1 - t) + bumps[i + 1] * t;
  };
  const logs = Float64Array.from({ length: bins + 1 }, (_, k) => {
    const frequency = (k / bins) * (sampleRate / 2);
    return ((levelAt(points, frequency) + bumpAt(frequency)) * Math.LN10) / 20;
  });
  // Cepstrum of the magnitude, then the causal impulse it stands for.
  const period = 2 * bins;
  const cos = Float64Array.from({ length: period }, (_, i) => Math.cos((2 * Math.PI * i) / period));
  const cepstrum = new Float64Array(length);
  for (let n = 0; n < length; n++) {
    let sum = logs[0] + (n % 2 ? -1 : 1) * logs[bins];
    for (let k = 1; k < bins; k++) sum += 2 * logs[k] * cos[(n * k) % period];
    cepstrum[n] = sum / period;
  }
  const impulse = new Float64Array(length);
  impulse[0] = Math.exp(cepstrum[0]);
  for (let n = 1; n < length; n++) {
    let sum = 0;
    for (let k = 1; k <= n; k++) sum += 2 * k * cepstrum[k] * impulse[n - k];
    impulse[n] = sum / n;
  }
  const fade = length / 4;
  for (let n = length - fade; n < length; n++) impulse[n] *= 0.5 - 0.5 * Math.cos((Math.PI * (length - n)) / fade);
  return Float32Array.from(impulse);
}

/** A loop of record surface noise: faint hiss with scattered crackles. */
export function vinylNoise({ sampleRate, seconds, rng = Math.random }) {
  const length = Math.ceil(seconds * sampleRate);
  const data = new Float32Array(length);
  let hiss = 0;
  for (let i = 0; i < length; i++) {
    hiss += 0.25 * (rng() * 2 - 1 - hiss);
    data[i] = hiss * 0.08;
    if (rng() < 0.0004) {
      const amp = (rng() < 0.5 ? -1 : 1) * (0.3 + rng() * 0.7);
      for (let k = 0; k < 6 && i + k < length; k++) data[i + k] += amp * 0.6 ** k;
    }
  }
  return data;
}
