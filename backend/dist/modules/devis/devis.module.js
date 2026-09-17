"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevisModule = void 0;
const common_1 = require("@nestjs/common");
const devis_service_1 = require("./devis.service");
const devis_controller_1 = require("./devis.controller");
const ports_module_1 = require("../ports/ports.module");
let DevisModule = class DevisModule {
};
exports.DevisModule = DevisModule;
exports.DevisModule = DevisModule = __decorate([
    (0, common_1.Module)({
        imports: [ports_module_1.PortsModule],
        controllers: [devis_controller_1.DevisController],
        providers: [devis_service_1.DevisService],
        exports: [devis_service_1.DevisService],
    })
], DevisModule);
//# sourceMappingURL=devis.module.js.map