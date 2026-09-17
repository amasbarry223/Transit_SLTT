"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FournisseursModule = void 0;
const common_1 = require("@nestjs/common");
const fournisseurs_service_1 = require("./fournisseurs.service");
const fournisseurs_controller_1 = require("./fournisseurs.controller");
let FournisseursModule = class FournisseursModule {
};
exports.FournisseursModule = FournisseursModule;
exports.FournisseursModule = FournisseursModule = __decorate([
    (0, common_1.Module)({
        controllers: [fournisseurs_controller_1.FournisseursController],
        providers: [fournisseurs_service_1.FournisseursService],
        exports: [fournisseurs_service_1.FournisseursService],
    })
], FournisseursModule);
//# sourceMappingURL=fournisseurs.module.js.map