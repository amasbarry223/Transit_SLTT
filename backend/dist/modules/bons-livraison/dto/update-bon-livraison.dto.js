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
exports.UpdateBonLivraisonDto = exports.STATUTS_BON_LIVRAISON = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const ligne_bon_livraison_dto_1 = require("./ligne-bon-livraison.dto");
exports.STATUTS_BON_LIVRAISON = ['En cours', 'Livré'];
class UpdateBonLivraisonDto {
    date;
    lignes;
    transporteurId;
    transporteurNom;
    immatriculation;
    chauffeurNom;
    chauffeurTelephone;
    adresseLivraison;
    observations;
    statut;
}
exports.UpdateBonLivraisonDto = UpdateBonLivraisonDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ligne_bon_livraison_dto_1.LigneBonLivraisonDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateBonLivraisonDto.prototype, "lignes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "transporteurId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "transporteurNom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "immatriculation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "chauffeurNom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "chauffeurTelephone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "adresseLivraison", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBonLivraisonDto.prototype, "observations", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.STATUTS_BON_LIVRAISON),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateBonLivraisonDto.prototype, "statut", void 0);
//# sourceMappingURL=update-bon-livraison.dto.js.map