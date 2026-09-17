// Point d'entrée racine pour Hostinger Node.js (si Application Root = public_html)
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
process.chdir(backendDir);

require(path.join(backendDir, 'dist', 'main.js'));
