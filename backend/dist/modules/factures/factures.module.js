"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturesModule = void 0;
const common_1 = require("@nestjs/common");
const factures_service_1 = require("./factures.service");
const factures_controller_1 = require("./factures.controller");
let FacturesModule = class FacturesModule {
};
exports.FacturesModule = FacturesModule;
exports.FacturesModule = FacturesModule = __decorate([
    (0, common_1.Module)({
        controllers: [factures_controller_1.FacturesController],
        providers: [factures_service_1.FacturesService],
        exports: [factures_service_1.FacturesService],
    })
], FacturesModule);
//# sourceMappingURL=factures.module.js.map