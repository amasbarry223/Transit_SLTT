/**
 * Génère les icônes PWA — badge circulaire moderne (contour bleu marque)
 * autour de l'emblème aigle+globe extrait de public/logoV.png.
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

// Palette de marque (src/lib/brand-colors.ts) — dupliquée ici car ce script
// tourne hors Next.js (node brut, pas de résolution de `@/`).
const BRAND_PRIMARY = "#2D348C";
const BRAND_BACKGROUND = "#F8F9FC";

// Boîte englobante de l'emblème (aigle + globe + ruban), calibrée à l'oeil
// sur public/logoV.png (1080×977) pour exclure l'anneau de texte extérieur.
const EMBLEM_CROP = { left: 300, top: 195, width: 490, height: 560 };

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Anneau bleu marque + fond, en SVG pour un tracé net à toutes les tailles. */
function badgeRingSvg({ size, ringWidth, fillColor, backgroundColor }) {
  const cx = size / 2;
  const cy = size / 2;
  const ringRadius = size / 2 - ringWidth / 2;
  const backgroundRect = backgroundColor
    ? `<rect width="${size}" height="${size}" fill="${backgroundColor}" />`
    : "";
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${backgroundRect}
      <circle cx="${cx}" cy="${cy}" r="${size / 2 - ringWidth}" fill="${fillColor}" />
      <circle cx="${cx}" cy="${cy}" r="${ringRadius}" fill="none" stroke="${BRAND_PRIMARY}" stroke-width="${ringWidth}" />
    </svg>
  `);
}

/**
 * Compose le badge : anneau bleu + emblème centré.
 * `safeZoneRatio` réduit le diamètre du badge dans le canevas (marge requise
 * pour les icônes maskable, qui peuvent être rognées agressivement par l'OS).
 */
async function buildBadge(emblemBuffer, { size, transparent, safeZoneRatio = 1 }) {
  const badgeSize = Math.round(size * safeZoneRatio);
  const ringWidth = Math.max(2, Math.round(badgeSize * 0.045));

  const ring = await sharp(
    badgeRingSvg({
      size: badgeSize,
      ringWidth,
      fillColor: "#FFFFFF",
      backgroundColor: transparent ? null : undefined,
    }),
  )
    .png()
    .toBuffer();

  // La source (logoV.png) a un fond blanc opaque et la boîte de recadrage
  // laisse passer quelques fragments de l'ancien anneau de texte dans les
  // coins — un masque circulaire les élimine, quel que soit le recadrage.
  const emblemInner = badgeSize - ringWidth * 4;
  const emblemSquare = await sharp(emblemBuffer)
    .resize(emblemInner, emblemInner, {
      fit: "contain",
      background: "#FFFFFF",
    })
    .png()
    .toBuffer();
  const circleMask = Buffer.from(
    `<svg width="${emblemInner}" height="${emblemInner}"><circle cx="${emblemInner / 2}" cy="${emblemInner / 2}" r="${emblemInner / 2}" fill="#fff" /></svg>`,
  );
  const emblem = await sharp(emblemSquare)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const badge = await sharp(ring)
    .composite([{ input: emblem, gravity: "centre" }])
    .png()
    .toBuffer();

  if (badgeSize === size) return badge;

  // Replace le badge (réduit pour respecter la safe zone) au centre d'un
  // canevas plein format, opaque (fond marque) pour les variantes maskable.
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BACKGROUND,
    },
  })
    .composite([{ input: badge, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function main() {
  if (!(await exists(source))) {
    console.error("Source introuvable :", source);
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });

  const emblemBuffer = await sharp(source).extract(EMBLEM_CROP).png().toBuffer();

  const tasks = [
    // "any" — badge circulaire, coins transparents (rendu rond natif).
    { name: "icon-192x192.png", size: 192, transparent: true },
    { name: "icon-512x512.png", size: 512, transparent: true },
    // "maskable" — canevas plein carré opaque, badge dans la safe zone (80%)
    // pour survivre au masque appliqué par l'OS (cercle, squircle, etc.).
    { name: "icon-512x512-maskable.png", size: 512, transparent: false, safeZoneRatio: 0.8 },
    // Apple ignore la transparence (remplit de noir) : canevas opaque requis.
    { name: "apple-touch-icon.png", size: 180, transparent: false, safeZoneRatio: 0.92 },
  ];

  for (const task of tasks) {
    const dest = path.join(outDir, task.name);
    const buf = await buildBadge(emblemBuffer, task);
    await sharp(buf).png().toFile(dest);
    console.log("✓", path.relative(root, dest));
  }

  console.log("\nIcônes PWA générées dans public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
