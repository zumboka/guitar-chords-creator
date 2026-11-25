# Guitar recordings

Files are named by MIDI note number (38 = low D in Drop D, 40 = low E, 78 = F♯5, fret 14 on the high E string). [`js/recordings.js`](../js/recordings.js) lists every folder with its range and how far each recording is out of tune; playback corrects that.

## Soundfont notes (CC BY-SA 3.0)

| Folder | Notes | Used by |
|---|---|---|
| `electric_guitar_clean` | 38 to 78 | Neo Soul, Post Rock |
| `electric_guitar_jazz` | 38 to 78 | LoFi |
| `overdriven_guitar` | 38 to 78 | Punk, Shoegaze |

**Source:** the Musyng Kite soundfont, as pre-rendered per note by the [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) project (`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/<instrument>-mp3/<note>.mp3`).

**License:** [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These files are shared under the same license.

**Changes:** files renamed from note names (`E2.mp3`) to MIDI numbers (`40.mp3`); the audio itself is unchanged.

## Guitars recorded without an amp, for Metalcore (CC0)

| Folder | Content |
|---|---|
| `power_chord_a`, `power_chord_b` | two performances of each ringing power chord (root, fifth, octave), by root: 40 (E) to 51 (D♯) |
| `palm_mute_a`, `palm_mute_b` | the same chords palm-muted |
| `di_guitar` | single notes, 38 to 71 |

**Source:** recorded by Carbonthief and published in the [Renoise instrument library](https://files.renoise.com/forum/downloads/Instruments/): the chords from [Power Chords Std DI](https://files.renoise.com/forum/downloads/Instruments/Carbonthief-Power_Chords_Std_DI/), the single notes from [Seven String Guitar](https://files.renoise.com/forum/downloads/Instruments/Carbonthief-Seven_String_Guitar/).

**License:** CC0, public domain (stated on both pages and in their `LICENSE.txt`). Credit isn't required; thank you anyway.

**Changes:** cut to start 6 ms before the pick attack and to 5 s (chords), 1 s (palm mutes) or 1.8 s (single notes), faded out, set to a common peak level, and saved as 22.05 kHz, 16-bit mono FLAC.
