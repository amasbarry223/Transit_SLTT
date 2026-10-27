import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { MODES_PAIEMENT } from '../dossier-finances';

export class EnregistrerPaiementDto {
  @IsIn(MODES_PAIEMENT)
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsNumber()
  montant!: number;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
