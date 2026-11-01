# Quickstart

## Requirements

- Node 18+ (Node 24 tested)
- ffmpeg on `PATH` — only for video (`brandkit render`, `brandkit overlays`)
- Nothing else. No Chrome, no bundler, no Python.

```bash
git clone https://github.com/LUCID-LABS-LTD/brand-kit
cd brand-kit
npm install          # installs @napi-rs/canvas (prebuilt, no compiler)
node cli/brandkit.mjs doctor
```

`doctor` should print `true` for node, ffmpeg, fonts, assets and the amber detector.

---

## Cards

```bash
npx brandkit list
npx brandkit card --text "We shipped V3." --layout announcement --out out/v3.png
npx brandkit card --text "62 of 62 units passed." --layout stat --size 4x5
npx brandkit card --text "Three years, one machine." --layout quote --theme paper
```

Useful flags:

| flag | default | notes |
| --- | --- | --- |
| `--layout` | `announcement` | see `brandkit list` |
| `--size` | `16x9` | `16x9`, `4x5`, `1x1` |
| `--theme` | `dark` | `dark`, `paper` |
| `--accent` | auto | the one amber word/phrase |
| `--kicker` | auto | small label above the headline |
| `--body` | from post | override the sub-copy |
| `--scale` | `2` | `2` = 3200×1800, `3` = 4800×2700 |
| `--out` | `out/…` | file path |
| `--json` | off | machine-readable result incl. the resolved spec |

The resolved spec is returned with `--json`, which makes it easy for an agent to
inspect what the auto-layout decided.

### Batch

```bash
npx brandkit card --batch jobs.json --dir out/batch --json
```

```json
[
  { "text": "Nigeria's first autonomous delivery fleet is live.", "layout": "hook", "size": "4x5" },
  { "text": "62 out of 62 units passed.", "layout": "stat", "size": "16x9", "out": "out/stat.png" }
]
```

---

## Card Studio (browser)

```bash
npx --yes serve . -p 4173
open http://localhost:4173/cards/
```

- Type or paste a post → the card updates live.
- The **Amber budget** meter is a real pixel count on a downscaled copy of the render.
- **Download PNG** exports at 2× (3200×1800 for 16:9).
- **Copy image** puts the PNG on the clipboard (`ClipboardItem`, Chrome/Edge/Safari).
- Deep-link a card: `/cards/?text=…&layout=hook&size=4x5&theme=dark`

Everything runs from local files. No network calls at runtime.

---

## Motion

```bash
npx brandkit render --spec presets/example-scene.json --out out/demo.mp4
```

The renderer:

1. creates a Canvas at the exact output size,
2. draws every scene for frame *i* at `t = i / fps`,
3. writes `frame_00000.png …`,
4. encodes with ffmpeg (`libx264`, `yuv420p`, `+faststart`),
5. deletes the frames unless `--keep-frames`.

Same spec ⇒ same frames ⇒ same file. There is no wall clock in the path.

### Alpha overlays

```bash
npx brandkit overlays \
  --comps lower-third,built-stamp,flash-wipe,scanlines,bar-sweep \
  --sizes 1920x1080,1080x1920 \
  --formats webm,mov
```

Output lands in `overlays/<size>/<comp>.<ext>` and `overlays/manifest.json` is
updated. Use `--force` to re-render existing files.

| format | codec | alpha | notes |
| --- | --- | --- | --- |
| `.mov` | ProRes 4444 | true | drop straight on a timeline |
| `.webm` | VP9 (`alpha_mode=1`) | yes | smaller, Chrome/Resolve/Premiere |
| `.mp4` | H.264 | no | full-frame preview |

### Motion Player (browser)

```bash
npx --yes serve . -p 4173
open http://localhost:4173/motion/
```

Scrub any comp, change props live, and **Record one loop** to a WebM straight
from the canvas (`MediaRecorder`). Good for quick review; use the CLI when you
need MP4 or true alpha.

---

## Samples

```bash
node tools/make-samples.cjs
open samples/index.html
```

Regenerates the gallery and fails loudly if any sample breaks the brand check.

---

## Using it from another project

Vendor the three files (no npm publish needed):

```html
<link rel="stylesheet" href="cards/card.css">
<script src="cards/engine.js"></script>
<script src="cards/layouts.js"></script>
<script src="cards/card.js"></script>
```

See `docs/AGENTS.md` for the integration contract used by the X Thread Generator.
