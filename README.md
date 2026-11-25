# Guitar Chords Creator

Generate four-chord guitar progressions that actually sound like your genre, see them as chord diagrams, and hear them strummed or picked.

**Live:** https://zumboka.github.io/guitar-chords-creator/

- **Six genres:** Neo Soul, LoFi, Punk, Post Rock, Shoegaze, Metalcore.
- **Four different chords** each time, in a key that suits the genre, with Roman numerals.
- **Chord diagrams** in the classic chord-box style: `o` / `x` above the nut, dots, barres, and a fret label (`5fr`) higher up the neck.
- **Playback** strummed (with a rhythm typical of the genre) or as an arpeggio, with tempo, loop, and click-a-chord to hear one on its own.
- **Share links:** the URL holds the exact progression and diagrams.

Standard tuning, except Metalcore in Drop D (the low string tuned down to D; its diagrams name the strings). The sound comes from guitar recordings, tuned and levelled as they load, with effects per genre: chorus, compression, echo, reverb, and tape wobble with vinyl crackle for LoFi. Most genres play one recorded note per string. Strumming always plays the whole chord, in a rhythm typical of the genre. Neo Soul is one Stratocaster close up (neck pickup, a warm compressed amp, a slow chorus, slaps on the backbeat); Post Rock is two far apart (bridge pickup, a chiming amp, bouncing echoes, a hall, a build-up from quiet to loud); Shoegaze is two fuzz guitars far apart, swaying as if on the tremolo arm, with a crisp clean one between them and a big dark hall. Metalcore plays two rhythm guitars, left and right: whole power chords and palm mutes recorded straight from the guitar, each side through its own simulated high-gain amp and speaker, so the strings distort together.

## How the chords fit the genre

| Genre | What makes it fit | Example |
|---|---|---|
| Neo Soul | 9th, 11th and 13th chords, secondary dominants, tritone substitutes; never a plain triad; a lazy, swung strum with slaps on 2 and 4 | Dm9 – G13 – Cmaj9 – Am9 |
| LoFi | mellow maj7, m7 and 9th chords, stepwise descents, the borrowed minor iv | Fmaj7 – Em7 – Dm7 – Cmaj7 |
| Punk | power chords, the I–V–vi–IV family, relentless downstrokes | E5 – B5 – C♯5 – A5 |
| Post Rock | add9, sus and maj7 chords over open strings; slow, echoing strums that build up, a ringing arpeggio | Gmaj7 – Em(add9) – Cadd9 – Dsus4 |
| Shoegaze | borrowed chords with the open B and E strings droning through them, a swaying wall of fuzz under a crisp clean guitar, huge reverb | Emaj7 – Cmaj7 – Aadd9 – Am(add9) |
| Metalcore | Drop D: one-finger power chords and the open low D, Aeolian and Phrygian moves, ringing accents against palm-muted chugs without a gap | D5 – B♭5 – F5 – C5 |

Each genre has 5 to 8 progression patterns in Roman numerals (`js/genres.js`). One is picked at random, put into a random key from the genre's list, and every chord gets a shape from the voicing library (`js/voicings.js`), chosen for the genre's taste (position on the neck, open strings, bass string) and for smooth movement from chord to chord.

## Correctness

`npm test` runs Node's built-in test runner (no dependencies to install). Among other things it checks that:

- every chord shape sounds exactly its chord name: the right bass note, every defining tone, nothing foreign;
- every shape is playable: a stretch of at most 4 frets and at most 4 fingers;
- every progression has four different chords and follows its genre's rules, over 1,500 random progressions per genre;
- playback only ever plays the diagram's own notes, inside the chord's bar, one note per string and guitar at a time;
- strumming plays whole chords only: every string of the diagram, or its top four on an upstroke (Neo Soul also slaps them all);
- Metalcore never leaves a gap (every stroke lasts until the next, over chord changes and around the loop), and its two guitars never play the same recording at once;
- every note a chord shape can reach has a recording with a tuning correction, and share links survive a round trip.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```sh
python -m http.server 8000
# open http://localhost:8000
```

## Project layout

```
index.html, css/style.css
js/theory.js       notes, keys, Roman numerals, chord qualities
js/voicings.js     chord shapes and the checks that they are right and playable
js/genres.js       progressions, keys, voicing taste, tempo and rhythms per genre
js/generator.js    picks a progression and its shapes
js/diagram.js      chord-box SVG
js/performance.js  turns a progression into timed notes (strum / arpeggio)
js/samples.js      loads the recordings
js/recordings.js   every recorded instrument: range, format and measured tuning
js/dsp.js          sample trimming and levelling, reverb, vinyl noise, clipping curves and speaker cabinets
js/sounds.js       each genre's instrument and effects, and which recording plays a stroke
js/amp.js          the guitar amp, from clean to high gain
js/audio.js        Web Audio playback
js/nodes.js        small Web Audio helpers
audio/             the guitar recordings (see audio/README.md)
js/share.js        share links
js/main.js         page wiring
tests/             node --test
docs/spec.md       the plan this was built from
```

## Credits

Guitar recordings: [EGFxSet](https://zenodo.org/records/7044411) by Hegel Pedroza, Gerardo Meza and Iran R. Roman ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) for Neo Soul, Post Rock and Shoegaze, the Musyng Kite soundfont via [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), and the power chords, palm mutes and single notes by Carbonthief for Metalcore ([CC0](https://files.renoise.com/forum/downloads/Instruments/Carbonthief-Power_Chords_Std_DI/)). Details in [audio/README.md](audio/README.md).
