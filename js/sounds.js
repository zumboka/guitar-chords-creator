// The guitar of each genre: recorded instruments (see audio/README.md) and their effects.
//
// instrument: folder in audio/. chords: recordings of whole power chords, for strums. takes: the
// parts playing every note, each { pan, offset (s), detune (playback rate), instrument, cabinet };
// one centred take unless listed. amp: a distortion amp per take (amp.js). tone: EQ in Hz and dB,
// peaks as { freq, gain, q }. chorus / wobble: modulated delays (wobble is LoFi tape wow).
// delay.beats follows the tempo. crackle: level of vinyl noise. level: output gain, calibrated so
// every genre plays at about -19.5 dBFS RMS (measured with renderOffline in audio.js).

import { highest, nearest } from './recordings.js';
import { notesOf } from './samples.js';

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
    // Straight from the guitar: whole power chords for the strums, single notes for the arpeggio.
    instrument: 'di_guitar',
    chords: { ringing: ['power_chord_a', 'power_chord_b'], muted: ['palm_mute_a', 'palm_mute_b'] },
    // Two rhythm guitars, hard left and right, each with its own amp and speaker.
    takes: [
      { pan: -1, cabinet: 1 },
      { pan: 1, cabinet: 2 },
    ],
    // Hz and dB; drive is the gain into each clipping stage. The cabinet is fitted to the spectrum of
    // real metal rhythm guitars (docs/spec.md).
    amp: {
      tighten: 90,
      boost: { freq: 800, gain: 8, q: 0.5 },
      drive: [38, 14],
      between: { highpass: 110, lowpass: 7000 },
      // prettier-ignore
      cabinet: [
        [50, -8], [70, 3.5], [90, 8], [115, 7], [140, 1.5], [180, 0], [225, -1], [280, -3],
        [400, -3.3], [560, -5], [800, -4.8], [1100, -3.8], [1450, -3.3], [1800, -0.7], [2250, 2.6],
        [2800, 5], [3500, 5], [4500, 1.5], [5600, -5], [7000, -13], [9000, -20], [12000, -29],
      ],
    },
    tone: { highpass: 60, lowpass: 10000 },
    reverb: { mix: 0.04, seconds: 0.7 },
    level: 0.074,
  },
};

/** The takes playing every note of a sound, with defaults filled in. */
export function takesOf(sound) {
  return (sound.takes || [{}]).map((take) => ({ pan: 0, offset: 0, detune: 1, instrument: sound.instrument, ...take }));
}

/** A recording played at another pitch: the recorded note and the playback rate for it. */
const shifted = (instrument, midi, recorded, muted = false) => ({
  instrument,
  midi: recorded,
  rate: 2 ** ((midi - recorded) / 12),
  muted,
});

/**
 * The recordings a sound with `chords` can use for a stroke. No two strokes of a real guitar sound
 * the same, so there are several: another performance, or the neighbouring note or chord moved to
 * the right pitch. Two of them half a list apart are never the same performance.
 */
function recordingsFor(sound, { midis, muted }) {
  const [midi] = midis;
  const neighbour = (instrument, note) => (note < highest(instrument) ? note + 1 : note - 1);
  if (midis.length === 1) {
    const { instrument } = sound;
    return [shifted(instrument, midi, midi), shifted(instrument, midi, neighbour(instrument, midi))];
  }
  const [a, b] = muted ? sound.chords.muted : sound.chords.ringing;
  const root = nearest(a, midi);
  if (!muted) return [shifted(a, midi, root), shifted(b, midi, root)];
  const next = neighbour(a, root);
  return [[a, root], [b, next], [b, root], [a, next]].map(([instrument, note]) => shifted(instrument, midi, note, true));
}

/**
 * What each take plays for a stroke (strokesOf in performance.js): a recorded note, its playback
 * rate, and whether the recording is palm-muted itself. `count` numbers the strokes of a kind.
 */
export function voicesFor(sound, stroke, count) {
  const takes = takesOf(sound);
  if (!sound.chords) {
    return takes.map((take) => ({ instrument: take.instrument, midi: stroke.midis[0], rate: take.detune }));
  }
  const recordings = recordingsFor(sound, stroke);
  return takes.map((_, t) => recordings[(count + (t * recordings.length) / takes.length) % recordings.length]);
}

/** Every recording a set of diagrams can need, in one playback mode or both: instrument -> MIDI notes. */
export function recordingsNeeded(sound, fretsList, tuning, mode) {
  const needed = new Map();
  const add = ({ instrument, midi }) => needed.set(instrument, (needed.get(instrument) || new Set()).add(midi));
  const notes = notesOf(fretsList, tuning);
  if (!sound.chords) {
    for (const { instrument } of takesOf(sound)) notes.forEach((midi) => add({ instrument, midi }));
    return needed;
  }
  if (mode !== 'strum') for (const midi of notes) recordingsFor(sound, { midis: [midi] }).forEach(add);
  if (mode !== 'arpeggio') {
    for (const frets of fretsList) {
      const midis = notesOf([frets], tuning);
      for (const muted of [false, true]) recordingsFor(sound, { midis, muted }).forEach(add);
    }
  }
  return needed;
}
