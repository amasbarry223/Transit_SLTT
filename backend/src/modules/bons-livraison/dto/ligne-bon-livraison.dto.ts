import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LigneBonLivraisonDto {
  @IsString()
  marchandise!: string;

  @IsNumber()
  quantite!: number;

  @IsString()
  @IsOptional()
  unite?: string;
}
