import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LigneBonCaisseDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  beneficiaire!: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsNumber()
  montant!: number;
}
