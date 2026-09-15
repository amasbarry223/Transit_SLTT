import { IsNumber, IsString } from 'class-validator';

export class LigneDevisDto {
  @IsString()
  designation!: string;

  @IsNumber()
  quantite!: number;

  @IsNumber()
  prixUnitaire!: number;
}
