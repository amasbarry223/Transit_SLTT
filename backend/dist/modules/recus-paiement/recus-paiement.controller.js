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
exports.RecusPaiementController = void 0;
const common_1 = require("@nestjs/common");
const recus_paiement_service_1 = require("./recus-paiement.service");
const create_recu_paiement_dto_1 = require("./dto/create-recu-paiement.dto");
const update_recu_paiement_dto_1 = require("./dto/update-recu-paiement.dto");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let RecusPaiementController = class RecusPaiementController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(user, search, annexeId) {
        return this.service.findAll(user, { search, annexeId });
    }
    findOne(id, user) {
        return this.service.findOne(id, user);
    }
    create(user, body) {
        return this.service.create(user, body);
    }
    update(id, user, body) {
        return this.service.update(id, user, body);
    }
    remove(id, user) {
        return this.service.delete(id, user);
    }
};
exports.RecusPaiementController = RecusPaiementController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('annexeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RecusPaiementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecusPaiementController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('recus-paiement:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_recu_paiement_dto_1.CreateRecuPaiementDto]),
    __metadata("design:returntype", void 0)
], RecusPaiementController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('recus-paiement:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_recu_paiement_dto_1.UpdateRecuPaiementDto]),
    __metadata("design:returntype", void 0)
], RecusPaiementController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('recus-paiement:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecusPaiementController.prototype, "remove", null);
exports.RecusPaiementController = RecusPaiementController = __decorate([
    (0, common_1.Controller)('recus-paiement'),
    __metadata("design:paramtypes", [recus_paiement_service_1.RecusPaiementService])
], RecusPaiementController);
//# sourceMappingURL=recus-paiement.controller.js.map