# Spec: Guitar Chords Creator

Agreed on 2026-11-22, before the build. The build ran autonomously from this plan.

## Goal

A website that generates guitar chord progressions of four different chords for the genres Neo Soul, LoFi, Punk, Post Rock, Shoegaze and Metalcore. The chords must fit the genre. The progression can be played normally (strummed) and as an arpeggio, and is shown as chord-box diagrams like the user's reference image (Em, E, Am, C boxes: chord name on top, `o` / `x` above a thick nut, dots on the frets).

## Decisions

| Topic | Decision |
|---|---|
| Metalcore tuning | Drop D (D A D G B E). Changed on 2026-11-22 with the user's OK while improving the Metalcore sound; every other genre uses standard tuning |
| Sound | Recorded guitars (Musyng Kite soundfont, CC BY-SA 3.0), hosted in the repo under `audio/`, with an instrument and effects per genre. Changed on 2026-11-22: the first version synthesised the guitar, and the user found it didn't sound good |
| Metalcore sound | Changed on 2026-11-25: the user wanted more of a rhythm guitar, with seamless transitions from chord to chord; it sounded like rock. Now two guitars recorded without an amp (CC0: power chords, palm mutes and single notes by Carbonthief), each through a simulated high-gain amp, playing without gaps |
| Neo Soul and Post Rock sound | Changed on 2026-11-25: the user found the two too similar (they shared the instrument and nearly all effects). Now a Stratocaster recorded clean (EGFxSet, CC BY 4.0) with its neck pickup for Neo Soul and its bridge pickup for Post Rock, and an arrangement, amp and space of their own |
| Extras | Tempo slider, loop, click a diagram to hear that chord, shareable link |
| Not included | Locking a chord while re-rolling the others; choosing the key |
| Stack | Plain HTML/CSS/JavaScript (ES modules), no framework, no build step, no dependencies |
| Hosting | GitHub Pages from the root of `main` (one-time switch in the repo settings by the owner) |
| Git | Commit on `main`, push `main` directly; Claude pushes without asking for this project |

## Page

- Genre picker (six buttons) and "New progression". Picking a genre also generates a progression and sets the genre's tempo.
- Key and Roman numerals above four chord cards (name, diagram, numeral, frets).
- Strum, Arpeggio and Stop; tempo 50 to 220 BPM; loop; the playing chord is highlighted.
- Works at phone width; light and dark themes; the chord cards stay paper white.

## Music

- Each genre: 5 to 8 Roman-numeral templates of four different chords, a key list per mode, a voicing taste, a default tempo, a strum rhythm and an arpeggio pattern.
- Keys that would need double accidentals or names like Fb and Cb are skipped for a template.
- Voicings come from a library of open and movable shapes, scored per genre and for hand movement around the loop.

| Genre | Character | Example |
|---|---|---|
| Neo Soul | 9ths, 11ths, 13ths, secondary dominants, tritone subs; never a plain triad; thumb-and-finger comping with slaps on 2 and 4 and sliding stabs | Dm9 – G13 – Cmaj9 – Am9 |
| LoFi | maj7, m7, 9ths, stepwise descents, borrowed iv | Fmaj7 – Em7 – Dm7 – Cmaj7 |
| Punk | power chords, I–V–vi–IV family, eighth-note downstrokes | E5 – B5 – C♯5 – A5 |
| Post Rock | add9, sus, maj7 with ringing open strings; two guitars, tremolo picking and volume swells, dotted-eighth echo, hall, a build-up over the progression | Gmaj7 – Em(add9) – Cadd9 – Dsus4 |
| Shoegaze | borrowed chords over droning open top strings, fuzz, chorus, huge reverb | Emaj7 – Cmaj7 – Aadd9 – Am(add9) |
| Metalcore | minor keys in Drop D, one-finger power chords and the open low D, Aeolian and Phrygian moves, ringing accents against palm-muted chugs without a gap | D5 – B♭5 – F5 – C5 |

## Neo Soul and Post Rock tone

From tone guides (guitarchalk, Seymour Duncan, Guitar World, MusicRadar) and measurements of guitar recordings of both styles (Freesound previews, used for analysis only). The two must stay apart on every line:

| | Neo Soul | Post Rock |
|---|---|---|
| Guitar | one, neck pickup, mid-neck positions | two, bridge pickup, open strings |
| Place | centre (left and right the same) | wide: side signal about 6 dB below the middle, left and right balanced |
| Space | dry: a short plate, silence after each slap | ping-pong dotted-eighth echo and a big dark hall, no gaps |
| Dynamics | about 35 dB between notes and gaps | a wall that grows by 3 to 5 dB over the four chords |
| Attack | sharp: rolled chords, thumb slaps, stabs sliding in from a fret below | soft: slow strums, tremolo picking and volume swells |
| Brightness | warm: spectral centre near 500 Hz | chiming: near 900 Hz when strummed |

## Metalcore tone

Measured on real metal rhythm guitars (Freesound previews, used for analysis only) and matched on renders of the page:

- The level never drops: chugs are at least as loud as ringing chords, and a chord change dips by a few dB for some milliseconds at most.
- Scooped, not mid-heavy: in the median 60 ms frame, 500 to 1500 Hz lies about 6 dB below 80 to 320 Hz (the first Drop D version had it 5 dB above, like rock), and so does 2 to 4 kHz.
- Steep roll-off above 4.5 kHz, from the `cabinet` curve in `js/sounds.js`, which was fitted to that target.
- The two sides are separate performances (correlation near 0 when strumming).

## Verification

- Unit tests (`node --test`): every diagram spells its chord name (bass note, defining tones, no foreign notes) and is playable (stretch ≤ 4 frets, ≤ 4 fingers); every progression has four different chords and follows its genre's rules over 1,500 random generations per genre; playback only plays the diagram's notes inside the chord's bar; every reachable note has a recording and a tuning correction; share links round-trip.
- Browser check: every genre and both playback modes, diagrams against the reference, no console errors, phone width, output levels evened out across genres.
- Not verifiable by the builder: how the sound pleases the ear.
