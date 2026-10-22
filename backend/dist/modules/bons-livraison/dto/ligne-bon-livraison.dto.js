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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LigneBonLivraisonDto = void 0;
const class_validator_1 = require("class-validator");
class LigneBonLivraisonDto {
    marchandise;
    quantite;
    unite;
}
exports.LigneBonLivraisonDto = LigneBonLivraisonDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LigneBonLivraisonDto.prototype, "marchandise", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LigneBonLivraisonDto.prototype, "quantite", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LigneBonLivraisonDto.prototype, "unite", void 0);
//# sourceMappingURL=ligne-bon-livraison.dto.js.map