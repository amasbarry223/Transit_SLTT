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
exports.DepensesController = void 0;
const common_1 = require("@nestjs/common");
const depenses_service_1 = require("./depenses.service");
const create_depense_dto_1 = require("./dto/create-depense.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let DepensesController = class DepensesController {
    depensesService;
    constructor(depensesService) {
        this.depensesService = depensesService;
    }
    async findAll(user, search, statut, categorie, dossierId, annexeId, page, limit) {
        return this.depensesService.findAll(user, {
            search,
            statut,
            categorie,
            dossierId,
            annexeId,
            page,
            limit,
        });
    }
    async findOne(id, user) {
        return this.depensesService.findOne(id, user);
    }
    async create(user, body) {
        return this.depensesService.create(user, body);
    }
    async approuver(id, user) {
        return this.depensesService.approuver(id, user);
    }
    async payerDepuisCaisse(id, user, body) {
        return this.depensesService.payerDepuisCaisse(id, user, body);
    }
    async remove(id, user) {
        return this.depensesService.remove(id, user);
    }
};
exports.DepensesController = DepensesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('statut')),
    __param(3, (0, common_1.Query)('categorie')),
    __param(4, (0, common_1.Query)('dossierId')),
    __param(5, (0, common_1.Query)('annexeId')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('depenses.creer'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_depense_dto_1.CreateDepenseDto]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/approuver'),
    (0, decorators_1.RequirePermission)('depenses.valider'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "approuver", null);
__decorate([
    (0, common_1.Post)(':id/payer'),
    (0, decorators_1.RequirePermission)('caisse.decaisser'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "payerDepuisCaisse", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('depenses.supprimer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DepensesController.prototype, "remove", null);
exports.DepensesController = DepensesController = __decorate([
    (0, common_1.Controller)('depenses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [depenses_service_1.DepensesService])
], DepensesController);
//# sourceMappingURL=depenses.controller.js.map