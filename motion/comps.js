/*!
 * LUCID LABS LTD — motion compositions
 * Every comp is a pure function of time: draw(ctx, env) where env.t is
 * seconds into the comp. No requestAnimationFrame, no wall clock — the same
 * spec always produces identical frames.
 *
 * Style: kinetic type + flash-frame pacing, recoloured to brand.
 * Accent (amber) replaces the red/green flashes in the reference sample.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../brand/engine.js"));
  else root.LucidMotion = factory(root.LucidBrand);
})(typeof self !== "undefined" ? self : this, function (B) {
  "use strict";

  var fontString = B.fontString;
  var measure = B.measure;
  var drawTracked = B.drawTracked;
  var fitBlock = B.fitBlock;
  var fitLine = B.fitLine;
  var emphasisSet = B.emphasisSet;
  var drawTrackedText = B.drawTracked;
  var ease = B.ease;
  var clamp = B.clamp;
  var progress = B.progress;

  function env2(env) {
    var e = Object.assign({}, env);
    e.u = Math.min(env.w, env.h) / 1080;
    e.pad = Math.round(Math.min(env.w, env.h) * 0.055);
    e.p = env.dur ? clamp(env.t / env.dur, 0, 1) : 0;
    return e;
  }

  function upper(s) { return String(s == null ? "" : s).toUpperCase(); }

  function typedLines(ctx, block, reveal, x, y, spacing, theme, marks, wordMap) {
    var space = measure(ctx, " ", spacing);
    var idx = 0;
    var cursor = { x: x, y: y };
    ctx.textBaseline = "top";
    for (var li = 0; li < block.lines.length; li++) {
      var line = block.lines[li];
      var cx = x;
      for (var wi = 0; wi < line.length; wi++) {
        var word = line[wi];
        var em = marks[wordMap[li][wi]];
        ctx.fillStyle = em ? theme.accent : theme.text;
        for (var ci = 0; ci < word.length; ci++) {
          if (idx < reveal) {
            ctx.fillText(word[ci], cx, y + li * block.lineHeight);
          }
          cx += measure(ctx, word[ci], spacing);
          idx++;
        }
        cx += space;
        idx++;
        cursor.x = cx;
        cursor.y = y + li * block.lineHeight;
      }
    }
    return cursor;
  }

  function buildTyped(text, env, opts) {
    opts = opts || {};
    var e = env2(env);
    var block = fitBlock(ctxRef(env), upper(text), {
      maxWidth: e.w - e.pad * 2,
      maxLines: opts.maxLines || 3,
      maxSize: opts.maxSize || Math.round(118 * e.u),
      minSize: opts.minSize || Math.round(34 * e.u),
      weight: 800,
      spacingEm: 0.04,
      lineHeight: opts.lineHeight || 1.12
    });
    var words = upper(text).trim().split(/\s+/).filter(Boolean);
    var marks = emphasisSet(words, upper(env.props.accent || env.props.highlight || ""));
    var map = [];
    var i = 0;
    for (var li = 0; li < block.lines.length; li++) {
      map.push([]);
      for (var wi = 0; wi < block.lines[li].length; wi++) map[li].push(i++);
    }
    return { block: block, marks: marks, map: map };
  }

  // fitBlock needs a live context for measurement; env carries one.
  function ctxRef(env) { return env.ctx; }

  function cursorBlock(ctx, x, y, size, color, t, on) {
    var visible = on === false ? false : (Math.floor(t * 2.2) % 2 === 0);
    if (!visible) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y + size * 0.06, size * 0.52, size * 0.92);
  }

  /* ------------------------------------------------------------------ *
   * comps
   * ------------------------------------------------------------------ */

  var COMPS = {};

  COMPS["boot-sting"] = {
    label: "Boot sting",
    hint: "Mark draws in, wordmark types, cursor blinks",
    duration: 3,
    bg: true,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var t = env.t;
      var u = e.u;
      var markSize = Math.round(200 * u);
      var grow = ease.outBack(clamp(t / 0.55, 0, 1));
      var alpha = clamp(t / 0.35, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      var mx = (e.w - markSize) / 2;
      var my = e.h * 0.40 - markSize / 2;
      B.drawMark(ctx, mx, my, markSize * (0.88 + 0.12 * grow), env.theme.accent, true);
      ctx.restore();

      var words = "LUCID LABS LTD";
      var size = Math.round(34 * u);
      ctx.font = fontString(700, size);
      var full = measure(ctx, words, size * 0.16);
      var reveal = Math.floor(clamp((t - 0.7) / 1.1, 0, 1) * words.length);
      var x = (e.w - full) / 2;
      var y = e.h * 0.40 + markSize / 2 + Math.round(48 * u);
      ctx.textBaseline = "top";
      ctx.fillStyle = env.theme.text;
      var spent = 0;
      for (var i = 0; i < reveal; i++) {
        ctx.fillText(words[i], x + spent, y);
        spent += measure(ctx, words[i], size * 0.16);
      }
      var cursorX = x + spent;
      if (t > 0.7 && t < 2.1) {
        cursorBlock(ctx, cursorX, y, size, env.theme.accent, t);
      }

      var tag = upper(env.props.tagline || "");
      if (tag && t > 1.9) {
        var ta = clamp((t - 1.9) / 0.5, 0, 1);
        ctx.save();
        ctx.globalAlpha = ta;
        var ts = Math.round(16 * u);
        ctx.font = fontString(500, ts);
        ctx.fillStyle = env.theme.muted;
        drawTracked(ctx, tag, e.w / 2, y + size * 2.4, ts * 0.16, "center");
        ctx.restore();
      }

      // sweep line
      var sw = e.w * ease.outCubic(clamp(t / 1.2, 0, 1));
      ctx.fillStyle = B.rgba(env.theme.accent, 0.55);
      ctx.fillRect((e.w - sw) / 2, my - 26 * u, sw, Math.max(1, 2 * u));
    }
  };

  COMPS.typewriter = {
    label: "Typewriter",
    hint: "Headline types on with a blinking cursor",
    duration: 4,
    bg: true,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var text = env.props.text || env.props.headline || "WE BUILD IT.";
      var built = buildTyped(text, env, { maxLines: env.props.maxLines || 3 });
      var block = built.block;
      var total = 0;
      for (var li = 0; li < block.lines.length; li++) {
        total += block.lines[li].join("").length + block.lines[li].length;
      }
      var typeP = clamp(env.t / (env.dur * 0.62), 0, 1);
      var reveal = Math.floor(ease.outCubic(typeP) * total);
      var top = Math.round(e.h * 0.5 - (block.lines.length * block.lineHeight) / 2);
      var cur = typedLines(ctx, block, reveal, e.pad, top, block.spacing, env.theme, built.marks, built.map);
      if (typeP < 1 || Math.floor(env.t * 2.2) % 2 === 0) {
        cursorBlock(ctx, cur.x + 2, cur.y, block.size, env.theme.accent, env.t);
      }
      var kick = upper(env.props.kicker || "");
      if (kick) {
        var ks = Math.round(15 * e.u);
        ctx.font = fontString(500, ks);
        ctx.fillStyle = env.theme.accent;
        ctx.textBaseline = "top";
        drawTracked(ctx, kick, e.pad, e.pad, ks * 0.16, "left");
      }
    }
  };

  COMPS["stat-counter"] = {
    label: "Stat counter",
    hint: "Number counts up, label lands after",
    duration: 4,
    bg: true,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var target = env.props.value != null ? Number(env.props.value) : 62;
      var suffix = env.props.suffix || "";
      var decimals = (String(target).split(".")[1] || "").length;
      var p = ease.outCubic(clamp(env.t / (env.dur * 0.62), 0, 1));
      var shown = (target * p).toFixed(decimals);
      var label = upper(env.props.label || "");
      var size = fitLine(ctx, shown + suffix, {
        maxSize: Math.round(e.h * 0.30),
        minSize: Math.round(e.h * 0.10),
        weight: 800,
        spacingEm: 0.01,
        maxWidth: e.w - e.pad * 2
      }).size;
      ctx.font = fontString(800, size);
      ctx.fillStyle = env.theme.accent;
      ctx.textBaseline = "alphabetic";
      var y = e.h * 0.55;
      drawTracked(ctx, shown + suffix, e.pad, y, size * 0.01, "left");
      ctx.textBaseline = "top";

      var ruleP = ease.outCubic(clamp((env.t - 0.5) / 0.5, 0, 1));
      ctx.fillStyle = env.theme.accent;
      ctx.fillRect(e.pad, y + 26 * e.u, (e.w - e.pad * 2) * 0.16 * ruleP, Math.max(3, 6 * e.u));

      if (label && env.t > env.dur * 0.45) {
        var a = clamp((env.t - env.dur * 0.45) / 0.45, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        var lb = fitBlock(ctx, label, {
          maxWidth: e.w - e.pad * 2,
          maxLines: 2,
          maxSize: Math.round(40 * e.u),
          minSize: Math.round(20 * e.u),
          weight: 600,
          spacingEm: 0.07,
          lineHeight: 1.35
        });
        ctx.fillStyle = env.theme.text;
        ctx.textBaseline = "top";
        for (var i = 0; i < lb.lines.length; i++) {
          drawTracked(ctx, lb.lines[i].join(" "), e.pad, y + 78 * e.u + i * lb.lineHeight, lb.spacing, "left");
        }
        ctx.restore();
      }
    }
  };

  COMPS["section-card"] = {
    label: "Section card",
    hint: "Kicker slides, title wipes in",
    duration: 4,
    bg: true,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var kick = upper(env.props.kicker || "SECTION 01");
      var title = upper(env.props.text || env.props.title || "WE BUILD IT");
      var ks = Math.round(16 * e.u);
      var kp = ease.outCubic(clamp(env.t / 0.5, 0, 1));
      ctx.save();
      ctx.globalAlpha = kp;
      ctx.font = fontString(500, ks);
      ctx.fillStyle = env.theme.accent;
      ctx.textBaseline = "top";
      drawTracked(ctx, kick, e.pad - 40 * e.u * (1 - kp), e.h * 0.30, ks * 0.16, "left");
      ctx.restore();

      var block = fitBlock(ctx, title, {
        maxWidth: e.w - e.pad * 2,
        maxLines: 3,
        maxSize: Math.round(128 * e.u),
        minSize: Math.round(40 * e.u),
        weight: 800,
        spacingEm: 0.04,
        lineHeight: 1.1
      });
      var wipe = ease.outExpo(clamp((env.t - 0.25) / 0.7, 0, 1));
      var top = e.h * 0.44 - (block.lines.length * block.lineHeight) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(e.pad, top - 10 * e.u, (e.w - e.pad * 2) * wipe, block.lines.length * block.lineHeight + 40 * e.u);
      ctx.clip();
      ctx.fillStyle = env.theme.text;
      ctx.textBaseline = "top";
      for (var i = 0; i < block.lines.length; i++) {
        drawTracked(ctx, block.lines[i].join(" "), e.pad, top + i * block.lineHeight, block.spacing, "left");
      }
      ctx.restore();

      var rp = ease.outCubic(clamp((env.t - 0.8) / 0.6, 0, 1));
      ctx.fillStyle = env.theme.accent;
      ctx.fillRect(e.pad, top + block.lines.length * block.lineHeight + 34 * e.u, 120 * e.u * rp, Math.max(3, 5 * e.u));
    }
  };

  COMPS["lower-third"] = {
    label: "Lower third",
    hint: "Name + role bar slides in from the left",
    duration: 4,
    bg: false,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var name = upper(env.props.name || env.props.text || "LUCID LABS LTD");
      var role = upper(env.props.role || "WE DON'T PROPOSE THE FUTURE. WE BUILD IT.");
      var barH = Math.round(104 * e.u);
      var barW = Math.round(e.w * 0.62);
      var y = Math.round(e.h * 0.74);
      var slide = ease.outExpo(clamp(env.t / 0.55, 0, 1));
      var out = ease.inOutCubic(clamp((env.t - (env.dur - 0.5)) / 0.5, 0, 1));
      var x = -barW + (barW * slide) - barW * out;

      ctx.fillStyle = B.rgba(env.theme.surface, 0.94);
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = env.theme.accent;
      ctx.fillRect(x, y, Math.max(2, 6 * e.u), barH);

      var nameSize = Math.round(30 * e.u);
      var roleSize = Math.round(14 * e.u);
      ctx.font = fontString(700, nameSize);
      ctx.fillStyle = env.theme.text;
      ctx.textBaseline = "top";
      drawTracked(ctx, name, x + 32 * e.u, y + 22 * e.u, nameSize * 0.06, "left");
      ctx.font = fontString(500, roleSize);
      ctx.fillStyle = env.theme.muted;
      drawTracked(ctx, role, x + 33 * e.u, y + 68 * e.u, roleSize * 0.1, "left");
    }
  };

  COMPS["built-stamp"] = {
    label: "BUILT stamp",
    hint: "Green chip stamps down — the only legal green",
    duration: 2.5,
    bg: false,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var label = upper(env.props.label || "BUILT");
      var size = Math.round(46 * e.u);
      var p = clamp(env.t / 0.42, 0, 1);
      var scale = p < 1 ? ease.outBack(p) : 1;
      var padX = size * 1.25;
      var padY = size * 0.6;
      ctx.font = fontString(700, size);
      var textW = measure(ctx, label, size * 0.14);
      var cw = textW + padX * 2;
      var ch = size + padY * 2;
      var cx = e.w / 2;
      var cy = e.h / 2;

      // impact ring
      if (env.t < 1.1) {
        var rp = clamp((env.t - 0.28) / 0.8, 0, 1);
        if (rp > 0) {
          ctx.save();
          ctx.globalAlpha = (1 - rp) * 0.55;
          ctx.strokeStyle = env.theme.green;
          ctx.lineWidth = Math.max(2, 5 * e.u);
          ctx.beginPath();
          ctx.arc(cx, cy, (cw * 0.35) + rp * cw * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.strokeStyle = env.theme.green;
      ctx.lineWidth = Math.max(2, 4 * e.u);
      B.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, ch / 2);
      ctx.stroke();
      ctx.fillStyle = env.theme.green;
      ctx.textBaseline = "middle";
      drawTracked(ctx, label, 0, 2 * e.u, size * 0.14, "center");
      ctx.restore();
      ctx.textBaseline = "top";
    }
  };

  COMPS["flash-wipe"] = {
    label: "Flash wipe",
    hint: "Amber flash-frame transition",
    duration: 0.5,
    bg: false,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var p = clamp(env.t / env.dur, 0, 1);
      var a = Math.pow(1 - p, 2) * 0.62;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = env.props.color === "text" ? env.theme.text : env.theme.accent;
      ctx.fillRect(0, 0, e.w, e.h);
      ctx.restore();
      // tear bars: hard horizontal slices that lag the flash
      var bars = 5;
      for (var i = 0; i < bars; i++) {
        var rp = clamp((p - i * 0.05) / 0.25, 0, 1);
        var bh = e.h * (0.02 + (i % 3) * 0.01);
        var by = e.h * ((i + 0.5) / bars) - bh / 2 + (1 - rp) * 40 * e.u;
        ctx.fillStyle = B.rgba(env.theme.text, (1 - rp) * 0.55);
        ctx.fillRect(0, by, e.w, bh);
      }
      var sweep = e.h * ease.outCubic(p);
      ctx.fillStyle = B.rgba(env.theme.text, (1 - p) * 0.8);
      ctx.fillRect(0, sweep - 3 * e.u, e.w, Math.max(2, 6 * e.u));
    }
  };

  COMPS["end-card"] = {
    label: "End card",
    hint: "Mark + wordmark + CTA",
    duration: 4,
    bg: true,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var markSize = Math.round(160 * e.u);
      var pulse = 1 + Math.sin(env.t * 2.4) * 0.02;
      var a = clamp(env.t / 0.5, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      B.drawMark(ctx, (e.w - markSize) / 2, e.h * 0.34, markSize * pulse, env.theme.accent, true);
      ctx.restore();

      var size = Math.round(30 * e.u);
      ctx.font = fontString(700, size);
      var word = "LUCID LABS LTD";
      var reveal = Math.floor(clamp((env.t - 0.4) / 0.8, 0, 1) * word.length);
      var full = measure(ctx, word, size * 0.14);
      var x = (e.w - full) / 2;
      var y = e.h * 0.34 + markSize + 52 * e.u;
      ctx.fillStyle = env.theme.text;
      ctx.textBaseline = "top";
      var spent = 0;
      for (var i = 0; i < reveal; i++) {
        ctx.fillText(word[i], x + spent, y);
        spent += measure(ctx, word[i], size * 0.14);
      }

      if (env.t > 1.5) {
        var cta = upper(env.props.text || env.props.cta || "WE BUILD IT.");
        var ca = clamp((env.t - 1.5) / 0.5, 0, 1);
        var cb = fitBlock(ctx, cta, {
          maxWidth: e.w - e.pad * 2,
          maxLines: 2,
          maxSize: Math.round(34 * e.u),
          minSize: Math.round(18 * e.u),
          weight: 500,
          spacingEm: 0.06,
          lineHeight: 1.4
        });
        ctx.save();
        ctx.globalAlpha = ca;
        ctx.fillStyle = env.theme.muted;
        for (var k = 0; k < cb.lines.length; k++) {
          drawTracked(ctx, cb.lines[k].join(" "), e.w / 2, y + size * 2.6 + k * cb.lineHeight, cb.spacing, "center");
        }
        ctx.restore();
      }
    }
  };

  COMPS.scanlines = {
    label: "Scanlines",
    hint: "Looping CRT texture for overlays",
    duration: 6,
    bg: false,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var step = Math.max(3, Math.round(4 * e.u));
      var offset = (env.t * 26 * e.u) % step;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (var y = -step + offset; y < e.h; y += step) {
        ctx.fillRect(0, y, e.w, Math.max(1, Math.round(1.4 * e.u)));
      }
      ctx.restore();
      B.drawVignette(ctx, e.w, e.h, { strength: 0.45 });
      var rand = B.prng(1000 + Math.floor(env.t * 30));
      ctx.save();
      ctx.fillStyle = "rgba(232,226,212,0.05)";
      for (var i = 0; i < 260; i++) {
        ctx.fillRect(rand() * e.w, rand() * e.h, 1.5 * e.u, 1.5 * e.u);
      }
      ctx.restore();
    }
  };

  COMPS["bar-sweep"] = {
    label: "Progress bar",
    hint: "Amber strip sweeping across the bottom",
    duration: 5,
    bg: false,
    draw: function (env) {
      var e = env2(env);
      var ctx = env.ctx;
      var pct = env.props.value != null ? clamp(Number(env.props.value) / (env.props.max || 100), 0, 1) : 1;
      var p = ease.outCubic(clamp(env.t / Math.max(0.4, env.dur * 0.8), 0, 1)) * pct;
      var hgt = Math.max(4, Math.round(12 * e.u));
      var y = e.h - hgt - Math.round(8 * e.u);
      ctx.fillStyle = B.rgba(env.theme.border, 0.9);
      ctx.fillRect(0, y, e.w, hgt);
      ctx.fillStyle = env.theme.accent;
      ctx.fillRect(0, y, e.w * p, hgt);
    }
  };

  var ORDER = [
    "boot-sting",
    "typewriter",
    "stat-counter",
    "section-card",
    "lower-third",
    "built-stamp",
    "flash-wipe",
    "end-card",
    "scanlines",
    "bar-sweep"
  ];

  function list() {
    return ORDER.map(function (id) {
      return { id: id, label: COMPS[id].label, hint: COMPS[id].hint, duration: COMPS[id].duration };
    });
  }

  function get(id) { return COMPS[id] || null; }

  /**
   * Draw one frame of a scene at absolute time t (seconds).
   */
  function drawScene(env, scene, t) {
    var comp = COMPS[scene.comp];
    if (!comp) throw new Error("Unknown comp: " + scene.comp);
    var local = t - (scene.in || 0);
    var dur = (scene.out || 0) - (scene.in || 0);
    if (local < 0 || local > dur) return false;
    comp.draw(Object.assign({}, env, {
      t: local,
      dur: dur,
      props: scene.props || scene
    }));
    return true;
  }

  return {
    COMPS: COMPS,
    ORDER: ORDER,
    list: list,
    get: get,
    drawScene: drawScene
  };
});
