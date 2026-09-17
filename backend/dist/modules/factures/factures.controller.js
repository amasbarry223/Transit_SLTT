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
exports.FacturesController = void 0;
const common_1 = require("@nestjs/common");
const factures_service_1 = require("./factures.service");
const create_facture_dto_1 = require("./dto/create-facture.dto");
const update_facture_dto_1 = require("./dto/update-facture.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let FacturesController = class FacturesController {
    facturesService;
    constructor(facturesService) {
        this.facturesService = facturesService;
    }
    async findAll(user, search, statut, clientId, dossierId, annexeId, page, limit) {
        return this.facturesService.findAll(user, { search, statut, clientId, dossierId, annexeId, page, limit });
    }
    async findOne(id, user) {
        return this.facturesService.findOne(id, user);
    }
    async create(user, body) {
        return this.facturesService.create(user, body);
    }
    async update(id, user, body) {
        return this.facturesService.update(id, user, body);
    }
    async updateStatut(id, user, statut) {
        return this.facturesService.updateStatut(id, user, statut);
    }
    async remove(id, user) {
        return this.facturesService.remove(id, user);
    }
    async enregistrerPaiement(id, user, body) {
        return this.facturesService.enregistrerPaiement(id, user, body);
    }
};
exports.FacturesController = FacturesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('statut')),
    __param(3, (0, common_1.Query)('clientId')),
    __param(4, (0, common_1.Query)('dossierId')),
    __param(5, (0, common_1.Query)('annexeId')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('factures.creer'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_facture_dto_1.CreateFactureDto]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermission)('factures.modifier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_facture_dto_1.UpdateFactureDto]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/statut'),
    (0, decorators_1.RequirePermission)('factures.modifier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('statut')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "updateStatut", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('factures.supprimer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/paiements'),
    (0, decorators_1.RequirePermission)('caisse.encaisser'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FacturesController.prototype, "enregistrerPaiement", null);
exports.FacturesController = FacturesController = __decorate([
    (0, common_1.Controller)('factures'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [factures_service_1.FacturesService])
], FacturesController);
//# sourceMappingURL=factures.controller.js.map