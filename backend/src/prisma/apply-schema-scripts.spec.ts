import { readFileSync } from 'fs';
import { join } from 'path';
import { applySchemaScripts, splitSqlStatements } from './apply-schema-scripts';

const SCRIPT = join(__dirname, '..', '..', 'prisma', 'sql', '2026-10-22-bons-livraison-notifications.sql');

describe('splitSqlStatements', () => {
  it('découpe le script de production en ses deux CREATE TABLE IF NOT EXISTS, sans commentaires', () => {
    const statements = splitSqlStatements(readFileSync(SCRIPT, 'utf8'));
    expect(statements).toHaveLength(2);
    expect(statements[0]).toMatch(/^CREATE TABLE IF NOT EXISTS `notifications`/);
    expect(statements[1]).toMatch(/^CREATE TABLE IF NOT EXISTS `bons_livraison`/);
    expect(statements.join('\n')).not.toContain('--');
  });
});

describe('applySchemaScripts', () => {
  it('exécute chaque instruction des scripts de prisma/sql', async () => {
    const prisma = { $executeRawUnsafe: vi.fn().mockResolvedValue(0) };

    const res = await applySchemaScripts(prisma as any);

    expect(res.status).toBe('ok');
    expect(res.applied).toContain('2026-10-22-bons-livraison-notifications.sql');
    expect(res.applied).toContain('2026-10-27-dossier-depenses-paiements.sql');
    // 2 instructions (bons de livraison) + 6 (sauvegarde, 2 tables, 2 INSERT de reprise, 1 UPDATE).
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(8);
  });
});
