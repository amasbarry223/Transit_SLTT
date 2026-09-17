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
exports.ComptabiliteController = void 0;
const common_1 = require("@nestjs/common");
const comptabilite_service_1 = require("./comptabilite.service");
const create_operation_dto_1 = require("./dto/create-operation.dto");
const create_cloture_dto_1 = require("./dto/create-cloture.dto");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let ComptabiliteController = class ComptabiliteController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAllOperations(user, annexeId, clientId) {
        return this.service.findAllOperations(user, { annexeId, clientId });
    }
    createOperation(user, body) {
        return this.service.createOperation(user, body);
    }
    deleteOperation(id, user) {
        return this.service.deleteOperation(id, user);
    }
    findAllClotures(user, annexeId) {
        return this.service.findAllClotures(user, { annexeId });
    }
    createCloture(user, body) {
        return this.service.createCloture(user, body);
    }
};
exports.ComptabiliteController = ComptabiliteController;
__decorate([
    (0, common_1.Get)('operations'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __param(2, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ComptabiliteController.prototype, "findAllOperations", null);
__decorate([
    (0, common_1.Post)('operations'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('comptabilite:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_operation_dto_1.CreateOperationDto]),
    __metadata("design:returntype", void 0)
], ComptabiliteController.prototype, "createOperation", null);
__decorate([
    (0, common_1.Delete)('operations/:id'),
    (0, decorators_1.RequirePermission)('comptabilite:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComptabiliteController.prototype, "deleteOperation", null);
__decorate([
    (0, common_1.Get)('clotures'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComptabiliteController.prototype, "findAllClotures", null);
__decorate([
    (0, common_1.Post)('clotures'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('comptabilite:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_cloture_dto_1.CreateClotureDto]),
    __metadata("design:returntype", void 0)
], ComptabiliteController.prototype, "createCloture", null);
exports.ComptabiliteController = ComptabiliteController = __decorate([
    (0, common_1.Controller)('comptabilite'),
    __metadata("design:paramtypes", [comptabilite_service_1.ComptabiliteService])
], ComptabiliteController);
//# sourceMappingURL=comptabilite.controller.js.map