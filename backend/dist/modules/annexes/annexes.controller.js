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
exports.AnnexesController = void 0;
const common_1 = require("@nestjs/common");
const annexes_service_1 = require("./annexes.service");
const create_annexe_dto_1 = require("./dto/create-annexe.dto");
const update_annexe_dto_1 = require("./dto/update-annexe.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/guards/permissions.guard");
const decorators_1 = require("../../shared/decorators");
let AnnexesController = class AnnexesController {
    annexesService;
    constructor(annexesService) {
        this.annexesService = annexesService;
    }
    async findAll() {
        return this.annexesService.findAll();
    }
    async findOne(id) {
        return this.annexesService.findOne(id);
    }
    async create(body) {
        return this.annexesService.create(body);
    }
    async update(id, body) {
        return this.annexesService.update(id, body);
    }
    async remove(id) {
        return this.annexesService.remove(id);
    }
};
exports.AnnexesController = AnnexesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnnexesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnexesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermission)('annexes.creer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_annexe_dto_1.CreateAnnexeDto]),
    __metadata("design:returntype", Promise)
], AnnexesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermission)('annexes.modifier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_annexe_dto_1.UpdateAnnexeDto]),
    __metadata("design:returntype", Promise)
], AnnexesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('annexes.supprimer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnexesController.prototype, "remove", null);
exports.AnnexesController = AnnexesController = __decorate([
    (0, common_1.Controller)('annexes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [annexes_service_1.AnnexesService])
], AnnexesController);
//# sourceMappingURL=annexes.controller.js.map