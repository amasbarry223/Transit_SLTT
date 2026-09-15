import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class EnregistrerPaiementDto {
  @IsNumber()
  montant!: number;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
