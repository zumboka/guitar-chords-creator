// The recorded instruments in audio/. One file per note, or per root for the power chords, from
// MIDI note `low` upwards. `cents` says how far each recording is from true pitch (positive =
// sharp), measured in the sustain; playback divides it out.

export const RECORDINGS = {
  // Covers every note a chord shape can sound: 38 (low D in Drop D) to 78 (fret 14 on high E).
  electric_guitar_clean: {
    type: 'mp3',
    low: 38,
    cents: [
      -5, -8, -9, 4, -2, -5, -3, -1, 1, -6, -4, 1, 1, -4, 3, 0, -4, 13, -2, 3, 1,
      -3, 4, 2, -1, 1, 0, -1, -3, 0, 0, -2, -2, -2, 0, 2, -2, -2, 2, 1, 0,
    ],
  },
  electric_guitar_jazz: {
    type: 'mp3',
    low: 38,
    cents: [
      2, 3, 5, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2,
      3, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4,
    ],
  },
  overdriven_guitar: {
    type: 'mp3',
    low: 38,
    cents: [
      4, 4, 4, 4, 6, 5, 5, 5, 4, 0, 0, -1, -1, 1, 1, 2, 2, 5, 6, 4, 4,
      5, 5, 9, 9, 4, 4, 4, 4, 4, 4, 3, 4, 3, 5, 5, 5, 5, 5, 5, 6,
    ],
  },
  // Straight from the guitar, without an amp (amp.js adds it). Two performances, a and b, of each
  // power chord (root, fifth and octave), ringing and palm-muted, on the roots 40 (E) to 51 (D#).
  power_chord_a: { type: 'flac', low: 40, cents: [-3, -6, -4, -5, -6, -2, -3, -2, -2, -2, -3, -1] },
  power_chord_b: { type: 'flac', low: 40, cents: [-4, -7, -2, -3, -5, -3, -1, -2, -2, -2, -4, -2] },
  palm_mute_a: { type: 'flac', low: 40, cents: [-5, -5, -4, -7, -6, -2, -3, -6, -3, -4, -2, 1] },
  palm_mute_b: { type: 'flac', low: 40, cents: [-3, -5, -3, -8, -3, -1, -4, -4, -4, -2, -2, 0] },
  // Single notes, 38 (low D) to 71.
  di_guitar: {
    type: 'flac',
    low: 38,
    cents: [
      -5, -8, -6, 7, 8, 4, 3, 3, 6, 5, 1, -2, -2, 6, 5, 8, 8,
      7, 5, 5, 3, 2, -3, -1, -2, -3, -3, -3, -4, -5, -5, -6, -7, -7,
    ],
  },
};

export const highest = (instrument) => RECORDINGS[instrument].low + RECORDINGS[instrument].cents.length - 1;

/** The recorded note closest to `midi`. */
export const nearest = (instrument, midi) =>
  Math.min(highest(instrument), Math.max(RECORDINGS[instrument].low, midi));

export const centsOf = (instrument, midi) => RECORDINGS[instrument].cents[midi - RECORDINGS[instrument].low];
