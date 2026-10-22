// Point d'entrée index.js pour le gestionnaire d'applications Node.js Hostinger
require('./scripts/ensure-prisma-client.js').ensurePrismaClient(__dirname);
require('./dist/main.js');
