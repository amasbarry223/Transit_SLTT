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
exports.CreateDepenseDto = void 0;
const class_validator_1 = require("class-validator");
var CategorieDepenseDto;
(function (CategorieDepenseDto) {
    CategorieDepenseDto["DOUANE"] = "DOUANE";
    CategorieDepenseDto["PORT"] = "PORT";
    CategorieDepenseDto["TRANSPORT"] = "TRANSPORT";
    CategorieDepenseDto["MANUTENTION"] = "MANUTENTION";
    CategorieDepenseDto["ASSURANCE"] = "ASSURANCE";
    CategorieDepenseDto["DIVERS"] = "DIVERS";
})(CategorieDepenseDto || (CategorieDepenseDto = {}));
class CreateDepenseDto {
    numero;
    annexeId;
    dossierId;
    fournisseurId;
    categorie;
    montant;
    devise;
    justificatif;
    description;
    dateDepense;
}
exports.CreateDepenseDto = CreateDepenseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "numero", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "annexeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "dossierId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "fournisseurId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CategorieDepenseDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "categorie", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDepenseDto.prototype, "montant", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "devise", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "justificatif", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepenseDto.prototype, "dateDepense", void 0);
//# sourceMappingURL=create-depense.dto.js.map