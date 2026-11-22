// Share links: the progression lives in the URL fragment, e.g.
// #g=neo-soul&k=C-major&p=two-five-one-six&v=x5355x.3x345x.x3243x.5x555x&t=76

import { GENRES } from './genres.js';
import { buildProgression } from './generator.js';
import { fretsToString, parseFrets } from './voicings.js';

export const TEMPO_RANGE = { min: 50, max: 220 };

export function encodeState(progression, bpm) {
  return new URLSearchParams({
    g: progression.genre,
    k: `${progression.key.tonic}-${progression.key.mode}`,
    p: progression.templateId,
    v: progression.chords.map((c) => fretsToString(c.frets)).join('.'),
    t: String(bpm),
  }).toString();
}

/** Reads a fragment back into { progression, bpm }, or null if it doesn't describe one. */
export function decodeState(fragment) {
  const params = new URLSearchParams(String(fragment || '').replace(/^#/, ''));
  const genre = params.get('g');
  if (!Object.hasOwn(GENRES, genre)) return null;
  const key = /^([A-G][#b]?)-(major|minor)$/.exec(params.get('k') || '');
  if (!key) return null;
  const frets = (params.get('v') || '').split('.').map(parseFrets);
  const progression = buildProgression(
    genre,
    params.get('p'),
    { tonic: key[1], mode: key[2] },
    frets.length === 4 ? frets : null,
  );
  if (!progression) return null;
  const t = Number(params.get('t'));
  const bpm = Number.isInteger(t) && t >= TEMPO_RANGE.min && t <= TEMPO_RANGE.max ? t : GENRES[genre].tempo;
  return { progression, bpm };
}
