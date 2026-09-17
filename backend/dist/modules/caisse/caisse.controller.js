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
exports.CaisseController = void 0;
const common_1 = require("@nestjs/common");
const caisse_service_1 = require("./caisse.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let CaisseController = class CaisseController {
    caisseService;
    constructor(caisseService) {
        this.caisseService = caisseService;
    }
    async findAll(user, annexeId) {
        return this.caisseService.findAll(user, annexeId);
    }
    async findOne(id, user) {
        return this.caisseService.findOne(id, user);
    }
    async createTransaction(id, user, body) {
        return this.caisseService.createTransaction(id, user, body);
    }
};
exports.CaisseController = CaisseController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CaisseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CaisseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/transactions'),
    (0, decorators_1.RequirePermission)('caisse.gerer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CaisseController.prototype, "createTransaction", null);
exports.CaisseController = CaisseController = __decorate([
    (0, common_1.Controller)('caisses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [caisse_service_1.CaisseService])
], CaisseController);
//# sourceMappingURL=caisse.controller.js.map