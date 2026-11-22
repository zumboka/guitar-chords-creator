// The guitar tone of each genre. All sound is synthesised: plucked strings (see dsp.js) run
// through amp-style drive, EQ, chorus, delay and reverb.
//
// brightness / sustain shape the plucked string; seconds is how long each note is rendered.
// drive: distortion amount (and asymmetry for fuzz). tone: EQ in Hz / dB.
// chorus / wobble: modulated delays (wobble is LoFi tape wow). delay.beats follows the tempo.
// double: two takes panned left and right, like a double-tracked rhythm guitar.
// crackle: level of vinyl noise. level: output gain, calibrated so every genre plays at about
// -19.5 dBFS RMS (measured with renderOffline in audio.js).

export const SOUNDS = {
  'neo-soul': {
    brightness: 0.42,
    sustain: 3.2,
    seconds: 4,
    tone: { highpass: 70, lowpass: 4200, mid: { freq: 900, gain: -2 } },
    chorus: { mix: 0.3, rate: 0.7, depth: 0.0025 },
    reverb: { mix: 0.25, seconds: 2.2 },
    level: 2.2,
  },
  lofi: {
    brightness: 0.28,
    sustain: 2.6,
    seconds: 4,
    tone: { highpass: 150, lowpass: 2300 },
    wobble: { rate: 0.45, depth: 0.0018 },
    crackle: 0.2,
    reverb: { mix: 0.22, seconds: 1.8 },
    level: 2.45,
  },
  punk: {
    brightness: 0.85,
    sustain: 2,
    seconds: 2.5,
    drive: { amount: 7, asymmetry: 0.1 },
    tone: { highpass: 90, lowpass: 4800, mid: { freq: 1400, gain: 3 } },
    double: true,
    reverb: { mix: 0.08, seconds: 1.2 },
    level: 0.24,
  },
  'post-rock': {
    brightness: 0.6,
    sustain: 4.5,
    seconds: 5,
    tone: { highpass: 80, lowpass: 6500 },
    chorus: { mix: 0.15, rate: 0.3, depth: 0.002 },
    delay: { beats: 0.75, feedback: 0.45, mix: 0.35 },
    reverb: { mix: 0.45, seconds: 4.5 },
    level: 1.3,
  },
  shoegaze: {
    brightness: 0.7,
    sustain: 4.5,
    seconds: 5,
    drive: { amount: 14, asymmetry: 0.3 },
    tone: { highpass: 110, lowpass: 3600 },
    chorus: { mix: 0.5, rate: 0.35, depth: 0.0055 },
    double: true,
    reverb: { mix: 0.65, seconds: 6 },
    level: 0.155,
  },
  metalcore: {
    brightness: 0.95,
    sustain: 2.2,
    seconds: 2.5,
    drive: { amount: 30, asymmetry: 0.05 },
    tone: { highpass: 100, lowpass: 5200, mid: { freq: 750, gain: -6 } },
    double: true,
    reverb: { mix: 0.07, seconds: 1 },
    level: 0.13,
  },
};
