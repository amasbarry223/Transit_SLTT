"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustedOrigins = getTrustedOrigins;
exports.isTrustedOrigin = isTrustedOrigin;
const DEFAULT_TRUSTED_ORIGINS = [
    'https://traorelogistique-transit.com',
    'https://www.traorelogistique-transit.com',
    'http://localhost:3000',
    'http://localhost:3001',
];
function getTrustedOrigins(rawCors = process.env.CORS_ORIGIN) {
    const configured = (rawCors ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    return Array.from(new Set([...DEFAULT_TRUSTED_ORIGINS, ...configured]));
}
function normalizeOrigin(origin) {
    return origin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
function isTrustedOrigin(origin, allowedOrigins = getTrustedOrigins()) {
    return allowedOrigins.some((allowed) => allowed === origin || normalizeOrigin(allowed) === normalizeOrigin(origin));
}
//# sourceMappingURL=cors-origins.util.js.map