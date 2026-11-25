// A high-gain guitar amp. The whole chord runs through one chain, so its strings distort together
// (the growl of a real power chord) and the sound holds its level until the next stroke.
//
// input -> tighten -> boost -> clip -> filter -> clip -> cabinet

import { cabinetImpulse, clipCurve, seededRandom } from './dsp.js';
import { BUTTERWORTH, filter, gain, series } from './nodes.js';

// The clipping curves cover inputs of up to +-CLIP_RANGE, where tanh is as good as flat.
const CLIP_RANGE = 5;
const CABINET_RIPPLE = 1.5;

const cabinets = new WeakMap();

/** A speaker cabinet; every seed is a slightly different speaker and microphone position. */
function cabinetBuffer(ctx, points, seed) {
  if (!cabinets.has(ctx)) cabinets.set(ctx, new Map());
  const known = cabinets.get(ctx);
  const key = JSON.stringify([points, seed]);
  if (!known.has(key)) {
    const impulse = cabinetImpulse({
      sampleRate: ctx.sampleRate,
      points,
      ripple: CABINET_RIPPLE,
      rng: seededRandom(seed),
    });
    const buffer = ctx.createBuffer(1, impulse.length, ctx.sampleRate);
    buffer.getChannelData(0).set(impulse);
    known.set(key, buffer);
  }
  return known.get(key);
}

function clipper(ctx, bias) {
  const node = ctx.createWaveShaper();
  node.curve = clipCurve({ range: CLIP_RANGE, bias });
  node.oversample = '4x';
  return node;
}

/** @returns {{ input: AudioNode, output: AudioNode }} */
export function createAmp(ctx, { tighten, boost, drive, between, cabinet }, seed) {
  const input = filter(ctx, 'highpass', tighten, BUTTERWORTH);
  const speaker = ctx.createConvolver();
  speaker.normalize = false;
  speaker.buffer = cabinetBuffer(ctx, cabinet, seed);
  const output = series(
    input,
    filter(ctx, 'peaking', boost.freq, boost.q, boost.gain),
    gain(ctx, drive[0] / CLIP_RANGE),
    clipper(ctx, 0.25),
    filter(ctx, 'highpass', between.highpass, BUTTERWORTH),
    filter(ctx, 'lowpass', between.lowpass, BUTTERWORTH),
    gain(ctx, drive[1] / CLIP_RANGE),
    clipper(ctx, 0),
    speaker,
  );
  return { input, output };
}
