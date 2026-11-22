// Sound building blocks as plain arrays, so they can be tested outside the browser.

export const midiToFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

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

/**
 * A plucked string (Karplus-Strong): a burst of noise circulating in a delay line one period
 * long, losing a little energy and high end on every pass.
 * The delay line has a whole number of samples, so the pitch lands near, not on, the target;
 * the returned `frequency` is the exact pitch, to be corrected with the playback rate.
 * @param brightness 0..1, how hard and bright the pick is.
 * @param sustain seconds until the string has died away by 60 dB.
 */
export function pluck({ frequency, sampleRate, seconds, brightness = 0.5, sustain = 3, rng = Math.random }) {
  const period = Math.max(2, Math.round(sampleRate / frequency - 0.5));
  const length = Math.max(period * 2, Math.ceil(seconds * sampleRate));
  const data = new Float32Array(length);

  const smoothing = 0.12 + 0.86 * brightness;
  let y = 0;
  let mean = 0;
  for (let i = 0; i < period; i++) {
    y += smoothing * (rng() * 2 - 1 - y);
    data[i] = y;
    mean += y;
  }
  mean /= period;
  for (let i = 0; i < period; i++) data[i] -= mean;

  // The two-point average in the loop adds half a sample of delay.
  const actual = sampleRate / (period + 0.5);
  const loss = 0.001 ** (1 / (sustain * actual));
  for (let i = period; i < length; i++) {
    data[i] = loss * 0.5 * (data[i - period] + (i > period ? data[i - period - 1] : 0));
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 0) for (let i = 0; i < length; i++) data[i] /= peak;
  return { data, frequency: actual };
}

/**
 * Distortion transfer curve for a WaveShaper: tanh saturation, `amount` is the drive.
 * `asymmetry` (0..0.4) bends the curve unevenly, adding the even harmonics of a fuzz pedal.
 */
export function driveCurve(amount, asymmetry = 0, size = 4096) {
  const curve = new Float32Array(size);
  const norm = Math.tanh(amount * (1 + asymmetry));
  for (let i = 0; i < size; i++) {
    const x = (i / (size - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * (x + asymmetry * x * x)) / norm;
  }
  return curve;
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
