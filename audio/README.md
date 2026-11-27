# Guitar recordings

Files are named by MIDI note number (35 = low B in Drop B, 40 = low E, 78 = F♯5, fret 14 on the high E string). [`js/recordings.js`](../js/recordings.js) lists every folder with its range and how far each recording is out of tune; playback corrects that.

## Stratocaster, for Neo Soul, Post Rock and Shoegaze (CC BY 4.0)

| Folder | Content | Used by |
|---|---|---|
| `strat_neck` | neck pickup, notes 40 to 78 played around the fifth to ninth fret where possible | Neo Soul, Shoegaze (clean guitar) |
| `strat_bridge` | bridge pickup, notes 40 to 78 played on open strings and low frets where possible | Post Rock, Shoegaze (left fuzz guitar) |
| `strat_bridge_up` | a second performance of the same notes, further up the neck (notes 40 to 44, which exist only once, with the bridge and middle pickups) | Post Rock (second guitar when strumming), Shoegaze (right fuzz guitar) |

**Source:** [EGFxSet](https://zenodo.org/records/7044411) (the clean recordings) by Hegel Pedroza, Gerardo Meza and Iran R. Roman, described in "EGFxSet: Electric guitar tones processed through real effects of distortion, modulation, delay and reverb", ISMIR Late Breaking Demo, 2022. Project page: [egfxset.github.io](https://egfxset.github.io).

**License:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

**Changes:** 117 of the 690 clean recordings, chosen by string and fret; cut to start 4 ms before the attack and to 2.6 s / 2.0 s (neck) or 3.6 s / 2.6 s (bridge) below / from note 60, faded out, set to a common peak level, renamed to MIDI numbers, and saved as 22.05 kHz, 16-bit mono FLAC.

## Soundfont notes (CC BY-SA 3.0)

| Folder | Notes | Used by |
|---|---|---|
| `electric_guitar_jazz` | 38 to 78 | LoFi |
| `overdriven_guitar` | 38 to 78 | Punk |

**Source:** the Musyng Kite soundfont, as pre-rendered per note by the [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) project (`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/<instrument>-mp3/<note>.mp3`).

**License:** [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These files are shared under the same license.

**Changes:** files renamed from note names (`E2.mp3`) to MIDI numbers (`40.mp3`); the audio itself is unchanged.

## A guitar recorded without an amp, for Metalcore (CC0)

| Folder | Content |
|---|---|
| `di_guitar` | single notes of a seven-string guitar, 35 (low B) to 76; the full chords are built from them |

**Source:** recorded by Carbonthief and published in the [Renoise instrument library](https://files.renoise.com/forum/downloads/Instruments/) as [Seven String Guitar](https://files.renoise.com/forum/downloads/Instruments/Carbonthief-Seven_String_Guitar/).

**License:** CC0, public domain (stated on the page and in its `LICENSE.txt`). Credit isn't required; thank you anyway.

**Changes:** cut to start 6 ms before the pick attack and to 2.6 s, faded out over the last 0.3 s, set to a common peak level, and saved as 22.05 kHz, 16-bit mono FLAC.
