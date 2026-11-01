/*!
 * LUCID LABS LTD — card layouts
 * Seven post layouts. Every layout draws into an existing 2D context and
 * respects the brand rules (amber ≤10%, green only on BUILT, mono type).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../brand/engine.js"));
  else root.LucidCards = factory(root.LucidBrand);
})(typeof self !== "undefined" ? self : this, function (B) {
  "use strict";

  var drawScanlines = B.drawScanlines;
  var drawVignette = B.drawVignette;
  var rgba = B.rgba;
  var roundRect = B.roundRect;
  var fontString = B.fontString;
  var measure = B.measure;
  var drawTracked = B.drawTracked;
  var fitBlock = B.fitBlock;
  var fitLine = B.fitLine;
  var drawRichBlock = B.drawRichBlock;
  var emphasisSet = B.emphasisSet;
  var drawLockup = B.drawLockup;
  var lockupWidth = B.lockupWidth;

  function metrics(w, h, spec) {
    return {
      S: w / 1600,
      pad: Math.round(w * 0.05),
      w: w,
      h: h,
      theme: spec.theme,
      paper: spec.themeKey === "paper"
    };
  }

  function background(ctx, w, h, spec) {
    var m = metrics(w, h, spec);
    var t = spec.theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, w, h);
    var g = ctx.createRadialGradient(w * 0.18, h * 0.08, 0, w * 0.18, h * 0.08, Math.max(w, h) * 1.05);
    g.addColorStop(0, rgba(t.surface, m.paper ? 1 : 0.95));
    g.addColorStop(0.55, rgba(t.surface, m.paper ? 0.35 : 0.25));
    g.addColorStop(1, rgba(t.bg, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawScanlines(ctx, w, h, {
      step: Math.max(2, Math.round(3 * m.S)),
      alpha: m.paper ? 0.025 : 0.045,
      negative: m.paper
    });
    drawVignette(ctx, w, h, { strength: m.paper ? 0.10 : 0.42 });
  }

  function kicker(ctx, m, text, opts) {
    opts = opts || {};
    var size = opts.size || Math.round(17 * m.S);
    ctx.font = fontString(500, size);
    ctx.fillStyle = opts.color || m.theme.accent;
    ctx.textBaseline = "top";
    drawTracked(ctx, String(text).toUpperCase(), opts.x == null ? m.pad : opts.x, opts.y == null ? m.pad * 0.92 : opts.y, size * 0.14, opts.align || "left");
    return size * 1.6;
  }

  function bodyCopy(ctx, m, text, x, y, maxWidth, opts) {
    opts = opts || {};
    if (!text) return 0;
    var block = fitBlock(ctx, text, {
      maxWidth: maxWidth,
      maxLines: opts.maxLines || 2,
      maxSize: opts.maxSize || Math.round(26 * m.S),
      minSize: opts.minSize || Math.round(17 * m.S),
      weight: 400,
      spacingEm: 0,
      lineHeight: opts.lineHeight || 1.55
    });
    ctx.fillStyle = opts.color || m.theme.muted;
    ctx.textBaseline = "top";
    for (var i = 0; i < block.lines.length; i++) {
      drawTracked(ctx, block.lines[i].join(" "), x, y + i * block.lineHeight, 0, "left");
    }
    return block.lines.length * block.lineHeight;
  }

  function headlineBlock(ctx, m, spec, opts) {
    opts = opts || {};
    var maxWidth = opts.maxWidth || m.w - m.pad * 1.7;
    var top = opts.top;
    var block = fitBlock(ctx, spec.headline, {
      maxWidth: maxWidth,
      maxLines: opts.maxLines || 3,
      maxSize: opts.maxSize || Math.round(112 * m.S),
      minSize: opts.minSize || Math.round(40 * m.S),
      weight: 800,
      spacingEm: 0.04,
      lineHeight: opts.lineHeight || 1.12
    });
    var words = String(spec.headline || "").trim().split(/\s+/).filter(Boolean);
    var marks = emphasisSet(words, spec.accent);
    var used = drawRichBlock(ctx, block, opts.x == null ? m.pad : opts.x, top, {
      theme: m.theme,
      words: words,
      marks: marks,
      align: opts.align || "left",
      color: m.theme.text
    });
    // uppercase rendering: canvas has no text-transform, so re-draw if needed
    return { block: block, height: used };
  }

  /** Headlines are uppercase by brand rule; this wraps the draw in a transform-free pass. */
  function upper(s) {
    return String(s == null ? "" : s).toUpperCase();
  }

  function richHeadline(ctx, m, spec, opts) {
    opts = opts || {};
    var headline = upper(spec.headline);
    var maxWidth = opts.maxWidth || m.w - m.pad * 1.7;
    var block = fitBlock(ctx, headline, {
      maxWidth: maxWidth,
      maxLines: opts.maxLines || 3,
      maxSize: opts.maxSize || Math.round(112 * m.S),
      minSize: opts.minSize || Math.round(38 * m.S),
      weight: 800,
      spacingEm: 0.04,
      lineHeight: opts.lineHeight || 1.12
    });
    var words = headline.trim().split(/\s+/).filter(Boolean);
    var marks = emphasisSet(words, upper(spec.accent));
    var used = drawRichBlock(ctx, block, opts.x == null ? m.pad : opts.x, opts.top, {
      theme: m.theme,
      words: words,
      marks: marks,
      align: opts.align || "left",
      color: m.theme.text
    });
    return { block: block, height: used };
  }

  function codeLines(spec, max, chars) {
    if (spec.lines && spec.lines.length) return spec.lines.slice(0, max);
    var text = ((spec.body || "") + " " + (spec.headline || "")).replace(/\s+/g, " ").trim();
    if (!text) return [];
    var words = text.split(/\s+/).filter(Boolean);
    var limit = chars || 44;
    var lines = [];
    var cur = "";
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + " " + words[i] : words[i];
      if (next.length > limit) {
        if (cur) lines.push(cur);
        cur = words[i];
        if (lines.length >= max) break;
      } else {
        cur = next;
      }
    }
    if (cur && lines.length < max) lines.push(cur);
    var truncated = lines.join(" ").split(/\s+/).length < words.length;
    if (truncated && lines.length) {
      var last = lines[lines.length - 1];
      if (last.length > limit - 2) last = last.slice(0, limit - 3).replace(/\s+\S*$/, "");
      lines[lines.length - 1] = last + "…";
    }
    return lines.slice(0, max);
  }

  function isBuilt(spec) {
    return /\b(built|shipped|live|passed|done|complete|completed|launched|online)\b/i.test(
      spec.headline + " " + (spec.body || "") + " " + (spec.items || []).join(" ")
    );
  }

  function chip(ctx, x, y, label, color, opts) {
    opts = opts || {};
    var size = opts.size || 17;
    var padX = size * 1.1;
    var padY = size * 0.62;
    ctx.font = fontString(600, size);
    var w = measure(ctx, label, size * 0.12) + padX * 2;
    var h = size + padY * 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size * 0.09);
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    drawTracked(ctx, label, x + padX, y + h / 2 + 1, size * 0.12, "left");
    ctx.textBaseline = "top";
    return w;
  }

  /* ------------------------------------------------------------------ *
   * layouts
   * ------------------------------------------------------------------ */

  var LAYOUTS = {};

  LAYOUTS.announcement = {
    label: "Announcement",
    hint: "Kicker + headline with one amber word",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      kicker(ctx, m, spec.kicker || "LUCID LABS LTD · DEEP-TECH · NIGERIA");
      var top = Math.round(h * (h / w > 1.2 ? 0.24 : 0.32));
      var res = richHeadline(ctx, m, spec, { top: top, maxLines: 3, maxWidth: m.w - m.pad * 1.8 });
      var y = top + res.height + Math.round(46 * m.S);
      bodyCopy(ctx, m, spec.body, m.pad, y, m.w * 0.66, { maxLines: 2, maxSize: Math.round(27 * m.S) });
      var markSize = Math.round(30 * m.S);
      drawLockup(ctx, m.w - m.pad - lockupWidth(ctx, markSize), m.h - m.pad - markSize, markSize, m.theme);
    }
  };

  LAYOUTS.terminal = {
    label: "Terminal",
    hint: "Command window with $ prompt lines",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      var x = m.pad;
      var y = m.pad;
      var fw = w - m.pad * 2;
      var fh = h - m.pad * 2;
      ctx.fillStyle = m.theme.surface;
      roundRect(ctx, x, y, fw, fh, 12 * m.S);
      ctx.fill();
      ctx.strokeStyle = m.theme.border;
      ctx.lineWidth = Math.max(1, 1.5 * m.S);
      ctx.stroke();

      var barH = Math.round(64 * m.S);
      ctx.save();
      roundRect(ctx, x, y, fw, fh, 12 * m.S);
      ctx.clip();
      ctx.strokeStyle = m.theme.border;
      ctx.beginPath();
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x + fw, y + barH);
      ctx.stroke();
      ctx.restore();

      var dotR = Math.round(6 * m.S);
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 30 * m.S + i * 24 * m.S, y + barH / 2, dotR, 0, Math.PI * 2);
        ctx.fillStyle = m.theme.border;
        ctx.fill();
      }
      var barSize = Math.round(18 * m.S);
      ctx.font = fontString(400, barSize);
      ctx.fillStyle = m.theme.muted;
      ctx.textBaseline = "middle";
      drawTracked(ctx, spec.title || "lucidlabs-ltd — build.log", x + fw / 2, y + barH / 2, barSize * 0.04, "center");

      var lines = codeLines(spec, 2, 38);
      var lineSize = Math.round(21 * m.S);
      ctx.font = fontString(400, lineSize);
      var lineH = Math.round(lineSize * 1.85);
      var ly = y + barH + 36 * m.S;
      ctx.textBaseline = "top";
      for (var j = 0; j < lines.length; j++) {
        ctx.fillStyle = m.theme.accent;
        drawTracked(ctx, "$", x + 40 * m.S, ly + j * lineH, 0, "left");
        ctx.fillStyle = m.theme.text;
        drawTracked(ctx, lines[j], x + 40 * m.S + measure(ctx, "$ ", 0), ly + j * lineH, 0, "left");
      }

      var boxTop = ly + lines.length * lineH + Math.round(26 * m.S);
      var boxBottom = y + fh - Math.round(96 * m.S);
      var bx = x + 40 * m.S;
      var bw = fw - 80 * m.S;
      ctx.save();
      ctx.setLineDash([Math.max(4, 8 * m.S), Math.max(3, 6 * m.S)]);
      ctx.strokeStyle = m.theme.border;
      ctx.lineWidth = Math.max(1, 1.5 * m.S);
      roundRect(ctx, bx, boxTop, bw, boxBottom - boxTop, 6 * m.S);
      ctx.stroke();
      ctx.restore();

      var labSize = Math.round(13 * m.S);
      ctx.font = fontString(500, labSize);
      ctx.fillStyle = m.theme.muted;
      ctx.textBaseline = "top";
      drawTracked(ctx, "// OUTPUT", bx + 22 * m.S, boxTop + 20 * m.S, labSize * 0.1, "left");

      var out = fitBlock(ctx, upper(spec.headline), {
        maxWidth: bw - 44 * m.S,
        maxLines: 3,
        maxSize: Math.round(56 * m.S),
        minSize: Math.round(24 * m.S),
        weight: 800,
        spacingEm: 0.04,
        lineHeight: 1.14
      });
      var outWords = upper(spec.headline).trim().split(/\s+/).filter(Boolean);
      var outMarks = emphasisSet(outWords, upper(spec.accent));
      var outH = out.lines.length * out.lineHeight;
      var oy = Math.max(boxTop + 52 * m.S, boxTop + (boxBottom - boxTop - outH) / 2 + 4 * m.S);
      drawRichBlock(ctx, out, bx + 22 * m.S, oy, {
        theme: m.theme,
        words: outWords,
        marks: outMarks,
        align: "left",
        color: m.theme.text
      });

      var footSize = Math.round(15 * m.S);
      ctx.font = fontString(400, footSize);
      ctx.fillStyle = m.theme.muted;
      ctx.textBaseline = "middle";
      drawTracked(ctx, spec.date || "2026 // LAGOS, NG", x + 40 * m.S, y + fh - 34 * m.S, footSize * 0.06, "left");
      var markSize = Math.round(22 * m.S);
      drawLockup(ctx, x + fw - 40 * m.S - lockupWidth(ctx, markSize), y + fh - 34 * m.S - markSize / 2, markSize, m.theme, { glow: false });
      ctx.textBaseline = "top";
    }
  };

  LAYOUTS.buildlog = {
    label: "Build log",
    hint: "Status chip + timestamped log rows",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      kicker(ctx, m, spec.kicker || "LUCID LABS LTD · BUILD STATUS");
      var top = Math.round(h * 0.20);
      var res = richHeadline(ctx, m, spec, { top: top, maxLines: 2, maxSize: Math.round(72 * m.S) });
      var built = isBuilt(spec);
      var cy = top + res.height + Math.round(34 * m.S);
      chip(ctx, m.pad, cy, built ? "BUILT" : "IN PROGRESS", built ? m.theme.green : m.theme.accent, { size: Math.round(16 * m.S) });

      var rows = codeLines(spec, 3, 46);
      var rowSize = Math.round(25 * m.S);
      var rowH = Math.round(rowSize * 3);
      var ry = cy + Math.round(66 * m.S);
      for (var i = 0; i < rows.length; i++) {
        var yy = ry + i * rowH;
        ctx.strokeStyle = m.theme.border;
        ctx.lineWidth = Math.max(1, 1 * m.S);
        ctx.beginPath();
        ctx.moveTo(m.pad, yy);
        ctx.lineTo(w - m.pad, yy);
        ctx.stroke();
        ctx.font = fontString(500, Math.round(15 * m.S));
        ctx.fillStyle = m.theme.muted;
        ctx.textBaseline = "middle";
        drawTracked(ctx, "0" + (i + 1), m.pad, yy + rowH / 2, 1, "left");
        ctx.font = fontString(400, rowSize);
        ctx.fillStyle = m.theme.text;
        drawTracked(ctx, rows[i], m.pad + 66 * m.S, yy + rowH / 2, 0, "left");
        ctx.textBaseline = "top";
      }
      var markSize = Math.round(28 * m.S);
      drawLockup(ctx, w - m.pad - lockupWidth(ctx, markSize), h - m.pad - markSize, markSize, m.theme);
    }
  };

  LAYOUTS.stat = {
    label: "Stat",
    hint: "One big number, amber, with a label",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      kicker(ctx, m, spec.kicker || "LUCID LABS LTD · BY THE NUMBERS");

      var num = spec.value || B.extractNumber(spec.headline);
      var label = spec.label || (num ? spec.headline.replace(num, " ").trim() : spec.headline);
      var body = spec.body || "";

      var centerY = Math.round(h * 0.44);
      if (num) {
        var numFit = fitLine(ctx, String(num), {
          maxSize: Math.round(h * 0.30),
          minSize: Math.round(h * 0.09),
          weight: 800,
          spacingEm: 0.01,
          maxWidth: w - m.pad * 2
        });
        ctx.font = fontString(800, numFit.size);
        ctx.fillStyle = m.theme.accent;
        ctx.textBaseline = "alphabetic";
        drawTracked(ctx, String(num), m.pad, centerY, numFit.spacing, "left");
        ctx.textBaseline = "top";
        var underlineY = centerY + Math.round(28 * m.S);
        ctx.fillStyle = m.theme.accent;
        ctx.fillRect(m.pad, underlineY, Math.round(132 * m.S), Math.max(3, Math.round(6 * m.S)));
        centerY = underlineY + Math.round(52 * m.S);
      } else {
        var big = fitBlock(ctx, upper(spec.headline), {
          maxWidth: w - m.pad * 2,
          maxLines: 3,
          maxSize: Math.round(96 * m.S),
          minSize: Math.round(38 * m.S),
          weight: 800,
          spacingEm: 0.04,
          lineHeight: 1.1
        });
        ctx.fillStyle = m.theme.text;
        ctx.textBaseline = "top";
        for (var i = 0; i < big.lines.length; i++) {
          drawTracked(ctx, big.lines[i].join(" "), m.pad, centerY + i * big.lineHeight, big.spacing, "left");
        }
        centerY += big.lines.length * big.lineHeight + Math.round(30 * m.S);
        label = "";
        body = "";
      }

      var bottomLimit = h - m.pad - Math.round(70 * m.S);
      if (label && centerY < bottomLimit - 40 * m.S) {
        var lb = fitBlock(ctx, upper(label), {
          maxWidth: Math.round(w * 0.72),
          maxLines: 2,
          maxSize: Math.round(38 * m.S),
          minSize: Math.round(22 * m.S),
          weight: 600,
          spacingEm: 0.06,
          lineHeight: 1.35
        });
        ctx.fillStyle = m.theme.text;
        ctx.textBaseline = "top";
        for (var k = 0; k < lb.lines.length; k++) {
          drawTracked(ctx, lb.lines[k].join(" "), m.pad, centerY + k * lb.lineHeight, lb.spacing, "left");
        }
        centerY += lb.lines.length * lb.lineHeight + Math.round(22 * m.S);
      }
      if (body && centerY < bottomLimit - 30 * m.S) {
        bodyCopy(ctx, m, body, m.pad, centerY, Math.round(w * 0.62), { maxLines: 2 });
      }

      var markSize = Math.round(30 * m.S);
      drawLockup(ctx, w - m.pad - lockupWidth(ctx, markSize), h - m.pad - markSize, markSize, m.theme);
    }
  };

  LAYOUTS.hook = {
    label: "Thread hook",
    hint: "Big opener for the first post of a thread",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      // accent glow bottom-left, low alpha, keeps amber budget honest
      var g = ctx.createRadialGradient(0, h, 0, 0, h, Math.max(w, h) * 0.55);
      g.addColorStop(0, rgba(m.theme.accent, 0.10));
      g.addColorStop(1, rgba(m.theme.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      kicker(ctx, m, spec.kicker || "THREAD");
      var top = Math.round(h * (h / w > 1.2 ? 0.26 : 0.30));
      var res = richHeadline(ctx, m, spec, {
        top: top,
        maxLines: 4,
        maxSize: Math.round(118 * m.S),
        minSize: Math.round(40 * m.S),
        maxWidth: w - m.pad * 2
      });

      var chipY = h - m.pad - Math.round(52 * m.S);
      var cw = chip(ctx, m.pad, chipY + Math.round(20 * m.S), spec.cta || "READ ↓", m.theme.accent, { size: Math.round(16 * m.S) });
      var markSize = Math.round(28 * m.S);
      drawLockup(ctx, w - m.pad - lockupWidth(ctx, markSize), h - m.pad - markSize, markSize, m.theme);
      return { headlineBottom: top + res.height, chipWidth: cw };
    }
  };

  LAYOUTS.minimal = {
    label: "Minimal",
    hint: "Mark, one line, wordmark — quiet posts",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      ctx.strokeStyle = m.theme.border;
      ctx.lineWidth = Math.max(1, 1 * m.S);
      roundRect(ctx, m.pad * 0.55, m.pad * 0.55, w - m.pad * 1.1, h - m.pad * 1.1, 8 * m.S);
      ctx.stroke();

      var markSize = Math.round(84 * m.S);
      B.drawMark(ctx, (w - markSize) / 2, h * 0.34, markSize, m.theme.accent, true);
      var ws = Math.round(28 * m.S);
      ctx.font = fontString(700, ws);
      ctx.fillStyle = m.theme.text;
      ctx.textBaseline = "middle";
      drawTracked(ctx, "LUCID LABS", w / 2, h * 0.34 + markSize + 34 * m.S, ws * 0.1, "center");
      var w1 = measure(ctx, "LUCID LABS", ws * 0.1);
      ctx.font = fontString(500, ws * 0.62);
      ctx.fillStyle = m.theme.muted;
      drawTracked(ctx, "LTD", w / 2 + w1 / 2 + ws * 0.75, h * 0.34 + markSize + 34 * m.S + ws * 0.05, ws * 0.08, "left");
      ctx.textBaseline = "top";

      var line = spec.headline || spec.body;
      if (line) {
        var lb = fitBlock(ctx, line, {
          maxWidth: w * 0.7,
          maxLines: 2,
          maxSize: Math.round(30 * m.S),
          minSize: Math.round(18 * m.S),
          weight: 400,
          lineHeight: 1.5
        });
        ctx.fillStyle = m.theme.muted;
        for (var i = 0; i < lb.lines.length; i++) {
          drawTracked(ctx, lb.lines[i].join(" "), w / 2, Math.round(h * 0.70) + i * lb.lineHeight, 0, "center");
        }
      }
    }
  };

  LAYOUTS.quote = {
    label: "Quote",
    hint: "Pull-quote with attribution",
    draw: function (ctx, w, h, spec) {
      var m = metrics(w, h, spec);
      background(ctx, w, h, spec);
      var qs = Math.round(190 * m.S);
      ctx.font = fontString(800, qs);
      ctx.fillStyle = m.theme.accent;
      ctx.textBaseline = "top";
      ctx.fillText("\u201C", m.pad, Math.round(h * 0.10));

      var top = Math.round(h * 0.34);
      var block = fitBlock(ctx, spec.headline, {
        maxWidth: w * 0.78,
        maxLines: 3,
        maxSize: Math.round(62 * m.S),
        minSize: Math.round(30 * m.S),
        weight: 700,
        spacingEm: 0.005,
        lineHeight: 1.32
      });
      var words = String(spec.headline || "").trim().split(/\s+/).filter(Boolean);
      var marks = emphasisSet(words, spec.accent);
      drawRichBlock(ctx, block, w / 2, top, {
        theme: m.theme,
        words: words,
        marks: marks,
        align: "center",
        color: m.theme.text
      });

      var attrSize = Math.round(19 * m.S);
      ctx.font = fontString(500, attrSize);
      ctx.fillStyle = m.theme.muted;
      drawTracked(ctx, upper(spec.author || "LUCID LABS LTD"), w / 2, Math.round(h * 0.73), attrSize * 0.12, "center");
      var markSize = Math.round(26 * m.S);
      drawLockup(ctx, w - m.pad - lockupWidth(ctx, markSize), h - m.pad - markSize, markSize, m.theme, { glow: false });
    }
  };

  var ORDER = ["announcement", "terminal", "buildlog", "stat", "hook", "minimal", "quote"];

  function list() {
    return ORDER.map(function (id) {
      return { id: id, label: LAYOUTS[id].label, hint: LAYOUTS[id].hint };
    });
  }

  function draw(ctx, w, h, spec) {
    var layout = LAYOUTS[spec.layout] || LAYOUTS.announcement;
    if (!spec.theme) spec.theme = B.THEMES[spec.themeKey || "dark"];
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    layout.draw(ctx, w, h, spec);
    ctx.restore();
    return spec;
  }

  return {
    LAYOUTS: LAYOUTS,
    ORDER: ORDER,
    list: list,
    draw: draw
  };
});
