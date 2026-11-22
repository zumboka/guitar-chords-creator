// The guitar of each genre: a recorded instrument (see audio/README.md) and its effects.
//
// instrument: folder in audio/. tone: EQ in Hz / dB.
// chorus / wobble: modulated delays (wobble is LoFi tape wow). delay.beats follows the tempo.
// double: a second take panned to the other side, like a double-tracked rhythm guitar.
// crackle: level of vinyl noise. level: output gain, calibrated so every genre plays at about
// -19.5 dBFS RMS (measured with renderOffline in audio.js).

export const SOUNDS = {
  'neo-soul': {
    instrument: 'electric_guitar_clean',
    tone: { highpass: 70, lowpass: 7000 },
    chorus: { mix: 0.25, rate: 0.6, depth: 0.002 },
    reverb: { mix: 0.22, seconds: 2.2 },
    level: 1.35,
  },
  lofi: {
    instrument: 'electric_guitar_jazz',
    tone: { highpass: 140, lowpass: 2800 },
    wobble: { rate: 0.45, depth: 0.0015 },
    crackle: 0.2,
    reverb: { mix: 0.2, seconds: 1.8 },
    level: 1.85,
  },
  punk: {
    instrument: 'overdriven_guitar',
    tone: { highpass: 90, lowpass: 7500 },
    double: true,
    reverb: { mix: 0.08, seconds: 1.2 },
    level: 0.95,
  },
  'post-rock': {
    instrument: 'electric_guitar_clean',
    tone: { highpass: 80, lowpass: 8000 },
    chorus: { mix: 0.15, rate: 0.3, depth: 0.0015 },
    delay: { beats: 0.75, feedback: 0.4, mix: 0.3 },
    reverb: { mix: 0.4, seconds: 4.5 },
    level: 1.05,
  },
  shoegaze: {
    instrument: 'overdriven_guitar',
    tone: { highpass: 110, lowpass: 5000 },
    chorus: { mix: 0.4, rate: 0.35, depth: 0.004 },
    double: true,
    reverb: { mix: 0.6, seconds: 6 },
    level: 0.65,
  },
  metalcore: {
    instrument: 'distortion_guitar',
    tone: { highpass: 90, lowpass: 8000, mid: { freq: 750, gain: -3 } },
    double: true,
    reverb: { mix: 0.06, seconds: 1 },
    level: 0.95,
  },
};
