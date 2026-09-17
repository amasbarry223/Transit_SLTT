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
exports.DevisController = void 0;
const common_1 = require("@nestjs/common");
const devis_service_1 = require("./devis.service");
const create_devis_dto_1 = require("./dto/create-devis.dto");
const update_devis_dto_1 = require("./dto/update-devis.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let DevisController = class DevisController {
    devisService;
    constructor(devisService) {
        this.devisService = devisService;
    }
    async findAll(user, clientId) {
        return this.devisService.findAll(user, clientId);
    }
    async findOne(id, user) {
        return this.devisService.findOne(id, user);
    }
    async create(user, body) {
        return this.devisService.create(user, body);
    }
    async update(id, user, body) {
        return this.devisService.update(id, user, body);
    }
    async remove(id, user) {
        return this.devisService.delete(id, user);
    }
};
exports.DevisController = DevisController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevisController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevisController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('devis.creer'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_devis_dto_1.CreateDevisDto]),
    __metadata("design:returntype", Promise)
], DevisController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('devis.creer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_devis_dto_1.UpdateDevisDto]),
    __metadata("design:returntype", Promise)
], DevisController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('devis.creer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevisController.prototype, "remove", null);
exports.DevisController = DevisController = __decorate([
    (0, common_1.Controller)('devis'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [devis_service_1.DevisService])
], DevisController);
//# sourceMappingURL=devis.controller.js.map