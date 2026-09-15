import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePortDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
