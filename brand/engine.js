/*!
 * LUCID LABS LTD — brand engine
 * Shared drawing primitives for social cards and motion graphics.
 * Works in the browser (window.LucidBrand) and Node (module.exports).
 *
 * Deliberately dependency-free: no CDN, no bundler, no html2canvas.
 * Everything is Canvas 2D so the preview IS the export.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LucidBrand = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var THEMES = {
    dark: {
      bg: "#0B0A08",
      surface: "#12100C",
      text: "#E8E2D4",
      muted: "#8A8272",
      accent: "#FFB000",
      border: "#2A2620",
      green: "#3FBF6B"
    },
    paper: {
      bg: "#F0EBDD",
      surface: "#E9E3D2",
      text: "#26221A",
      muted: "#6E675A",
      accent: "#9A5B00",
      border: "#D5CDB8",
      green: "#1E7A45"
    }
  };

  var FAMILY = 'JetBrains Mono';
  var STACK = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace';

  /* ------------------------------------------------------------------ *
   * color
   * ------------------------------------------------------------------ */

  function rgb(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, a) {
    var c = rgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function mix(a, b, t) {
    var A = rgb(a);
    var B = rgb(b);
    var o = "#";
    for (var i = 0; i < 3; i++) {
      var v = Math.round(A[i] + (B[i] - A[i]) * t);
      o += (v < 16 ? "0" : "") + v.toString(16);
    }
    return o;
  }

  /* ------------------------------------------------------------------ *
   * fonts + tracking-aware text measurement
   *
   * Canvas letterSpacing is still uneven across environments, so tracking
   * is drawn glyph-by-glyph. Widths are cached per (font, spacing, glyph)
   * because auto-fit measures the same string at many sizes.
   * ------------------------------------------------------------------ */

  var _charCache = new Map();
  var CACHE_LIMIT = 60000;

  function fontString(weight, size) {
    return (weight || 400) + " " + Math.round(size) + "px " + STACK;
  }

  function charWidth(ctx, ch, spacing) {
    var key = ctx.font + "|" + spacing + "|" + ch;
    var v = _charCache.get(key);
    if (v === undefined) {
      v = ctx.measureText(ch).width + spacing;
      if (_charCache.size > CACHE_LIMIT) _charCache.clear();
      _charCache.set(key, v);
    }
    return v;
  }

  function measure(ctx, str, spacing) {
    if (!spacing) return ctx.measureText(str).width;
    var w = 0;
    for (var i = 0; i < str.length; i++) w += charWidth(ctx, str[i], spacing);
    return Math.max(0, w - spacing);
  }

  function drawTracked(ctx, str, x, y, spacing, align) {
    if (!spacing) {
      ctx.textAlign = align || "left";
      ctx.fillText(str, x, y);
      ctx.textAlign = "left";
      return;
    }
    var w = measure(ctx, str, spacing);
    var cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    var prev = ctx.textAlign;
    ctx.textAlign = "left";
    for (var i = 0; i < str.length; i++) {
      ctx.fillText(str[i], cx, y);
      cx += charWidth(ctx, str[i], spacing);
    }
    ctx.textAlign = prev;
  }

  /* ------------------------------------------------------------------ *
   * wrapping / auto-fit
   * ------------------------------------------------------------------ */

  function wrapWords(ctx, words, maxWidth, spacing) {
    var lines = [];
    var line = [];
    var w = 0;
    var space = measure(ctx, " ", spacing);
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var ww = measure(ctx, word, spacing);
      if (line.length && w + space + ww > maxWidth) {
        lines.push(line);
        line = [word];
        w = ww;
      } else {
        w += (line.length ? space : 0) + ww;
        line.push(word);
      }
    }
    if (line.length) lines.push(line);
    return lines;
  }

  /**
   * Shrink-to-fit a block of text.
   * Returns { size, lines: [[word,...]], lineHeight, width }.
   */
  function fitBlock(ctx, text, opts) {
    var maxWidth = opts.maxWidth;
    var maxLines = opts.maxLines || 3;
    var maxSize = opts.maxSize || 160;
    var minSize = opts.minSize || 28;
    var weight = opts.weight || 700;
    var spacingEm = opts.spacingEm || 0;
    var lineHeightRatio = opts.lineHeight || 1.15;
    var words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) words = [" "];

    var size = maxSize;
    var spacing = spacingEm * size;
    var lines = [];
    var widest = 0;

    while (size > minSize) {
      ctx.font = fontString(weight, size);
      spacing = spacingEm * size;
      lines = wrapWords(ctx, words, maxWidth, spacing);
      widest = 0;
      for (var i = 0; i < lines.length; i++) {
        widest = Math.max(widest, measure(ctx, lines[i].join(" "), spacing));
      }
      if (lines.length <= maxLines && widest <= maxWidth) break;
      size -= 2;
    }

    ctx.font = fontString(weight, size);
    spacing = spacingEm * size;
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[lines.length - 1];
      var joined = last.join(" ");
      while (joined.length > 1 && measure(ctx, joined + "…", spacing) > maxWidth) {
        joined = joined.slice(0, -1).replace(/\s+\S*$/, "");
      }
      lines[lines.length - 1] = joined.split(/\s+/).filter(Boolean);
      if (lines[lines.length - 1].length === 0) lines[lines.length - 1] = ["…"];
      else lines[lines.length - 1].push("…");
    }

    return {
      size: size,
      spacing: spacing,
      lines: lines,
      lineHeight: Math.round(size * lineHeightRatio),
      weight: weight,
      width: Math.max.apply(Math, lines.map(function (l) {
        return measure(ctx, l.join(" "), spacing);
      }).concat([0]))
    };
  }

  /** Shrink a single line until it fits. */
  function fitLine(ctx, text, opts) {
    var size = opts.maxSize || 160;
    var minSize = opts.minSize || 20;
    var weight = opts.weight || 700;
    var spacingEm = opts.spacingEm || 0;
    var maxWidth = opts.maxWidth || 1e9;
    var str = String(text || "");
    while (size > minSize) {
      ctx.font = fontString(weight, size);
      if (measure(ctx, str, spacingEm * size) <= maxWidth) break;
      size -= 2;
    }
    return { size: size, spacing: spacingEm * size, weight: weight };
  }

  /* ------------------------------------------------------------------ *
   * rich text (amber emphasis inside a block)
   * ------------------------------------------------------------------ */

  function emphasisSet(words, phrase) {
    if (!phrase) return {};
    var target = String(phrase).toUpperCase().split(/\s+/).filter(Boolean);
    if (!target.length) return {};
    var upper = words.map(function (w) { return w.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    var marks = {};
    for (var i = 0; i + target.length <= words.length; i++) {
      var hit = true;
      for (var j = 0; j < target.length; j++) {
        if (upper[i + j] !== target[j].toUpperCase().replace(/[^A-Z0-9]/g, "")) { hit = false; break; }
      }
      if (hit) {
        for (var k = 0; k < target.length; k++) marks[i + k] = true;
        return marks;
      }
    }
    return {};
  }

  function drawRichBlock(ctx, block, x, y, opts) {
    var theme = opts.theme;
    var words = opts.words;
    var marks = opts.marks || {};
    var space = measure(ctx, " ", block.spacing);
    var index = 0;
    ctx.textBaseline = "top";
    for (var li = 0; li < block.lines.length; li++) {
      var line = block.lines[li];
      var lineW = measure(ctx, line.join(" "), block.spacing);
      var cx = x;
      if (opts.align === "center") cx = x - lineW / 2;
      else if (opts.align === "right") cx = x - lineW;
      for (var wi = 0; wi < line.length; wi++) {
        var word = line[wi];
        ctx.fillStyle = marks[index + wi] ? theme.accent : (opts.color || theme.text);
        drawTracked(ctx, word, cx, y + li * block.lineHeight, block.spacing, "left");
        cx += measure(ctx, word, block.spacing) + space;
      }
      index += line.length;
    }
    return block.lines.length * block.lineHeight;
  }

  /* ------------------------------------------------------------------ *
   * logo — vector reproduction of logo-mark.svg (terminal prompt)
   * ------------------------------------------------------------------ */

  function drawMark(ctx, x, y, size, color, glow) {
    var s = size / 120;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 * (s > 0 ? 1 : 1) * Math.max(1, size / 120) * 6;
    }
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(36, 30);
    ctx.lineTo(68, 60);
    ctx.lineTo(36, 90);
    ctx.stroke();
    ctx.fillRect(76, 74, 28, 13);
    ctx.restore();
  }

  /** mark + "LUCID LABS LTD" lockup. Returns total width. */
  function drawLockup(ctx, x, y, markSize, theme, opts) {
    opts = opts || {};
    var size = opts.fontSize || Math.round(markSize * 0.44);
    drawMark(ctx, x, y, markSize, theme.accent, opts.glow !== false);
    ctx.textBaseline = "middle";
    var tx = x + markSize * 1.32;
    var ty = y + markSize / 2;
    ctx.font = fontString(700, size);
    ctx.fillStyle = theme.text;
    drawTracked(ctx, "LUCID LABS", tx, ty, size * 0.1, "left");
    var w1 = measure(ctx, "LUCID LABS", size * 0.1);
    ctx.font = fontString(500, size * 0.62);
    ctx.fillStyle = theme.muted;
    drawTracked(ctx, "LTD", tx + w1 + size * 0.45, ty + size * 0.06, size * 0.08, "left");
    var w2 = measure(ctx, "LTD", size * 0.08);
    ctx.textBaseline = "top";
    return tx - x + w1 + size * 0.45 + w2;
  }

  function lockupWidth(ctx, markSize) {
    var size = Math.round(markSize * 0.44);
    ctx.font = fontString(700, size);
    var w1 = measure(ctx, "LUCID LABS", size * 0.1);
    ctx.font = fontString(500, size * 0.62);
    var w2 = measure(ctx, "LTD", size * 0.08);
    return markSize * 1.32 + w1 + size * 0.45 + w2;
  }

  /* ------------------------------------------------------------------ *
   * texture
   * ------------------------------------------------------------------ */

  function drawScanlines(ctx, w, h, opts) {
    opts = opts || {};
    var step = opts.step || 3;
    var alpha = opts.alpha == null ? 0.045 : opts.alpha;
    var offset = opts.offset || 0;
    var tone = opts.negative ? "0,0,0," : "255,255,255,";
    ctx.save();
    ctx.fillStyle = "rgba(" + tone + alpha + ")";
    for (var y = -step + (offset % step); y < h; y += step) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }

  function drawVignette(ctx, w, h, opts) {
    opts = opts || {};
    var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0," + (opts.strength == null ? 0.5 : opts.strength) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* ------------------------------------------------------------------ *
   * determinism helpers for motion
   * ------------------------------------------------------------------ */

  function prng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  var ease = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    outExpo: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    outBack: function (t) {
      var c = 1.70158, c3 = c + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    linear: function (t) { return t; }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function progress(t, start, dur) { return clamp((t - start) / dur, 0, 1); }

  /* ------------------------------------------------------------------ *
   * brand compliance
   * ------------------------------------------------------------------ */

  /**
   * Count pixels that read as the theme accent.
   * Returns percentage of total pixels.
   */
  function amberBudget(ctx, w, h, accentHex) {
    var target = rgb(accentHex);
    var data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    var count = 0;
    var total = w * h;
    for (var i = 0; i < data.length; i += 4) {
      var r = data[i], g = data[i + 1], b = data[i + 2];
      var dr = r - target[0], dg = g - target[1], db = b - target[2];
      if (dr * dr + dg * dg + db * db < 55 * 55) count++;
    }
    return (count / total) * 100;
  }

  /** Detect decorative green (should only appear on BUILT chips). */
  function greenBudget(ctx, w, h, greenHex) {
    var target = rgb(greenHex);
    var data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    var count = 0;
    for (var i = 0; i < data.length; i += 4) {
      var dr = data[i] - target[0], dg = data[i + 1] - target[1], db = data[i + 2] - target[2];
      if (dr * dr + dg * dg + db * db < 48 * 48) count++;
    }
    return (count / (w * h)) * 100;
  }

  function checkBrand(canvas, opts) {
    opts = opts || {};
    var theme = THEMES[opts.theme || "dark"];
    var ctx = canvas.getContext("2d");
    var amber = amberBudget(ctx, canvas.width, canvas.height, theme.accent);
    var green = greenBudget(ctx, canvas.width, canvas.height, theme.green);
    var violations = [];
    if (amber != null && amber > 10) {
      violations.push("amber covers " + amber.toFixed(1) + "% (limit 10%)");
    }
    if (green != null && green > 0.02 && !opts.allowGreen) {
      violations.push("green present (" + green.toFixed(2) + "%) but no BUILT chip in this layout");
    }
    return { amberPct: amber, greenPct: green, violations: violations, ok: violations.length === 0 };
  }

  /* ------------------------------------------------------------------ *
   * text utilities
   * ------------------------------------------------------------------ */

  var STOPWORDS = new Set(("a an the and or but if then than that this these those is are was were be been being " +
    "to of in on at for with from by as it its we you your our their they he she i not no yes do does did " +
    "can will just about into over after before more most very much many how what why when who which " +
    "new now here there out up down off all any some each every other same own so too only also").split(" "));

  function splitPost(text) {
    var clean = String(text || "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return { headline: "", body: "" };
    var sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
    var head = sentences[0].trim();
    var body = clean.slice(head.length).trim();
    if (head.length > 150) {
      head = head.slice(0, 150).replace(/\s+\S*$/, "");
      body = clean.slice(head.length).trim();
    }
    return { headline: head, body: body };
  }

  function pickAccent(text) {
    var words = String(text || "").match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var lw = w.toLowerCase();
      if (STOPWORDS.has(lw) || w.length < 4) continue;
      var score = w.length * 1.2;
      if (w === w.toUpperCase() && w.length > 2) score += 6;
      if (/^[A-Z]/.test(w)) score += 2;
      if (i === 0) score -= 2;
      if (score > bestScore) { bestScore = score; best = w; }
    }
    return best;
  }

  function extractNumber(text) {
    var m = String(text || "").match(/([$€£₦]?\s?\d[\d,.]*\s?(?:%|x|×|k|m|bn|b|hrs?|hr|mins?|days?|weeks?|months?|years?)?)/i);
    return m ? m[0].trim() : null;
  }

  function slugify(s) {
    return String(s || "card")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "card";
  }

  function titleCase(s) {
    return String(s || "");
  }

  return {
    THEMES: THEMES,
    FAMILY: FAMILY,
    STACK: STACK,
    fontString: fontString,
    measure: measure,
    drawTracked: drawTracked,
    fitBlock: fitBlock,
    fitLine: fitLine,
    emphasisSet: emphasisSet,
    drawRichBlock: drawRichBlock,
    wrapWords: wrapWords,
    drawMark: drawMark,
    drawLockup: drawLockup,
    lockupWidth: lockupWidth,
    drawScanlines: drawScanlines,
    drawVignette: drawVignette,
    roundRect: roundRect,
    rgb: rgb,
    rgba: rgba,
    mix: mix,
    prng: prng,
    ease: ease,
    clamp: clamp,
    progress: progress,
    amberBudget: amberBudget,
    greenBudget: greenBudget,
    checkBrand: checkBrand,
    splitPost: splitPost,
    pickAccent: pickAccent,
    extractNumber: extractNumber,
    slugify: slugify,
    titleCase: titleCase
  };
});
