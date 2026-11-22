# Guitar recordings

One MP3 per note, named by MIDI note number (40 = low E, 78 = F♯5, fret 14 on the high E string), for four instruments:

| Folder | Used by |
|---|---|
| `electric_guitar_clean` | Neo Soul, Post Rock |
| `electric_guitar_jazz` | LoFi |
| `overdriven_guitar` | Punk, Shoegaze |
| `distortion_guitar` | Metalcore |

**Source:** the Musyng Kite soundfont, as pre-rendered per note by the [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) project (`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/<instrument>-mp3/<note>.mp3`).

**License:** [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These files are shared under the same license.

**Changes:** files renamed from note names (`E2.mp3`) to MIDI numbers (`40.mp3`); the audio itself is unchanged. Some recordings are a little out of tune (up to 18 cents); playback corrects them with the measurements in [`js/tuning.js`](../js/tuning.js).
