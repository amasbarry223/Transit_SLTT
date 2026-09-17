"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAccessSecret = jwtAccessSecret;
exports.jwtAccessExpiresIn = jwtAccessExpiresIn;
exports.jwtRefreshSecret = jwtRefreshSecret;
exports.jwtRefreshExpiresIn = jwtRefreshExpiresIn;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('JwtConfig');
function requireSecret(envVar) {
    const value = process.env[envVar];
    if (!value) {
        const fallback = envVar === 'JWT_SECRET'
            ? 'transit_sltt_fallback_access_secret_2026_hostinger'
            : 'transit_sltt_fallback_refresh_secret_2026_hostinger';
        logger.error(`⚠️ CRITIQUE: ${envVar} manquant dans l'environnement ! Utilisation du repli de secours pour éviter un crash 503 au démarrage. Veuillez renseigner ${envVar} dans Hostinger.`);
        return fallback;
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