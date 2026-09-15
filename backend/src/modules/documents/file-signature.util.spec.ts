import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectRealMimeType, realMimeSatisfies } from './file-signature.util';

async function writeTemp(bytes: number[] | Buffer): Promise<string> {
  const p = path.join(os.tmpdir(), `sig-test-${Date.now()}-${Math.random()}`);
  await fs.promises.writeFile(p, Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
  return p;
}

describe('detectRealMimeType', () => {
  it('reconnaît un PDF à sa signature %PDF', async () => {
    const p = await writeTemp(Buffer.from('%PDF-1.4\n...reste du contenu'));
    expect(await detectRealMimeType(p)).toBe('application/pdf');
    await fs.promises.unlink(p);
  });

  it('reconnaît un JPEG à ses octets FF D8 FF', async () => {
    const p = await writeTemp([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(await detectRealMimeType(p)).toBe('image/jpeg');
    await fs.promises.unlink(p);
  });

  it('reconnaît un PNG à sa signature complète', async () => {
    const p = await writeTemp([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(await detectRealMimeType(p)).toBe('image/png');
    await fs.promises.unlink(p);
  });

  it('reconnaît un WEBP (RIFF....WEBP)', async () => {
    const p = await writeTemp(Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]));
    expect(await detectRealMimeType(p)).toBe('image/webp');
    await fs.promises.unlink(p);
  });

  it('reconnaît un HEIC via sa boîte ftyp/marque', async () => {
    const p = await writeTemp(Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from('ftyp'), Buffer.from('heic')]));
    expect(await detectRealMimeType(p)).toBe('image/heic');
    await fs.promises.unlink(p);
  });

  it("renvoie null pour un contenu arbitraire (ex. un exécutable renommé en .pdf)", async () => {
    const p = await writeTemp(Buffer.from('MZ\x90\x00\x03\x00\x00\x00 ceci nest pas un pdf'));
    expect(await detectRealMimeType(p)).toBeNull();
    await fs.promises.unlink(p);
  });
});

describe('realMimeSatisfies', () => {
  it('accepte une correspondance exacte', () => {
    expect(realMimeSatisfies('application/pdf', 'application/pdf')).toBe(true);
  });

  it('accepte heic détecté pour un mimetype déclaré heif (signature partagée)', () => {
    expect(realMimeSatisfies('image/heic', 'image/heif')).toBe(true);
  });

  it('rejette une non-correspondance (mimetype falsifié)', () => {
    expect(realMimeSatisfies('image/jpeg', 'application/pdf')).toBe(false);
  });

  it('rejette quand aucune signature connue n’a été détectée', () => {
    expect(realMimeSatisfies(null, 'application/pdf')).toBe(false);
  });
});
