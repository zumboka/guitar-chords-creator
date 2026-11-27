# Spec: Guitar Chords Creator

Agreed on 2026-11-22, before the build. The build ran autonomously from this plan.

## Goal

A website that generates guitar chord progressions of four different chords for the genres Neo Soul, LoFi, Punk, Post Rock, Shoegaze and Metalcore. The chords must fit the genre. The progression can be played normally (strummed) and as an arpeggio, and is shown as chord-box diagrams like the user's reference image (Em, E, Am, C boxes: chord name on top, `o` / `x` above a thick nut, dots on the frets).

## Decisions

| Topic | Decision |
|---|---|
| Metalcore tuning | Drop C (C G C F A D), the user's request on 2026-11-25, to make it more fitting and natural. Drop D (D A D G B E) from 2026-11-22, with the user's OK; every other genre uses standard tuning |
| Sound | Recorded guitars (Musyng Kite soundfont, CC BY-SA 3.0), hosted in the repo under `audio/`, with an instrument and effects per genre. Changed on 2026-11-22: the first version synthesised the guitar, and the user found it didn't sound good |
| Metalcore sound | Changed on 2026-11-25: the user wanted more of a rhythm guitar, with seamless transitions from chord to chord; it sounded like rock. Now two guitars recorded without an amp (CC0: power chords, palm mutes and single notes by Carbonthief), each through a simulated high-gain amp, playing without gaps. Later that day the user asked for chords, sound and strumming typical of the genre, the chords most importantly: now the progressions of metalcore songs in Drop C, mostly C minor; the lowest chords recorded on a seven-string guitar instead of moved down; more bite; chug groups opened by ringing accents. On 2026-11-27 the user pointed to the chorus of Jared Dines' "Metalcore VS Deathcore" (1:47 to 2:05) for how the chords should be and sound: now full minor and major chords, among them that chorus's two progressions, built from single notes of the seven-string guitar through the same amps and left to ring on every beat at 184 BPM; the power chords and palm mutes are gone ("Metalcore chords and rhythm") |
| Neo Soul and Post Rock sound | Changed on 2026-11-25: the user found the two too similar (they shared the instrument and nearly all effects). Now a Stratocaster recorded clean (EGFxSet, CC BY 4.0) with its neck pickup for Neo Soul and its bridge pickup for Post Rock, and an amp, rhythm and space of their own |
| Shoegaze sound | Changed on 2026-11-25: the user found the guitar a bit plain and not as crisp as the other genres (a soundfont's overdriven guitar, doubled: nearly everything below 500 Hz and no pick attack). Now the Stratocaster recordings as two fuzz guitars and a bright clean one |
| Strumming | Decided by the user on 2026-11-25: chords are played normally and typical of the genre, with the genre's typical sound; no extra effects (such as the ringing of a second, tremolo-picked guitar) and no extra notes (bass notes, stabs, slides). And on 2026-11-25: every genre needs its typical character when strummed; the bare strums of Neo Soul and Post Rock had none. So whole chords only (a test enforces it for every genre), in the sound world the user likes in the arpeggios |
| Extras | Tempo slider, loop, click a diagram to hear that chord, shareable link; saving the chords as an image (a PNG), the user's request on 2026-11-27 |
| Not included | Locking a chord while re-rolling the others; choosing the key |
| Stack | Plain HTML/CSS/JavaScript (ES modules), no framework, no build step, no dependencies |
| Hosting | GitHub Pages from the root of `main` (one-time switch in the repo settings by the owner) |
| Git | Commit on `main`, push `main` directly; Claude pushes without asking for this project |

## Page

- Genre picker (six buttons) and "New progression". Picking a genre also generates a progression and sets the genre's tempo.
- Key and Roman numerals above four chord cards (name, diagram, numeral, frets).
- Strum, Arpeggio and Stop; tempo 50 to 220 BPM; loop; the playing chord is highlighted.
- "Save as image" under the cards downloads a PNG (1920 px wide) of the genre, key, numerals, tuning and the four chord cards, light like printed chord boxes in either theme (`js/sheet.js`).
- Works at phone width; light and dark themes; the chord cards stay paper white.

## Music

- Each genre: 5 to 8 Roman-numeral templates of four different chords, a key list per mode, a voicing taste, a default tempo, a strum rhythm and an arpeggio pattern.
- Keys that would need double accidentals or names like Fb and Cb are skipped for a template.
- Voicings come from a library of open and movable shapes, scored per genre and for hand movement around the loop.

| Genre | Character | Example |
|---|---|---|
| Neo Soul | 9ths, 11ths, 13ths, secondary dominants, tritone subs; never a plain triad; a lazy, swung strum with slaps on 2 and 4 | Dm9 – G13 – Cmaj9 – Am9 |
| LoFi | maj7, m7, 9ths, stepwise descents, borrowed iv | Fmaj7 – Em7 – Dm7 – Cmaj7 |
| Punk | power chords, I–V–vi–IV family, eighth-note downstrokes | E5 – B5 – C♯5 – A5 |
| Post Rock | add9, sus, maj7 over open strings; slow, echoing strums that build up, a ringing arpeggio | Gmaj7 – Em(add9) – Cadd9 – Dsus4 |
| Shoegaze | borrowed chords over droning open top strings, a swaying wall of fuzz under a crisp clean guitar, huge reverb | Emaj7 – Cmaj7 – Aadd9 – Am(add9) |
| Metalcore | Drop C, mostly C minor on the open low string; emotional chorus progressions (i7–IV–v7–VI and iv–III–v–VI from the user's example, VI–VII–i, the minor v, Phrygian half-steps) as full minor and major chords, ringing on every beat without a gap | Cm7 – F – Gm7 – A♭ |

## Neo Soul and Post Rock tone

From tone guides (guitarchalk, Seymour Duncan, Fender Play, Pickup Music, Guitar World, MusicRadar, Riffhard) and measurements of guitar recordings (Freesound previews, used for analysis only). The two must stay apart on every line. When strumming:

| | Neo Soul | Post Rock |
|---|---|---|
| Guitar | one, neck pickup, mid-neck positions, warm clean amp with compression and a slow chorus | two performances of the same chords, bridge pickup, a chiming amp that breaks up when played hard |
| Place | centre, barely widened by the chorus | wide: side signal about 6 dB below the middle, left and right balanced |
| Rhythm | rolled chords on 1 and 3, slaps on 2 and 4 that stop them, swung upstrokes into the next chord | slow downstrokes that leave room for the echo, eighths in the last bar |
| Space | a plate, and silence after each slap (about 30 dB between chord and gap) | ping-pong dotted-eighth echo and a hall, 11 to 13 dB down 0.4 s after the last chord and about 20 dB after 1 s; more than that rings |
| Dynamics | even | from quiet to loud over the four chords (3 to 6 dB) |
| Brightness | warm: spectral centre near 500 to 600 Hz | crisp: near 750 to 850 Hz |

The arpeggios, which the user is happy with, go further: Post Rock rings into chords faded in by the second guitar, with more echo and a bigger hall.

## Shoegaze tone

From tone guides (Sweetwater, Riffhard, Guitar World, Perfect Circuit, guitarguitar: crisp, clean sounds layered over murky, modulated ones; fuzz with scooped mids; the tremolo arm; big reverb) and measurements of shoegaze and dream pop guitars (Freesound previews, used for analysis only). When strumming:

- Layers: two fuzz guitars far apart, two performances of the same chords, and a bright clean one in the middle.
- Crisp: every strum rises about 8 dB out of the wall at 2 to 8 kHz (Post Rock 5, the soundfont version 2), and the spectral centre lies near 700 to 900 Hz (it was 320).
- Scooped: dense from 160 to 400 Hz, a dip around 1 kHz, presence from 1.6 to 4 kHz, a steep roll-off above 4.5 kHz.
- Fuzz with clear chords: from 250 to 600 Hz the chord's partials carry at least 8 dB more than everything between them.
- Movement: partials sway by about 26 cents (16 to 46 in the references). Only the fuzz guitars have vibrato; the clean one holds the chord in tune. More chorus than now blurs the attack.
- A wall: the level varies by about 4 dB, every string drones until it is hit again, and the hall is 11 to 13 dB down 0.4 s after the last chord, 13 to 16 dB after 1 s.

The arpeggio is the same three guitars with less fuzz, so its overlapping notes stay apart.

## Metalcore chords and rhythm

The user's example (2026-11-27): Jared Dines, "Metalcore VS Deathcore" (YouTube, 2015), 1:47 to 2:05, a "Metalcore" guitarist and a "Deathcore" one side by side. A comment on the video calls this "the chord progression from 1:47 to 2:04 ... nice and emotional". Measured on its audio (drums taken out by separating sustained and percussive sound) and seen on its frames:

- The Metalcore guitar is a six-string tuned to B (lowest note B1), playing full barre chords with distortion, not power chords: at 1:53 his hand is around the fifth fret, where E major lies on the low string, and E–B–G♯–B–E sound.
- Two four-chord phrases in B minor: Bm7–E–F♯m7–G (i7–IV–v7–VI, the major IV of the Dorian mode), then Em–D–F♯m–G (iv–III–v–VI), into a riff on B.
- He strikes the chords on every beat at about 185 BPM (the snare falls every 0.65 s, half time) and lets them ring; in the second phrase each chord lasts a bar and rings through it. The low chugs underneath belong to the Deathcore guitar.
- Both guitars are double-tracked hard left and right (correlation near 0 above 600 Hz).

Here, in Drop C:

- Progressions, each four different chords: the example's two phrases (in C minor Cm7–F–Gm7–A♭ and Fm–E♭–Gm–A♭), and from transcriptions of metalcore songs (Hooktheory TheoryTab, user tabs on guitartabs.cc), now as full chords:
  - VI–VII–i–III: Killswitch Engage "Rose of Sharyn" (D♭–E♭–F–A♭ in F minor), Demon Hunter "My Heartstrings Come Undone", Bring Me The Horizon "Avalanche". The choruses of Killswitch Engage's "When Darkness Falls" and "In Due Time" are VI–VII–i–VII.
  - i–v–VI–VII: Parkway Drive "Horizons".
  - i–VI–III–v: Trivium "Like Light to the Flies".
  - VI–iv–i–III: Motionless in White "Undead Ahead 2"; VI–iv–i in Parkway Drive "Alone" and Killswitch Engage "My Curse".
  - i–VII–VI–V: i–VII–VI–VII in Bullet for My Valentine "Your Betrayal" and Motionless in White "Werewolf", i–VI–V in Avenged Sevenfold "Unholy Confessions".
  - i–♭II–VII–VI, the Phrygian half-step: Demon Hunter's pre-chorus.
- Key: C minor half the time, on the open low string (Killswitch Engage's three transcribed songs, "Your Betrayal" and "Werewolf" are in C minor), else D, F or G minor.
- Shapes: root, fifth and octave under one finger across the three lowest strings with the third (and seventh) on top, the drop-tuning chord (Cm = 0 0 0 2 3 1, E♭ = 3 3 3 5 6 5); or the A shape of standard tuning on the second string (A♭ = x 1 3 3 3 1); the open chords of C and G. Low on the neck, the root on the low string where it fits.
- Rhythm: downstrokes of the whole chord on every beat, each ringing until the next (`X---X---X---X---`), at 184 BPM. The arpeggio picks low, middle and top notes in eighths, grouped three, three and two, the low note palm-muted.

## Metalcore tone

Measured on real metal rhythm guitars (Freesound previews, used for analysis only), on the user's example, and matched on renders of the page:

- The level never drops: a new stroke or chord dips by a few dB for some milliseconds at most.
- Picked notes (the arpeggio) keep the tone fitted to real metal rhythm guitars: scooped, not mid-heavy, with bite; in third octaves against 100 to 315 Hz, 500 Hz to 1.25 kHz lies 4.5 to 8 dB down and 2 to 3.15 kHz about 3 dB down (the first Drop D version had the mids 5 dB above, like rock), 1.5 to 2.5 dB more at 2 to 5 kHz in Drop C, as in metalcore recordings; steep roll-off above 4.5 kHz.
- Full chords bring far more midrange into the amp: through the same speaker they came out 3 to 7 dB above the lows, the balance of rock again. Strums have their own `cabinet` in `js/sounds.js`, fitted to the balance of the example's chorus (its whole mix, 1:47 to 2:04): against 100 to 315 Hz, 315 Hz to 1.25 kHz about 3 dB down, 1.6 to 4 kHz level with the lows, then the same steep roll-off above 4.5 kHz (the example's top end is mostly cymbals). Renders of six progressions in four keys land within 1 dB of that, spectral centre 1.0 to 1.2 kHz. Their pitch energy lies 59 to 82 % on the chord's own notes, as clear as the example (22 to 77 %, with its bass and second guitar in the mix).
- The two sides are separate performances: each plays its own recording of every note (the note itself or its neighbour moved by a semitone), so above 500 Hz their correlation stays near 0.1. Below 150 Hz the same low notes line up, as in real double tracking.

## Verification

- Unit tests (`node --test`): every diagram spells its chord name (bass note, defining tones, no foreign notes) and is playable (stretch ≤ 4 frets, ≤ 4 fingers); every progression has four different chords and follows its genre's rules over 1,500 random generations per genre; playback only plays the diagram's notes inside the chord's bar; every reachable note has a recording and a tuning correction; share links round-trip; the saved image is well-formed SVG with every chord.
- Browser check: every genre and both playback modes, diagrams against the reference, no console errors, phone width, output levels evened out across genres; the saved image in Chrome and Firefox.
- Not verifiable by the builder: how the sound pleases the ear.
