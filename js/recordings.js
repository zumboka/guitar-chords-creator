// The recorded notes in audio/ cover MIDI 38 (low D in Drop D) to 78 (F#5, fret 14 on the high
// E string). CENTS_SHARP says how far each recording is from true pitch (positive = sharp),
// measured in the sustain (median at 0.3, 0.6 and 0.9 s after the attack); playback divides it
// out. Index 0 is MIDI 38.

export const SAMPLE_RANGE = { low: 38, high: 78 };

export const CENTS_SHARP = {
  electric_guitar_clean: [
    -5, -8, -9, 4, -2, -5, -3, -1, 1, -6, -4, 1, 1, -4, 3, 0, -4, 13, -2, 3, 1,
    -3, 4, 2, -1, 1, 0, -1, -3, 0, 0, -2, -2, -2, 0, 2, -2, -2, 2, 1, 0,
  ],
  electric_guitar_jazz: [
    2, 3, 5, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2,
    3, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4,
  ],
  overdriven_guitar: [
    4, 4, 4, 4, 6, 5, 5, 5, 4, 0, 0, -1, -1, 1, 1, 2, 2, 5, 6, 4, 4,
    5, 5, 9, 9, 4, 4, 4, 4, 4, 4, 3, 4, 3, 5, 5, 5, 5, 5, 5, 6,
  ],
  distortion_guitar: [
    10, 9, 9, 9, 9, 8, 18, 16, 16, 17, 17, 18, 6, 6, 6, 6, 6, 6, 5, 5, 5,
    7, 7, 7, 8, 9, 8, 2, 2, 2, 0, 0, 0, 1, 1, 0, -1, -1, 0, 2, 2,
  ],
};
