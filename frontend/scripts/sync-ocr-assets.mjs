/**
 * Copie worker/core Tesseract + pdf.js worker vers /public si disponibles,
 * sans bloquer ni faire échouer le build si déjà présents.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ocrDir = path.join(root, "public", "ocr");
const langDir = path.join(ocrDir, "lang");

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

function copy(src, dest) {
  try {
    if (!fs.existsSync(src)) return false;
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    return true;
  } catch {
    return false;
  }
}

try {
  ensureDir(langDir);

  // Recherche dans frontend/node_modules puis dans monorepo root node_modules
  const searchDirs = [
    path.join(root, "node_modules"),
    path.join(root, "..", "node_modules"),
  ];

  for (const nm of searchDirs) {
    const workerSrc = path.join(nm, "tesseract.js", "dist", "worker.min.js");
    if (fs.existsSync(workerSrc)) {
      copy(workerSrc, path.join(ocrDir, "worker.min.js"));
    }

    const coreSrcDir = path.join(nm, "tesseract.js-core");
    if (fs.existsSync(coreSrcDir)) {
      try {
        for (const name of fs.readdirSync(coreSrcDir)) {
          if (!/^tesseract-core.*\.wasm(\.js)?$/.test(name)) continue;
          copy(path.join(coreSrcDir, name), path.join(ocrDir, name));
        }
      } catch {}
    }

    const pdfWorkerSrc = path.join(nm, "pdfjs-dist", "build", "pdf.worker.min.mjs");
    if (fs.existsSync(pdfWorkerSrc)) {
      copy(pdfWorkerSrc, path.join(root, "public", "pdf.worker.min.mjs"));
    }
  }
} catch (e) {
  console.warn("[sync-ocr-assets] avertissement ignoré:", e.message);
}

console.log("[sync-ocr-assets] OK");
