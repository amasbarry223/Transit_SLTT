import * as fs from 'fs';

/**
 * Vérifie les premiers octets d'un fichier (magic bytes) contre les
 * signatures connues des formats acceptés — le `mimetype` déclaré à l'upload
 * n'est qu'une valeur du multipart form-data, entièrement contrôlée par le
 * client (falsifiable via `curl -F "file=@malware.bin;type=application/pdf"`).
 * Contrairement au filtre par extension/mimetype (documentFileFilter), qui
 * ne compare que des métadonnées déclarées, ceci lit le contenu réel écrit
 * sur disque.
 */
export async function detectRealMimeType(filePath: string): Promise<string | null> {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await fd.read(buf, 0, 16, 0);
    const b = buf.subarray(0, bytesRead);

    if (b.length >= 4 && b.subarray(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
    ) {
      return 'image/png';
    }
    if (
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
    // HEIC/HEIF : conteneur ISOBMFF — boîte `ftyp` à l'offset 4, la marque
    // (brand) sur 4 octets à l'offset 8 identifie la variante. Liste non
    // exhaustive des marques HEIC/HEIF les plus courantes (photos iPhone).
    if (b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp') {
      const brand = b.subarray(8, 12).toString('ascii');
      const heicBrands = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1']);
      if (heicBrands.has(brand)) return 'image/heic';
    }
    return null;
  } finally {
    await fd.close();
  }
}

/** `image/heic` et `image/heif` partagent le même conteneur/signature —
 *  on ne peut pas les distinguer par magic bytes seuls, donc on les traite
 *  comme équivalents ici (l'un ou l'autre satisfait le contrôle). */
export function realMimeSatisfies(real: string | null, declared: string): boolean {
  if (!real) return false;
  if (real === declared) return true;
  if (real === 'image/heic' && declared === 'image/heif') return true;
  return false;
}
