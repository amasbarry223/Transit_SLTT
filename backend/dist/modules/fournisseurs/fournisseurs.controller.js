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
exports.FournisseursController = void 0;
const common_1 = require("@nestjs/common");
const fournisseurs_service_1 = require("./fournisseurs.service");
const create_fournisseur_dto_1 = require("./dto/create-fournisseur.dto");
const update_fournisseur_dto_1 = require("./dto/update-fournisseur.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const decorators_1 = require("../../shared/decorators");
let FournisseursController = class FournisseursController {
    fournisseursService;
    constructor(fournisseursService) {
        this.fournisseursService = fournisseursService;
    }
    async findAll(search) {
        return this.fournisseursService.findAll(search);
    }
    async findOne(id) {
        return this.fournisseursService.findOne(id);
    }
    async create(body) {
        return this.fournisseursService.create(body);
    }
    async update(id, body) {
        return this.fournisseursService.update(id, body);
    }
    async remove(id) {
        return this.fournisseursService.remove(id);
    }
};
exports.FournisseursController = FournisseursController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FournisseursController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FournisseursController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermission)('fournisseurs.creer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fournisseur_dto_1.CreateFournisseurDto]),
    __metadata("design:returntype", Promise)
], FournisseursController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermission)('fournisseurs.modifier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_fournisseur_dto_1.UpdateFournisseurDto]),
    __metadata("design:returntype", Promise)
], FournisseursController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('fournisseurs.supprimer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FournisseursController.prototype, "remove", null);
exports.FournisseursController = FournisseursController = __decorate([
    (0, common_1.Controller)('fournisseurs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [fournisseurs_service_1.FournisseursService])
], FournisseursController);
//# sourceMappingURL=fournisseurs.controller.js.map