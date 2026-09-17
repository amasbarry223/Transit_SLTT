"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnexesModule = void 0;
const common_1 = require("@nestjs/common");
const annexes_service_1 = require("./annexes.service");
const annexes_controller_1 = require("./annexes.controller");
let AnnexesModule = class AnnexesModule {
};
exports.AnnexesModule = AnnexesModule;
exports.AnnexesModule = AnnexesModule = __decorate([
    (0, common_1.Module)({
        controllers: [annexes_controller_1.AnnexesController],
        providers: [annexes_service_1.AnnexesService],
        exports: [annexes_service_1.AnnexesService],
    })
], AnnexesModule);
//# sourceMappingURL=annexes.module.js.map