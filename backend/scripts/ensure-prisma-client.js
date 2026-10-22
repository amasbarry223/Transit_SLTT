// Garantit, au démarrage de l'API, que le client Prisma installé correspond
// au schéma déployé.
//
// Pourquoi : sur Hostinger, `backend/dist` (commité) est mis à jour à chaque
// push, mais le client Prisma généré dans node_modules ne l'est pas toujours.
// Quand le schéma gagne un modèle (ex. BonLivraison), le code compilé
// interroge alors un client qui ne le connaît pas : toutes les requêtes sur ce
// modèle échouent en PrismaClientValidationError ("Données invalides pour
// cette opération"). Le client généré embarque une copie du schéma qui l'a
// produit : si elle diffère du schéma déployé, on régénère avant de démarrer.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Prisma reformate la copie embarquée (alignement des colonnes) : on compare
// sans tenir compte des espaces.
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

function ensurePrismaClient(backendDir) {
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  try {
    const searchPaths = [backendDir, path.join(backendDir, '..')];
    const clientPkg = require.resolve('@prisma/client/package.json', { paths: searchPaths });
    const generatedSchema = path.join(path.dirname(clientPkg), '..', '..', '.prisma', 'client', 'schema.prisma');

    const deployed = normalize(fs.readFileSync(schemaPath, 'utf8'));
    const generated = fs.existsSync(generatedSchema) ? normalize(fs.readFileSync(generatedSchema, 'utf8')) : '';
    if (deployed === generated) return;

    console.log('[prisma] Client Prisma périmé par rapport au schéma déployé — régénération…');
    const prismaCli = require.resolve('prisma/build/index.js', { paths: searchPaths });
    const res = spawnSync(process.execPath, [prismaCli, 'generate', '--schema', schemaPath], {
      cwd: backendDir,
      stdio: 'inherit',
      env: process.env,
    });
    if (res.status === 0) {
      console.log('[prisma] Client Prisma régénéré.');
    } else {
      console.error(`[prisma] Échec de prisma generate (code ${res.status}) — démarrage avec le client existant.`);
    }
  } catch (err) {
    // Ne jamais empêcher l'API de démarrer pour ce contrôle.
    console.error('[prisma] Vérification du client Prisma impossible :', err && err.message);
  }
}

module.exports = { ensurePrismaClient };
