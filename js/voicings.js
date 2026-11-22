// Guitar chord shapes, and the checks that a shape really is the chord it claims to be.
// Frets are listed from the lowest string to the high E string; null means the string is muted.
// Tunings are named as in theory.js (TUNINGS); the default is standard tuning.

import { TUNINGS, QUALITIES, chordTones, mod, parseNote } from './theory.js';

const x = null;
const toShape = ([quality, root, frets]) => ({ quality, rootPc: parseNote(root).pc, frets });

// Movable shapes, written out at one root and slid along the neck. They have no open strings.
const MOVABLE = [
  ['5', 'F', [1, 3, 3, x, x, x]],
  ['5', 'Bb', [x, 1, 3, 3, x, x]],
  ['maj', 'F', [1, 3, 3, 2, 1, 1]],
  ['maj', 'Bb', [x, 1, 3, 3, 3, 1]],
  ['m', 'F', [1, 3, 3, 1, 1, 1]],
  ['m', 'Bb', [x, 1, 3, 3, 2, 1]],
  ['6', 'G', [3, x, 2, 4, 3, x]],
  ['6', 'C', [x, 3, 5, 5, 5, 5]],
  ['m6', 'G', [3, x, 2, 3, 3, x]],
  ['m6', 'C', [x, 3, 1, 2, 1, x]],
  ['7', 'F', [1, 3, 1, 2, 1, 1]],
  ['7', 'Bb', [x, 1, 3, 1, 3, 1]],
  ['7', 'G', [3, x, 3, 4, 3, x]],
  ['maj7', 'G', [3, x, 4, 4, 3, x]],
  ['maj7', 'C', [x, 3, 5, 4, 5, 3]],
  ['maj7', 'G', [x, x, 5, 4, 3, 2]],
  ['m7', 'G', [3, 5, 3, 3, 3, 3]],
  ['m7', 'G', [3, x, 3, 3, 3, x]],
  ['m7', 'C', [x, 3, 5, 3, 4, 3]],
  ['m7', 'C', [x, 3, 1, 3, 1, x]],
  ['7sus4', 'G', [3, 5, 3, 5, 3, 3]],
  ['7sus4', 'C', [x, 3, 5, 3, 6, 3]],
  ['9', 'C', [x, 3, 2, 3, 3, 3]],
  ['maj9', 'C', [x, 3, 2, 4, 3, x]],
  ['maj9', 'G', [3, x, 4, 4, 3, 5]],
  ['m9', 'C', [x, 3, 1, 3, 3, x]],
  ['m9', 'G', [3, x, 3, 3, 3, 5]],
  ['m11', 'C', [x, 3, 3, 3, 4, 3]],
  ['m11', 'G', [3, x, 3, 3, 1, x]],
  ['13', 'G', [3, x, 3, 4, 5, x]],
  ['13', 'C', [x, 3, 2, 3, 5, 5]],
  ['7#9', 'C', [x, 3, 2, 3, 4, x]],
  ['add9', 'C', [x, 3, 5, 7, 5, 3]],
  ['add9', 'F', [x, x, 3, 2, 1, 3]],
  ['madd9', 'C', [x, 3, 5, 7, 4, 3]],
  ['madd9', 'F', [x, x, 3, 1, 1, 3]],
  ['sus2', 'C', [x, 3, 5, 5, 3, 3]],
  ['sus2', 'E', [x, x, 2, 4, 5, 2]],
  ['sus4', 'C', [x, 3, 5, 5, 6, 3]],
  ['sus4', 'G', [3, 5, 5, 5, 3, 3]],
].map(toShape);

// Shapes that use open strings, valid only for their own root. Several keep the top strings
// ringing while the fretted notes move (the drones Post Rock and Shoegaze love).
const OPEN = [
  ['5', 'E', [0, 2, 2, x, x, x]],
  ['5', 'A', [x, 0, 2, 2, x, x]],
  ['5', 'D', [x, x, 0, 2, 3, x]],
  ['maj', 'C', [x, 3, 2, 0, 1, 0]],
  ['maj', 'A', [x, 0, 2, 2, 2, 0]],
  ['maj', 'G', [3, 2, 0, 0, 0, 3]],
  ['maj', 'E', [0, 2, 2, 1, 0, 0]],
  ['maj', 'D', [x, x, 0, 2, 3, 2]],
  ['m', 'A', [x, 0, 2, 2, 1, 0]],
  ['m', 'E', [0, 2, 2, 0, 0, 0]],
  ['m', 'D', [x, x, 0, 2, 3, 1]],
  ['6', 'C', [x, 3, 2, 2, 1, 0]],
  ['6', 'G', [3, 2, 0, 0, 0, 0]],
  ['6', 'G', [3, x, 0, 0, 0, 0]],
  ['6', 'D', [x, x, 0, 2, 0, 2]],
  ['6', 'A', [x, 0, 2, 2, 2, 2]],
  ['6', 'E', [0, 2, 2, 1, 2, 0]],
  ['m6', 'A', [x, 0, 2, 2, 1, 2]],
  ['m6', 'E', [0, 2, 2, 0, 2, 0]],
  ['m6', 'D', [x, x, 0, 2, 0, 1]],
  ['7', 'E', [0, 2, 0, 1, 0, 0]],
  ['7', 'A', [x, 0, 2, 0, 2, 0]],
  ['7', 'D', [x, x, 0, 2, 1, 2]],
  ['7', 'G', [3, 2, 0, 0, 0, 1]],
  ['7', 'C', [x, 3, 2, 3, 1, 0]],
  ['7', 'B', [x, 2, 1, 2, 0, 2]],
  ['maj7', 'C', [x, 3, 2, 0, 0, 0]],
  ['maj7', 'A', [x, 0, 2, 1, 2, 0]],
  ['maj7', 'E', [0, 2, 1, 1, 0, 0]],
  ['maj7', 'D', [x, x, 0, 2, 2, 2]],
  ['maj7', 'G', [3, 2, 0, 0, 0, 2]],
  ['maj7', 'F', [x, x, 3, 2, 1, 0]],
  ['m7', 'A', [x, 0, 2, 0, 1, 0]],
  ['m7', 'E', [0, 2, 0, 0, 0, 0]],
  ['m7', 'E', [0, 2, 2, 0, 3, 0]],
  ['m7', 'D', [x, x, 0, 2, 1, 1]],
  ['m7', 'B', [x, 2, 0, 2, 0, 2]],
  ['m7', 'C#', [x, 4, 6, 6, 0, 0]],
  ['9', 'E', [0, 2, 0, 1, 0, 2]],
  ['9', 'A', [x, 0, 2, 4, 2, 3]],
  ['maj9', 'E', [0, 2, 1, 1, 0, 2]],
  ['maj9', 'C', [x, 3, 2, 4, 3, 0]],
  ['maj9', 'G', [3, x, 0, 2, 0, 2]],
  ['m9', 'A', [x, 0, 5, 5, 0, 0]],
  ['m9', 'E', [0, 2, 0, 0, 0, 2]],
  ['m9', 'D', [x, 5, 3, 5, 5, 0]],
  ['m11', 'A', [x, 0, 0, 0, 1, 0]],
  ['m11', 'E', [0, 0, 0, 0, 0, 0]],
  ['m11', 'F#', [2, 4, 4, 2, 0, 0]],
  ['13', 'E', [0, x, 0, 1, 2, 0]],
  ['13', 'A', [x, 0, x, 0, 2, 2]],
  ['7#9', 'E', [0, 7, 6, 7, 8, x]],
  ['add9', 'C', [x, 3, 2, 0, 3, 0]],
  ['add9', 'G', [3, 2, 0, 2, 0, 3]],
  ['add9', 'E', [0, 2, 2, 1, 0, 2]],
  ['add9', 'A', [x, 0, 2, 4, 2, 0]],
  ['add9', 'A', [x, 0, 7, 6, 0, 0]],
  ['add9', 'D', [x, 5, 4, 2, 3, 0]],
  ['madd9', 'E', [0, 2, 4, 0, 0, 0]],
  ['madd9', 'A', [x, 0, 2, 4, 1, 0]],
  ['madd9', 'A', [x, 0, 7, 5, 0, 0]],
  ['madd9', 'D', [x, 5, 3, 2, 3, 0]],
  ['sus2', 'D', [x, x, 0, 2, 3, 0]],
  ['sus2', 'A', [x, 0, 2, 2, 0, 0]],
  ['sus2', 'E', [0, 2, 4, 4, 0, 0]],
  ['sus4', 'D', [x, x, 0, 2, 3, 3]],
  ['sus4', 'A', [x, 0, 2, 2, 3, 0]],
  ['sus4', 'E', [0, 2, 2, 2, 0, 0]],
  ['sus4', 'B', [x, 2, 4, 4, 0, 0]],
].map(toShape);

// Drop D: the low string sounds a tone lower. Shapes that leave it muted work unchanged; power
// chords get the one-finger shape across the three lowest strings.
const lowStringMuted = (s) => s.frets[0] == null;

export const SHAPES = {
  standard: { movable: MOVABLE, open: OPEN },
  dropD: {
    movable: [toShape(['5', 'E', [2, 2, 2, x, x, x]]), ...MOVABLE.filter(lowStringMuted)],
    open: [toShape(['5', 'D', [0, 0, 0, x, x, x]]), ...OPEN.filter(lowStringMuted)],
  },
};

const MAX_FRET = 14;

/** The notes a voicing sounds: string index, fret and MIDI pitch. */
export function sounding(frets, tuning = 'standard') {
  const open = TUNINGS[tuning].notes;
  const notes = [];
  frets.forEach((fret, string) => {
    if (fret != null) notes.push({ string, fret, midi: open[string] + fret });
  });
  return notes;
}

/**
 * Fewest fingers that can hold the shape: an index-finger barre across the lowest fret when no
 * open or muted string lies under it, and one finger per remaining note, except that neighbouring
 * strings at the same fret share a finger.
 */
export function fingerCount(frets) {
  const fretted = [];
  frets.forEach((f, s) => {
    if (f != null && f > 0) fretted.push({ f, s });
  });
  if (!fretted.length) return 0;
  const min = Math.min(...fretted.map((n) => n.f));
  const atMin = fretted.filter((n) => n.f === min).map((n) => n.s);
  const first = atMin[0];
  const last = atMin[atMin.length - 1];
  const barre = atMin.length > 1 && frets.slice(first, last + 1).every((f) => f != null && f >= min);
  let fingers = barre ? 1 : 0;
  const rest = barre ? fretted.filter((n) => n.f !== min) : fretted;
  rest.forEach((n, i) => {
    const prev = rest[i - 1];
    if (!(prev && prev.f === n.f && prev.s === n.s - 1)) fingers += 1;
  });
  return fingers;
}

/**
 * The barre a diagram should draw: one finger across the lowest fret, shown only when it is
 * needed because a string in between is fretted higher.
 */
export function findBarre(frets) {
  const fretted = frets.map((f, s) => ({ f, s })).filter((n) => n.f != null && n.f > 0);
  if (fretted.length < 2) return null;
  const min = Math.min(...fretted.map((n) => n.f));
  const atMin = fretted.filter((n) => n.f === min).map((n) => n.s);
  const from = atMin[0];
  const to = atMin[atMin.length - 1];
  if (atMin.length < 2) return null;
  const between = frets.slice(from, to + 1);
  if (!between.every((f) => f != null && f >= min)) return null;
  if (!between.some((f) => f > min)) return null;
  return { fret: min, from, to };
}

export function isPlayable(frets) {
  const fretted = frets.filter((f) => f != null && f > 0);
  const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
  return (
    frets.length === 6 &&
    frets.every((f) => f == null || (Number.isInteger(f) && f >= 0 && f <= MAX_FRET)) &&
    frets.filter((f) => f != null).length >= 3 &&
    span <= 4 &&
    fingerCount(frets) <= 4
  );
}

/**
 * True when the shape sounds exactly the chord: nothing outside the chord, every required tone
 * present, and the root as the lowest note.
 */
export function matchesChord(frets, rootPc, quality, tuning = 'standard') {
  if (!Array.isArray(frets) || frets.length !== 6) return false;
  const notes = sounding(frets, tuning);
  if (notes.length < 3) return false;
  const pcs = new Set(notes.map((n) => mod(n.midi, 12)));
  const allowed = new Set(chordTones(rootPc, quality));
  for (const pc of pcs) if (!allowed.has(pc)) return false;
  for (const i of QUALITIES[quality].required) if (!pcs.has(mod(rootPc + i, 12))) return false;
  const bass = Math.min(...notes.map((n) => n.midi));
  return mod(bass, 12) === rootPc;
}

/** Facts the voicing picker scores on. */
export function describe(frets, tuning = 'standard') {
  const fretted = frets.filter((f) => f != null && f > 0);
  const notes = sounding(frets, tuning);
  const bass = notes.reduce((low, n) => (n.midi < low.midi ? n : low), notes[0]);
  return {
    position: fretted.length ? fretted.reduce((a, b) => a + b, 0) / fretted.length : 0,
    openStrings: frets.filter((f) => f === 0).length,
    // Open B and high E strings, the ones that drone over shapes moving lower down.
    openTop: frets.slice(4).filter((f) => f === 0).length,
    bassString: bass ? bass.string : -1,
  };
}

/** Every playable voicing of a chord: open shapes for its root plus the movable shapes slid into place. */
export function voicingsFor(rootPc, quality, tuning = 'standard') {
  const found = new Map();
  for (const shape of SHAPES[tuning].open) {
    if (shape.quality === quality && shape.rootPc === rootPc) found.set(fretsToString(shape.frets), shape.frets.slice());
  }
  for (const shape of SHAPES[tuning].movable) {
    if (shape.quality !== quality) continue;
    const shift = mod(rootPc - shape.rootPc, 12);
    for (const s of [shift - 12, shift, shift + 12]) {
      const frets = shape.frets.map((f) => (f == null ? null : f + s));
      const fretted = frets.filter((f) => f != null);
      if (Math.min(...fretted) < 1 || Math.max(...fretted) > MAX_FRET) continue;
      found.set(fretsToString(frets), frets);
    }
  }
  return [...found.values()];
}

const FRET_CHARS = '0123456789abcdef';

/** Compact form used in share links: one character per string, "x" for muted ("x32010"). */
export function fretsToString(frets) {
  return frets.map((f) => (f == null ? 'x' : FRET_CHARS[f])).join('');
}

export function parseFrets(text) {
  if (typeof text !== 'string' || !/^[x0-9a-e]{6}$/.test(text)) return null;
  return [...text].map((c) => (c === 'x' ? null : FRET_CHARS.indexOf(c)));
}
