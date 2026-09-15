import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClotureDto {
  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  periodeDebut!: string;

  @IsString()
  periodeFin!: string;

  @IsNumber()
  @IsOptional()
  soldeTheorique?: number;

  @IsNumber()
  @IsOptional()
  soldeConstate?: number;

  @IsString()
  @IsOptional()
  note?: string;

  // Le front (comptabilite-generale-slice.ts) envoie encore ce champ, mais
  // le service impose toujours `user.nom` (JWT) comme auteur, jamais cette
  // valeur cliente. Whitelisté pour ne pas rejeter ce payload existant.
  @IsString()
  @IsOptional()
  cloturePar?: string;

  @IsDateString()
  @IsOptional()
  clotureLe?: string;
}
