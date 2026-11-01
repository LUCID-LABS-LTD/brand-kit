# LUCID LABS LTD — brand kit

A brand engine for **LUCID LABS LTD**: compliant social cards and motion graphics,
renderable from the command line, from the browser, or by an agent.

No build step. No CDN. No `html2canvas`. Everything is drawn with Canvas 2D, so the
preview *is* the export, and the same code produces identical frames on every machine.

![Motion demo](samples/demo.gif)

*`npx brandkit render --spec presets/example-scene.json` — 12s, 1920×1080, 30fps, rendered
frame-by-frame with no browser.*

```
brand-kit/
├─ brand/      tokens, tokens.json, engine.js, logo/, fonts/, brand.css
├─ cards/      card layouts + Card Studio (browser)
├─ motion/     motion comps + deterministic frame renderer (Node + ffmpeg)
├─ overlays/   pre-rendered alpha overlays + manifest.json
├─ presets/    example scene specs
├─ cli/        brandkit CLI
├─ samples/    generated sample cards + gallery
└─ docs/       quickstart, scene spec, brand rules, agent notes
```

**Live demo:** https://lucid-labs-ltd.github.io/brand-kit/ — Card Studio, Motion Player and the sample gallery, no install.

---

## Quickstart

```bash
git clone https://github.com/LUCID-LABS-LTD/brand-kit
cd brand-kit
npm install
```

### One card from a post

```bash
npx brandkit card \
  --text "Nigeria's first autonomous delivery fleet is live." \
  --layout announcement \
  --size 16x9 \
  --out card.png
```

### A motion clip from a scene spec

```bash
npx brandkit render --spec presets/example-scene.json --out out/demo.mp4
```

### Transparent overlays for an editor

```bash
npx brandkit overlays --comps lower-third,built-stamp --formats webm,mov
```

### Browser tools (no install needed)

```bash
npx --yes serve . -p 4173
```

- `http://localhost:4173/cards/` — **Card Studio**
- `http://localhost:4173/motion/` — **Motion Player**
- `http://localhost:4173/samples/` — **sample gallery**

---

## Card layouts

| id | use it for |
| --- | --- |
| `announcement` | shipping something, launches, milestones |
| `terminal` | technical posts, engineering notes |
| `buildlog` | status updates — includes the only legal `BUILT` chip |
| `stat` | one number that carries the post |
| `hook` | the first post of a thread |
| `minimal` | quiet posts, one line, mark only |
| `quote` | pull-quotes, field notes |

Sizes: `16x9` (1600×900), `4x5` (1080×1350), `1x1` (1080×1080).
Themes: `dark` (primary), `paper` (secondary).

Cards auto-detect the headline, the sub-copy and the one amber word. Every export is
checked against the brand rules and the CLI exits non-zero if a card breaks them.

```bash
npx brandkit card --batch jobs.json --json
```

`jobs.json`:

```json
[
  { "text": "We shipped V3.", "layout": "announcement", "size": "16x9", "out": "out/v3.png" },
  { "text": "62 of 62 units passed.", "layout": "stat", "size": "4x5" }
]
```

---

## Motion comps

| id | duration | alpha | what it is |
| --- | --- | --- | --- |
| `boot-sting` | 3s | no | mark draws in, wordmark types, cursor blinks |
| `typewriter` | 4s | no | headline types on, amber emphasis |
| `stat-counter` | 4s | no | number counts up, label lands after |
| `section-card` | 4s | no | kicker slides, title wipes in |
| `lower-third` | 4s | **yes** | name + role bar slides in |
| `built-stamp` | 2.5s | **yes** | `BUILT` chip stamps down |
| `flash-wipe` | 0.5s | **yes** | amber flash-frame transition |
| `end-card` | 4s | no | mark, wordmark, CTA |
| `scanlines` | 6s | **yes** | looping CRT texture |
| `bar-sweep` | 5s | **yes** | amber progress strip |

Comps are pure functions of time: `draw(ctx, { t, dur, props })`. There is no
`requestAnimationFrame` and no wall clock in the render path, so frame 214 is
always frame 214. That is what makes the output usable by an agent.

Read `docs/SCENE-SPEC.md` for the JSON format.

---

## Overlays

`overlays/manifest.json` lists every pre-rendered file with comp, size, duration,
format and alpha flag.

- **`.mov`** — ProRes 4444, true alpha, 1920×1080 and 1080×1920
- **`.webm`** — VP9 with `alpha_mode=1`, smaller, plays in Chrome / Resolve / Premiere
- **`.mp4`** — full-frame preview when no alpha is needed

Drop a `.mov` on the timeline above footage and it composites cleanly. No keying.

---

## Brand rules (enforced, not suggested)

- Background `#0B0A08`, surface `#12100C`, text `#E8E2D4`, muted `#8A8272`, border `#2A2620`.
- Amber `#FFB000` is **emphasis only**, ≤ 10% of the pixel area. Never a background.
- Green `#3FBF6B` only on `BUILT` chips and online/status dots. Never body text, never decoration.
- Never mix the dark theme's amber with the paper theme's green.
- Name is always `LUCID LABS LTD` — full caps, no period, never `LucidLabs`.
- Headlines uppercase, tracking 0.01–0.08em. JetBrains Mono everywhere.
- Logo clear space ≥ the cursor-block height. Do not recolour the mark.

The engine measures amber coverage on every card at export time (`LucidBrand.checkBrand`).
The number you see in Card Studio is the real pixel count, not an estimate.

---

## Use it from an agent

```bash
# stable, scriptable, exits non-zero on a brand violation
npx github:LUCID-LABS-LTD/brand-kit card --text "…" --layout hook --json
npx github:LUCID-LABS-LTD/brand-kit render --spec scene.json --out out/clip.mp4
```

`brandkit list` prints every layout and comp id. `brandkit doctor` checks node,
ffmpeg, fonts and assets.

---

## License

- **Code** — MIT. See `LICENSE`.
- **Logos, wordmark and brand assets** — © LUCID LABS LTD. All rights reserved.
  You may redistribute the assets as part of this kit; you may not use them to
  represent another company.
- **JetBrains Mono** — SIL Open Font License 1.1. See `brand/fonts/OFL.txt`.

`BRAND.md` is the canonical source. If `tokens.json` and `BRAND.md` disagree,
`BRAND.md` wins and the tokens get fixed.
