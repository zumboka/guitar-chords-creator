# Spec: Guitar Chords Creator

Agreed on 2026-11-22, before the build. The build ran autonomously from this plan.

## Goal

A website that generates guitar chord progressions of four different chords for the genres Neo Soul, LoFi, Punk, Post Rock, Shoegaze and Metalcore. The chords must fit the genre. The progression can be played normally (strummed) and as an arpeggio, and is shown as chord-box diagrams like the user's reference image (Em, E, Am, C boxes: chord name on top, `o` / `x` above a thick nut, dots on the frets).

## Decisions

| Topic | Decision |
|---|---|
| Metalcore tuning | Standard tuning, like every other genre |
| Sound | Synthesised in the browser, no samples; a distinct tone per genre |
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
| Neo Soul | 9ths, 11ths, 13ths, secondary dominants, tritone subs; never a plain triad | Dm9 – G13 – Cmaj9 – Am9 |
| LoFi | maj7, m7, 9ths, stepwise descents, borrowed iv | Fmaj7 – Em7 – Dm7 – Cmaj7 |
| Punk | power chords, I–V–vi–IV family, eighth-note downstrokes | E5 – B5 – C♯5 – A5 |
| Post Rock | add9, sus, maj7 with ringing open strings, picked patterns, delay and reverb | Gmaj7 – Em(add9) – Cadd9 – Dsus4 |
| Shoegaze | borrowed chords over droning open top strings, fuzz, chorus, huge reverb | Emaj7 – Cmaj7 – Aadd9 – Am(add9) |
| Metalcore | minor keys, low power chords, Aeolian and Phrygian moves, palm-muted chugs | E5 – C5 – G5 – D5 |

## Verification

- Unit tests (`node --test`): every diagram spells its chord name (bass note, defining tones, no foreign notes) and is playable (stretch ≤ 4 frets, ≤ 4 fingers); every progression has four different chords and follows its genre's rules over 1,500 random generations per genre; playback only plays the diagram's notes inside the chord's bar; the synthesised strings are in tune; share links round-trip.
- Browser check: every genre and both playback modes, diagrams against the reference, no console errors, phone width, output levels evened out across genres.
- Not verifiable by the builder: how the sound pleases the ear.
