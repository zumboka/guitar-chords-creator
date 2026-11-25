// What makes each genre sound like itself: progressions, keys, voicing taste, tempo and rhythm.
//
// Progressions are Roman numerals relative to the tonic ("bVI" = the chord on the lowered sixth
// degree), each with a chord quality from theory.js. Lowercase numerals are minor chords.
// Rhythms are in beats of a 4/4 bar; one chord lasts one bar. A strum hits every string of the
// shape, an upstroke the top four, each `spread` seconds after the last; a `slap` deadens them all.
// A `fill` replaces the pattern in the last bar. Arpeggios are written for six voices (0 = lowest);
// those in `mutes` are palm-muted, 'x' is a slap. `part` says which guitar picks them (the takes in
// sounds.js), `swells` adds a second one fading in the chord. `build` grows louder from that level
// to full over the four bars. `tuning` names an entry of TUNINGS in theory.js.

const eighths = (vel = 1, off = 0.8) =>
  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((at) => ({ at, dir: 'down', len: 0.46, vel: at % 1 ? off : vel }));

/**
 * A bar of sixteenths: X = the whole chord, m = palm-muted chug, - = keep ringing. Every stroke
 * rings until the next one, so there are no gaps.
 */
const riff = (steps) =>
  [...steps].flatMap((step, i) => {
    if (step === '-') return [];
    const next = [...steps].findIndex((s, k) => k > i && s !== '-');
    const len = ((next < 0 ? steps.length : next) - i) / 4;
    return [{ at: i / 4, dir: 'down', len, vel: step === 'X' ? 1 : 0.9, mute: step === 'm' }];
  });

export const GENRES = {
  'neo-soul': {
    name: 'Neo Soul',
    blurb: 'Lush 9ths and 13ths, chromatic turns and a lazy groove with slaps on the backbeat.',
    tempo: 76,
    swing: 0.1,
    tuning: 'standard',
    keys: {
      major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'G', 'Ab', 'A', 'Bb'],
      minor: ['A', 'B', 'C', 'C#', 'D', 'E', 'F', 'F#', 'G'],
    },
    templates: [
      { id: 'two-five-one-six', mode: 'major', chords: ['ii:m9', 'V:13', 'I:maj9', 'vi:m9'] },
      { id: 'two-of-us', mode: 'major', chords: ['IV:maj9', 'III:7#9', 'vi:m9', 'v:m7'] },
      { id: 'minor-plagal', mode: 'major', chords: ['IV:maj7', 'iv:m7', 'iii:m7', 'vi:m9'] },
      { id: 'tritone-sub', mode: 'major', chords: ['ii:m9', 'bII:9', 'I:maj9', 'vi:m9'] },
      { id: 'one-six-two-five', mode: 'major', chords: ['I:maj9', 'vi:m9', 'ii:m11', 'V:13'] },
      { id: 'royal-road', mode: 'major', chords: ['IV:maj9', 'V:13', 'iii:m7', 'vi:m9'] },
      { id: 'minor-turnaround', mode: 'minor', chords: ['i:m9', 'iv:m9', 'bVII:13', 'bIII:maj9'] },
      { id: 'dorian-vamp', mode: 'minor', chords: ['i:m11', 'IV:13', 'bVI:maj7', 'V:7#9'] },
    ],
    voicing: { center: 5, centerWeight: 0.12, open: 0.45, move: 0.45 },
    // Rolled chords on 1 and 3, stopped by a slap on the backbeat, and a light, swung upstroke
    // leading into the next one.
    strum: {
      spread: 0.009,
      pattern: [
        { at: 0, dir: 'down', len: 1, vel: 0.95, spread: 0.022 },
        { at: 1, slap: true, vel: 0.5 },
        { at: 1.5, dir: 'up', len: 0.4, vel: 0.65 },
        { at: 2, dir: 'down', len: 1, vel: 0.85, spread: 0.022 },
        { at: 3, slap: true, vel: 0.55 },
        { at: 3.5, dir: 'up', len: 0.45, vel: 0.65 },
      ],
    },
    arpeggio: { step: 0.5, sequence: [0, 3, 'x', 4, 1, 5, 'x', 3], ring: 0.9, vel: 0.85 },
  },

  lofi: {
    name: 'LoFi',
    blurb: 'Mellow sevenths sliding down in steps, warm and a little worn.',
    tempo: 72,
    swing: 0.16,
    tuning: 'standard',
    keys: {
      major: ['C', 'D', 'Eb', 'E', 'F', 'G', 'A', 'Bb'],
      minor: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'],
    },
    templates: [
      { id: 'step-down', mode: 'major', chords: ['IV:maj7', 'iii:m7', 'ii:m7', 'I:maj7'] },
      { id: 'two-five-one-six', mode: 'major', chords: ['ii:m7', 'V:7', 'I:maj7', 'vi:m7'] },
      { id: 'one-six-two-five', mode: 'major', chords: ['I:maj7', 'vi:m7', 'ii:m7', 'V:7'] },
      { id: 'borrowed-four', mode: 'major', chords: ['IV:maj7', 'iv:m7', 'iii:m7', 'vi:m7'] },
      { id: 'one-three-four', mode: 'major', chords: ['I:maj7', 'iii:m7', 'IV:maj7', 'iv:m6'] },
      { id: 'ninths', mode: 'major', chords: ['ii:m9', 'V:9', 'I:maj9', 'IV:maj7'] },
      { id: 'minor-circle', mode: 'minor', chords: ['i:m7', 'iv:m7', 'bVII:7', 'bIII:maj7'] },
      { id: 'minor-drift', mode: 'minor', chords: ['i:m9', 'bVI:maj7', 'iv:m7', 'v:m7'] },
    ],
    voicing: { center: 4, centerWeight: 0.12, open: 0.25, move: 0.45 },
    strum: {
      spread: 0.03,
      pattern: [
        { at: 0, dir: 'down', len: 2.4, vel: 0.85 },
        { at: 2.5, dir: 'up', len: 1.5, vel: 0.55 },
      ],
    },
    arpeggio: { step: 0.5, sequence: [0, 3, 4, 2, 5, 3, 4, 1], ring: 2, vel: 0.8 },
  },

  punk: {
    name: 'Punk',
    blurb: 'Power chords, three-chord-trick energy and relentless downstrokes.',
    tempo: 168,
    swing: 0,
    tuning: 'standard',
    keys: {
      major: ['E', 'A', 'D', 'G', 'C', 'B', 'F'],
      minor: ['A', 'E', 'B', 'D', 'F#'],
    },
    templates: [
      { id: 'axis', mode: 'major', chords: ['I:5', 'V:5', 'vi:5', 'IV:5'] },
      { id: 'axis-from-six', mode: 'major', chords: ['vi:5', 'IV:5', 'I:5', 'V:5'] },
      { id: 'fifties', mode: 'major', chords: ['I:5', 'vi:5', 'IV:5', 'V:5'] },
      { id: 'one-four-six-five', mode: 'major', chords: ['I:5', 'IV:5', 'vi:5', 'V:5'] },
      { id: 'flat-three', mode: 'major', chords: ['I:5', 'bIII:5', 'IV:5', 'V:5'] },
      { id: 'flat-seven', mode: 'major', chords: ['I:5', 'bVII:5', 'IV:5', 'V:5'] },
      { id: 'minor-anthem', mode: 'minor', chords: ['i:5', 'bVI:5', 'bIII:5', 'bVII:5'] },
      { id: 'minor-descent', mode: 'minor', chords: ['i:5', 'bVII:5', 'bVI:5', 'bIII:5'] },
    ],
    voicing: { center: 4, centerWeight: 0.1, open: -0.2, move: 0.3, maxBassString: 1 },
    strum: { spread: 0.006, pattern: eighths() },
    arpeggio: { step: 0.5, sequence: [0, 2, 5, 2, 0, 2, 5, 2], ring: 0.5, vel: 0.9 },
  },

  'post-rock': {
    name: 'Post Rock',
    blurb: 'Open-string add9 and sus chords that echo through a wide hall and build from quiet to loud.',
    tempo: 108,
    swing: 0,
    tuning: 'standard',
    keys: {
      major: ['G', 'D', 'A', 'E', 'C'],
      minor: ['E', 'B', 'A'],
    },
    templates: [
      { id: 'open-four', mode: 'major', chords: ['I:maj7', 'vi:madd9', 'IV:add9', 'V:sus4'] },
      { id: 'six-four-one-five', mode: 'major', chords: ['vi:m7', 'IV:maj7', 'I:add9', 'V:sus4'] },
      { id: 'lydian-lift', mode: 'major', chords: ['I:maj7', 'II:add9', 'vi:m7', 'IV:maj7'] },
      { id: 'four-one-five-six', mode: 'major', chords: ['IV:maj7', 'I:add9', 'V:sus2', 'vi:m7'] },
      { id: 'minor-swell', mode: 'minor', chords: ['i:madd9', 'bVI:maj7', 'bIII:add9', 'bVII:6'] },
      { id: 'minor-climb', mode: 'minor', chords: ['i:m7', 'bVI:maj7', 'bIII:add9', 'bVII:sus2'] },
    ],
    voicing: { center: 2, centerWeight: 0.08, open: -0.45, openTop: -0.4, move: 0.1, variety: 0.6 },
    // Slow strums that leave room for the echo, growing from quiet to loud; the last bar drives on
    // in eighths.
    strum: {
      spread: 0.012,
      build: 0.5,
      pattern: [
        { at: 0, dir: 'down', len: 2, vel: 0.95 },
        { at: 2, dir: 'down', len: 1, vel: 0.75 },
        { at: 3, dir: 'down', len: 1, vel: 0.7 },
        { at: 3.5, dir: 'up', len: 0.5, vel: 0.5 },
      ],
      fill: [
        { at: 0, dir: 'down', len: 1, vel: 0.95 },
        { at: 1, dir: 'down', len: 1, vel: 0.75 },
        { at: 1.5, dir: 'up', len: 0.5, vel: 0.6 },
        { at: 2, dir: 'down', len: 1, vel: 0.85 },
        { at: 2.5, dir: 'up', len: 0.5, vel: 0.65 },
        { at: 3, dir: 'down', len: 1, vel: 0.9 },
        { at: 3.5, dir: 'up', len: 0.5, vel: 0.7 },
      ],
    },
    // Ringing eighths that the echo fills in, over chords faded in like a violin.
    arpeggio: {
      step: 0.5,
      sequence: [0, 2, 3, 4, 5, 4, 3, 2],
      ring: 4,
      vel: 0.85,
      part: 0,
      swells: { part: 1, vel: 0.42, attack: 2 },
      build: 0.45,
    },
  },

  shoegaze: {
    name: 'Shoegaze',
    blurb: 'Open strings droning through borrowed chords under a wall of fuzz and reverb.',
    tempo: 92,
    swing: 0,
    tuning: 'standard',
    keys: {
      major: ['E', 'A', 'D', 'G'],
      minor: ['E', 'A', 'B'],
    },
    templates: [
      { id: 'drone-mixture', mode: 'major', chords: ['I:maj7', 'bVI:maj7', 'IV:add9', 'iv:madd9'] },
      { id: 'flat-seven-mixture', mode: 'major', chords: ['I:add9', 'bVII:6', 'IV:add9', 'iv:m6'] },
      { id: 'mixolydian-haze', mode: 'major', chords: ['I:maj7', 'v:m7', 'IV:maj7', 'iv:m6'] },
      { id: 'mediant-drift', mode: 'major', chords: ['I:add9', 'iii:m7', 'bVI:maj7', 'IV:add9'] },
      { id: 'dorian-glow', mode: 'minor', chords: ['i:madd9', 'bVI:maj7', 'bIII:6', 'IV:add9'] },
    ],
    voicing: { center: 2, centerWeight: 0.08, open: -0.5, openTop: -0.6, move: 0.08, variety: 0.4 },
    strum: {
      spread: 0.009,
      // Every string drones until it is hit again.
      pattern: [
        { at: 0, dir: 'down', len: 4, vel: 0.9 },
        { at: 1, dir: 'down', len: 4, vel: 0.75 },
        { at: 1.5, dir: 'up', len: 4, vel: 0.6 },
        { at: 2.5, dir: 'up', len: 4, vel: 0.6 },
        { at: 3, dir: 'down', len: 4, vel: 0.8 },
        { at: 3.5, dir: 'up', len: 4, vel: 0.6 },
      ],
    },
    arpeggio: { step: 0.5, sequence: [0, 3, 5, 4, 2, 4, 5, 3], ring: 3, vel: 0.75 },
  },

  metalcore: {
    name: 'Metalcore',
    blurb: 'Two high-gain guitars in Drop C: anthemic minor progressions, palm-muted chugs and ringing accents.',
    tempo: 140,
    swing: 0,
    // Every string a tone lower and the low one two: one-finger power chords and an open low C.
    tuning: 'dropC',
    keys: {
      major: [],
      // Mostly C minor, the key of the open low string.
      minor: ['C', 'C', 'C', 'D', 'F', 'G'],
    },
    // As in metalcore songs (docs/spec.md): the VI-VII-i of the choruses, the minor v, Phrygian half-steps.
    templates: [
      { id: 'six-seven-one-three', mode: 'minor', chords: ['bVI:5', 'bVII:5', 'i:5', 'bIII:5'] },
      { id: 'one-five-six-seven', mode: 'minor', chords: ['i:5', 'v:5', 'bVI:5', 'bVII:5'] },
      { id: 'one-six-three-five', mode: 'minor', chords: ['i:5', 'bVI:5', 'bIII:5', 'v:5'] },
      { id: 'six-four-one-three', mode: 'minor', chords: ['bVI:5', 'iv:5', 'i:5', 'bIII:5'] },
      { id: 'one-seven-six-five', mode: 'minor', chords: ['i:5', 'bVII:5', 'bVI:5', 'V:5'] },
      { id: 'phrygian', mode: 'minor', chords: ['i:5', 'bII:5', 'bVII:5', 'bVI:5'] },
    ],
    // One-finger shapes anywhere on the neck, C5 on the open strings.
    voicing: { center: 5, centerWeight: 0.05, open: -0.3, move: 0.05 },
    // Chugs in groups of four, three and two, each opened by a ringing accent, as in Killswitch Engage's
    // verse riffs; the last bar rings in eighths like a chorus and chugs its way back to the first.
    strum: { spread: 0, pattern: riff('Xmmm--Xmm--Xm-X-'), fill: riff('X-X-X-X-X-X-mmmm') },
    arpeggio: { step: 0.25, sequence: [0, 2, 5, 0, 2, 5, 0, 2, 5, 0, 2, 5, 0, 2, 5, 2], ring: 0.25, vel: 0.9, mutes: [0] },
  },
};

export const GENRE_IDS = Object.keys(GENRES);
