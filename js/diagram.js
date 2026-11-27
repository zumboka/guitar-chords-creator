// Chord-box diagrams as SVG: strings left (lowest) to right, o / x above a thick nut,
// dots on the frets, a bar for barre chords and a fret label ("5fr") higher up the neck.
// Outside standard tuning the string names go underneath, the dropped one highlighted.

import { TUNINGS } from './theory.js';
import { findBarre } from './voicings.js';

const FRETS = 5;
const LEFT = 24;
const STRING_GAP = 16;
const RIGHT = LEFT + 5 * STRING_GAP;
const TOP = 34;
const FRET_HEIGHT = 22;
const WIDTH = 128;
const HEIGHT = TOP + FRETS * FRET_HEIGHT + 6;
const TUNING_ROW = 16;

export const escapeXML = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** The shape as text, low string first: "x 3 2 0 1 0". */
export const fretLabel = (frets) => frets.map((f) => (f == null ? 'x' : f)).join(' ');

/** A diagram's viewBox: taller outside standard tuning, for the string names underneath. */
export const diagramSize = (tuning = 'standard') => ({
  width: WIDTH,
  height: HEIGHT + (tuning === 'standard' ? 0 : TUNING_ROW),
});

/** The first fret the diagram shows: 1 (with the nut) when the shape fits, else its lowest fret. */
export function baseFret(frets) {
  const fretted = frets.filter((f) => f != null && f > 0);
  if (!fretted.length || Math.max(...fretted) <= FRETS) return 1;
  return Math.min(...fretted);
}

export function diagramSVG(frets, label = '', tuning = 'standard') {
  const base = baseFret(frets);
  const sx = (s) => LEFT + s * STRING_GAP;
  const fy = (f) => TOP + (f - base + 0.5) * FRET_HEIGHT;
  const parts = [];

  for (let i = 0; i <= FRETS; i++) {
    const y = TOP + i * FRET_HEIGHT;
    parts.push(`<line class="fret" x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}"/>`);
  }
  for (let s = 0; s < 6; s++) {
    parts.push(`<line class="string" x1="${sx(s)}" y1="${TOP}" x2="${sx(s)}" y2="${TOP + FRETS * FRET_HEIGHT}"/>`);
  }
  if (base === 1) {
    parts.push(`<rect class="nut" x="${LEFT - 1}" y="${TOP - 4}" width="${RIGHT - LEFT + 2}" height="5"/>`);
  } else {
    parts.push(`<text class="position" x="${RIGHT + 6}" y="${TOP + FRET_HEIGHT / 2 + 4}">${base}fr</text>`);
  }

  frets.forEach((f, s) => {
    const cx = sx(s);
    const cy = TOP - 13;
    if (f === 0) parts.push(`<circle class="open" cx="${cx}" cy="${cy}" r="4.2"/>`);
    if (f == null) {
      parts.push(`<path class="mute" d="M${cx - 4} ${cy - 4}L${cx + 4} ${cy + 4}M${cx + 4} ${cy - 4}L${cx - 4} ${cy + 4}"/>`);
    }
  });

  const barre = findBarre(frets);
  if (barre) {
    const x = sx(barre.from) - 7;
    const width = sx(barre.to) - sx(barre.from) + 14;
    parts.push(`<rect class="barre" x="${x}" y="${fy(barre.fret) - 7}" width="${width}" height="14" rx="7"/>`);
  }
  frets.forEach((f, s) => {
    if (f == null || f === 0) return;
    if (barre && f === barre.fret && s >= barre.from && s <= barre.to) return;
    parts.push(`<circle class="dot" cx="${sx(s)}" cy="${fy(f)}" r="6.6"/>`);
  });

  if (tuning !== 'standard') {
    const y = TOP + FRETS * FRET_HEIGHT + 14;
    // The dropped string is the one tuned apart from the others (in Drop C they all sit a tone lower).
    const offsets = TUNINGS[tuning].notes.map((note, s) => note - TUNINGS.standard.notes[s]);
    const shared = offsets.find((o) => offsets.filter((p) => p === o).length > offsets.length / 2) ?? 0;
    TUNINGS[tuning].strings.forEach((name, s) => {
      const dropped = offsets[s] !== shared;
      parts.push(`<text class="tuning-note${dropped ? ' retuned' : ''}" x="${sx(s)}" y="${y}">${name}</text>`);
    });
  }

  const size = diagramSize(tuning);
  return (
    `<svg class="diagram" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-label="${escapeXML(label)}">` +
    parts.join('') +
    '</svg>'
  );
}
