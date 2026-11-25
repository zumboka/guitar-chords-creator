// The guitar of each genre: recorded instruments (see audio/README.md) and their effects.
//
// instrument: folder in audio/. chords: recordings of whole power chords, for strums. takes: the
// guitars, each { pan, offset (s), detune (playback rate), instrument, cabinet, level, amp, sway }; one
// centred take unless listed. All of them play every note, except notes with a `part` (performance.js).
// amp: an amp per take (amp.js), unless the take has its own. sway: vibrato, { rate (Hz), cents }.
// tight: strings stop dead before the next stroke. release: how slowly they stop otherwise (s).
// compress: evens out loud and soft. tone: EQ in Hz and dB, peaks as { freq, gain, q }. chorus: copies
// of the sound with a drifting delay; wobble: the sound itself delayed like that (LoFi tape wow).
// delay: a ping-pong echo; its beats follow the tempo. crackle: level of vinyl noise. level: output
// gain, calibrated so every genre plays at about -19.5 dBFS RMS (measured with renderOffline in
// audio.js). strum: what is different when the chords are strummed.

import { highest, nearest } from './recordings.js';
import { notesOf } from './samples.js';

// Fuzz with scooped mids, for whole chords: little enough gain that their notes stay apart.
const FUZZ = {
  tighten: 120,
  boost: { freq: 900, gain: 3, q: 0.5 },
  between: { highpass: 110, lowpass: 5000 },
  // prettier-ignore
  cabinet: [
    [60, -13], [90, -5], [120, -1.5], [180, -1], [250, -2.5], [400, -6], [630, -11], [1000, -13.5],
    [1500, -11], [2200, -8], [3000, -6], [4000, -6], [5000, -9], [6500, -16], [8500, -26], [11000, -36],
  ],
};

export const SOUNDS = {
  // One guitar close up: neck pickup, a warm clean amp, compression and a little plate reverb; a slow
  // chorus makes the strums lush.
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
    chorus: [{ mix: 0.12, rate: 0.5, depth: 0.0012, pan: 0 }],
    reverb: { mix: 0.1, seconds: 1.3, predelay: 0.012, lowpass: 5000 },
    release: 0.06,
    level: 0.52,
    strum: {
      chorus: [{ mix: 0.35, rate: 0.6, depth: 0.0018, pan: 0.35 }],
      reverb: { mix: 0.18, seconds: 1.6, predelay: 0.015, lowpass: 5000 },
      release: 0.1,
      level: 0.42,
    },
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
    // The same recording again, a little late and detuned on the other side.
    takes: [{ pan: -0.6 }, { pan: 0.6, offset: 0.016, detune: 1.0025 }],
    tone: { highpass: 90, lowpass: 7500 },
    reverb: { mix: 0.08, seconds: 1.2 },
    level: 0.95,
  },
  // Two guitars far apart: bridge pickup, a chiming amp that starts to break up when played hard,
  // echoes that bounce between the sides and a big dark hall. Strums are two performances of the
  // same chords.
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
        drive: [2],
        // prettier-ignore
        cabinet: [
          [60, -4], [120, 1], [250, 2], [400, 0.5], [700, -1], [1100, -2], [1700, -1], [2500, 4.5],
          [3500, 9], [4800, 11], [6000, 8], [8000, -2], [11000, -16],
        ],
      },
      delay: { beats: 0.75, feedback: 0.35, mix: 0.22, lowpass: 3500 },
      reverb: { mix: 0.3, seconds: 3.6, predelay: 0.035, lowpass: 5000 },
      release: 0.16,
      level: 0.33,
    },
  },
  // Two fuzz guitars far apart, swaying as if on the tremolo arm, and between them a bright clean one
  // for the pick attack that fuzz swallows; a little chorus and a big dark hall. Picked notes overlap
  // more than strums, so they get less fuzz.
  shoegaze: {
    instrument: 'strat_bridge',
    takes: [
      { pan: -0.8, cabinet: 6, sway: { rate: 0.9, cents: 15 } },
      { pan: 0.7, cabinet: 7, sway: { rate: 1.15, cents: 15 }, instrument: 'strat_bridge_up', offset: 0.012 },
      {
        instrument: 'strat_neck',
        cabinet: 8,
        amp: {
          tighten: 140,
          drive: [1.2],
          // prettier-ignore
          cabinet: [
            [60, -3.5], [120, 5.5], [200, 7.5], [350, 5.5], [630, 3.5], [1200, 5.5], [2000, 9], [3000, 12.5],
            [4500, 15.5], [6000, 16], [8000, 12.5], [10500, 2.5],
          ],
        },
      },
    ],
    amp: { ...FUZZ, drive: [3.5, 1.9] },
    tone: { highpass: 80, lowpass: 10000 },
    chorus: [
      { mix: 0.25, rate: 0.8, depth: 0.0024, pan: -0.8 },
      { mix: 0.25, rate: 1.1, depth: 0.0019, pan: 0.8 },
    ],
    reverb: { mix: 0.55, seconds: 5, predelay: 0.04, lowpass: 3500 },
    release: 0.15,
    level: 0.225,
    strum: {
      amp: { ...FUZZ, drive: [6, 2.2] },
      release: 0.09,
      level: 0.14,
    },
  },
  metalcore: {
    // Straight from the guitar: whole power chords for the strums, single notes for the arpeggio.
    // Two performances of each chord, a and b; Drop C's lowest ones from c.
    instrument: 'di_guitar',
    chords: {
      ringing: ['power_chord_a', 'power_chord_b', 'power_chord_c'],
      muted: ['palm_mute_a', 'palm_mute_b', 'palm_mute_c'],
    },
    // Two rhythm guitars, hard left and right, each with its own amp and speaker.
    takes: [
      { pan: -1, cabinet: 1 },
      { pan: 1, cabinet: 2 },
    ],
    // Hz and dB; drive is the gain into each clipping stage. The cabinet is fitted to the spectrum of
    // real metal rhythm guitars in Drop C, with the bite of metalcore ones (docs/spec.md).
    amp: {
      tighten: 90,
      boost: { freq: 800, gain: 8, q: 0.5 },
      drive: [38, 14],
      between: { highpass: 110, lowpass: 7000 },
      // prettier-ignore
      cabinet: [
        [50, -11.9], [70, 2.7], [90, 7.2], [115, 5], [140, 0.2], [180, -0.2], [225, -0.1], [280, -0.4],
        [400, -0.5], [560, -2.5], [800, -2.6], [1100, -1.8], [1450, -1.3], [1800, 2.1], [2250, 6.2],
        [2800, 8.9], [3500, 9.7], [4500, 8.1], [5600, 0.5], [7000, -9.5], [9000, -17.5], [12000, -27],
      ],
    },
    tone: { highpass: 60, lowpass: 10000 },
    tight: true,
    reverb: { mix: 0.04, seconds: 0.7 },
    level: 0.062,
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
    amp: sound.amp,
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
  if (midis.length === 1) {
    const { instrument } = sound;
    const neighbour = midi < highest(instrument) ? midi + 1 : midi - 1;
    return [shifted(instrument, midi, midi), shifted(instrument, midi, neighbour)];
  }
  // Every recording of the chord itself, then those of the chords next to it.
  const sets = muted ? sound.chords.muted : sound.chords.ringing;
  const found = [0, 1, -1, 2, -2].flatMap((step) =>
    sets.filter((set) => nearest(set, midi + step) === midi + step).map((set) => shifted(set, midi, midi + step, muted)),
  );
  const [first, second, third, fourth] = found;
  // Chugs take turns, so that each guitar plays four different ones before one comes back.
  return muted ? [first, fourth, second, third] : [first, second];
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
