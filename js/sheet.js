// The progression as one image, for "Save as image": the genre, key, numerals and tuning on top and
// the four chord cards below, as on the page. A self-contained SVG (its own styles, system fonts,
// nothing to load), which the page draws onto a canvas and saves as a PNG.

import { GENRES } from './genres.js';
import { diagramSVG, diagramSize, escapeXML, fretLabel } from './diagram.js';
import { TUNINGS, keyLabel, pretty } from './theory.js';

const SCALE = 2; // pixels per unit, for a sharp image on any screen and in print
const MARGIN = 36;
const CARD_WIDTH = 210;
const GAP = 16;
const DIAGRAM_WIDTH = 150;
const WIDTH = 2 * MARGIN + 4 * CARD_WIDTH + 3 * GAP;

// The colours of the progression panel and its paper-white cards; the diagram rules repeat those
// of css/style.css.
const style = (accent) => `
text { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; fill: #1c1b19; }
.genre { font-size: 15px; font-weight: 700; fill: ${accent}; }
.key { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; }
.romans { font-size: 17px; font-weight: 500; fill: #69655c; }
.tuning { font-size: 14px; font-weight: 700; fill: ${accent}; }
.card { fill: #ffffff; stroke: #e9e4d8; }
.name, .roman, .frets { text-anchor: middle; }
.name { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.roman { font-size: 16px; font-weight: 700; fill: ${accent}; }
.frets { font: 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #7a766c; letter-spacing: 0.06em; }
.diagram .fret, .diagram .string { stroke: #45423c; stroke-width: 1.2; }
.diagram .nut, .diagram .dot, .diagram .barre { fill: #1c1b19; }
.diagram .open { fill: none; stroke: #1c1b19; stroke-width: 1.4; }
.diagram .mute { stroke: #1c1b19; stroke-width: 1.6; stroke-linecap: round; }
.diagram .position { font: 600 11px ui-sans-serif, system-ui, sans-serif; }
.diagram .tuning-note { fill: #7a766c; font: 600 10px ui-sans-serif, system-ui, sans-serif; text-anchor: middle; }
.diagram .tuning-note.retuned { fill: ${accent}; font-weight: 800; }
`;

/** The progression as an SVG image of `width` x `height` pixels, in the genre's accent colour. */
export function chordSheet(progression, accent) {
  const { genre, key, chords } = progression;
  const tuningId = GENRES[genre].tuning;
  const tuning = TUNINGS[tuningId];
  const parts = [];
  const text = (cls, x, y, content) => parts.push(`<text class="${cls}" x="${x}" y="${y}">${escapeXML(content)}</text>`);

  // The heading, line by line: the distance from the line above to its baseline, and its text.
  const heading = [
    ['genre', 15, GENRES[genre].name],
    ['key', 34, `Key of ${pretty(keyLabel(key))}`],
    ['romans', 27, chords.map((c) => pretty(c.roman)).join(' – ')],
  ];
  if (tuningId !== 'standard') heading.push(['tuning', 25, `${tuning.name} tuning: ${tuning.strings.map(pretty).join(' ')}`]);
  let y = MARGIN;
  for (const [cls, step, content] of heading) {
    y += step;
    text(cls, MARGIN, y, content);
  }

  const top = y + 24;
  const box = diagramSize(tuningId);
  const diagramHeight = (DIAGRAM_WIDTH * box.height) / box.width;
  const cardHeight = Math.round(diagramHeight + 110);
  chords.forEach((chord, i) => {
    const x = MARGIN + i * (CARD_WIDTH + GAP);
    const center = x + CARD_WIDTH / 2;
    const name = pretty(chord.name);
    parts.push(`<rect class="card" x="${x}" y="${top}" width="${CARD_WIDTH}" height="${cardHeight}" rx="14"/>`);
    text('name', center, top + 38, name);
    parts.push(
      `<svg x="${center - DIAGRAM_WIDTH / 2}" y="${top + 52}" width="${DIAGRAM_WIDTH}" height="${diagramHeight}" ` +
        `viewBox="0 0 ${box.width} ${box.height}">${diagramSVG(chord.frets, name, tuningId)}</svg>`,
    );
    const below = top + 52 + diagramHeight;
    text('roman', center, below + 22, pretty(chord.roman));
    text('frets', center, below + 42, fretLabel(chord.frets));
  });

  const height = Math.ceil(top + cardHeight + MARGIN);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH * SCALE}" height="${height * SCALE}" viewBox="0 0 ${WIDTH} ${height}">` +
    `<style>${style(escapeXML(accent))}</style>` +
    `<rect width="${WIDTH}" height="${height}" fill="#fffdf8"/>` +
    parts.join('') +
    '</svg>';
  return { svg, width: WIDTH * SCALE, height: height * SCALE };
}

/** The file name, genre and key: "post-rock-f-sharp-minor.png". */
export function imageName({ genre, key }) {
  const tonic = key.tonic.replace('#', '-sharp').replace(/b$/, '-flat');
  return `${genre}-${tonic}-${key.mode}.png`.toLowerCase();
}
