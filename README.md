# Guitar Chords Creator

Generate four-chord guitar progressions that actually sound like your genre, see them as chord diagrams, and hear them strummed or picked.

**Live:** https://zumboka.github.io/guitar-chords-creator/

- **Six genres:** Neo Soul, LoFi, Punk, Post Rock, Shoegaze, Metalcore.
- **Four different chords** each time, in a key that suits the genre, with Roman numerals.
- **Chord diagrams** in the classic chord-box style: `o` / `x` above the nut, dots, barres, and a fret label (`5fr`) higher up the neck.
- **Playback** strummed (with a rhythm typical of the genre) or as an arpeggio, with tempo, loop, and click-a-chord to hear one on its own.
- **Share links:** the URL holds the exact progression and diagrams.

Standard tuning throughout. The sound comes from recordings of real electric guitars (clean, jazz, overdriven and distorted), one per note, tuned and levelled as they load, with effects per genre: chorus, delay, reverb, and tape wobble with vinyl crackle for LoFi.

## How the chords fit the genre

| Genre | What makes it fit | Example |
|---|---|---|
| Neo Soul | 9th, 11th and 13th chords, secondary dominants, tritone substitutes; never a plain triad | Dm9 – G13 – Cmaj9 – Am9 |
| LoFi | mellow maj7, m7 and 9th chords, stepwise descents, the borrowed minor iv | Fmaj7 – Em7 – Dm7 – Cmaj7 |
| Punk | power chords, the I–V–vi–IV family, relentless downstrokes | E5 – B5 – C♯5 – A5 |
| Post Rock | add9, sus and maj7 chords with ringing open strings | Gmaj7 – Em(add9) – Cadd9 – Dsus4 |
| Shoegaze | borrowed chords with the open B and E strings droning through them, fuzz and huge reverb | Emaj7 – Cmaj7 – Aadd9 – Am(add9) |
| Metalcore | minor-key power chords on the low strings, Aeolian and Phrygian moves, palm-muted chugs | E5 – C5 – G5 – D5 |

Each genre has 5 to 8 progression patterns in Roman numerals (`js/genres.js`). One is picked at random, put into a random key from the genre's list, and every chord gets a shape from the voicing library (`js/voicings.js`), chosen for the genre's taste (position on the neck, open strings, bass string) and for smooth movement from chord to chord.

## Correctness

`npm test` runs Node's built-in test runner (no dependencies to install). Among other things it checks that:

- every chord shape sounds exactly its chord name: the right bass note, every defining tone, nothing foreign;
- every shape is playable: a stretch of at most 4 frets and at most 4 fingers;
- every progression has four different chords and follows its genre's rules, over 1,500 random progressions per genre;
- playback only ever plays the diagram's own notes, inside the chord's bar, one note per string at a time;
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
js/samples.js      loads the recorded notes
js/tuning.js       measured tuning of every recording
js/dsp.js          sample trimming and levelling, reverb and vinyl noise
js/sounds.js       each genre's instrument and effects
js/audio.js        Web Audio playback
audio/             the guitar recordings (see audio/README.md)
js/share.js        share links
js/main.js         page wiring
tests/             node --test
docs/spec.md       the plan this was built from
```

## Credits

Guitar recordings: the Musyng Kite soundfont via [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Details in [audio/README.md](audio/README.md).
