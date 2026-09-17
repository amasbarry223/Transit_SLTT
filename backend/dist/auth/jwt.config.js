"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAccessSecret = jwtAccessSecret;
exports.jwtAccessExpiresIn = jwtAccessExpiresIn;
exports.jwtRefreshSecret = jwtRefreshSecret;
exports.jwtRefreshExpiresIn = jwtRefreshExpiresIn;
function requireSecret(envVar) {
    const value = process.env[envVar];
    if (!value) {
        throw new Error(`${envVar} manquant — définissez-le dans .env avant de démarrer l'API (aucune valeur par défaut n'est fournie pour un secret).`);
    }
    return value;
}
function jwtAccessSecret() {
    return requireSecret('JWT_SECRET');
}
function jwtAccessExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '15m';
}
function jwtRefreshSecret() {
    return requireSecret('JWT_REFRESH_SECRET');
}
function jwtRefreshExpiresIn() {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}
//# sourceMappingURL=jwt.config.js.map