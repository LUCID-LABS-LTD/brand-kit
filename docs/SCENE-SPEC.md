# Scene spec

A scene spec is plain JSON. The renderer is deterministic: every scene is a pure
function of `t`.

```json
{
  "name": "launch-clip",
  "size": "1920x1080",
  "fps": 30,
  "theme": "dark",
  "duration": 12,
  "alpha": false,
  "scenes": [
    {
      "comp": "boot-sting",
      "in": 0,
      "out": 2.4,
      "props": { "tagline": "WE DON'T PROPOSE THE FUTURE. WE BUILD IT." }
    },
    {
      "comp": "typewriter",
      "in": 2.4,
      "out": 5.6,
      "props": {
        "kicker": "LUCID LABS LTD · LAGOS, NG",
        "text": "Nigeria's first autonomous delivery fleet is live.",
        "accent": "autonomous"
      }
    },
    { "comp": "flash-wipe", "in": 5.6, "out": 6.0 },
    {
      "comp": "stat-counter",
      "in": 6.0,
      "out": 9.0,
      "props": { "value": 62, "suffix": "%", "label": "Drop test pass rate" }
    },
    { "comp": "end-card", "in": 9.0, "out": 12.0, "props": { "text": "lucidlabsltd.com" } }
  ]
}
```

## Top level

| key | type | default | notes |
| --- | --- | --- | --- |
| `name` | string | `scene` | used for the output filename |
| `size` | string | `1920x1080` | `1920x1080`, `1080x1920`, `1080x1080`, `1600x900` |
| `fps` | number | `30` | integer |
| `theme` | string | `dark` | `dark` or `paper` |
| `duration` | number | max `out` | seconds |
| `alpha` | bool | `false` | skip the background fill (transparent) |
| `scenes` | array | — | drawn in order |

## Scenes

| key | type | notes |
| --- | --- | --- |
| `comp` | string | required, must exist in `brandkit list` |
| `in` | number | start time, seconds |
| `out` | number | end time; defaults to `in + comp.duration` |
| `props` | object | comp-specific, see below |

Scenes are drawn in array order. Later scenes paint over earlier ones, which is
how `flash-wipe` and `scanlines` work as overlays on top of a base comp.

`props` may also be written inline on the scene object — convenient for quick edits.

## Props by comp

### `boot-sting`
| prop | default |
| --- | --- |
| `tagline` | — |

### `typewriter`
| prop | default |
| --- | --- |
| `text` | `WE BUILD IT.` |
| `accent` | — (word highlighted amber) |
| `kicker` | — |
| `maxLines` | `3` |

### `stat-counter`
| prop | default |
| --- | --- |
| `value` | `62` |
| `suffix` | `%` |
| `label` | — |

### `section-card`
| prop | default |
| --- | --- |
| `kicker` | `SECTION 01` |
| `text` | `WE BUILD IT` |

### `lower-third`
| prop | default |
| --- | --- |
| `name` | `LUCID LABS LTD` |
| `role` | tagline |

### `built-stamp`
| prop | default |
| --- | --- |
| `label` | `BUILT` |

### `flash-wipe`
| prop | default |
| --- | --- |
| `color` | amber — set `"text"` for a cream flash |

### `end-card`
| prop | default |
| --- | --- |
| `text` | `lucidlabsltd.com` |

### `scanlines`
No props. Loops cleanly at 6s.

### `bar-sweep`
| prop | default |
| --- | --- |
| `value` | `100` |
| `max` | `100` |

## Timing tips

- 30fps: one frame ≈ 33ms. A "flash frame" should hold 2–4 frames, not 1 —
  a single frame is invisible on most feeds.
- A hard cut lands well on a scene boundary. Keep `end-card` ≥ 2.5s.
- `scanlines` is designed to be the last scene in the array, drawn with
  `alpha: true` so it tints everything under it.
- Keep `typewriter` ≤ 4s. Beyond that the typing reads as slow, not deliberate.

## Determinism

`drawScene(env, scene, t)` computes `local = t - scene.in` and passes it to the
comp. Comps never read `Date.now()` or `performance.now()`. Grain in `scanlines`
is seeded from the frame number. Rendering the same spec twice produces
byte-identical PNG frames.
