import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAnnexeDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  // Alias métier historique de `ville` — le service ne l'utilise que si
  // `ville` lui-même n'est pas fourni (voir annexes.service.ts::update).
  @IsString()
  @IsOptional()
  villeSiege?: string;

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

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
