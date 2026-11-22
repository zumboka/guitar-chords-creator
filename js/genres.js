// What makes each genre sound like itself: progressions, keys, voicing taste, tempo and rhythm.
//
// Progressions are Roman numerals relative to the tonic ("bVI" = the chord on the lowered sixth
// degree), each with a chord quality from theory.js. Lowercase numerals are minor chords.
// Rhythms are in beats of a 4/4 bar; one chord lasts one bar.

const eighths = (vel = 1, off = 0.8) =>
  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((at) => ({ at, dir: 'down', len: 0.46, vel: at % 1 ? off : vel }));

export const GENRES = {
  'neo-soul': {
    name: 'Neo Soul',
    blurb: 'Lush 9ths and 13ths, chromatic turns and a lazy, behind-the-beat groove.',
    tempo: 76,
    swing: 0.1,
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
    strum: {
      spread: 0.018,
      pattern: [
        { at: 0, dir: 'down', len: 1.4, vel: 0.9 },
        { at: 1.5, dir: 'up', len: 0.45, vel: 0.5 },
        { at: 2, dir: 'down', len: 0.9, vel: 0.75 },
        { at: 3, dir: 'down', len: 0.3, vel: 0.45, mute: true },
        { at: 3.5, dir: 'up', len: 0.5, vel: 0.55 },
      ],
    },
    arpeggio: { step: 0.5, sequence: [0, 2, 4, 3, 5, 3, 4, 2], ring: 1.5, vel: 0.8 },
  },

  lofi: {
    name: 'LoFi',
    blurb: 'Mellow sevenths sliding down in steps, warm and a little worn.',
    tempo: 72,
    swing: 0.16,
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
    blurb: 'Ringing add9 and sus chords over open strings that build, shimmer and echo.',
    tempo: 108,
    swing: 0,
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
    strum: {
      spread: 0.014,
      pattern: [
        { at: 0, dir: 'down', len: 2, vel: 0.9 },
        { at: 2, dir: 'down', len: 1, vel: 0.6 },
        { at: 3, dir: 'down', len: 0.5, vel: 0.65 },
        { at: 3.5, dir: 'up', len: 0.5, vel: 0.5 },
      ],
    },
    arpeggio: { step: 0.25, sequence: [0, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2], ring: 1.5, vel: 0.7 },
  },

  shoegaze: {
    name: 'Shoegaze',
    blurb: 'Open strings droning through borrowed chords under a wall of fuzz and reverb.',
    tempo: 92,
    swing: 0,
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
      spread: 0.012,
      pattern: [
        { at: 0, dir: 'down', len: 1, vel: 0.9 },
        { at: 1, dir: 'down', len: 0.5, vel: 0.75 },
        { at: 1.5, dir: 'up', len: 1, vel: 0.6 },
        { at: 2.5, dir: 'up', len: 0.5, vel: 0.6 },
        { at: 3, dir: 'down', len: 0.5, vel: 0.8 },
        { at: 3.5, dir: 'up', len: 0.5, vel: 0.6 },
      ],
    },
    arpeggio: { step: 0.5, sequence: [0, 3, 5, 4, 2, 4, 5, 3], ring: 3, vel: 0.75 },
  },

  metalcore: {
    name: 'Metalcore',
    blurb: 'Minor-key power chords, Phrygian half-steps and palm-muted chugs.',
    tempo: 140,
    swing: 0,
    keys: {
      major: [],
      minor: ['E', 'E', 'E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    },
    templates: [
      { id: 'aeolian-anthem', mode: 'minor', chords: ['i:5', 'bVI:5', 'bIII:5', 'bVII:5'] },
      { id: 'andalusian', mode: 'minor', chords: ['i:5', 'bVII:5', 'bVI:5', 'V:5'] },
      { id: 'phrygian', mode: 'minor', chords: ['i:5', 'bII:5', 'bVII:5', 'bVI:5'] },
      { id: 'minor-cadence', mode: 'minor', chords: ['i:5', 'bVI:5', 'iv:5', 'v:5'] },
      { id: 'epic-rise', mode: 'minor', chords: ['bVI:5', 'bVII:5', 'i:5', 'v:5'] },
      { id: 'minor-loop', mode: 'minor', chords: ['i:5', 'bIII:5', 'bVII:5', 'iv:5'] },
    ],
    voicing: { center: 2, centerWeight: 0.2, open: -0.3, move: 0.3, maxBassString: 1, bassString: 0, bassPenalty: 0.9 },
    strum: {
      spread: 0.004,
      pattern: [
        { at: 0, dir: 'down', len: 1, vel: 1 },
        { at: 1, dir: 'down', len: 0.22, vel: 0.85, mute: true },
        { at: 1.25, dir: 'down', len: 0.22, vel: 0.8, mute: true },
        { at: 1.5, dir: 'down', len: 0.5, vel: 0.95 },
        { at: 2, dir: 'down', len: 1, vel: 1 },
        { at: 3, dir: 'down', len: 0.22, vel: 0.85, mute: true },
        { at: 3.25, dir: 'down', len: 0.22, vel: 0.8, mute: true },
        { at: 3.5, dir: 'down', len: 0.22, vel: 0.85, mute: true },
        { at: 3.75, dir: 'down', len: 0.22, vel: 0.8, mute: true },
      ],
    },
    arpeggio: { step: 0.25, sequence: [0, 2, 5, 2, 0, 2, 5, 2, 0, 2, 5, 2, 0, 5, 2, 5], ring: 0.5, vel: 0.85 },
  },
};

export const GENRE_IDS = Object.keys(GENRES);
