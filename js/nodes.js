// Small Web Audio helpers.

/** For lowpass and highpass, Web Audio takes Q in dB; this is the flattest response. */
export const BUTTERWORTH = -3.01;

export function filter(ctx, type, frequency, Q, gain = 0) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = Q;
  node.gain.value = gain;
  return node;
}

export function gain(ctx, value) {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

/** Connects the nodes one after the other and returns the last. */
export function series(...nodes) {
  for (let i = 1; i < nodes.length; i++) nodes[i - 1].connect(nodes[i]);
  return nodes[nodes.length - 1];
}
