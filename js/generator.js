// Picks a progression for a genre, puts it in a key and finds playable shapes for it.

import { GENRES } from './genres.js';
import { chordInKey } from './theory.js';
import { voicingsFor, describe, matchesChord, isPlayable } from './voicings.js';

const MAX_CANDIDATES = 8;

const AWKWARD_ROOTS = ['Cb', 'Fb', 'E#', 'B#'];

/**
 * The chords of a template in a key, or null when a root would need a double sharp or flat, or
 * a name guitarists don't use (Fb9 instead of E9).
 */
export function chordsInKey(template, key) {
  const chords = template.chords.map((symbol) => chordInKey(key, symbol));
  const clean = chords.every((c) => Math.abs(c.rootAccidental) <= 1 && !AWKWARD_ROOTS.includes(c.root));
  return clean ? chords : null;
}

/** The keys from the genre's list that spell every chord of the template cleanly. */
export function keysFor(genre, template) {
  return genre.keys[template.mode].filter((tonic) => chordsInKey(template, { tonic, mode: template.mode }));
}

/**
 * Chooses one shape per chord. Each shape is scored on the genre's taste (where on the neck,
 * open strings, which string carries the bass, plus some randomness for variety), and the
 * hand movement from chord to chord, around the loop, is added on top.
 */
export function chooseVoicings(genre, chords, rng = Math.random) {
  const style = genre.voicing;
  const options = chords.map((chord) => {
    let shapes = voicingsFor(chord.rootPc, chord.quality, genre.tuning);
    if (style.maxBassString != null) {
      const low = shapes.filter((frets) => describe(frets, genre.tuning).bassString <= style.maxBassString);
      if (low.length) shapes = low;
    }
    return shapes
      .map((frets) => {
        const d = describe(frets, genre.tuning);
        let cost =
          style.centerWeight * Math.abs(d.position - style.center) +
          style.open * d.openStrings +
          (style.openTop || 0) * d.openTop;
        if (style.bassString != null && d.bassString !== style.bassString) cost += style.bassPenalty;
        return { frets, position: d.position, cost: cost + rng() * (style.variety ?? 0.9) };
      })
      .sort((a, b) => a.cost - b.cost)
      .slice(0, MAX_CANDIDATES);
  });
  let best = null;
  const pick = [];
  const walk = (i, cost) => {
    if (i === options.length) {
      const total = cost + style.move * Math.abs(pick[i - 1].position - pick[0].position);
      if (!best || total < best.cost) best = { cost: total, frets: pick.map((p) => p.frets) };
      return;
    }
    for (const option of options[i]) {
      pick[i] = option;
      walk(i + 1, cost + option.cost + (i ? style.move * Math.abs(option.position - pick[i - 1].position) : 0));
    }
  };
  walk(0, 0);
  return best.frets;
}

/**
 * Builds a progression from a template and key. Shapes given in `frets` (from a shared link) are
 * kept when they really are the chord and playable; the others are chosen fresh.
 * Returns null for anything the genre doesn't offer.
 */
export function buildProgression(genreId, templateId, key, frets = null, rng = Math.random) {
  const genre = GENRES[genreId];
  const template = genre && genre.templates.find((t) => t.id === templateId);
  if (!template || !key || key.mode !== template.mode || !keysFor(genre, template).includes(key.tonic)) return null;
  const chords = chordsInKey(template, key);
  const chosen = chooseVoicings(genre, chords, rng);
  return {
    genre: genreId,
    templateId,
    key: { tonic: key.tonic, mode: key.mode },
    chords: chords.map((chord, i) => {
      const given = frets && frets[i];
      const keep = given && isPlayable(given) && matchesChord(given, chord.rootPc, chord.quality, genre.tuning);
      return { ...chord, frets: keep ? given : chosen[i] };
    }),
  };
}

/** A random progression for the genre, avoiding an exact repeat of `previous`. */
export function generateProgression(genreId, rng = Math.random, previous = null) {
  const genre = GENRES[genreId];
  for (let attempt = 0; ; attempt++) {
    const template = genre.templates[Math.floor(rng() * genre.templates.length)];
    const keys = keysFor(genre, template);
    const tonic = keys[Math.floor(rng() * keys.length)];
    const repeat =
      previous && previous.genre === genreId && previous.templateId === template.id && previous.key.tonic === tonic;
    if (repeat && attempt < 10) continue;
    return buildProgression(genreId, template.id, { tonic, mode: template.mode }, null, rng);
  }
}
