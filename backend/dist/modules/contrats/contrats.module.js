"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContratsModule = void 0;
const common_1 = require("@nestjs/common");
const contrats_controller_1 = require("./contrats.controller");
const contrats_service_1 = require("./contrats.service");
let ContratsModule = class ContratsModule {
};
exports.ContratsModule = ContratsModule;
exports.ContratsModule = ContratsModule = __decorate([
    (0, common_1.Module)({
        controllers: [contrats_controller_1.ContratsController],
        providers: [contrats_service_1.ContratsService],
        exports: [contrats_service_1.ContratsService],
    })
], ContratsModule);
//# sourceMappingURL=contrats.module.js.map