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
- Standard tuning everywhere (user's decision, 2026-11-22).
- Diagrams follow the user's reference chord boxes: name on top, `o` / `x` above a thick nut, dots, a barre bar, a `5fr` label higher up the neck.
- Loudness per genre is set by `level` in `js/sounds.js`, calibrated to about -18 dBFS RMS with `renderOffline` from `js/audio.js`; recalibrate after changing a tone.
- `docs/spec.md` is the agreed plan; update it when a decision changes.

## Git

Solo project: commit on `main` and push `main` directly, no branches or pull requests. Claude may commit and push this project without asking (user's decision, 2026-11-22).
