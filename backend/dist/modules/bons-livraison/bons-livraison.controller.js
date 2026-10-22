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
exports.BonsLivraisonController = void 0;
const common_1 = require("@nestjs/common");
const bons_livraison_service_1 = require("./bons-livraison.service");
const create_bon_livraison_dto_1 = require("./dto/create-bon-livraison.dto");
const update_bon_livraison_dto_1 = require("./dto/update-bon-livraison.dto");
const decorators_1 = require("../../shared/decorators");
let BonsLivraisonController = class BonsLivraisonController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(user, annexeId, clientId) {
        return this.service.findAll(user, { annexeId, clientId });
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
        return this.service.remove(id, user);
    }
};
exports.BonsLivraisonController = BonsLivraisonController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermission)('bons:read'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __param(2, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BonsLivraisonController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermission)('bons:read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonsLivraisonController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bon_livraison_dto_1.CreateBonLivraisonDto]),
    __metadata("design:returntype", void 0)
], BonsLivraisonController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_bon_livraison_dto_1.UpdateBonLivraisonDto]),
    __metadata("design:returntype", void 0)
], BonsLivraisonController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('bons:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonsLivraisonController.prototype, "remove", null);
exports.BonsLivraisonController = BonsLivraisonController = __decorate([
    (0, common_1.Controller)('bons-livraison'),
    __metadata("design:paramtypes", [bons_livraison_service_1.BonsLivraisonService])
], BonsLivraisonController);
//# sourceMappingURL=bons-livraison.controller.js.map