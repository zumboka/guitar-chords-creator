// Page wiring: genre buttons, the progression and its diagrams, playback and share links.

import { GENRES, GENRE_IDS } from './genres.js';
import { generateProgression } from './generator.js';
import { diagramSVG } from './diagram.js';
import { decodeState, encodeState } from './share.js';
import { TUNINGS, keyLabel, pretty } from './theory.js';
import { Player } from './audio.js';
import { recordingsNeeded } from './sounds.js';
import { prefetch } from './samples.js';

const $ = (id) => document.getElementById(id);
const player = new Player();
const state = { genre: GENRE_IDS[0], progression: null, bpm: GENRES[GENRE_IDS[0]].tempo, playing: null };

const fretLabel = (frets) => frets.map((f) => (f == null ? 'x' : f)).join(' ');

function renderGenres() {
  $('genres').replaceChildren(
    ...GENRE_IDS.map((id) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'genre';
      button.dataset.genre = id;
      button.textContent = GENRES[id].name;
      button.addEventListener('click', () => newProgression(id));
      return button;
    }),
  );
}

function render() {
  const { progression } = state;
  const tuningId = GENRES[state.genre].tuning;
  const tuning = TUNINGS[tuningId];
  document.body.dataset.genre = state.genre;
  for (const button of $('genres').children) {
    button.setAttribute('aria-pressed', String(button.dataset.genre === state.genre));
  }
  $('blurb').textContent = GENRES[state.genre].blurb;
  $('key').textContent = `Key of ${pretty(keyLabel(progression.key))}`;
  $('romans').textContent = progression.chords.map((c) => pretty(c.roman)).join(' – ');
  $('tuning').hidden = tuningId === 'standard';
  $('tuning').textContent = `${tuning.name} tuning: ${tuning.strings.join(' ')}`;
  $('chords').replaceChildren(
    ...progression.chords.map((chord, index) => {
      const name = pretty(chord.name);
      const roman = pretty(chord.roman);
      const item = document.createElement('li');
      item.innerHTML = `
        <button type="button" class="chord" aria-label="${name} (${roman}), play this chord">
          <span class="chord-name">${name}</span>
          ${diagramSVG(chord.frets, `${name}: ${fretLabel(chord.frets)}`, tuningId)}
          <span class="chord-roman">${roman}</span>
          <span class="chord-frets" aria-hidden="true">${fretLabel(chord.frets)}</span>
        </button>`;
      item.querySelector('.chord').addEventListener('click', () => previewChord(index));
      return item;
    }),
  );
  $('tempo').value = state.bpm;
  $('tempo-value').textContent = state.bpm;
  updateLink();
  // Download the recordings now, so pressing play doesn't have to wait for them.
  const frets = progression.chords.map((c) => c.frets);
  for (const mode of ['strum', 'arpeggio']) {
    for (const [instrument, notes] of recordingsNeeded(state.genre, mode, frets, tuningId)) prefetch(instrument, notes);
  }
}

function updateLink() {
  history.replaceState(null, '', `#${encodeState(state.progression, state.bpm)}`);
}

/** A fresh progression; picking another genre also resets the tempo to that genre's own. */
function newProgression(genre = state.genre) {
  stop();
  if (genre !== state.genre) {
    state.genre = genre;
    state.bpm = GENRES[genre].tempo;
  }
  state.progression = generateProgression(genre, Math.random, state.progression);
  render();
}

function setPlaying(mode, loading = false) {
  state.playing = mode;
  for (const id of ['play-strum', 'play-arpeggio']) {
    const button = $(id);
    const active = button.dataset.mode === mode;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-busy', String(active && loading));
  }
  $('stop').disabled = !mode;
}

function highlight(index) {
  $('chords')
    .querySelectorAll('.chord')
    .forEach((card, i) => card.classList.toggle('is-playing', i === index));
}

function play(mode) {
  if (state.playing === mode) {
    stop();
    return;
  }
  try {
    player
      .play(state.progression, {
        mode,
        bpm: state.bpm,
        loop: $('loop').checked,
        onStart: () => setPlaying(mode),
        onChord: highlight,
        onEnd: () => setPlaying(null),
      })
      .catch((error) => {
        console.error(error);
        toast('The guitar sounds could not be loaded');
      });
    setPlaying(mode, true);
  } catch (error) {
    console.error(error);
    setPlaying(null);
    toast('Audio could not start in this browser');
  }
}

function stop() {
  player.stop();
}

function previewChord(index) {
  stop();
  try {
    player.preview(state.progression, index, state.bpm).catch((error) => {
      console.error(error);
      toast('The guitar sounds could not be loaded');
    });
  } catch (error) {
    console.error(error);
  }
  highlight(index);
  clearTimeout(previewChord.timer);
  previewChord.timer = setTimeout(() => {
    if (!state.playing) highlight(-1);
  }, 900);
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 1800);
}

function applyShared(shared) {
  state.genre = shared.progression.genre;
  state.progression = shared.progression;
  state.bpm = shared.bpm;
}

renderGenres();
const shared = decodeState(location.hash);
if (shared) applyShared(shared);
else state.progression = generateProgression(state.genre);
render();

$('generate').addEventListener('click', () => newProgression());
$('play-strum').addEventListener('click', () => play('strum'));
$('play-arpeggio').addEventListener('click', () => play('arpeggio'));
$('stop').addEventListener('click', stop);
$('tempo').addEventListener('input', (event) => {
  state.bpm = Number(event.target.value);
  $('tempo-value').textContent = state.bpm;
  player.setTempo(state.bpm);
});
$('tempo').addEventListener('change', updateLink);
$('loop').addEventListener('change', (event) => player.setLoop(event.target.checked));
$('share').addEventListener('click', async () => {
  updateLink();
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Link copied');
  } catch {
    toast('Copy the address from the address bar to share');
  }
});

// A pasted link in the same tab.
window.addEventListener('hashchange', () => {
  const next = decodeState(location.hash);
  if (next && encodeState(next.progression, next.bpm) !== encodeState(state.progression, state.bpm)) {
    stop();
    applyShared(next);
    render();
  }
});

// Background tabs throttle timers, which would make a loop stutter.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});

if (!Player.supported) {
  for (const id of ['play-strum', 'play-arpeggio']) $(id).disabled = true;
  $('audio-note').hidden = false;
}
