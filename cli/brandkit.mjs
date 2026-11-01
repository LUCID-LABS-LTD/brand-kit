#!/usr/bin/env node
/**
 * brandkit — LUCID LABS LTD brand engine CLI
 *
 *   brandkit list
 *   brandkit card --text "..." --layout hook --out card.png
 *   brandkit card --batch jobs.json
 *   brandkit render --spec scene.json --out clip.mp4
 *   brandkit overlays --comps lower-third,built-stamp --sizes 1920x1080
 *   brandkit doctor
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const B = require(path.join(ROOT, "brand", "engine.js"));
const Cards = require(path.join(ROOT, "cards", "layouts.js"));
const Card = require(path.join(ROOT, "cards", "card.js"));
const Motion = require(path.join(ROOT, "motion", "comps.js"));

/* ---- args --------------------------------------------------------- */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const raw = a.slice(2);
      const eq = raw.indexOf("=");
      if (eq > -1) { out[raw.slice(0, eq)] = raw.slice(eq + 1); continue; }
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { out[raw] = next; i++; }
      else out[raw] = true;
    } else out._.push(a);
  }
  return out;
}

/* ---- fonts -------------------------------------------------------- */

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const dir = path.join(ROOT, "brand", "fonts");
  for (const w of ["Regular", "Medium", "Bold", "ExtraBold"]) {
    const file = path.join(dir, `JetBrainsMono-${w}.ttf`);
    if (fs.existsSync(file)) GlobalFonts.registerFromPath(file, "JetBrains Mono");
  }
  fontsReady = true;
}

/* ---- card --------------------------------------------------------- */

function renderCard(spec, scale) {
  registerFonts();
  const canvas = createCanvas(spec.width * scale, spec.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  Cards.draw(ctx, spec.width, spec.height, spec);
  return canvas;
}

async function cmdCard(args) {
  const batch = args.batch ? JSON.parse(fs.readFileSync(path.resolve(args.batch), "utf8")) : null;
  const jobs = batch || [{
    text: args.text,
    layout: args.layout,
    size: args.size || "16x9",
    theme: args.theme,
    accent: args.accent,
    kicker: args.kicker,
    body: args.body,
    out: args.out
  }];
  if (!batch && !args.text) throw new Error("card needs --text, --batch, or --spec");

  const outDir = args.dir || path.join(ROOT, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const scale = Number(args.scale || 2);
  const rows = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job.text) throw new Error(`job ${i} has no text`);
    const spec = Card.normalize(job.text, job);
    const canvas = renderCard(spec, scale);
    const check = B.checkBrand(canvas, {
      theme: spec.themeKey,
      allowGreen: spec.layout === "buildlog"
    });
    const out = path.resolve(job.out || path.join(outDir, `lucid-${spec.layout}-${B.slugify(spec.headline)}.png`));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await canvas.encode("png"));
    rows.push({
      layout: spec.layout,
      size: `${spec.width}x${spec.height}`,
      amber: check.amberPct == null ? "n/a" : `${check.amberPct.toFixed(2)}%`,
      brand: check.ok ? "pass" : `FAIL (${check.violations.join("; ")})`,
      file: out
    });
    if (args.json) rows[rows.length - 1] = { ...rows[rows.length - 1], spec };
  }

  if (args.json) console.log(JSON.stringify(rows, null, 2));
  else console.table(rows);
  if (rows.some((r) => r.brand.startsWith("FAIL"))) process.exitCode = 1;
}

/* ---- render / overlays -------------------------------------------- */

async function loadRenderer() {
  return import(pathToFileURL(path.join(ROOT, "motion", "render.mjs")).href);
}

async function cmdRender(args) {
  if (!args.spec) throw new Error("render needs --spec <scene.json>");
  const R = await loadRenderer();
  const spec = R.loadSpec(path.resolve(args.spec));
  spec.alpha = !!args.alpha;
  const out = path.resolve(args.out || path.join(ROOT, "out", `${spec.name}${spec.alpha ? "-alpha.webm" : ".mp4"}`));
  console.log(`› ${spec.name}: ${spec.width}x${spec.height} @${spec.fps}fps, ${spec.duration}s, ${spec.scenes.length} scenes${spec.alpha ? ", alpha" : ""}`);
  const t0 = Date.now();
  const res = await R.render(spec, out, { keepFrames: !!args["keep-frames"] });
  console.log(`✓ ${res.outPath} (${res.frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const OVERLAY_COMPS = ["lower-third", "built-stamp", "flash-wipe", "scanlines", "bar-sweep"];

async function cmdOverlays(args) {
  const R = await loadRenderer();
  const comps = String(args.comps || OVERLAY_COMPS.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const sizes = String(args.sizes || "1920x1080,1080x1920").split(",").map((s) => s.trim());
  const formats = String(args.formats || "webm").split(",").map((s) => s.trim());
  const outRoot = path.resolve(args.out || path.join(ROOT, "overlays"));
  fs.mkdirSync(outRoot, { recursive: true });

  const manifestPath = path.join(outRoot, "manifest.json");
  let manifest = { generated: new Date().toISOString(), items: [] };
  if (fs.existsSync(manifestPath) && !args.force) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch { /* rebuild */ }
  }

  for (const id of comps) {
    const comp = Motion.get(id);
    if (!comp) { console.warn(`! unknown comp: ${id}`); continue; }
    for (const sizeKey of sizes) {
      const size = R.SIZES[sizeKey];
      if (!size) { console.warn(`! unknown size: ${sizeKey}`); continue; }
      for (const fmt of formats) {
        const dir = path.join(outRoot, sizeKey);
        fs.mkdirSync(dir, { recursive: true });
        const out = path.join(dir, `${id}.${fmt}`);
        if (fs.existsSync(out) && !args.force) { console.log(`· skip ${path.relative(ROOT, out)}`); continue; }
        const spec = {
          name: `${id}-${sizeKey}`,
          sizeKey,
          width: size.width,
          height: size.height,
          fps: 30,
          theme: "dark",
          duration: Math.min(comp.duration, Number(args.max || 6)),
          alpha: fmt !== "mp4",
          scenes: [{ comp: id, in: 0, out: Math.min(comp.duration, Number(args.max || 6)), props: compProps(id) }]
        };
        console.log(`› ${id} ${sizeKey} ${fmt}`);
        await R.render(spec, out, {});
        const item = {
          comp: id,
          label: comp.label,
          size: sizeKey,
          width: size.width,
          height: size.height,
          duration: spec.duration,
          format: fmt,
          alpha: fmt !== "mp4",
          file: path.relative(ROOT, out).replace(/\\/g, "/")
        };
        manifest.items = manifest.items.filter((x) => !(x.comp === id && x.size === sizeKey && x.format === fmt));
        manifest.items.push(item);
      }
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ manifest: ${path.relative(ROOT, manifestPath)} (${manifest.items.length} items)`);
}

function compProps(id) {
  switch (id) {
    case "lower-third": return { name: "LUCID LABS LTD", role: "WE BUILD THE FUTURE" };
    case "built-stamp": return { label: "BUILT" };
    case "bar-sweep": return { value: 100, max: 100 };
    case "end-card": return { text: "lucidlabsltd.com" };
    case "typewriter": return { text: "WE BUILD IT.", accent: "BUILD" };
    case "stat-counter": return { value: 62, suffix: "%", label: "DROP TEST PASS" };
    case "section-card": return { kicker: "SECTION 01", text: "WE BUILD IT." };
    case "boot-sting": return { tagline: "WE DON'T PROPOSE THE FUTURE. WE BUILD IT." };
    default: return {};
  }
}

/* ---- list / doctor ------------------------------------------------ */

function cmdList() {
  const rows = [];
  for (const l of Card.list()) rows.push({ kind: "card", id: l.id, label: l.label, hint: l.hint });
  for (const c of Motion.list()) rows.push({ kind: "motion", id: c.id, label: c.label, hint: `${c.hint} · ${c.duration}s` });
  console.table(rows);
}

function cmdDoctor() {
  registerFonts();
  const checks = [];
  const ff = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  checks.push({ check: "node", value: process.version, ok: true });
  checks.push({ check: "ffmpeg", value: ff.status === 0 ? (ff.stdout.split("\n")[0] || "ok") : "MISSING", ok: ff.status === 0 });
  const fontCount = GlobalFonts.families.filter((f) => /JetBrains/i.test(f.family)).length;
  checks.push({ check: "fonts registered", value: String(fontCount), ok: fontCount > 0 });
  for (const f of ["logo/logo-mark.svg", "logo/logo-full.svg", "BRAND.md"]) {
    const p = path.join(ROOT, "brand", f);
    checks.push({ check: `brand/${f}`, value: fs.existsSync(p) ? "present" : "MISSING", ok: fs.existsSync(p) });
  }
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = B.THEMES.dark.accent;
  ctx.fillRect(0, 0, 200, 200);
  const pct = B.amberBudget(ctx, 200, 200, B.THEMES.dark.accent);
  checks.push({ check: "amber detector", value: `${pct.toFixed(1)}%`, ok: pct > 90 });
  console.table(checks);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
}

/* ---- main --------------------------------------------------------- */

const [, , cmd, ...rest] = process.argv;
const args = parseArgs(rest);

try {
  switch (cmd) {
    case "card": await cmdCard(args); break;
    case "render": await cmdRender(args); break;
    case "overlays": await cmdOverlays(args); break;
    case "list": cmdList(); break;
    case "doctor": cmdDoctor(); break;
    case undefined:
    case "help":
      console.log(`brandkit — LUCID LABS LTD

  brandkit list                                    layouts + comps
  brandkit card --text "..." [--layout hook] [--size 16x9] [--out card.png]
  brandkit card --batch jobs.json [--dir out] [--scale 2] [--json]
  brandkit render --spec scene.json --out clip.mp4 [--alpha]
  brandkit overlays [--comps a,b] [--sizes 1920x1080,1080x1920] [--formats webm,mov]
  brandkit doctor

card layouts: ${Card.list().map((l) => l.id).join(", ")}
motion comps: ${Motion.list().map((c) => c.id).join(", ")}`);
      break;
    default:
      console.error(`unknown command "${cmd}" — try: brandkit help`);
      process.exit(1);
  }
} catch (err) {
  console.error("✗ " + err.message);
  process.exit(1);
}
