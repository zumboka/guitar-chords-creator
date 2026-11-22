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
