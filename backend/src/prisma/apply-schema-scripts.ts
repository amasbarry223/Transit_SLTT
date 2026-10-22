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
 */
export interface SchemaScriptsResult {
  status: 'ok' | 'error' | 'none';
  applied: string[];
  detail?: string;
}

export const schemaScripts: SchemaScriptsResult = { status: 'none', applied: [] };

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

export async function applySchemaScripts(prisma: Pick<PrismaClient, '$executeRawUnsafe'>): Promise<SchemaScriptsResult> {
  const dir = resolveSqlDir();
  if (!dir) return schemaScripts;
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      for (const statement of splitSqlStatements(readFileSync(join(dir, file), 'utf8'))) {
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
