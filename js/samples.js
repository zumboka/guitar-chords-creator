// Recorded guitar notes (see audio/README.md): downloaded once, decoded per audio context,
// then trimmed to the attack, evened out in level and tuned (sampleSettings in dsp.js).

import { sampleSettings } from './dsp.js';
import { STANDARD_TUNING } from './theory.js';
import { SAMPLE_RANGE, TUNING } from './tuning.js';

export const sampleUrl = (instrument, midi) => `audio/${instrument}/${midi}.mp3`;

/** The MIDI notes a set of diagrams can sound, lowest first. */
export function notesOf(fretsList) {
  const notes = new Set();
  for (const frets of fretsList) {
    frets.forEach((fret, string) => {
      if (fret != null) notes.add(STANDARD_TUNING[string] + fret);
    });
  }
  return [...notes].sort((a, b) => a - b);
}

const files = new Map();

function download(url) {
  if (!files.has(url)) {
    const request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.arrayBuffer();
    });
    request.catch(() => files.delete(url));
    files.set(url, request);
  }
  return files.get(url);
}

/** Starts downloading notes ahead of time, so pressing play only has to decode them. */
export function prefetch(instrument, midis) {
  for (const midi of midis) download(sampleUrl(instrument, midi)).catch(() => {});
}

export class SampleBank {
  constructor(ctx) {
    this.ctx = ctx;
    this.loading = new Map();
    this.ready = new Map();
  }

  /** Resolves once every note can be played with get(). */
  load(instrument, midis) {
    return Promise.all(
      midis.map((midi) => {
        const key = `${instrument}/${midi}`;
        if (!this.loading.has(key)) {
          const note = download(sampleUrl(instrument, midi))
            .then((data) => this.ctx.decodeAudioData(data.slice(0)))
            .then((buffer) => {
              const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
              const cents = TUNING[instrument][midi - SAMPLE_RANGE.low];
              this.ready.set(key, { buffer, ...sampleSettings(channels, buffer.sampleRate, cents) });
            });
          note.catch(() => this.loading.delete(key));
          this.loading.set(key, note);
        }
        return this.loading.get(key);
      }),
    );
  }

  get(instrument, midi) {
    const note = this.ready.get(`${instrument}/${midi}`);
    if (!note) throw new Error(`Sample not loaded: ${instrument} ${midi}`);
    return note;
  }
}
