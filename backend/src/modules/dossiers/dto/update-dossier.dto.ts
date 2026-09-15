import { IsOptional, IsString } from 'class-validator';
import { DossierFieldsDto } from './dossier-fields.dto';

export class UpdateDossierDto extends DossierFieldsDto {
  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;
}
