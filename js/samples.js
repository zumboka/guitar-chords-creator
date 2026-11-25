// Guitar recordings (see audio/README.md): downloaded once, decoded per audio context, then
// trimmed to the attack, evened out in level and tuned (sampleSettings in dsp.js).

import { sampleSettings } from './dsp.js';
import { TUNINGS } from './theory.js';
import { RECORDINGS, centsOf } from './recordings.js';

export const sampleUrl = (instrument, midi) => `audio/${instrument}/${midi}.${RECORDINGS[instrument].type}`;

/** The MIDI notes a set of diagrams can sound, lowest first. */
export function notesOf(fretsList, tuning = 'standard') {
  const open = TUNINGS[tuning].notes;
  const notes = new Set();
  for (const frets of fretsList) {
    frets.forEach((fret, string) => {
      if (fret != null) notes.add(open[string] + fret);
    });
  }
  return [...notes].sort((a, b) => a - b);
}

const ATTEMPTS = 3;
const RETRY_DELAY = 300;
const files = new Map();

/** A file, tried again when the server is briefly unavailable. */
async function fetchFile(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.arrayBuffer();
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}

function download(url) {
  if (!files.has(url)) {
    const request = fetchFile(url);
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
              this.ready.set(key, { buffer, ...sampleSettings(channels, buffer.sampleRate, centsOf(instrument, midi)) });
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
