// The recorded instruments in audio/. One file per note, from MIDI note `low` upwards. `cents`
// says how far each recording is from true pitch (positive = sharp), measured in the sustain;
// playback divides it out.

export const RECORDINGS = {
  // A Stratocaster without an amp (amp.js adds it): the neck pickup in mid-neck positions, and the
  // bridge pickup with open strings wherever there is one and, as a second performance, further up
  // the neck. 40 (low E) to 78 (fret 14 on high E).
  strat_neck: {
    type: 'flac',
    low: 40,
    cents: [
      9, 13, 18, 13, 13, 10, 9, 9, 6, 10, 8, 6, 10, 8, 8, 7, 6, 10, 12, 6,
      13, 9, 9, 9, 9, 6, 7, 10, 7, 3, 4, 5, 8, -1, 3, 5, 5, 2, 6,
    ],
  },
  strat_bridge: {
    type: 'flac',
    low: 40,
    cents: [
      8, 8, 8, 10, 6, 4, 10, 10, 9, 7, 8, 11, 11, 10, 10, 5, 13, 10, 15, 3,
      9, 5, 5, 6, 1, 6, 5, 5, 5, 4, 4, 4, 4, 3, -1, 2, 3, 0, 5,
    ],
  },
  strat_bridge_up: {
    type: 'flac',
    low: 40,
    cents: [
      4, 10, 11, 7, 9, 8, 8, 9, 9, 14, 4, 6, 6, 8, 4, 9, 9, 12, 9, 9,
      10, 8, 7, 6, 4, 5, 4, 4, 2, 3, 1, -2, 4, 1, 3, 1, 4, 2, -1,
    ],
  },
  // From a soundfont. Covers every note a chord shape can sound in any tuning, 38 (low D) to 78.
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
  // Also recorded without an amp, for Metalcore: single notes of a seven-string guitar, 36 (low C)
  // to 76 (fret 14 on Drop C's top string).
  di_guitar: {
    type: 'flac',
    low: 36,
    cents: [
      -9, -2, -5, -8, -6, 7, 8, 4, 3, 3, 6, 5, 1, -2, -2, 6, 5, 8, 8, 7, 5,
      5, 3, 2, -3, -1, -2, -3, -3, -3, -4, -5, -5, -6, -7, -7, -4, -7, -6, -5, -6,
    ],
  },
};

export const highest = (instrument) => RECORDINGS[instrument].low + RECORDINGS[instrument].cents.length - 1;

export const centsOf = (instrument, midi) => RECORDINGS[instrument].cents[midi - RECORDINGS[instrument].low];
