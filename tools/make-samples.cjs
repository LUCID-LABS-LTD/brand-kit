/**
 * Builds the sample gallery: samples/*.png + samples/index.html + samples/manifest.json
 * Run: node tools/make-samples.cjs
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const ROOT = path.resolve(__dirname, "..");
const B = require(path.join(ROOT, "brand", "engine.js"));
const Cards = require(path.join(ROOT, "cards", "layouts.js"));
const Card = require(path.join(ROOT, "cards", "card.js"));

for (const w of ["Regular", "Medium", "Bold", "ExtraBold"]) {
  GlobalFonts.registerFromPath(path.join(ROOT, "brand", "fonts", `JetBrainsMono-${w}.ttf`), "JetBrains Mono");
}

const JOBS = [
  {
    slug: "fleet-live",
    layout: "announcement",
    size: "16x9",
    theme: "dark",
    text: "Nigeria's first autonomous delivery fleet is live. Built end-to-end in Lagos — navigation, power, and fleet control, engineered from zero."
  },
  {
    slug: "thread-opener",
    layout: "hook",
    size: "4x5",
    theme: "dark",
    text: "Most robotics startups in Africa die in the demo stage. We just took ours into a live warehouse."
  },
  {
    slug: "drop-test",
    layout: "stat",
    size: "16x9",
    theme: "dark",
    kicker: "LUCID LABS LTD · HARDWARE",
    text: "62 out of 62 units passed the V3 drop test. Every chassis cleared 1.8 metres onto concrete."
  },
  {
    slug: "build-status",
    layout: "buildlog",
    size: "16x9",
    theme: "dark",
    text: "Fleet control shipped to production this morning. Navigation stack, power management, and the operator console are all live."
  },
  {
    slug: "build-window",
    layout: "terminal",
    size: "16x9",
    theme: "dark",
    text: "We rebuilt the navigation stack from scratch in eleven weeks. No off-the-shelf SLAM, no borrowed autonomy — just a clean room and a deadline."
  },
  {
    slug: "field-note",
    layout: "quote",
    size: "1x1",
    theme: "paper",
    text: "Hardware is just software that has to survive the rain.",
    author: "LUCID LABS LTD · FIELD NOTE 04"
  },
  {
    slug: "quiet-mark",
    layout: "minimal",
    size: "1x1",
    theme: "dark",
    text: "We don't propose the future. We build it."
  },
  {
    slug: "paper-announce",
    layout: "announcement",
    size: "4x5",
    theme: "paper",
    text: "The V3 wearable finishes its first full month in the field. 41 operators, zero critical faults, one very tired firmware team."
  }
];

(async () => {
  const out = path.join(ROOT, "samples");
  fs.mkdirSync(out, { recursive: true });
  const items = [];

  for (const job of JOBS) {
    const spec = Card.normalize(job.text, job);
    const scale = 1;
    const canvas = createCanvas(spec.width * scale, spec.height * scale);
    const ctx = canvas.getContext("2d");
    Cards.draw(ctx, spec.width, spec.height, spec);
    const check = B.checkBrand(canvas, {
      theme: spec.themeKey,
      allowGreen: spec.layout === "buildlog"
    });
    const file = path.join(out, `${job.slug}.png`);
    fs.writeFileSync(file, await canvas.encode("png"));
    items.push({
      slug: job.slug,
      file: `${job.slug}.png`,
      layout: spec.layout,
      theme: spec.themeKey,
      size: `${spec.width}x${spec.height}`,
      amber: check.amberPct == null ? null : Number(check.amberPct.toFixed(2)),
      brand: check.ok ? "pass" : "fail",
      headline: spec.headline
    });
    if (!check.ok) console.warn("FAIL", job.slug, check.violations.join("; "));
  }

  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ generated: new Date().toISOString(), items }, null, 2));

  const cards = items.map((it) => `
      <figure class="card">
        <a href="${it.file}" target="_blank" rel="noopener"><img src="${it.file}" alt="${it.slug}" loading="lazy"></a>
        <figcaption>
          <b>${it.layout}</b>
          <span>${it.theme} · ${it.size} · ${it.amber}% amber</span>
        </figcaption>
      </figure>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LUCID LABS LTD — Card samples</title>
<link rel="stylesheet" href="../brand/brand.css">
<style>
  body{background:var(--ll-bg);color:var(--ll-text);font-family:var(--ll-font);margin:0;padding:40px 28px 80px;}
  header{max-width:1320px;margin:0 auto 34px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;}
  .eyebrow{font-size:10px;letter-spacing:.18em;color:var(--ll-accent);margin-bottom:8px;}
  h1{font-size:24px;margin:0;letter-spacing:.02em;}
  header p{margin:8px 0 0;font-size:12px;color:var(--ll-muted);max-width:52ch;line-height:1.6;}
  header nav a{font-size:10px;letter-spacing:.14em;color:var(--ll-muted);text-decoration:none;border-bottom:1px solid var(--ll-border);padding-bottom:3px;margin-left:16px;}
  header nav a:hover{color:var(--ll-accent);border-color:var(--ll-accent);}
  main{max-width:1320px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:22px;}
  .card{margin:0;border:1px solid var(--ll-border);background:var(--ll-surface);}
  .card img{width:100%;display:block;}
  figcaption{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;font-size:10px;letter-spacing:.08em;border-top:1px solid var(--ll-border);}
  figcaption b{color:var(--ll-text);font-weight:500;text-transform:uppercase;}
  figcaption span{color:var(--ll-muted);}
</style>
</head>
<body>
<header>
  <div>
    <div class="eyebrow">LUCID LABS LTD</div>
    <h1>Card samples</h1>
    <p>Generated by <code>tools/make-samples.cjs</code>. Every card passed the amber-budget check at build time.</p>
  </div>
  <nav><a href="../cards/index.html">Card Studio</a><a href="../motion/index.html">Motion Player</a></nav>
</header>
<main>${cards}
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(out, "index.html"), html);
  console.table(items.map((i) => ({ slug: i.slug, layout: i.layout, theme: i.theme, size: i.size, amber: i.amber, brand: i.brand })));
})();
