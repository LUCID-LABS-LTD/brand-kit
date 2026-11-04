# Agent notes

This repo is designed to be operated by an agent (and edited by a human) without
a build step or a browser.

## Contract

- **Input**: text, a layout id, a size, a theme.
- **Output**: a PNG path, plus a JSON object describing what was rendered and
  whether it passed the brand check.
- **Failure**: non-zero exit code if a card breaks amber/green rules. Do not
  ignore the exit code.

```bash
npx github:LUCID-LABS-LTD/brand-kit card \
  --text "…" \
  --layout hook \
  --size 4x5 \
  --out out/thread-cover.png \
  --json
```

```json
[
  {
    "layout": "hook",
    "size": "1080x1350",
    "amber": "0.78%",
    "brand": "pass",
    "file": "C:\\…\\out\\thread-cover.png",
    "spec": { "layout": "hook", "headline": "…", "accent": "…" }
  }
]
```

Use `spec` to log exactly what the auto-layout chose. If the emphasis word is
wrong, re-run with `--accent "WORD"`.

## Layout selection

| post type | layout |
| --- | --- |
| first post of a thread | `hook` |
| shipping / launch | `announcement` |
| contains one strong number | `stat` |
| status / progress | `buildlog` |
| engineering detail, commands | `terminal` |
| quote or field note | `quote` |
| short, quiet, brand-forward | `minimal` |

Sizes: `4x5` for maximum feed area, `16x9` for link previews and decks,
`1x1` for profile-adjacent posts.

## Motion

```bash
npx github:LUCID-LABS-LTD/brand-kit render --spec scene.json --out out/clip.mp4
```

- Scene specs are JSON; see `docs/SCENE-SPEC.md`.
- `--alpha` produces a transparent clip.
- Overlays are pre-rendered in `overlays/`; prefer reusing them over re-rendering.
- In the browser, `motion/` has a **Download MP4** button (WebCodecs H.264, in-page
  muxing) that yields exactly one loop at the selected size. No server needed.

## Editing the kit

- Tokens live in `brand/tokens.json` and `brand/engine.js` (keep them in sync with
  `brand/BRAND.md` — BRAND.md wins).
- Layouts: `cards/layouts.js`. One object per layout with `label`, `hint`, `draw`.
- Comps: `motion/comps.js`. One object per comp with `duration`, `bg`, `draw`.
- Never hard-code a hex in a layout or comp; read from `spec.theme`.
- After changes: `node tools/make-samples.cjs && node cli/brandkit.mjs doctor`.

## Vendoring into another app

The card engine is plain UMD. Copy these four files and you are done:

```
brand/engine.js   → cards/engine.js
cards/layouts.js  → cards/layouts.js
cards/card.js     → cards/card.js
brand/fonts/*.ttf → cards/fonts/
```

```html
<link rel="stylesheet" href="cards/card.css">
<script src="cards/engine.js"></script>
<script src="cards/layouts.js"></script>
<script src="cards/card.js"></script>
```

```js
const canvas = LucidCard.render(text, { layout: "hook", size: "4x5", scale: 2 });
LucidCard.download(canvas, "card.png");
```

`LucidCard.render` returns a canvas at `width × scale`. `LucidCard.check(canvas, spec)`
returns `{ amberPct, greenPct, violations, ok }`.

## Non-negotiables

1. Amber ≤ 10% of pixels. The engine measures it; do not ship a card that fails.
2. Green only on a `BUILT` chip or status dot.
3. `LUCID LABS LTD` in full, upper case.
4. Headline upper case, tracking 0.04–0.08em.
5. Never put the logo on a busy image without a solid pad.
