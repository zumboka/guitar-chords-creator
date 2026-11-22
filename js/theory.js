// Notes, keys, Roman numerals and chord qualities.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/** Standard tuning (E A D G B E), low string first, as MIDI note numbers. */
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64];

export const mod = (n, m) => ((n % m) + m) % m;

/**
 * Chord qualities. `intervals` are every tone the chord may contain (semitones above the root);
 * `required` are the tones a voicing must contain to deserve the name (the 5th and some
 * extensions may be left out). `figure` is the suffix after a Roman numeral, whose case
 * already says major or minor.
 */
export const QUALITIES = {
  '5': { symbol: '5', figure: '5', intervals: [0, 7], required: [0, 7] },
  maj: { symbol: '', figure: '', intervals: [0, 4, 7], required: [0, 4, 7] },
  m: { symbol: 'm', figure: '', intervals: [0, 3, 7], required: [0, 3, 7], minor: true },
  6: { symbol: '6', figure: '6', intervals: [0, 4, 7, 9], required: [0, 4, 9] },
  m6: { symbol: 'm6', figure: '6', intervals: [0, 3, 7, 9], required: [0, 3, 9], minor: true },
  7: { symbol: '7', figure: '7', intervals: [0, 4, 7, 10], required: [0, 4, 10] },
  maj7: { symbol: 'maj7', figure: 'maj7', intervals: [0, 4, 7, 11], required: [0, 4, 11] },
  m7: { symbol: 'm7', figure: '7', intervals: [0, 3, 7, 10], required: [0, 3, 10], minor: true },
  '7sus4': { symbol: '7sus4', figure: '7sus4', intervals: [0, 5, 7, 10], required: [0, 5, 10] },
  9: { symbol: '9', figure: '9', intervals: [0, 4, 7, 10, 2], required: [0, 4, 10, 2] },
  maj9: { symbol: 'maj9', figure: 'maj9', intervals: [0, 4, 7, 11, 2], required: [0, 4, 11, 2] },
  m9: { symbol: 'm9', figure: '9', intervals: [0, 3, 7, 10, 2], required: [0, 3, 10, 2], minor: true },
  m11: { symbol: 'm11', figure: '11', intervals: [0, 3, 7, 10, 2, 5], required: [0, 3, 10, 5], minor: true },
  13: { symbol: '13', figure: '13', intervals: [0, 4, 7, 10, 2, 9], required: [0, 4, 10, 9] },
  '7#9': { symbol: '7#9', figure: '7#9', intervals: [0, 4, 7, 10, 3], required: [0, 4, 10, 3] },
  add9: { symbol: 'add9', figure: 'add9', intervals: [0, 4, 7, 2], required: [0, 4, 2] },
  madd9: { symbol: 'm(add9)', figure: '(add9)', intervals: [0, 3, 7, 2], required: [0, 3, 2], minor: true },
  sus2: { symbol: 'sus2', figure: 'sus2', intervals: [0, 2, 7], required: [0, 2, 7] },
  sus4: { symbol: 'sus4', figure: 'sus4', intervals: [0, 5, 7], required: [0, 5, 7] },
};

export function parseNote(name) {
  const m = /^([A-G])(#{1,2}|b{1,2})?$/.exec(name);
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const letter = LETTERS.indexOf(m[1]);
  const accidental = !m[2] ? 0 : m[2][0] === '#' ? m[2].length : -m[2].length;
  return { letter, accidental, pc: mod(LETTER_PC[letter] + accidental, 12) };
}

export function noteName(letter, accidental) {
  return LETTERS[letter] + (accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental));
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Parses a template chord such as "bVI:maj7" or "ii:m9". */
export function parseRoman(symbol) {
  const m = /^(b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i):(.+)$/.exec(symbol);
  if (!m || !QUALITIES[m[3]]) throw new Error(`Invalid Roman numeral chord: ${symbol}`);
  return {
    accidental: m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0,
    degree: NUMERALS.indexOf(m[2].toUpperCase()),
    numeral: m[2],
    lowercase: m[2] === m[2].toLowerCase(),
    quality: m[3],
  };
}

/** Root note of a scale degree in a key, spelled with the letter that degree calls for. */
export function spellDegree(key, degree, accidental = 0) {
  const tonic = parseNote(key.tonic);
  const letter = (tonic.letter + degree) % 7;
  const pc = mod(tonic.pc + MAJOR_STEPS[degree] + accidental, 12);
  let acc = mod(pc - LETTER_PC[letter], 12);
  if (acc > 6) acc -= 12;
  return { name: noteName(letter, acc), pc, accidental: acc };
}

/** Builds a chord from a Roman numeral template symbol in a key. */
export function chordInKey(key, symbol) {
  const r = parseRoman(symbol);
  const root = spellDegree(key, r.degree, r.accidental);
  const q = QUALITIES[r.quality];
  return {
    symbol,
    roman: (r.accidental === -1 ? 'b' : r.accidental === 1 ? '#' : '') + r.numeral + q.figure,
    root: root.name,
    rootPc: root.pc,
    rootAccidental: root.accidental,
    quality: r.quality,
    name: root.name + q.symbol,
  };
}

export function chordTones(rootPc, quality) {
  return QUALITIES[quality].intervals.map((i) => mod(rootPc + i, 12));
}

/** True when every required tone of the chord belongs to the key's scale. */
export function isDiatonic(key, chord) {
  const tonic = parseNote(key.tonic).pc;
  const scale = new Set(SCALES[key.mode].map((s) => mod(tonic + s, 12)));
  return QUALITIES[chord.quality].required.every((i) => scale.has(mod(chord.rootPc + i, 12)));
}

export function keyLabel(key) {
  return `${key.tonic} ${key.mode}`;
}

/** Replaces ASCII accidentals with music symbols for display ("Bb7#9" -> "B♭7♯9"). */
export function pretty(text) {
  return text.replace(/^([A-G])bb/, '$1𝄫').replace(/^([A-G])b/, '$1♭').replace(/^b/, '♭').replace(/#/g, '♯');
}
