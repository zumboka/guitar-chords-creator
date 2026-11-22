// The guitar of each genre: recorded instruments (see audio/README.md) and their effects.
//
// instrument: folder in audio/. takes: the parts playing every note, each { pan, offset (s),
// detune (playback rate), instrument }; one centred take unless listed. tone: EQ in Hz and dB,
// peaks as { freq, gain, q }. palmMute: cutoff (Hz) for palm-muted notes.
// chorus / wobble: modulated delays (wobble is LoFi tape wow). delay.beats follows the tempo.
// crackle: level of vinyl noise. level: output gain, calibrated so every genre plays at about
// -19.5 dBFS RMS (measured with renderOffline in audio.js).

// The same recording again, a little late and detuned on the other side.
const DOUBLED = [{ pan: -0.6 }, { pan: 0.6, offset: 0.016, detune: 1.0025 }];

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
    takes: DOUBLED,
    tone: { highpass: 90, lowpass: 7500 },
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
    takes: DOUBLED,
    tone: { highpass: 110, lowpass: 5000 },
    chorus: { mix: 0.4, rate: 0.35, depth: 0.004 },
    reverb: { mix: 0.6, seconds: 6 },
    level: 0.65,
  },
  metalcore: {
    instrument: 'distortion_guitar',
    // Two different amps hard left and right: the width of double-tracked rhythm guitars without
    // the hollow, phasey sound of a copied take.
    takes: [{ pan: -0.85 }, { pan: 0.85, offset: 0.007, instrument: 'overdriven_guitar' }],
    // Tight lows with a thump at 110 Hz, scooped mids, some presence, and the fizz cut.
    tone: {
      highpass: 60,
      lowpass: 6000,
      peaks: [
        { freq: 110, gain: 3, q: 1 },
        { freq: 650, gain: -4, q: 0.9 },
        { freq: 2800, gain: 2, q: 1 },
      ],
    },
    palmMute: 1300,
    reverb: { mix: 0.05, seconds: 0.9 },
    level: 0.79,
  },
};

/** The takes playing every note of a sound, with defaults filled in. */
export function takesOf(sound) {
  return (sound.takes || [{}]).map((take) => ({ pan: 0, offset: 0, detune: 1, instrument: sound.instrument, ...take }));
}

export const instrumentsOf = (sound) => [...new Set(takesOf(sound).map((take) => take.instrument))];
