# Brand rules — quick reference

Canonical document: [`brand/BRAND.md`](../brand/BRAND.md). This page is the
one-screen version the engine enforces.

## Colour

| token | dark | paper | use |
| --- | --- | --- | --- |
| bg | `#0B0A08` | `#F0EBDD` | page / frame background |
| surface | `#12100C` | `#E9E3D2` | panels, terminal windows |
| text | `#E8E2D4` | `#26221A` | primary text |
| muted | `#8A8272` | `#6E675A` | secondary text, timestamps |
| accent | `#FFB000` | `#9A5B00` | emphasis only |
| border | `#2A2620` | `#D5CDB8` | hairlines |
| green | `#3FBF6B` | `#1E7A45` | `BUILT` chips / status dots only |

## Three hard rules

1. **Amber ≤ 10% of the pixel area.** Emphasis, not decoration. No amber
   backgrounds, no amber body copy, no amber-filled cards.
2. **Green only for `BUILT`.** Never text, never "in progress", never decorative.
   In-flight states are amber.
3. **Never mix themes.** Dark amber never sits next to paper green.

## Type

- JetBrains Mono everywhere; IBM Plex Mono as fallback.
- Headlines and wordmarks: uppercase, letter-spacing `0.04–0.08em`.
- Body copy: sentence case, normal tracking. Long-form web body may use a
  sans-serif (founder decision, 2026-07-07).
- Never stretch, outline, or add effects to type beyond the amber emphasis.

## Name

`LUCID LABS LTD` — full caps, no period, in full, on every official asset.
`Lucid Labs` only in running body copy after the full name has appeared once.
Never `LucidLabs`, never `Lucid Labs Ltd.`.

## Logo

`>_` terminal prompt. Clear space ≥ cursor-block height on all sides. Never crop
the chevron or the cursor. Never recolour beyond amber / burnt amber / flat mono.
Never place it on a busy photo without a solid pad.

## Voice

> WE DON'T PROPOSE THE FUTURE. WE BUILD IT.

Direct, declarative, present tense. State what was built, not what might be.
No hedging, no hype.

## How it is enforced

`LucidBrand.checkBrand(canvas, { theme, allowGreen })` samples every pixel and
returns:

```json
{ "amberPct": 2.03, "greenPct": 0, "violations": [], "ok": true }
```

- `amberPct` > 10 → violation.
- `greenPct` > 0.02% with `allowGreen: false` → violation.

`brandkit card` prints the result and exits non-zero on failure.
`node tools/make-samples.cjs` fails the build if a sample regresses.
