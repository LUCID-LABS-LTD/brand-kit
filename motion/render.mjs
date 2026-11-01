#!/usr/bin/env node
/**
 * Deterministic frame renderer.
 *
 *   node motion/render.mjs --spec presets/example-scene.json --out out/demo.mp4
 *
 * Frames are drawn with Canvas 2D at exact pixel sizes (no browser scaling),
 * written as PNGs, then encoded with ffmpeg. Same spec in, same bytes out.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const B = require(path.join(ROOT, "brand", "engine.js"));
const Motion = require(path.join(ROOT, "motion", "comps.js"));

const SIZES = {
  "1920x1080": { width: 1920, height: 1080, label: "16:9 HD" },
  "1080x1920": { width: 1080, height: 1920, label: "9:16 vertical" },
  "1080x1080": { width: 1080, height: 1080, label: "1:1 square" },
  "1600x900": { width: 1600, height: 900, label: "16:9 feed" }
};

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

export function loadSpec(specPath) {
  const raw = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const sizeKey = raw.size || "1920x1080";
  const size = SIZES[sizeKey];
  if (!size) throw new Error(`Unknown size "${sizeKey}". Use one of: ${Object.keys(SIZES).join(", ")}`);
  const scenes = (raw.scenes || []).map((s) => ({
    comp: s.comp,
    in: Number(s.in || 0),
    out: Number(s.out || (s.in || 0) + (Motion.get(s.comp)?.duration || 3)),
    props: s.props || s
  }));
  const duration = raw.duration || Math.max(...scenes.map((s) => s.out), 1);
  return {
    name: raw.name || "scene",
    sizeKey,
    width: size.width,
    height: size.height,
    fps: raw.fps || 30,
    theme: raw.theme || "dark",
    duration,
    alpha: !!raw.alpha,
    scenes
  };
}

function frameFileName(i) {
  return `frame_${String(i).padStart(5, "0")}.png`;
}

export async function renderFrames(spec, outDir, opts = {}) {
  registerFonts();
  const width = spec.width;
  const height = spec.height;
  const fps = spec.fps;
  const total = Math.round(spec.duration * fps);
  const theme = B.THEMES[spec.theme] || B.THEMES.dark;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  fs.mkdirSync(outDir, { recursive: true });

  const quiet = opts.quiet;
  for (let i = 0; i < total; i++) {
    const t = i / fps;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!spec.alpha) {
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const scene of spec.scenes) {
      Motion.drawScene({ ctx, w: width, h: height, theme, themeKey: spec.theme }, scene, t);
    }
    const buf = await canvas.encode("png");
    fs.writeFileSync(path.join(outDir, frameFileName(i)), buf);
    if (!quiet && total > 60 && (i % 30 === 0 || i === total - 1)) {
      process.stdout.write(`\r  frames ${i + 1}/${total}`);
    }
  }
  if (!quiet && total > 60) process.stdout.write("\n");
  return { total, dir: outDir };
}

function ffmpeg(args) {
  const res = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error("ffmpeg failed:\n" + (res.stderr || "").slice(-3000));
  }
  return res;
}

export function encode(framesDir, fps, outPath, opts = {}) {
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  const input = ["-y", "-framerate", String(fps), "-i", path.join(framesDir, "frame_%05d.png")];
  const ext = path.extname(outPath).toLowerCase();
  let args;
  if (ext === ".mov") {
    args = [...input, "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
      "-vendor", "apl0", "-an", outPath];
  } else if (ext === ".webm" || opts.alpha) {
    args = [...input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28",
      "-auto-alt-ref", "0", "-row-mt", "1", "-cpu-used", "4", "-an", outPath];
  } else {
    args = [...input, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-an", outPath];
  }
  ffmpeg(args);
  return outPath;
}

export async function render(spec, outPath, opts = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lucid-frames-"));
  try {
    const { total } = await renderFrames(spec, tmp, opts);
    encode(tmp, spec.fps, outPath, { alpha: spec.alpha || opts.alpha });
    return { outPath, frames: total, duration: spec.duration, width: spec.width, height: spec.height };
  } finally {
    if (!opts.keepFrames) {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    } else {
      console.log("frames kept in", tmp);
    }
  }
}

/* ---- CLI ---------------------------------------------------------- */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.spec) {
    console.error("usage: node motion/render.mjs --spec <scene.json> --out <file.mp4> [--alpha] [--keep-frames]");
    process.exit(1);
  }
  const spec = loadSpec(path.resolve(args.spec));
  if (args.alpha) spec.alpha = true;
  const out = args.out || path.join(ROOT, "out", `${spec.name}.mp4`);
  const t0 = Date.now();
  const res = await render(spec, out, { keepFrames: !!args["keep-frames"] });
  console.log(`rendered ${res.outPath} — ${res.frames} frames, ${res.duration}s, ${res.width}x${res.height}, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

export { SIZES };
