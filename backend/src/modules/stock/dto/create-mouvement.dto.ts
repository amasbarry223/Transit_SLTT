import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMouvementDto {
  @IsString()
  @IsOptional()
  stockId?: string;

  @IsString()
  annexeId!: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsIn(['Entrée', 'Sortie'])
  type!: string;

  @IsString()
  @IsOptional()
  marchandise?: string;

  @IsNumber()
  quantite!: number;

  @IsString()
  @IsOptional()
  unite?: string;

  @IsString()
  @IsOptional()
  responsable?: string;

  @IsString()
  @IsOptional()
  bonRef?: string;

  @IsString()
  @IsOptional()
  motif?: string;
}
