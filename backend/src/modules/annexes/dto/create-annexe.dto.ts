import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAnnexeDto {
  @IsString()
  code!: string;

  @IsString()
  nom!: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsBoolean()
  @IsOptional()
  estSiege?: boolean;
}
