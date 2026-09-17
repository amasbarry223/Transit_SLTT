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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfGuard = void 0;
exports.isAllowedOrigin = isAllowedOrigin;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const decorators_1 = require("../../shared/decorators");
const cookie_config_1 = require("../cookie.config");
const cors_origins_util_1 = require("../../common/cors-origins.util");
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function isAllowedOrigin(originOrReferer, rawAllowedCors) {
    if (!originOrReferer)
        return false;
    let originToTest = originOrReferer;
    try {
        originToTest = new URL(originOrReferer).origin;
    }
    catch {
    }
    return (0, cors_origins_util_1.isTrustedOrigin)(originToTest, (0, cors_origins_util_1.getTrustedOrigins)(rawAllowedCors));
}
let CsrfGuard = class CsrfGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (SAFE_METHODS.has(request.method))
            return true;
        const skip = this.reflector.getAllAndOverride(decorators_1.SKIP_CSRF_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip)
            return true;
        const cookieToken = request.cookies?.[cookie_config_1.CSRF_COOKIE];
        const skipIfNoCookie = this.reflector.getAllAndOverride(decorators_1.SKIP_CSRF_IF_NO_COOKIE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipIfNoCookie && !cookieToken)
            return true;
        const headerToken = request.headers['x-csrf-token'];
        if (cookieToken && headerToken) {
            if (cookieToken === headerToken)
                return true;
            throw new common_1.ForbiddenException('Jeton CSRF invalide.');
        }
        const origin = (request.headers['origin'] || request.headers['referer']);
        if (origin && isAllowedOrigin(origin)) {
            return true;
        }
        throw new common_1.ForbiddenException('Jeton CSRF manquant ou invalide.');
    }
};
exports.CsrfGuard = CsrfGuard;
exports.CsrfGuard = CsrfGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CsrfGuard);
//# sourceMappingURL=csrf.guard.js.map