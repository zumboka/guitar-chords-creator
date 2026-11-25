// A guitar amp, from clean to high gain. The whole chord runs through one chain, so its strings
// distort together (the growl of a real power chord) and, with enough gain, the sound holds its level
// until the next stroke.
//
// input -> tighten -> [boost] -> clip, [filter -> clip ...] -> cabinet

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

function clipper(ctx, bias, oversample) {
  const node = ctx.createWaveShaper();
  node.curve = clipCurve({ range: CLIP_RANGE, bias });
  node.oversample = oversample;
  return node;
}

/** One clipping stage per entry of `drive`. @returns {{ input: AudioNode, output: AudioNode }} */
export function createAmp(ctx, { tighten, boost, drive, between, cabinet }, seed) {
  const input = filter(ctx, 'highpass', tighten, BUTTERWORTH);
  const nodes = [input];
  // The harder the clipping, the higher the overtones that would fold back.
  const oversample = drive.length > 1 ? '4x' : '2x';
  if (boost) nodes.push(filter(ctx, 'peaking', boost.freq, boost.q, boost.gain));
  drive.forEach((amount, stage) => {
    if (stage) {
      nodes.push(filter(ctx, 'highpass', between.highpass, BUTTERWORTH));
      nodes.push(filter(ctx, 'lowpass', between.lowpass, BUTTERWORTH));
    }
    nodes.push(gain(ctx, amount / CLIP_RANGE), clipper(ctx, stage ? 0 : 0.25, oversample));
  });
  const speaker = ctx.createConvolver();
  speaker.normalize = false;
  speaker.buffer = cabinetBuffer(ctx, cabinet, seed);
  return { input, output: series(...nodes, speaker) };
}
