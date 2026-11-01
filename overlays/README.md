# Overlays

Pre-rendered motion graphics with an alpha channel, ready to drop on a timeline.

```
overlays/
├─ manifest.json          every file, with comp / size / duration / alpha
├─ 1920x1080/
│   ├─ lower-third.webm   VP9 + alpha, 4s
│   ├─ lower-third.mov    ProRes 4444 + alpha, 4s
│   └─ …
└─ 1080x1920/
    └─ …
```

## What is here

| comp | duration | use |
| --- | --- | --- |
| `lower-third` | 4s | name + role, bottom-left |
| `built-stamp` | 2.5s | `BUILT` chip, centre |
| `flash-wipe` | 0.5s | amber flash transition (cap: 62% alpha) |
| `scanlines` | 6s | looping CRT texture, `Screen`/`Overlay` blend |
| `bar-sweep` | 5s | amber progress strip |

## Which file

- **`.mov`** — ProRes 4444, true alpha. Use in Premiere, Resolve, Final Cut, After Effects.
  Larger, but composites with no keying and no codec surprises.
- **`.webm`** — VP9 with `alpha_mode=1`. Small. Chrome, Resolve 18+, Premiere 2024+.
  If your editor refuses it, use the `.mov`.

The `scanlines` `.mov` is intentionally **not committed** — ProRes 4444 of a 6-second
noise texture is ~90 MB. The `.webm` is 4 MB and composites identically. Regenerate it
whenever you need it:

```bash
npx brandkit overlays --comps scanlines --formats mov --force
```

## Regenerating

```bash
# everything
npx brandkit overlays \
  --comps lower-third,built-stamp,flash-wipe,scanlines,bar-sweep \
  --sizes 1920x1080,1080x1920 \
  --formats webm,mov \
  --force

# one comp, one size
npx brandkit overlays --comps built-stamp --sizes 1080x1920 --formats webm --force
```

`manifest.json` is rewritten after every run.

## Notes for editors

- All overlays are drawn on a transparent canvas. Do **not** add a background fill.
- Timings are locked to 30 fps and start on frame 0, so they can be trimmed anywhere
  after the last frame.
- `flash-wipe` is capped at 62% amber on purpose: a full-frame amber flash would
  blow the 10%-amber brand budget. Treat it as a transition, not a colour card.
- `scanlines` loops seamlessly at 6s; set it to 50–70% opacity.
