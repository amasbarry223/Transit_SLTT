"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipCsrfIfNoCookie = exports.SKIP_CSRF_IF_NO_COOKIE_KEY = exports.SkipCsrf = exports.SKIP_CSRF_KEY = exports.Public = exports.IS_PUBLIC_KEY = exports.Roles = exports.ROLES_KEY = exports.RequirePermission = exports.PERMISSIONS_KEY = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
const common_2 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermission = (...permissions) => (0, common_2.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
exports.RequirePermission = RequirePermission;
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_2.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_2.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.SKIP_CSRF_KEY = 'skipCsrf';
const SkipCsrf = () => (0, common_2.SetMetadata)(exports.SKIP_CSRF_KEY, true);
exports.SkipCsrf = SkipCsrf;
exports.SKIP_CSRF_IF_NO_COOKIE_KEY = 'skipCsrfIfNoCookie';
const SkipCsrfIfNoCookie = () => (0, common_2.SetMetadata)(exports.SKIP_CSRF_IF_NO_COOKIE_KEY, true);
exports.SkipCsrfIfNoCookie = SkipCsrfIfNoCookie;
//# sourceMappingURL=index.js.map