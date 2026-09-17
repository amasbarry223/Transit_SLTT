"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const decorators_1 = require("../shared/decorators");
const cookie_config_1 = require("./cookie.config");
function apiPrefix() {
    return process.env.API_PREFIX ?? 'api';
}
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    setAuthCookies(res, accessToken, refreshToken) {
        res.cookie(cookie_config_1.ACCESS_TOKEN_COOKIE, accessToken, {
            ...(0, cookie_config_1.accessCookieOptions)(),
            maxAge: (0, cookie_config_1.accessCookieMaxAge)(),
        });
        res.cookie(cookie_config_1.REFRESH_TOKEN_COOKIE, refreshToken, {
            ...(0, cookie_config_1.refreshCookieOptions)(apiPrefix()),
            maxAge: (0, cookie_config_1.refreshCookieMaxAge)(),
        });
        this.setCsrfCookie(res);
    }
    setCsrfCookie(res) {
        res.cookie(cookie_config_1.CSRF_COOKIE, (0, crypto_1.randomBytes)(32).toString('hex'), {
            ...(0, cookie_config_1.csrfCookieOptions)(),
            maxAge: (0, cookie_config_1.refreshCookieMaxAge)(),
        });
    }
    clearAuthCookies(res) {
        res.clearCookie(cookie_config_1.ACCESS_TOKEN_COOKIE, (0, cookie_config_1.accessCookieOptions)());
        res.clearCookie(cookie_config_1.REFRESH_TOKEN_COOKIE, (0, cookie_config_1.refreshCookieOptions)(apiPrefix()));
        res.clearCookie(cookie_config_1.CSRF_COOKIE, (0, cookie_config_1.csrfCookieOptions)());
    }
    async login(loginDto, res) {
        const { accessToken, refreshToken, user } = await this.authService.login(loginDto.email, loginDto.password);
        this.setAuthCookies(res, accessToken, refreshToken);
        return { user };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.[cookie_config_1.REFRESH_TOKEN_COOKIE];
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token absent.');
        }
        const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
        res.cookie(cookie_config_1.ACCESS_TOKEN_COOKIE, accessToken, {
            ...(0, cookie_config_1.accessCookieOptions)(),
            maxAge: (0, cookie_config_1.accessCookieMaxAge)(),
        });
        this.setCsrfCookie(res);
        return { success: true };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.[cookie_config_1.REFRESH_TOKEN_COOKIE];
        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }
        this.clearAuthCookies(res);
    }
    async me(user) {
        return user;
    }
    async updateProfile(user, body) {
        return this.authService.updateProfile(user.id, body);
    }
    async changePassword(user, body) {
        if (!body.currentPassword || !body.newPassword) {
            throw new common_1.BadRequestException('Mot de passe actuel et nouveau mot de passe requis');
        }
        return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, decorators_1.SkipCsrf)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, decorators_1.SkipCsrfIfNoCookie)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, decorators_1.SkipCsrf)(),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map