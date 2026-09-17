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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const decorators_1 = require("../../shared/decorators");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getPublic() {
        return this.settingsService.getPublicSettings();
    }
    async getStatuses(type) {
        return this.settingsService.getStatusOptions(type);
    }
    async getOptions(type) {
        return this.settingsService.getStatusOptions(type);
    }
    async setStatusOption(body) {
        return this.settingsService.setStatusOption(body);
    }
    async getAll() {
        return this.settingsService.getAll();
    }
    async getByKey(cle) {
        return this.settingsService.getByKey(cle);
    }
    async setMany(body) {
        return this.settingsService.setMany(body);
    }
    async setKey(cle, valeur, description, type, isPublic, groupName) {
        return this.settingsService.setKey(cle, valeur, description, type, isPublic, groupName);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Get)('statuses'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getStatuses", null);
__decorate([
    (0, common_1.Get)('options'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Post)('statuses'),
    (0, decorators_1.RequirePermission)('settings.modifier'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setStatusOption", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':cle'),
    __param(0, (0, common_1.Param)('cle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getByKey", null);
__decorate([
    (0, common_1.Put)(),
    (0, decorators_1.RequirePermission)('settings.modifier'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setMany", null);
__decorate([
    (0, common_1.Put)(':cle'),
    (0, decorators_1.RequirePermission)('settings.modifier'),
    __param(0, (0, common_1.Param)('cle')),
    __param(1, (0, common_1.Body)('valeur')),
    __param(2, (0, common_1.Body)('description')),
    __param(3, (0, common_1.Body)('type')),
    __param(4, (0, common_1.Body)('isPublic')),
    __param(5, (0, common_1.Body)('groupName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setKey", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map