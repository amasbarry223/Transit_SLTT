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
exports.UpdatePrestationDto = exports.CreatePrestationDto = exports.STATUTS_PRESTATION = void 0;
const class_validator_1 = require("class-validator");
exports.STATUTS_PRESTATION = ['En attente', 'Exécuté', 'Prévue', 'Réalisée', 'Annulée'];
class CreatePrestationDto {
    libelle;
    description;
    montant;
    statut;
    datePrevue;
    dateRealisation;
}
exports.CreatePrestationDto = CreatePrestationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrestationDto.prototype, "libelle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePrestationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePrestationDto.prototype, "montant", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.STATUTS_PRESTATION),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePrestationDto.prototype, "statut", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePrestationDto.prototype, "datePrevue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePrestationDto.prototype, "dateRealisation", void 0);
class UpdatePrestationDto {
    libelle;
    description;
    montant;
    statut;
    datePrevue;
    dateRealisation;
    facturee;
}
exports.UpdatePrestationDto = UpdatePrestationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrestationDto.prototype, "libelle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrestationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePrestationDto.prototype, "montant", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.STATUTS_PRESTATION),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrestationDto.prototype, "statut", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrestationDto.prototype, "datePrevue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrestationDto.prototype, "dateRealisation", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePrestationDto.prototype, "facturee", void 0);
//# sourceMappingURL=prestation.dto.js.map