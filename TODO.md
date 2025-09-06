# TODO

Status: Alpha. Focus on macOS + Final Cut Pro. Keep Premiere as legacy.

## Near-term
- [ ] Add `settings.json` support (theme, fps, resolution, file naming, extra frames, layout).
- [ ] Add CLI flags: `--settings`, `--fps`, `--size`/`--width`/`--height`, `--composition`, `--markdown-file`, `--out`.
- [ ] Replace `os.system` with `subprocess.run` and sanitize paths.

## Markdown model & parsing
- [ ] Support multi-file diffs: parse language+path fences, compute diffs per file, separate tracks.
  - Syntax proposal: ```lang:path/to/file.ext fences.
- [ ] Support cutaways (console/image/video) via directives in markdown.
  - Example: frontmatter or inline `:::cutaway type=console|image|video src=...`.
- [ ] Support non-code textual slides (titles/paragraphs) with simple styling.
- [ ] Support a split-screen layout with two columns or rows for a side by side of components together. Like a left hand side image and a right hand side code block with an optional screen divider

## Rendering & metadata
- [ ] Unify on the metadata-emitting `CodeBlockAnimation` and remove old duplicate.
- [ ] Include per-block `filePath` and `track` in metadata for multi-file timelines.
- [ ] Make `extraFramesPerBlock` configurable.

## Final Cut Pro integration
- [ ] Generate FCPXML timeline from metadata (tracks by file, clip in/out by block timing).
- [ ] Verify import in Final Cut Pro and editing ergonomics.

## Premiere Pro (legacy)
- [ ] Keep `core/premiere_pro.py` but mark unsupported; document as legacy.
- [ ] If retained, align metadata schema and cutting logic.

## UX & docs
- [ ] Example `settings.json` and advanced example markdown (multi-file, cutaways, console).
- [ ] Update README with 4K/60 defaults and FCP usage.

## Stretch
- [ ] Aspect-ratio presets and per-platform templates.
- [ ] Audio markers import (for future voice alignment).

## Markdown syntax details
- [ ] Implement multi-file fence parsing for `lang:path/to/file.ext` and `lang:{title="...", path="..."}`.
- [ ] Add cutaway directives with attributes: `type`, `src`, `width`, `height`, and timing for video.
- [ ] Add console blocks with explicit `input` and `output` sections; simulate typing for inputs (no auto-run).

## Settings
- [ ] Support per-project settings folder with `settings.json` that overrides repo defaults.
- [ ] Resolve settings precedence: CLI `--settings` > project `settings.json` > repo defaults.
