// Web Audio playback: each genre's effect chain, and the scheduling of a performance's notes
// on recorded guitar samples.

import { SOUNDS } from './sounds.js';
import { impulseResponse, seededRandom, vinylNoise } from './dsp.js';
import { buildPerformance, previewNotes } from './performance.js';
import { SampleBank, notesOf } from './samples.js';

const NOTE_LEVEL = 0.5;
const RELEASE = 0.12;
const MUTED_RELEASE = 0.06;
const LOOKAHEAD = 0.3;
const SINGLE_TAKE = [{ pan: 0, offset: 0, detune: 1 }];
// A second take, slightly late and detuned, on the other side: the width of a double-tracked guitar.
const DOUBLE_TAKES = [
  { pan: -0.6, offset: 0, detune: 1 },
  { pan: 0.6, offset: 0.016, detune: 1.0025 },
];

const fretsOf = (progression) => progression.chords.map((c) => c.frets);

function filter(ctx, type, frequency, Q) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = Q;
  return node;
}

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

function createMaster(ctx) {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.25;
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  compressor.connect(gain);
  gain.connect(ctx.destination);
  return compressor;
}

/** input -> [wobble] -> EQ -> dry + chorus + delay + reverb -> out -> destination. */
function buildChain(ctx, sound, destination) {
  const oscillators = [];
  const input = ctx.createGain();
  let head = input;
  const then = (node) => {
    head.connect(node);
    head = node;
  };

  if (sound.wobble) then(modulatedDelay(ctx, 0.01, sound.wobble.rate, sound.wobble.depth, oscillators));
  then(filter(ctx, 'highpass', sound.tone.highpass, 0.7));
  if (sound.tone.mid) {
    const mid = filter(ctx, 'peaking', sound.tone.mid.freq, 0.9);
    mid.gain.value = sound.tone.mid.gain;
    then(mid);
  }
  then(filter(ctx, 'lowpass', sound.tone.lowpass, 0.7));

  const out = ctx.createGain();
  out.gain.value = sound.level;
  head.connect(out);

  if (sound.chorus) {
    const wet = ctx.createGain();
    wet.gain.value = sound.chorus.mix;
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0.5;
    const chorus = modulatedDelay(ctx, 0.014, sound.chorus.rate, sound.chorus.depth, oscillators);
    head.connect(chorus);
    chorus.connect(wet);
    wet.connect(pan);
    pan.connect(out);
  }

  let echo = null;
  if (sound.delay) {
    echo = ctx.createDelay(2);
    const feedback = ctx.createGain();
    feedback.gain.value = sound.delay.feedback;
    const damp = filter(ctx, 'lowpass', 2800, 0.7);
    const wet = ctx.createGain();
    wet.gain.value = sound.delay.mix;
    head.connect(echo);
    echo.connect(damp);
    damp.connect(feedback);
    feedback.connect(echo);
    damp.connect(wet);
    wet.connect(out);
  }

  if (sound.reverb) {
    const reverb = ctx.createConvolver();
    const channels = impulseResponse({ sampleRate: ctx.sampleRate, seconds: sound.reverb.seconds, rng: seededRandom(7) });
    const ir = ctx.createBuffer(2, channels[0].length, ctx.sampleRate);
    channels.forEach((data, i) => ir.getChannelData(i).set(data));
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = sound.reverb.mix;
    head.connect(reverb);
    reverb.connect(wet);
    wet.connect(out);
  }

  out.connect(destination);
  return {
    input,
    setTempo(bpm) {
      if (echo) echo.delayTime.setTargetAtTime(Math.min(1.9, (sound.delay.beats * 60) / bpm), ctx.currentTime, 0.05);
    },
    dispose() {
      oscillators.forEach((lfo) => lfo.stop());
      out.disconnect();
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

/** Schedules notes (times relative to `startAt`) into `bus`; the samples must be loaded. */
function scheduleNotes(ctx, bus, notes, startAt, sound, bank, humanize = true) {
  const sources = [];
  for (const note of notes) {
    const sample = bank.get(sound.instrument, note.midi);
    const takes = sound.double ? DOUBLE_TAKES : SINGLE_TAKE;
    const jitter = humanize ? (Math.random() - 0.5) * 0.008 : 0;
    const level =
      NOTE_LEVEL * sample.gain * note.velocity * (sound.double ? 0.75 : 1) * (humanize ? 0.92 + Math.random() * 0.16 : 1);

    for (const take of takes) {
      const start = Math.max(ctx.currentTime, startAt + note.time + take.offset + jitter);
      const end = start + note.duration;
      const source = ctx.createBufferSource();
      source.buffer = sample.buffer;
      source.playbackRate.value = sample.rate * take.detune;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(level, start + 0.002);
      envelope.gain.setValueAtTime(level, end);
      envelope.gain.setTargetAtTime(0, end, (note.muted ? MUTED_RELEASE : RELEASE) / 4);
      if (note.muted) {
        // Palm mute: the hand on the bridge dulls the string.
        const dull = filter(ctx, 'lowpass', 700, 0.6);
        source.connect(dull);
        dull.connect(envelope);
      } else {
        source.connect(envelope);
      }
      if (take.pan) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = take.pan;
        envelope.connect(pan);
        pan.connect(bus);
      } else {
        envelope.connect(bus);
      }
      source.start(start, sample.offset);
      source.stop(end + RELEASE * 2);
      sources.push(source);
    }
  }
  return sources;
}

export class Player {
  constructor() {
    this.ctx = null;
    this.genre = null;
    this.session = null;
  }

  static get supported() {
    return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
  }

  /** Creates the audio context on first use (it must start from a click) and the genre's chain. */
  ensure(genreId) {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Context({ latencyHint: 'interactive' });
      this.master = createMaster(this.ctx);
      this.bank = new SampleBank(this.ctx);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.genre !== genreId) {
      if (this.chain) this.chain.dispose();
      this.chain = buildChain(this.ctx, SOUNDS[genreId], this.master);
      this.genre = genreId;
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
    const ctx = this.ensure(progression.genre);
    const sound = SOUNDS[progression.genre];
    const session = { progression, mode, bpm, loop, onChord, onEnd, sources: [], cycles: [], timers: [], chord: -1 };
    this.session = session;
    try {
      await this.bank.load(sound.instrument, notesOf(fretsOf(progression)));
    } catch (error) {
      if (this.session === session) this.stop();
      throw error;
    }
    if (this.session !== session) return;

    session.bus = ctx.createGain();
    session.bus.connect(this.chain.input);
    if (sound.crackle) session.noise = startNoise(ctx, sound.crackle, session.bus);
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
    const sound = SOUNDS[session.progression.genre];
    session.sources = session.sources
      .slice(-400)
      .concat(scheduleNotes(this.ctx, session.bus, perf.notes, startAt, sound, this.bank));
    session.cycles = session.cycles.slice(-2).concat({ start: startAt, bar: perf.bar, end: startAt + perf.duration });
    const end = startAt + perf.duration;
    const wait = (end - this.ctx.currentTime - LOOKAHEAD) * 1000;
    session.timers.push(
      setTimeout(() => {
        if (this.session !== session) return;
        if (session.loop) this.scheduleCycle(session, end);
        else session.timers.push(setTimeout(() => this.stop(), (LOOKAHEAD + RELEASE) * 1000));
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

  stop() {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.timers.forEach(clearTimeout);
    cancelAnimationFrame(session.frame);
    if (session.bus) {
      const now = this.ctx.currentTime;
      session.bus.gain.setTargetAtTime(0, now, 0.03);
      for (const source of session.sources) {
        try {
          source.stop(now + 0.2);
        } catch {
          // Already stopped.
        }
      }
      if (session.noise) session.noise.stop(now + 0.2);
      setTimeout(() => session.bus.disconnect(), 500);
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

  /** One strum of a single chord. */
  async preview(progression, index, bpm) {
    const ctx = this.ensure(progression.genre);
    const sound = SOUNDS[progression.genre];
    const frets = progression.chords[index].frets;
    await this.bank.load(sound.instrument, notesOf([frets]));
    if (this.genre !== progression.genre) return;
    this.chain.setTempo(bpm);
    const bus = ctx.createGain();
    bus.connect(this.chain.input);
    scheduleNotes(ctx, bus, previewNotes(frets, progression.genre), ctx.currentTime + 0.02, sound, this.bank);
    setTimeout(() => bus.disconnect(), 4000);
  }
}

/** Renders a performance without playing it, for checking levels and output in the browser. */
export async function renderOffline(progression, { mode, bpm, tail = 2, sampleRate = 44100 }) {
  const perf = buildPerformance(progression, { mode, bpm });
  const ctx = new OfflineAudioContext(2, Math.ceil((perf.duration + tail) * sampleRate), sampleRate);
  const sound = SOUNDS[progression.genre];
  const bank = new SampleBank(ctx);
  await bank.load(sound.instrument, notesOf(fretsOf(progression)));
  const chain = buildChain(ctx, sound, createMaster(ctx));
  chain.setTempo(bpm);
  const bus = ctx.createGain();
  bus.connect(chain.input);
  if (sound.crackle) startNoise(ctx, sound.crackle, bus);
  scheduleNotes(ctx, bus, perf.notes, 0.05, sound, bank, false);
  return ctx.startRendering();
}
