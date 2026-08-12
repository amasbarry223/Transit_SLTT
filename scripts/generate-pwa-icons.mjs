/**
 * Génère les icônes PWA à partir de public/logoV.png.
 * Usage : node scripts/generate-pwa-icons.mjs
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "public", "logoV.png");
const outDir = path.join(root, "public", "icons");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Redimensionne le logo avec padding (ratio préservé) sur fond brand. */
async function writeIcon(dest, size, paddingRatio = 0.12, bg = "#F8F9FC") {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;
  const logoBuf = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logoBuf, gravity: "centre" }])
    .png()
    .toFile(dest);
}

async function main() {
  if (!(await exists(source))) {
    console.error("Source introuvable :", source);
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });

  const tasks = [
    { name: "icon-192x192.png", size: 192, padding: 0.12 },
    { name: "icon-512x512.png", size: 512, padding: 0.12 },
    { name: "icon-512x512-maskable.png", size: 512, padding: 0.2 },
    { name: "apple-touch-icon.png", size: 180, padding: 0.14 },
  ];

  for (const { name, size, padding } of tasks) {
    const dest = path.join(outDir, name);
    await writeIcon(dest, size, padding);
    console.log("✓", path.relative(root, dest));
  }

  console.log("\nIcônes PWA générées dans public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
