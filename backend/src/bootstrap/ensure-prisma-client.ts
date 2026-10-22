// Garantit que le client Prisma installé correspond au schéma déployé, AVANT
// que le moindre module ne charge @prisma/client.
//
// Pourquoi : sur Hostinger, `backend/dist` (commité) est mis à jour à chaque
// push, mais le client Prisma généré dans node_modules ne l'est pas : quand
// le schéma gagne un modèle (ex. BonLivraison), le code compilé interroge un
// client qui ne le connaît pas et toutes les requêtes sur ce modèle échouent
// en PrismaClientValidationError ("Données invalides pour cette opération").
// Le client généré embarque une copie du schéma qui l'a produit : si elle
// diffère du schéma déployé, on régénère.
//
// Importé en TOUT PREMIER par main.ts : les imports CommonJS s'exécutent
// dans l'ordre, donc ce contrôle passe avant le chargement d'AppModule,
// quel que soit le point d'entrée utilisé par l'hébergeur.
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { spawnSync } from 'child_process';

export type PrismaClientSyncStatus = 'ok' | 'regenerated' | 'failed' | 'error';

/** Résultat exposé par /api/health (diagnostic sans accès aux logs serveur). */
export const prismaClientSync: { status: PrismaClientSyncStatus; detail?: string } = { status: 'ok' };

// Prisma reformate la copie embarquée (alignement des colonnes) : on compare
// sans tenir compte des espaces.
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

function ensurePrismaClient(): void {
  // dist/bootstrap/ → backend/
  const backendDir = resolve(__dirname, '..', '..');
  const schemaPath = join(backendDir, 'prisma', 'schema.prisma');
  try {
    const searchPaths = [backendDir, join(backendDir, '..')];
    const clientPkg = require.resolve('@prisma/client/package.json', { paths: searchPaths });
    const generatedSchema = join(dirname(clientPkg), '..', '..', '.prisma', 'client', 'schema.prisma');

    const deployed = normalize(readFileSync(schemaPath, 'utf8'));
    const generated = existsSync(generatedSchema) ? normalize(readFileSync(generatedSchema, 'utf8')) : '';
    if (deployed === generated) return;

    console.log('[prisma] Client Prisma périmé par rapport au schéma déployé — régénération…');
    const prismaCli = require.resolve('prisma/build/index.js', { paths: searchPaths });
    const res = spawnSync(process.execPath, [prismaCli, 'generate', '--schema', schemaPath], {
      cwd: backendDir,
      env: process.env,
      encoding: 'utf8',
    });
    if (res.status === 0) {
      prismaClientSync.status = 'regenerated';
      console.log('[prisma] Client Prisma régénéré.');
    } else {
      const output = `${res.stderr ?? ''}${res.stdout ?? ''}${res.error ? String(res.error) : ''}`.trim();
      prismaClientSync.status = 'failed';
      prismaClientSync.detail = output.slice(-500) || `code ${res.status}`;
      console.error(`[prisma] Échec de prisma generate : ${prismaClientSync.detail}`);
    }
  } catch (err) {
    // Ne jamais empêcher l'API de démarrer pour ce contrôle.
    prismaClientSync.status = 'error';
    prismaClientSync.detail = (err as Error)?.message?.slice(0, 500);
    console.error('[prisma] Vérification du client Prisma impossible :', prismaClientSync.detail);
  }
}

ensurePrismaClient();
