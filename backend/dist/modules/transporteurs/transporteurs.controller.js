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
exports.TransporteursController = void 0;
const common_1 = require("@nestjs/common");
const transporteurs_service_1 = require("./transporteurs.service");
const create_transporteur_dto_1 = require("./dto/create-transporteur.dto");
const update_transporteur_dto_1 = require("./dto/update-transporteur.dto");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let TransporteursController = class TransporteursController {
    transporteursService;
    constructor(transporteursService) {
        this.transporteursService = transporteursService;
    }
    findAll(user, search, annexeId) {
        return this.transporteursService.findAll(user, { search, annexeId });
    }
    findOne(id, user) {
        return this.transporteursService.findOne(id, user);
    }
    create(user, body) {
        return this.transporteursService.create(user, body);
    }
    update(id, user, body) {
        return this.transporteursService.update(id, user, body);
    }
    remove(id, user) {
        return this.transporteursService.delete(id, user);
    }
};
exports.TransporteursController = TransporteursController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('annexeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TransporteursController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransporteursController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('transporteurs.creer'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transporteur_dto_1.CreateTransporteurDto]),
    __metadata("design:returntype", void 0)
], TransporteursController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('transporteurs.modifier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_transporteur_dto_1.UpdateTransporteurDto]),
    __metadata("design:returntype", void 0)
], TransporteursController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('transporteurs.supprimer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransporteursController.prototype, "remove", null);
exports.TransporteursController = TransporteursController = __decorate([
    (0, common_1.Controller)('transporteurs'),
    __metadata("design:paramtypes", [transporteurs_service_1.TransporteursService])
], TransporteursController);
//# sourceMappingURL=transporteurs.controller.js.map