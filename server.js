// Point d'entrée racine pour Hostinger Node.js (si Application Root = public_html)
const path = require('path');

// Basculer dans le répertoire backend pour la résolution des fichiers et .env
process.chdir(path.join(__dirname, 'backend'));

require('./backend/dist/main.js');
