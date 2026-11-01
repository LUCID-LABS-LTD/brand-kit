/*!
 * LUCID LABS LTD — card facade
 * Turns raw post text into a compliant card spec, then draws it.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../brand/engine.js"), require("./layouts.js"));
  else root.LucidCard = factory(root.LucidBrand, root.LucidCards);
})(typeof self !== "undefined" ? self : this, function (B, L) {
  "use strict";

  var SIZES = {
    "16x9": { width: 1600, height: 900, label: "16:9 · X feed" },
    "4x5": { width: 1080, height: 1350, label: "4:5 · portrait" },
    "1x1": { width: 1080, height: 1080, label: "1:1 · square" }
  };

  var KICKERS = {
    announcement: "LUCID LABS LTD · DEEP-TECH · NIGERIA",
    terminal: "LUCID LABS LTD",
    buildlog: "LUCID LABS LTD · BUILD STATUS",
    stat: "LUCID LABS LTD · BY THE NUMBERS",
    hook: "THREAD",
    minimal: "LUCID LABS LTD",
    quote: "LUCID LABS LTD"
  };

  function normalize(text, opts) {
    opts = opts || {};
    var parts = B.splitPost(text);
    var layout = opts.layout || "announcement";
    var headline = (opts.headline || parts.headline || parts.body || "").trim();
    var body = opts.body != null ? opts.body : parts.body;
    var sizeKey = opts.size || "16x9";
    var size = SIZES[sizeKey] || SIZES["16x9"];

    if (body === headline) body = "";

    var spec = {
      layout: layout,
      size: sizeKey,
      width: size.width,
      height: size.height,
      themeKey: opts.theme || "dark",
      theme: B.THEMES[opts.theme || "dark"] || B.THEMES.dark,
      kicker: opts.kicker || KICKERS[layout] || KICKERS.announcement,
      headline: headline,
      body: body || "",
      accent: opts.accent || B.pickAccent(headline),
      author: opts.author || "LUCID LABS LTD",
      cta: opts.cta || "READ ↓",
      date: opts.date || "",
      title: opts.title || "",
      value: opts.value || null,
      label: opts.label || "",
      lines: opts.lines || null
    };

    if (layout === "stat") {
      spec.value = opts.value || B.extractNumber(headline);
      if (spec.value) {
        spec.label = opts.label || headline.replace(spec.value, " ").replace(/\s+/g, " ").trim();
      }
    }
    if (layout === "quote") spec.author = opts.author || "LUCID LABS LTD";
    return spec;
  }

  function draw(canvas, spec) {
    var ctx = canvas.getContext("2d");
    if (!spec.theme) spec.theme = B.THEMES[spec.themeKey || "dark"];
    L.draw(ctx, canvas.width, canvas.height, spec);
    return canvas;
  }

  function check(canvas, spec) {
    return B.checkBrand(canvas, {
      theme: (spec && spec.themeKey) || "dark",
      allowGreen: !!spec && spec.layout === "buildlog" && /\b(built|shipped|live|passed|done|complete|completed|launched|online)\b/i.test(
        (spec.headline || "") + " " + (spec.body || "")
      )
    });
  }

  /* ---- browser-only helpers ---------------------------------------- */

  function createCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function render(text, opts) {
    opts = opts || {};
    var spec = normalize(text, opts);
    var scale = opts.scale || 2;
    var canvas = createCanvas(spec.width * scale, spec.height * scale);
    var ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    L.draw(ctx, spec.width, spec.height, spec);
    canvas.__spec = spec;
    return canvas;
  }

  function download(canvas, filename) {
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename || "lucid-card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }, "image/png");
  }

  function copy(canvas) {
    return new Promise(function (resolve, reject) {
      if (!navigator.clipboard || !window.ClipboardItem) {
        reject(new Error("Clipboard images not supported in this browser"));
        return;
      }
      canvas.toBlob(function (blob) {
        ClipboardItem
          ? navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(resolve, reject)
          : reject(new Error("ClipboardItem unavailable"));
      }, "image/png");
    });
  }

  return {
    SIZES: SIZES,
    KICKERS: KICKERS,
    normalize: normalize,
    draw: draw,
    check: check,
    render: render,
    createCanvas: createCanvas,
    download: download,
    copy: copy,
    slugify: B.slugify,
    list: L.list,
    layouts: L.LAYOUTS
  };
});
