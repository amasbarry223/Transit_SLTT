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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const create_stock_item_dto_1 = require("./dto/create-stock-item.dto");
const update_stock_item_dto_1 = require("./dto/update-stock-item.dto");
const create_mouvement_dto_1 = require("./dto/create-mouvement.dto");
const annexe_guard_1 = require("../../auth/guards/annexe.guard");
const decorators_1 = require("../../shared/decorators");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    findAllItems(user, search, annexeId, clientId) {
        return this.stockService.findAllItems(user, { search, annexeId, clientId });
    }
    findOneItem(id, user) {
        return this.stockService.findOneItem(id, user);
    }
    createItem(user, body) {
        return this.stockService.createItem(user, body);
    }
    updateItem(id, user, body) {
        return this.stockService.updateItem(id, user, body);
    }
    deleteItem(id, user) {
        return this.stockService.deleteItem(id, user);
    }
    findAllMouvements(user, annexeId, stockId) {
        return this.stockService.findAllMouvements(user, { annexeId, stockId });
    }
    createMouvement(user, body) {
        return this.stockService.createMouvement(user, body);
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('annexeId')),
    __param(3, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "findAllItems", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "findOneItem", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('stock:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_stock_item_dto_1.CreateStockItemDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "createItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('stock:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_stock_item_dto_1.UpdateStockItemDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, decorators_1.RequirePermission)('stock:write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Get)('mouvements'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('annexeId')),
    __param(2, (0, common_1.Query)('stockId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "findAllMouvements", null);
__decorate([
    (0, common_1.Post)('mouvements'),
    (0, common_1.UseGuards)(annexe_guard_1.AnnexeGuard),
    (0, decorators_1.RequirePermission)('stock:write'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mouvement_dto_1.CreateMouvementDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "createMouvement", null);
exports.StockController = StockController = __decorate([
    (0, common_1.Controller)('stock'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map