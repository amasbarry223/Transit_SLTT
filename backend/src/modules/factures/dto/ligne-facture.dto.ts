import { IsNumber, IsString } from 'class-validator';

export class LigneFactureDto {
  @IsString()
  designation!: string;

  @IsNumber()
  quantite!: number;

  @IsNumber()
  prixUnitaire!: number;
}
