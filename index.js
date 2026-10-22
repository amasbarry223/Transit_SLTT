// Point d'entrée racine index.js pour Hostinger Node.js
const path = require('path');

process.chdir(path.join(__dirname, 'backend'));

require('./backend/dist/main.js');
