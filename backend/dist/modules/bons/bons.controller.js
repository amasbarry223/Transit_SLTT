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
exports.BonsController = void 0;
const common_1 = require("@nestjs/common");
const bons_service_1 = require("./bons.service");
const create_bon_sortie_dto_1 = require("./dto/create-bon-sortie.dto");
const create_bon_caisse_dto_1 = require("./dto/create-bon-caisse.dto");
const update_bon_caisse_dto_1 = require("./dto/update-bon-caisse.dto");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let BonsController = class BonsController {
    bonsService;
    constructor(bonsService) {
        this.bonsService = bonsService;
    }
    findAllBons(user, annexeId, clientId) {
        return this.bonsService.findAllBons(user, { annexeId, clientId });
    }
    createBon(user, body) {
        return this.bonsService.createBon(user, body);
    }
    validateBon(id, user) {
        return this.bonsService.validateBon(id, user);
    }
    deleteBon(id, user) {
        return this.bonsService.deleteBon(id, user);
    }
    findAllBonsCaisse(user, annexeId) {
        return this.bonsService.findAllBonsCaisse(user, { annexeId });
    }
    createBonCaisse(user, body) {
        return this.bonsService.createBonCaisse(user, body);
    }
    updateBonCaisse(id, user, body) {
        return this.bonsService.updateBonCaisse(id, user, body);
    }
    deleteBonCaisse(id, user) {
        return this.bonsService.deleteBonCaisse(id, user);
    }
};
exports.BonsController = BonsController;
__decorate([
    (0, common_1.Get)('sortie'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __param(2, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "findAllBons", null);
__decorate([
    (0, common_1.Post)('sortie'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bon_sortie_dto_1.CreateBonSortieDto]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "createBon", null);
__decorate([
    (0, common_1.Put)('sortie/:id/valider'),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "validateBon", null);
__decorate([
    (0, common_1.Delete)('sortie/:id'),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "deleteBon", null);
__decorate([
    (0, common_1.Get)('caisse'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "findAllBonsCaisse", null);
__decorate([
    (0, common_1.Post)('caisse'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('bons:write-caisse'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bon_caisse_dto_1.CreateBonCaisseDto]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "createBonCaisse", null);
__decorate([
    (0, common_1.Put)('caisse/:id'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('bons:write-caisse'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_bon_caisse_dto_1.UpdateBonCaisseDto]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "updateBonCaisse", null);
__decorate([
    (0, common_1.Delete)('caisse/:id'),
    (0, decorators_1.RequirePermission)('bons:write-caisse'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonsController.prototype, "deleteBonCaisse", null);
exports.BonsController = BonsController = __decorate([
    (0, common_1.Controller)('bons'),
    __metadata("design:paramtypes", [bons_service_1.BonsService])
], BonsController);
//# sourceMappingURL=bons.controller.js.map