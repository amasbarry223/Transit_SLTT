import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStockItemDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  annexeId!: string;

  @IsString()
  marchandise!: string;

  @IsNumber()
  @IsOptional()
  quantite?: number;

  @IsString()
  @IsOptional()
  unite?: string;

  @IsNumber()
  @IsOptional()
  seuil?: number;

  @IsString()
  @IsOptional()
  depositaire?: string;

  @IsString()
  @IsOptional()
  commercial?: string;

  @IsNumber()
  @IsOptional()
  sommePayee?: number;

  @IsNumber()
  @IsOptional()
  resteAPayer?: number;

  @IsString()
  @IsOptional()
  date?: string;
}
