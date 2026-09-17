// Point d'entrée racine pour Hostinger Node.js
const path = require('path');
const { Module } = require('module');

const backendDir = path.join(__dirname, 'backend');
const backendNodeModules = path.join(backendDir, 'node_modules');

process.env.NODE_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + backendNodeModules;
Module._initPaths();
process.chdir(backendDir);

require(path.join(backendDir, 'dist', 'main.js'));
