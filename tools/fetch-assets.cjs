// Re-fetch brand assets as raw bytes (PowerShell redirection corrupts binaries).
const fs = require("fs");
const path = require("path");
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const ROOT = path.resolve(__dirname, "..");
const BASE = "https://api.github.com/repos/LUCID-LABS-LTD/lucid-labs/contents/lucid-labs-brand";

const FILES = [
  ["BRAND.md", "brand/BRAND.md"],
  ["logo/logo-full.svg", "brand/logo/logo-full.svg"],
  ["logo/logo-full-light.svg", "brand/logo/logo-full-light.svg"],
  ["logo/logo-mark.svg", "brand/logo/logo-mark.svg"],
  ["logo/logo-mark-light.svg", "brand/logo/logo-mark-light.svg"],
  ["logo/logo-mono.svg", "brand/logo/logo-mono.svg"],
  ["logo/logo-mono-light.svg", "brand/logo/logo-mono-light.svg"],
  ["logo/png/mark-1080-dark.png", "brand/logo/png/mark-1080-dark.png"],
  ["logo/png/mark-1080-light.png", "brand/logo/png/mark-1080-light.png"],
  ["logo/png/mark-400-dark.png", "brand/logo/png/mark-400-dark.png"],
  ["logo/png/mark-400-light.png", "brand/logo/png/mark-400-light.png"],
  ["logo/png/mark-32-dark.png", "brand/logo/png/mark-32-dark.png"],
  ["logo/png/mark-32-light.png", "brand/logo/png/mark-32-light.png"]
];

(async () => {
  for (const [from, to] of FILES) {
    const url = `${BASE}/${from}`;
    const headers = { Accept: "application/vnd.github.raw", "User-Agent": "brand-kit-fetch" };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${from}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = path.join(ROOT, to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    console.log(`${to.padEnd(36)} ${buf.length} bytes  ${buf.slice(0, 4).toString("hex")}`);
  }
})();
