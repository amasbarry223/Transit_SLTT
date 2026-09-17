"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_COOKIE = exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.accessCookieOptions = accessCookieOptions;
exports.accessCookieMaxAge = accessCookieMaxAge;
exports.refreshCookieOptions = refreshCookieOptions;
exports.refreshCookieMaxAge = refreshCookieMaxAge;
exports.csrfCookieOptions = csrfCookieOptions;
const ms_1 = __importDefault(require("ms"));
const jwt_config_1 = require("./jwt.config");
exports.ACCESS_TOKEN_COOKIE = 'transit_sltt_at';
exports.REFRESH_TOKEN_COOKIE = 'transit_sltt_rt';
exports.CSRF_COOKIE = 'transit_sltt_csrf';
const isProd = process.env.NODE_ENV === 'production';
function sameSite() {
    const value = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
    if (value === 'strict' || value === 'none' || value === 'lax')
        return value;
    return isProd ? 'none' : 'lax';
}
function domain() {
    const d = process.env.COOKIE_DOMAIN?.trim();
    if (!d || d === '' || d === 'undefined')
        return undefined;
    return d;
}
function baseOptions() {
    const site = sameSite();
    return {
        httpOnly: true,
        secure: isProd || site === 'none',
        sameSite: site,
        domain: domain(),
    };
}
function accessCookieOptions() {
    return { ...baseOptions(), path: '/' };
}
function accessCookieMaxAge() {
    return (0, ms_1.default)((0, jwt_config_1.jwtAccessExpiresIn)());
}
function refreshCookieOptions(apiPrefix) {
    return { ...baseOptions(), path: `/${apiPrefix}/auth` };
}
function refreshCookieMaxAge() {
    return (0, ms_1.default)((0, jwt_config_1.jwtRefreshExpiresIn)());
}
function csrfCookieOptions() {
    return { ...baseOptions(), httpOnly: false, path: '/' };
}
//# sourceMappingURL=cookie.config.js.map