# Guitar Chords Creator

Static site: HTML, CSS and vanilla JavaScript ES modules. No framework, no build step, no runtime dependencies. GitHub Pages serves the root of `main` at https://zumboka.github.io/guitar-chords-creator/.

The Godot asset-generation rules in the parent `C:\Users\malte\CLAUDE.md` don't apply to this project.

## Commands

- `npm test` (runs `node --test`): run before every commit; everything must pass.
- Local preview: `python -m http.server 8000`, then open http://localhost:8000 (modules don't load from `file://`).

## Rules

- Every chord shape must pass `matchesChord` and `isPlayable` in `js/voicings.js`; the tests enforce it for the whole library and for 1,500 generated progressions per genre.
- A progression is exactly four different chords. New progressions go in `js/genres.js` as Roman numerals with a chord quality (`'ii:m9'`); a quality a genre uses needs movable shapes so every key works.
- Genre rules live in `tests/generator.test.js` (`RULES`); keep them in step with `js/genres.js`.
- Standard tuning, except Metalcore in B standard (2026-11-27: the user asked for the tuning that makes its chords easiest while keeping the emotional sound; Drop B, Drop C and Drop D before). Each genre names its tuning in `js/genres.js`; the shapes for each tuning are `SHAPES` in `js/voicings.js`.
- Diagrams follow the user's reference chord boxes: name on top, `o` / `x` above a thick nut, dots, a barre bar, a `5fr` label higher up the neck. "Save as image" (user's request, 2026-11-27) draws the same cards into a PNG through `js/sheet.js`, whose styles repeat the diagram rules of `css/style.css`: change both together. During an arpeggio the diagram shows the note being picked as a full green dot (user's request, 2026-11-27).
- Sound comes from recordings in `audio/<instrument>/<midi>.mp3` or `.flac`, not synthesis (the synthesised first version sounded poor to the user). `js/recordings.js` holds each instrument's range and measured tuning; re-measure it when a recording is added or replaced. Keep the attribution (CC BY, CC BY-SA and CC0) in `audio/README.md` and the page footer.
- Metalcore plays full chords built from recorded single notes through a simulated amp (`js/amp.js`). Strings must distort together (every string of a chord goes through the same amp), the sound must not stop between strokes or chords, and its tone follows the measured targets under "Metalcore tone" in `docs/spec.md`. Its chords, sound and strumming must be typical of the genre (user's request, 2026-11-25), and the chords and their sound follow the user's example (2026-11-27): the chorus of Jared Dines' "Metalcore VS Deathcore" at 1:47 to 2:05, full minor and major chords ringing on every beat; it must stay emotional and its shapes easy to hold, open where they fit and never more than three fingers (user's requests, 2026-11-27). Both are described under "Metalcore chords and rhythm".
- Strumming plays whole chords only, normally and typical of the genre: no extra notes and nothing that rings on (user's decision, 2026-11-25), but with the genre's typical character in sound and rhythm (user's request, 2026-11-25). Neo Soul and Post Rock must stay clearly apart (user's request, 2026-11-25); the targets are under "Neo Soul and Post Rock tone" in `docs/spec.md`. Shoegaze must be crisp and full of character (user's request, 2026-11-25): fuzz guitars with a clean one between them, targets under "Shoegaze tone".
- Loudness per genre is set by `level` in `js/sounds.js`, calibrated to about -19.5 dBFS RMS with `renderOffline` from `js/audio.js`; recalibrate after changing a genre's instrument or effects.
- `docs/spec.md` is the agreed plan; update it when a decision changes.

## Git

Solo project: commit on `main` and push `main` directly, no branches or pull requests. Claude may commit and push this project without asking (user's decision, 2026-11-22).
