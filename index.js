// Point d'entrée racine index.js pour Hostinger Node.js
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
process.chdir(backendDir);

require('./backend/scripts/ensure-prisma-client.js').ensurePrismaClient(backendDir);

require('./backend/dist/main.js');
