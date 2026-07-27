/**
 * Copie worker/core Tesseract + pdf.js worker vers /public,
 * et télécharge fra/eng.traineddata.gz si absents.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ocrDir = path.join(root, "public", "ocr");
const langDir = path.join(ocrDir, "lang");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copy(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-ocr-assets] manquant: ${src}`);
    return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`[sync-ocr-assets] ${path.relative(root, dest)}`);
  return true;
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`[sync-ocr-assets] skip ${path.relative(root, dest)}`);
    return;
  }
  console.log(`[sync-ocr-assets] download ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, buf);
  console.log(`[sync-ocr-assets] ${path.relative(root, dest)} (${buf.length} bytes)`);
}

ensureDir(langDir);

copy(
  path.join(root, "node_modules", "tesseract.js", "dist", "worker.min.js"),
  path.join(ocrDir, "worker.min.js"),
);

for (const name of [
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-lstm.wasm",
]) {
  copy(path.join(root, "node_modules", "tesseract.js-core", name), path.join(ocrDir, name));
}

const pdfWorkerSrc = path.join(
  root,
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs",
);
copy(pdfWorkerSrc, path.join(root, "public", "pdf.worker.min.mjs"));

const langs = ["eng", "fra"];
for (const lang of langs) {
  const url = `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`;
  await download(url, path.join(langDir, `${lang}.traineddata.gz`));
}

console.log("[sync-ocr-assets] OK");
