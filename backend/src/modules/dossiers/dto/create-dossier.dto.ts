import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { DossierFieldsDto } from './dossier-fields.dto';

export class CreateDossierDto extends DossierFieldsDto {
  @IsString()
  annexeId!: string;

  @IsString()
  clientId!: string;

  // Uniquement lu à la création (dossiers.service.ts::create) — un import
  // historique conserve son montant déjà réglé et sa date de solde
  // d'origine, jamais recalculés via enregistrerPaiement().
  @IsNumber()
  @IsOptional()
  montantPaye?: number;

  @IsDateString()
  @IsOptional()
  dateSolde?: string;
}
