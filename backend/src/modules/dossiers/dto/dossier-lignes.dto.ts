import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CATEGORIES_DEPENSE, MODES_PAIEMENT } from '../dossier-finances';

/** Dépense du dossier. `id` présent = ligne existante à mettre à jour. */
export class DepenseDossierDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  nature!: string;

  @IsIn(CATEGORIES_DEPENSE)
  @IsOptional()
  categorie?: string;

  @IsInt()
  @Min(0)
  montant!: number;
}

/** Paiement reçu du client. `id` présent = paiement existant à mettre à jour. */
export class PaiementDossierDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsInt()
  @Min(0)
  montant!: number;

  @IsIn(MODES_PAIEMENT)
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}
