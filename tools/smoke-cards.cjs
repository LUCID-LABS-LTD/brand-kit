const path = require("path");
const fs = require("fs");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const ROOT = path.resolve(__dirname, "..");
const FONTS = path.join(ROOT, "brand", "fonts");

for (const w of ["Regular", "Medium", "Bold", "ExtraBold"]) {
  GlobalFonts.registerFromPath(path.join(FONTS, `JetBrainsMono-${w}.ttf`), "JetBrains Mono");
}

const B = require("../brand/engine.js");
const Cards = require("../cards/layouts.js");
const Card = require("../cards/card.js");

const TEXT =
  "Nigeria's first autonomous delivery fleet is live. Built end-to-end in Lagos \u2014 navigation, power, and fleet control, engineered from zero.";

const out = path.join(ROOT, "out", "smoke");
fs.mkdirSync(out, { recursive: true });

const results = [];
(async () => {
for (const layout of Cards.ORDER) {
  for (const [sizeKey, size] of Object.entries({ "16x9": Card.SIZES["16x9"], "4x5": Card.SIZES["4x5"] })) {
    const spec = Card.normalize(TEXT, { layout, size: sizeKey });
    const scale = 1;
    const canvas = createCanvas(size.width * scale, size.height * scale);
    const ctx = canvas.getContext("2d");
    Cards.draw(ctx, size.width, size.height, spec);
    const check = B.checkBrand(canvas, {
      theme: spec.themeKey,
      allowGreen: layout === "buildlog"
    });
    const file = path.join(out, `${layout}-${sizeKey}.png`);
    fs.writeFileSync(file, await canvas.encode("png"));
    results.push({
      layout,
      size: sizeKey,
      amber: check.amberPct && check.amberPct.toFixed(2),
      green: check.greenPct && check.greenPct.toFixed(3),
      ok: check.ok,
      violations: check.violations,
      accent: spec.accent
    });
  }
}

console.table(results);

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  for (const f of failed) {
    console.error(`FAIL ${f.layout} ${f.size}: ${f.violations.join("; ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`\nAll ${results.length} cards pass the brand check.`);
}
})();

