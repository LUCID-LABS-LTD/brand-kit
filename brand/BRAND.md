# LUCID LABS LTD — Brand Rules

Retro terminal / phosphor CRT. Nigerian deep-tech: robotics, AI, autonomous systems.

> "WE DON'T PROPOSE THE FUTURE. WE BUILD IT."

---

## 1. Naming

- Official assets (logos, banners, announcements, letterhead, decks): always **"LUCID LABS LTD"**, full caps, in full.
- **"Lucid Labs"** alone is acceptable only in running body copy, and only after "LUCID LABS LTD" has appeared once already in that piece.
- Never "Lucid Labs Ltd." with a period, never lowercase, never "LucidLabs".

## 2. Color — Dark theme (primary)

| Token | Hex | Use |
|---|---|---|
| Background | `#0B0A08` | App/page background |
| Surface | `#12100C` | Cards, panels, terminal windows |
| Text | `#E8E2D4` | Primary text |
| Muted | `#8A8272` | Secondary text, timestamps, captions |
| Accent amber | `#FFB000` | Emphasis only — see rule below |
| Border | `#2A2620` | Hairlines, card borders, dividers |
| Status green | `#3FBF6B` | **"BUILT" chips and online/status dots only** |

## 3. Color — Paper theme (parent-facing / print / child-safety)

| Token | Hex | Use |
|---|---|---|
| Background | `#F0EBDD` | Page background |
| Surface | `#E9E3D2` | Cards, panels |
| Text | `#26221A` | Primary text |
| Muted | `#6E675A` | Secondary text |
| Accent (burnt amber) | `#9A5B00` | Emphasis only — same 10% rule |
| Border | `#D5CDB8` | Hairlines |
| Status green | `#1E7A45` | "BUILT" chips only |

**When to use paper theme:** parent-facing communications, child-safety product content, printed one-pagers, anywhere the audience is not the technical/dev-culture crowd. The palette relationship doesn't change — only which theme is active. Never mix dark-theme amber with paper-theme green, or vice versa.

## 4. The amber 10% rule

Amber (`#FFB000` dark / `#9A5B00` paper) is **emphasis-only**. It should never exceed roughly **10% of the pixel area** of any single composition. Correct uses: a highlighted keyword, a chip border, the logomark, an ASCII progress bar's filled blocks, a single underline/accent rule. Incorrect: amber backgrounds, amber body copy, amber-filled cards.

## 5. The green-only-for-BUILT rule

Status green appears **only** on a "BUILT" status chip or an online/status indicator dot. It is never a text color, never a decorative accent, never used for "in progress" or any other state. "IN PROGRESS" and similar in-flight states are amber.

## 6. Typography

Monospace for headlines, wordmarks, labels, chips, nav, and all UI chrome.

**Exception — long-form body copy on the web:** paragraphs and running text on websites may use a clean system sans-serif for readability. Monospace body is reserved for short strings (specs, terminal blocks, captions). Decision: founder, 2026-07-07 — readability takes priority over aesthetic purity in body copy.

- **JetBrains Mono** (primary) — `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap`
- **IBM Plex Mono** (fallback / alternate weight range) — `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap`

Headlines and wordmarks: uppercase, wide tracking (`letter-spacing: 0.04–0.08em`). Body copy: sentence case is fine, tracking normal.

## 7. Logo

Files in `/logo`:

- `logo-full.svg` / `logo-full-light.svg` — mark + "LUCID LABS LTD" wordmark. Primary lockup.
- `logo-mark.svg` / `logo-mark-light.svg` — symbol only (`>_`, a terminal prompt cursor). Use for avatars, favicons, app icons, anywhere the wordmark won't fit.
- `logo-mono.svg` / `logo-mono-light.svg` — single flat color, no glow. Use for engraving, single-color print, watermarks.
- `/logo/png/` — rendered exports: `mark-1080-*.png` (profile picture), `mark-400-*.png`, `mark-32-*.png` (favicon), dark and light theme each.

**Clear space:** keep clear space around the mark equal to at least the height of the cursor block (the small rectangle) on all sides — roughly 20% of the mark's own height. Never crop the chevron or the cursor block. Never recolor the mark anything but amber/burnt-amber (accent use) or the flat mono colors — never place it on a busy photo without a solid-color pad underneath.

The mark reads as a terminal prompt (`>_`) — deliberate: Lucid Labs ships things, it doesn't propose them.

## 8. Voice

"WE DON'T PROPOSE THE FUTURE. WE BUILD IT." Direct, declarative, present-tense, no hedging. Short sentences. Technical precision over marketing gloss. Confidence without hype — state what was built, not what might be someday.

## 9. Files in this kit

```
/lucid-labs-brand
├── BRAND.md
├── logo/
│   ├── logo-full.svg / logo-full-light.svg
│   ├── logo-mark.svg / logo-mark-light.svg
│   ├── logo-mono.svg / logo-mono-light.svg
│   └── png/ (1080, 400, 32px exports × dark/light)
├── templates/
│   └── templates.html — 5 editable 1080×1080 social templates, in-browser PNG export
└── banners/
    └── banners.html — LinkedIn cover (1128×191) + X header (1500×500), editable + exported PNGs
```
