import { readFileSync } from 'fs';
import { join } from 'path';
import { applySchemaScripts, requiredColumns, schemaScripts, splitSqlStatements } from './apply-schema-scripts';

const SQL_DIR = join(__dirname, '..', '..', 'prisma', 'sql');
const SCRIPT = join(SQL_DIR, '2026-10-22-bons-livraison-notifications.sql');
const REPRISE = '2026-10-27-dossier-reprise-montants.sql';

function resetResult() {
  schemaScripts.status = 'none';
  schemaScripts.applied = [];
  schemaScripts.skipped = [];
  delete schemaScripts.detail;
}

describe('splitSqlStatements', () => {
  it('découpe le script de production en ses deux CREATE TABLE IF NOT EXISTS, sans commentaires', () => {
    const statements = splitSqlStatements(readFileSync(SCRIPT, 'utf8'));
    expect(statements).toHaveLength(2);
    expect(statements[0]).toMatch(/^CREATE TABLE IF NOT EXISTS `notifications`/);
    expect(statements[1]).toMatch(/^CREATE TABLE IF NOT EXISTS `bons_livraison`/);
    expect(statements.join('\n')).not.toContain('--');
  });
});

describe('requiredColumns', () => {
  it('lit les directives @si-colonne du script de reprise des dossiers', () => {
    expect(requiredColumns(readFileSync(join(SQL_DIR, REPRISE), 'utf8'))).toEqual([
      { table: 'dossiers', column: 'valeur_douane' },
      { table: 'dossiers', column: 'frais_circuit' },
      { table: 'dossiers', column: 'montant_investi' },
    ]);
  });
});

describe('applySchemaScripts', () => {
  beforeEach(resetResult);

  it('exécute chaque instruction des scripts de prisma/sql tant que les colonnes requises existent', async () => {
    const prisma = {
      $executeRawUnsafe: vi.fn().mockResolvedValue(0),
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ n: BigInt(1) }]),
    };

    const res = await applySchemaScripts(prisma as any);

    expect(res.status).toBe('ok');
    expect(res.applied).toEqual([
      '2026-10-22-bons-livraison-notifications.sql',
      '2026-10-27-dossier-depenses-paiements.sql',
      REPRISE,
      '2026-10-29-journal-liens.sql',
    ]);
    // 2 (bons de livraison) + 2 (tables dossier) + 4 (sauvegarde, 2 INSERT de reprise, UPDATE) + 1 (journal_liens).
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(9);
  });

  it('saute la reprise une fois les anciennes colonnes supprimées (phase 2), sans erreur', async () => {
    const prisma = {
      $executeRawUnsafe: vi.fn().mockResolvedValue(0),
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ n: 0 }]),
    };

    const res = await applySchemaScripts(prisma as any);

    expect(res.status).toBe('ok');
    expect(res.skipped).toEqual([REPRISE]);
    expect(res.applied).not.toContain(REPRISE);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(5);
  });
});
