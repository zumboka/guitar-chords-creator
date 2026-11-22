// Turns a progression into timed notes, one bar of 4/4 per chord, strummed or picked.
// Pure data, so tests can check that only the right notes play at the right times.

import { GENRES } from './genres.js';
import { TUNINGS } from './theory.js';

const MIN_DURATION = 0.02;

function stringsOf(frets, tuning) {
  const open = TUNINGS[tuning].notes;
  const strings = [];
  frets.forEach((fret, string) => {
    if (fret != null) strings.push({ string, midi: open[string] + fret });
  });
  return strings;
}

/** The strings a strum hits: all, the top four on an upstroke, or the two lowest for a chug. */
function strummed(strings, ev) {
  if (ev.strings === 'low') return strings.slice(0, 2);
  return ev.dir === 'up' ? strings.slice().reverse().slice(0, 4) : strings;
}

/**
 * @returns {{ notes: {time, duration, midi, string, velocity, muted, chord}[], bar: number, duration: number }}
 *   times in seconds from the start of the progression.
 */
export function buildPerformance(progression, { mode, bpm }) {
  const genre = GENRES[progression.genre];
  const beat = 60 / bpm;
  const bar = 4 * beat;
  // Swing delays the off-beat eighth notes.
  const swing = (at) => (at % 1 === 0.5 ? at + genre.swing : at);
  const notes = [];

  progression.chords.forEach((chord, index) => {
    const start = index * bar;
    const strings = stringsOf(chord.frets, genre.tuning);
    if (mode === 'strum') {
      for (const ev of genre.strum.pattern) {
        const hits = strummed(strings, ev);
        const at = swing(ev.at);
        hits.forEach((n, k) => {
          notes.push({
            time: start + at * beat + k * genre.strum.spread,
            duration: Math.max(MIN_DURATION, Math.min(ev.len, 4 - at) * beat),
            midi: n.midi,
            string: n.string,
            velocity: ev.vel * (1 - k * 0.03),
            muted: !!ev.mute,
            chord: index,
          });
        });
      }
    } else {
      // The pattern is written for six voices (0 = lowest); fewer voices follow its contour.
      const voices = strings.slice().sort((a, b) => a.midi - b.midi);
      const { step, sequence, ring, vel } = genre.arpeggio;
      const top = Math.max(1, ...sequence);
      sequence.forEach((idx, k) => {
        const beatPos = k * step;
        if (beatPos >= 4) return;
        const at = swing(beatPos);
        const n = voices[Math.round((idx * (voices.length - 1)) / top)];
        notes.push({
          time: start + at * beat,
          duration: Math.max(MIN_DURATION, Math.min(ring, 4 - at) * beat),
          midi: n.midi,
          string: n.string,
          velocity: vel * (beatPos % 1 === 0 ? 1 : 0.82),
          muted: false,
          chord: index,
        });
      });
    }
  });

  // A string sounds one note at a time: a new pluck cuts off the note before it.
  notes.sort((a, b) => a.time - b.time);
  const ringing = new Map();
  for (const n of notes) {
    const prev = ringing.get(n.string);
    if (prev && prev.time + prev.duration > n.time) prev.duration = Math.max(0.01, n.time - prev.time);
    ringing.set(n.string, n);
  }
  return { notes, bar, duration: bar * progression.chords.length };
}

/** One slow downstroke of a single chord, for clicking a diagram. */
export function previewNotes(frets, genreId) {
  const genre = GENRES[genreId];
  const spread = Math.max(genre.strum.spread, 0.014);
  return stringsOf(frets, genre.tuning).map((n, k) => ({
    time: k * spread,
    duration: 2.4,
    midi: n.midi,
    string: n.string,
    velocity: 0.9 - k * 0.03,
    muted: false,
    chord: 0,
  }));
}
