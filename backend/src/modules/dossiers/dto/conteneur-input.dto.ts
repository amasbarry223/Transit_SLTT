import { IsOptional, IsString } from 'class-validator';

export class ConteneurInputDto {
  @IsString()
  numero!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  plomb?: string;

  @IsString()
  @IsOptional()
  statut?: string;
}
