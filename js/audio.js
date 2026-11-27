// Web Audio playback: each genre's effect chain, and the scheduling of a performance's notes
// on recorded guitar samples.

import { GENRES } from './genres.js';
import { recordingsNeeded, soundFor, takesOf, voicesFor } from './sounds.js';
import { createAmp } from './amp.js';
import { impulseResponse, seededRandom, vinylNoise } from './dsp.js';
import { filter, gain, series } from './nodes.js';
import { buildPerformance, previewNotes } from './performance.js';
import { SampleBank } from './samples.js';

const NOTE_LEVEL = 0.5;
const ATTACK = 0.002;
const RELEASE = 0.12;
const LOOKAHEAD = 0.3;
// How far strokes stray from the beat (s), also for the two guitars of a tight sound.
const JITTER = 0.008;
const TIGHT_JITTER = 0.005;
// In a tight sound every string sounds until just before the next stroke, when the pick or hand stops
// it: distortion would drag out a slow release into the next chord.
const DAMP = 0.01;
const CHOKE = 0.006;

/** Loads the recordings a set of diagrams needs to be played in a genre's sound and tuning. */
function loadNotes(bank, genreId, fretsList, mode) {
  const needed = recordingsNeeded(genreId, mode, fretsList, GENRES[genreId].tuning);
  return Promise.all([...needed].map(([instrument, notes]) => bank.load(instrument, [...notes])));
}

const fretsOf = (progression) => progression.chords.map((c) => c.frets);

/** A short delay whose time drifts with a slow oscillator: chorus, or tape wow when used alone. */
function modulatedDelay(ctx, base, rate, depth, oscillators) {
  const delay = ctx.createDelay(0.1);
  delay.delayTime.value = base;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const amount = ctx.createGain();
  amount.gain.value = depth;
  lfo.connect(amount);
  amount.connect(delay.delayTime);
  lfo.start();
  oscillators.push(lfo);
  return delay;
}

function compressor(ctx, { threshold, knee = 12, ratio, attack, release }) {
  const node = ctx.createDynamicsCompressor();
  node.threshold.value = threshold;
  node.knee.value = knee;
  node.ratio.value = ratio;
  node.attack.value = attack;
  node.release.value = release;
  return node;
}

function createMaster(ctx) {
  const input = compressor(ctx, { threshold: -18, ratio: 3, attack: 0.005, release: 0.25 });
  series(input, gain(ctx, 0.9), ctx.destination);
  return input;
}

function panner(ctx, position) {
  const node = ctx.createStereoPanner();
  node.pan.value = position;
  return node;
}

/** An echo that bounces from side to side, right first, getting darker. @returns {{ input, output, delays }} */
function pingPong(ctx, { feedback, mix, lowpass }) {
  const output = gain(ctx, mix);
  const [first, second] = [0.8, -0.8].map((position) => {
    const delay = ctx.createDelay(2);
    const damp = filter(ctx, 'lowpass', lowpass, 0.7);
    series(delay, damp, panner(ctx, position), output);
    return { delay, damp };
  });
  series(first.damp, gain(ctx, feedback), second.delay);
  series(second.damp, gain(ctx, feedback), first.delay);
  return { input: first.delay, output, delays: [first.delay, second.delay] };
}

/** A room or hall: [pre-delay] -> [tone] -> noise that fades. @returns {{ input, output }} */
function createReverb(ctx, { seconds, predelay, lowpass }) {
  const convolver = ctx.createConvolver();
  const channels = impulseResponse({ sampleRate: ctx.sampleRate, seconds, rng: seededRandom(7) });
  const impulse = ctx.createBuffer(2, channels[0].length, ctx.sampleRate);
  channels.forEach((data, i) => impulse.getChannelData(i).set(data));
  convolver.buffer = impulse;
  const nodes = [convolver];
  if (lowpass) nodes.unshift(filter(ctx, 'highpass', 150, 0.7), filter(ctx, 'lowpass', lowpass, 0.7));
  if (predelay) {
    const delay = ctx.createDelay(0.2);
    delay.delayTime.value = predelay;
    nodes.unshift(delay);
  }
  return { input: nodes[0], output: series(...nodes) };
}

/** input -> [wobble] -> [compressor] -> EQ -> dry + chorus + delay + reverb -> out -> destination. */
function buildChain(ctx, sound, destination) {
  const oscillators = [];
  const input = ctx.createGain();
  let head = input;
  const then = (node) => {
    head.connect(node);
    head = node;
  };

  if (sound.wobble) then(modulatedDelay(ctx, 0.01, sound.wobble.rate, sound.wobble.depth, oscillators));
  if (sound.compress) then(compressor(ctx, sound.compress));
  then(filter(ctx, 'highpass', sound.tone.highpass, 0.7));
  for (const peak of sound.tone.peaks || []) then(filter(ctx, 'peaking', peak.freq, peak.q, peak.gain));
  then(filter(ctx, 'lowpass', sound.tone.lowpass, 0.7));

  const out = gain(ctx, sound.level);
  head.connect(out);

  for (const { mix, rate, depth, pan } of sound.chorus || []) {
    series(head, modulatedDelay(ctx, 0.014, rate, depth, oscillators), gain(ctx, mix), panner(ctx, pan), out);
  }

  const echo = sound.delay && pingPong(ctx, sound.delay);
  if (echo) {
    head.connect(echo.input);
    echo.output.connect(out);
  }

  if (sound.reverb) {
    const reverb = createReverb(ctx, sound.reverb);
    head.connect(reverb.input);
    if (echo) echo.output.connect(reverb.input);
    series(reverb.output, gain(ctx, sound.reverb.mix), out);
  }

  out.connect(destination);
  return {
    input,
    setTempo(bpm) {
      if (!echo) return;
      const time = Math.min(1.9, (sound.delay.beats * 60) / bpm);
      for (const delay of echo.delays) delay.delayTime.setTargetAtTime(time, ctx.currentTime, 0.05);
    },
    /** Fades out what still rings, then lets go of the chain. */
    dispose() {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      oscillators.forEach((lfo) => lfo.stop(ctx.currentTime + 0.3));
      setTimeout(() => out.disconnect(), 300);
    },
  };
}

function startNoise(ctx, level, destination) {
  const data = vinylNoise({ sampleRate: ctx.sampleRate, seconds: 4, rng: seededRandom(11) });
  const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buffer.getChannelData(0).set(data);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = level;
  source.connect(gain);
  gain.connect(destination);
  source.start();
  return source;
}

/** Vibrato, like a hand on the tremolo arm: up to `cents` above and below the note. */
function vibrato(ctx, { rate, cents }, oscillators) {
  const depth = (2 ** (cents / 1200) - 1) / (2 * Math.PI * rate);
  return modulatedDelay(ctx, 2 * depth, rate, depth, oscillators);
}

/**
 * The way into a genre's chain for one playback: an input per take, through its amp and panned,
 * mixed into `out`, which can be faded without disturbing other playbacks. `close` lets go of it
 * after some milliseconds.
 */
function openTakes(ctx, sound, destination) {
  const oscillators = [];
  const out = ctx.createGain();
  out.connect(destination);
  const inputs = takesOf(sound).map((take) => {
    const input = gain(ctx, take.level);
    let head = input;
    if (take.amp) {
      const amp = createAmp(ctx, take.amp, take.cabinet);
      input.connect(amp.input);
      head = amp.output;
    }
    if (take.sway) head = series(head, vibrato(ctx, take.sway, oscillators));
    if (take.pan) head = series(head, panner(ctx, take.pan));
    head.connect(out);
    return input;
  });
  const close = (wait) =>
    setTimeout(() => {
      out.disconnect();
      oscillators.splice(0).forEach((lfo) => lfo.stop());
    }, wait);
  return { inputs, out, close };
}

/** Palm mute: the hand on the bridge dulls the string, but the pick attack still comes through. */
function palmMute(ctx, start) {
  const dull = filter(ctx, 'lowpass', 4000, -6);
  dull.frequency.setValueAtTime(4000, start);
  dull.frequency.exponentialRampToValueAtTime(200, start + 0.06);
  return dull;
}

/** Schedules notes (times relative to `startAt`) into the takes; the recordings must be loaded. */
function scheduleNotes(ctx, { inputs }, notes, startAt, sound, bank, humanize = true) {
  const sources = [];
  const takes = takesOf(sound);
  const release = sound.release ?? RELEASE;
  const counts = new Map();
  const stray = (amount) => (humanize ? (Math.random() - 0.5) * amount : 0);

  for (const note of notes) {
    const jitter = stray(JITTER);
    const loudness = 1 + stray(0.16);
    const level = note.velocity * loudness;
    const count = counts.get(note.midi) || 0;
    counts.set(note.midi, count + 1);

    voicesFor(sound, note, count).forEach((voice, t) => {
      if (note.part != null && note.part !== t) return;
      const sample = bank.get(voice.instrument, voice.midi);
      // An amp levels everything out; without one, many notes at once need headroom.
      const headroom = takes[t].amp ? 1 : NOTE_LEVEL * (takes.length > 1 ? 0.75 : 1);
      // Separate performances stray separately; copies of one recording must stay together.
      const late = takes[t].offset + (sound.tight ? stray(TIGHT_JITTER) : jitter);
      const start = Math.max(ctx.currentTime, startAt + note.time + late);
      const end = start + Math.max(0.02, note.duration - (sound.tight ? DAMP : 0));
      const source = ctx.createBufferSource();
      source.buffer = sample.buffer;
      source.playbackRate.value = sample.rate * voice.rate;
      const envelope = ctx.createGain();
      const peak = level * headroom * sample.gain;
      const attack = note.swell || ATTACK;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(peak, start + attack);
      let head = source;
      if (note.dead) {
        // A slap: the click of the string and a short thud.
        envelope.gain.setTargetAtTime(0, start + 0.005, 0.009);
        head = series(head, filter(ctx, 'highshelf', 1500, 0, 8));
      } else {
        envelope.gain.setValueAtTime(peak, Math.max(end, start + attack));
        if (sound.tight) envelope.gain.linearRampToValueAtTime(0, end + CHOKE);
        else envelope.gain.setTargetAtTime(0, Math.max(end, start + attack), release / 4);
      }
      if (note.muted) head = series(head, palmMute(ctx, start));
      series(head, envelope, inputs[t]);
      source.start(start, sample.offset);
      source.stop(end + release * 2);
      sources.push(source);
    });
  }
  return sources;
}

export class Player {
  constructor() {
    this.ctx = null;
    this.sound = null;
    this.session = null;
    this.previewed = null;
  }

  static get supported() {
    return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
  }

  /** Creates the audio context on first use (it must start from a click) and the chain of a genre and mode. */
  ensure(genreId, mode) {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Context({ latencyHint: 'interactive' });
      this.master = createMaster(this.ctx);
      this.bank = new SampleBank(this.ctx);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const sound = `${genreId} ${mode}`;
    if (this.sound !== sound) {
      if (this.chain) this.chain.dispose();
      this.chain = buildChain(this.ctx, soundFor(genreId, mode), this.master);
      this.sound = sound;
    }
    return this.ctx;
  }

  /**
   * Plays the progression as soon as its notes are loaded. `onStart()` fires when the sound
   * starts, `onChord(index)` follows along (-1 when done), `onEnd()` when it stops.
   * Rejects when the notes can't be loaded.
   */
  async play(progression, { mode, bpm, loop = false, onStart, onChord, onEnd }) {
    this.stop();
    const ctx = this.ensure(progression.genre, mode);
    const sound = soundFor(progression.genre, mode);
    const session = { progression, mode, bpm, loop, onChord, onEnd, sources: [], cycles: [], timers: [], chord: -1 };
    this.session = session;
    try {
      await loadNotes(this.bank, progression.genre, fretsOf(progression), mode);
    } catch (error) {
      if (this.session === session) this.stop();
      throw error;
    }
    if (this.session !== session) return;

    session.takes = openTakes(ctx, sound, this.chain.input);
    if (sound.crackle) session.noise = startNoise(ctx, sound.crackle, session.takes.out);
    this.chain.setTempo(bpm);
    this.scheduleCycle(session, ctx.currentTime + 0.05);
    if (onStart) onStart();
    const follow = () => {
      if (this.session !== session) return;
      this.followChord(session);
      session.frame = requestAnimationFrame(follow);
    };
    session.frame = requestAnimationFrame(follow);
  }

  scheduleCycle(session, startAt) {
    const perf = buildPerformance(session.progression, { mode: session.mode, bpm: session.bpm });
    const sound = soundFor(session.progression.genre, session.mode);
    session.sources = session.sources
      .slice(-400)
      .concat(scheduleNotes(this.ctx, session.takes, perf.notes, startAt, sound, this.bank));
    session.cycles = session.cycles.slice(-2).concat({ start: startAt, bar: perf.bar, end: startAt + perf.duration });
    const end = startAt + perf.duration;
    const wait = (end - this.ctx.currentTime - LOOKAHEAD) * 1000;
    session.timers.push(
      setTimeout(() => {
        if (this.session !== session) return;
        if (session.loop) this.scheduleCycle(session, end);
        else session.timers.push(setTimeout(() => this.stop(), (LOOKAHEAD + (sound.release ?? RELEASE)) * 1000));
      }, Math.max(0, wait)),
    );
  }

  followChord(session) {
    const t = this.ctx.currentTime;
    let chord = -1;
    for (const c of session.cycles) {
      if (t >= c.start && t < c.end) chord = Math.min(3, Math.floor((t - c.start) / c.bar));
    }
    if (chord !== session.chord) {
      session.chord = chord;
      if (session.onChord) session.onChord(chord);
    }
  }

  /** Fades out a chord that was clicked; a chord still loading stays silent. */
  endPreview() {
    const takes = this.previewed && this.previewed.takes;
    this.previewed = null;
    if (!takes) return;
    takes.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    takes.close(500);
  }

  stop() {
    this.endPreview();
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.timers.forEach(clearTimeout);
    cancelAnimationFrame(session.frame);
    if (session.takes) {
      const now = this.ctx.currentTime;
      session.takes.out.gain.setTargetAtTime(0, now, 0.03);
      for (const source of session.sources) {
        try {
          source.stop(now + 0.2);
        } catch {
          // Already stopped.
        }
      }
      if (session.noise) session.noise.stop(now + 0.2);
      session.takes.close(500);
    }
    if (session.onChord) session.onChord(-1);
    if (session.onEnd) session.onEnd();
  }

  setTempo(bpm) {
    if (this.session) this.session.bpm = bpm;
    if (this.chain) this.chain.setTempo(bpm);
  }

  setLoop(loop) {
    if (this.session) this.session.loop = loop;
  }

  get playing() {
    return !!this.session;
  }

  /** One strum of a single chord, until it has rung out, another chord is clicked or playback starts. */
  async preview(progression, index, bpm) {
    this.endPreview();
    const ctx = this.ensure(progression.genre, 'strum');
    const sound = soundFor(progression.genre, 'strum');
    const frets = progression.chords[index].frets;
    const preview = { takes: null };
    this.previewed = preview;
    await loadNotes(this.bank, progression.genre, [frets], 'strum');
    if (this.previewed !== preview) return;
    this.chain.setTempo(bpm);
    preview.takes = openTakes(ctx, sound, this.chain.input);
    scheduleNotes(ctx, preview.takes, previewNotes(frets, progression.genre), ctx.currentTime + 0.02, sound, this.bank);
    preview.takes.close(4000);
  }
}

/** Renders a performance without playing it, for checking levels and output in the browser. */
export async function renderOffline(progression, { mode, bpm, tail = 2, sampleRate = 44100 }) {
  const perf = buildPerformance(progression, { mode, bpm });
  const ctx = new OfflineAudioContext(2, Math.ceil((perf.duration + tail) * sampleRate), sampleRate);
  const sound = soundFor(progression.genre, mode);
  const bank = new SampleBank(ctx);
  await loadNotes(bank, progression.genre, fretsOf(progression), mode);
  const chain = buildChain(ctx, sound, createMaster(ctx));
  chain.setTempo(bpm);
  const takes = openTakes(ctx, sound, chain.input);
  if (sound.crackle) startNoise(ctx, sound.crackle, takes.out);
  scheduleNotes(ctx, takes, perf.notes, 0.05, sound, bank, false);
  return ctx.startRendering();
}
