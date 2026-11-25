// The guitar of each genre: recorded instruments (see audio/README.md) and their effects.
//
// instrument: folder in audio/. chords: recordings of whole power chords, for strums. takes: the
// guitars, each { pan, offset (s), detune (playback rate), instrument, cabinet, level }; one centred
// take unless listed. All of them play every note, except notes with a `part` (performance.js). amp: an
// amp per take (amp.js). tight: strings stop dead before the next stroke. release: how slowly they
// stop otherwise (s). compress: evens out loud and soft. tone: EQ in Hz and dB, peaks as { freq,
// gain, q }. chorus / wobble: modulated delays (wobble is LoFi tape wow). delay: a ping-pong echo;
// its beats follow the tempo. crackle: level of vinyl noise. level: output gain, calibrated so every
// genre plays at about -19.5 dBFS RMS (measured with renderOffline in audio.js). strum: what is
// different when the chords are strummed.

import { highest, nearest } from './recordings.js';
import { notesOf } from './samples.js';

// The same recording again, a little late and detuned on the other side.
const DOUBLED = [{ pan: -0.6 }, { pan: 0.6, offset: 0.016, detune: 1.0025 }];

export const SOUNDS = {
  // One guitar close up: neck pickup, a warm clean amp, compression and only a little plate reverb.
  // Strums stay free of effects.
  'neo-soul': {
    instrument: 'strat_neck',
    takes: [{ cabinet: 3 }],
    amp: {
      tighten: 50,
      drive: [1.1],
      // prettier-ignore
      cabinet: [
        [60, 2], [100, 4], [160, 1], [300, 0], [700, -1.5], [1500, 0], [2500, 1.5], [4000, 3],
        [5500, 3], [7000, -3], [10000, -16],
      ],
    },
    compress: { threshold: -24, ratio: 3, attack: 0.03, release: 0.18 },
    tone: { highpass: 60, lowpass: 9000 },
    chorus: { mix: 0.12, rate: 0.5, depth: 0.0012, pan: 0 },
    reverb: { mix: 0.1, seconds: 1.3, predelay: 0.012, lowpass: 5000 },
    release: 0.06,
    level: 0.52,
    strum: { chorus: null, release: 0.1, level: 0.42 },
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
  // Two guitars far apart: bridge pickup and a chiming amp on the edge of breaking up. Arpeggios echo
  // through a big dark hall; strums are two performances of the same chords in a small room.
  'post-rock': {
    instrument: 'strat_bridge',
    takes: [
      { pan: -0.5, cabinet: 4 },
      { pan: 0.6, cabinet: 5, level: 1.6 },
    ],
    amp: {
      tighten: 90,
      drive: [1.6],
      // prettier-ignore
      cabinet: [
        [60, 0], [120, 3], [250, 4], [400, 2], [700, 0], [1100, -3], [1700, -2], [2500, 2],
        [3500, 6], [4800, 9], [6000, 6], [8000, -3], [11000, -18],
      ],
    },
    tone: { highpass: 90, lowpass: 10000 },
    delay: { beats: 0.75, feedback: 0.42, mix: 0.3, lowpass: 3500 },
    reverb: { mix: 0.32, seconds: 4.8, predelay: 0.04, lowpass: 4500 },
    release: 0.2,
    level: 0.56,
    strum: {
      takes: [
        { pan: -0.55, cabinet: 4 },
        { pan: 0.55, cabinet: 5, instrument: 'strat_bridge_up', offset: 0.012 },
      ],
      amp: {
        tighten: 110,
        drive: [1.4],
        // prettier-ignore
        cabinet: [
          [60, -4], [120, 1], [250, 2], [400, 0.5], [700, -1], [1100, -2], [1700, -1], [2500, 4.5],
          [3500, 9], [4800, 11], [6000, 8], [8000, -2], [11000, -16],
        ],
      },
      delay: null,
      reverb: { mix: 0.15, seconds: 2, predelay: 0.015, lowpass: 4500 },
      release: 0.12,
      level: 0.34,
    },
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
    tight: true,
    reverb: { mix: 0.04, seconds: 0.7 },
    level: 0.074,
  },
};

/** How a genre sounds in a playback mode ('strum' or 'arpeggio'). */
export function soundFor(genreId, mode) {
  const { strum, ...sound } = SOUNDS[genreId];
  return mode === 'strum' ? { ...sound, ...strum } : sound;
}

/** The takes playing every note of a sound, with defaults filled in. */
export function takesOf(sound) {
  return (sound.takes || [{}]).map((take) => ({
    pan: 0,
    offset: 0,
    detune: 1,
    level: 1,
    instrument: sound.instrument,
    ...take,
  }));
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

/** Every recording a set of diagrams needs in a genre's playback mode: instrument -> MIDI notes. */
export function recordingsNeeded(genreId, mode, fretsList, tuning) {
  const sound = soundFor(genreId, mode);
  const needed = new Map();
  const add = ({ instrument, midi }) => needed.set(instrument, (needed.get(instrument) || new Set()).add(midi));
  const notes = notesOf(fretsList, tuning);
  if (!sound.chords) {
    for (const { instrument } of takesOf(sound)) notes.forEach((midi) => add({ instrument, midi }));
    return needed;
  }
  if (mode === 'arpeggio') {
    for (const midi of notes) recordingsFor(sound, { midis: [midi] }).forEach(add);
  } else {
    for (const frets of fretsList) {
      const midis = notesOf([frets], tuning);
      for (const muted of [false, true]) recordingsFor(sound, { midis, muted }).forEach(add);
    }
  }
  return needed;
}
