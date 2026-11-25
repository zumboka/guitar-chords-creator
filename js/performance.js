// Turns a progression into timed notes, one bar of 4/4 per chord, strummed or picked.
// Pure data, so tests can check that only the right notes play at the right times.

import { GENRES } from './genres.js';
import { TUNINGS } from './theory.js';

const MIN_DURATION = 0.02;
// A slap deadens the strings almost at once (s).
const SLAP = 0.06;

function stringsOf(frets, tuning) {
  const open = TUNINGS[tuning].notes;
  const strings = [];
  frets.forEach((fret, string) => {
    if (fret != null) strings.push({ string, midi: open[string] + fret });
  });
  return strings;
}

/** The strings a strum hits: all, or the top four on an upstroke. */
const strummed = (strings, ev) => (ev.dir === 'up' ? strings.slice().reverse().slice(0, 4) : strings);

/**
 * @returns {{ notes: {time, duration, midi, string, velocity, muted, dead, swell, part, chord, stroke}[],
 *   bar: number, duration: number }} times in seconds from the start of the progression; notes hit
 *   together share a stroke number. `part` is the guitar playing the note (null: all of them).
 */
export function buildPerformance(progression, { mode, bpm }) {
  const genre = GENRES[progression.genre];
  const beat = 60 / bpm;
  const bar = 4 * beat;
  // Swing delays the off-beat eighth notes.
  const swing = (at) => (at % 1 === 0.5 ? at + genre.swing : at);
  const notes = [];
  let stroke = 0;

  progression.chords.forEach((chord, index) => {
    const start = index * bar;
    const strings = stringsOf(chord.frets, genre.tuning);
    const bars = progression.chords.length;
    const build = (mode === 'arpeggio' && genre.arpeggio.build) || 1;
    const growth = build + ((1 - build) * index) / Math.max(1, bars - 1);
    const add = (n, at, len, velocity, extra = {}) =>
      notes.push({
        time: start + at * beat,
        duration: Math.max(MIN_DURATION, Math.min(len, 4 - at) * beat),
        midi: n.midi,
        string: n.string,
        velocity: velocity * growth,
        muted: false,
        dead: false,
        swell: 0,
        part: null,
        chord: index,
        stroke,
        ...extra,
      });
    const slap = (at, velocity) => {
      for (const n of strings) add(n, at, SLAP / beat, velocity, { dead: true });
    };

    if (mode === 'strum') {
      const { spread, pattern, fill } = genre.strum;
      for (const ev of index === bars - 1 && fill ? fill : pattern) {
        const at = swing(ev.at);
        strummed(strings, ev).forEach((n, k) => {
          const time = start + at * beat + k * spread;
          add(n, at, ev.len, ev.vel * (1 - k * 0.03), { time, muted: !!ev.mute });
        });
        stroke++;
      }
    } else {
      // The pattern is written for six voices (0 = lowest); fewer voices follow its contour.
      const voices = strings.slice().sort((a, b) => a.midi - b.midi);
      const { step, sequence, ring, vel, mutes = [], part = null, swells } = genre.arpeggio;
      const top = Math.max(1, ...sequence.filter((idx) => idx !== 'x'));
      sequence.forEach((idx, k) => {
        const beatPos = k * step;
        if (beatPos >= 4) return;
        const at = swing(beatPos);
        const velocity = vel * (beatPos % 1 === 0 ? 1 : 0.82);
        if (idx === 'x') slap(at, vel * 0.55);
        else add(voices[Math.round((idx * (voices.length - 1)) / top)], at, ring, velocity, { muted: mutes.includes(idx), part });
        stroke++;
      });
      if (swells) {
        for (const n of strings) add(n, 0, 4, swells.vel, { part: swells.part, swell: swells.attack * beat });
        stroke++;
      }
    }
  });

  // A string of a guitar sounds one note at a time: a new pluck cuts off the note before it.
  notes.sort((a, b) => a.time - b.time);
  const ringing = new Map();
  for (const n of notes) {
    const key = `${n.part} ${n.string}`;
    const prev = ringing.get(key);
    if (prev && prev.time + prev.duration > n.time) prev.duration = Math.max(0.01, n.time - prev.time);
    ringing.set(key, n);
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
    dead: false,
    swell: 0,
    part: null,
    chord: 0,
    stroke: 0,
  }));
}

/**
 * The notes as pick strokes: those of a strum together, picked notes one by one.
 * @returns {{time, duration, midis: number[], velocity, muted, chord}[]} midis lowest first
 */
export function strokesOf(notes) {
  const strokes = new Map();
  for (const { stroke, time, duration, midi, velocity, muted, chord } of notes) {
    if (!strokes.has(stroke)) strokes.set(stroke, { time, duration, midis: [], velocity, muted, chord });
    strokes.get(stroke).midis.push(midi);
  }
  for (const stroke of strokes.values()) stroke.midis.sort((a, b) => a - b);
  return [...strokes.values()];
}
