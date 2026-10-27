import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { PrismaClient } from '@prisma/client';

/**
 * Applique au démarrage les scripts SQL idempotents de prisma/sql (copiés
 * dans dist/prisma/sql par le script "build"). Le projet n'a pas de
 * migrations Prisma et la base de production n'est accessible que par
 * phpMyAdmin : sans ce mécanisme, chaque nouvelle table exigeait une
 * manipulation manuelle, et l'oublier cassait le chargement de l'application.
 *
 * Contrat des scripts : uniquement des instructions rejouables sans effet
 * (CREATE TABLE IF NOT EXISTS, …) — ils sont rejoués à chaque démarrage.
 * Ordre d'exécution : nom de fichier (préfixe date AAAA-MM-JJ).
 *
 * Directive `-- @si-colonne: table.colonne` (une ou plusieurs) : le script
 * n'est exécuté que si toutes ces colonnes existent encore. Sert aux scripts
 * de reprise de données qui lisent des colonnes supprimées ensuite à la main
 * (sans elle, ils échoueraient à chaque démarrage et bloqueraient les
 * scripts suivants).
 */
export interface SchemaScriptsResult {
  status: 'ok' | 'error' | 'none';
  applied: string[];
  /** Scripts non exécutés car une colonne `@si-colonne` n'existe plus. */
  skipped: string[];
  detail?: string;
}

export const schemaScripts: SchemaScriptsResult = { status: 'none', applied: [], skipped: [] };

/** Colonnes `table.colonne` déclarées par les directives `-- @si-colonne:`. */
export function requiredColumns(sql: string): Array<{ table: string; column: string }> {
  return [...sql.matchAll(/^--\s*@si-colonne:\s*([\w]+)\.([\w]+)\s*$/gm)].map((m) => ({
    table: m[1],
    column: m[2],
  }));
}

async function columnExists(
  prisma: Pick<PrismaClient, '$queryRawUnsafe'>,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ n: bigint | number }>>(
    'SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    table,
    column,
  );
  return Number(rows[0]?.n ?? 0) > 0;
}

/** Découpe un script en instructions : retire les commentaires `--` et coupe
 *  sur les `;` de fin de ligne (les scripts n'en contiennent pas d'autres). */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveSqlDir(): string | undefined {
  // dist/prisma/ (déployé) puis backend/prisma/ (local, ts-node).
  return [join(__dirname, 'sql'), join(__dirname, '..', '..', 'prisma', 'sql')].find((d) => existsSync(d));
}

export async function applySchemaScripts(
  prisma: Pick<PrismaClient, '$executeRawUnsafe' | '$queryRawUnsafe'>,
): Promise<SchemaScriptsResult> {
  const dir = resolveSqlDir();
  if (!dir) return schemaScripts;
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      const sql = readFileSync(join(dir, file), 'utf8');
      let present = true;
      for (const { table, column } of requiredColumns(sql)) {
        if (!(await columnExists(prisma, table, column))) present = false;
      }
      if (!present) {
        schemaScripts.skipped.push(file);
        continue;
      }
      for (const statement of splitSqlStatements(sql)) {
        await prisma.$executeRawUnsafe(statement);
      }
      schemaScripts.applied.push(file);
    } catch (err) {
      schemaScripts.status = 'error';
      schemaScripts.detail = `${file} : ${((err as Error)?.message ?? String(err)).slice(0, 300)}`;
      return schemaScripts;
    }
  }
  schemaScripts.status = 'ok';
  return schemaScripts;
}
