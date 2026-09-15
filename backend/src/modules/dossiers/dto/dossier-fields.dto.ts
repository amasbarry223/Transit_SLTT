import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ConteneurInputDto } from './conteneur-input.dto';

/**
 * Champs communs à la création et à la mise à jour d'un dossier.
 *
 * Dossier est l'entité la plus riche de l'app, et son historique porte deux
 * générations de noms de champs envoyées SIMULTANÉMENT par le front pour
 * plusieurs concepts (dossiers-slice.ts) — la fonction
 * buildDossierPrismaData() (dossiers.service.ts) préfère toujours le nom
 * Prisma exact si présent, sinon retombe sur l'alias :
 *   voieTransport ?? modeTransport | marchandise ?? nature
 *   poids ?? poidsTotal           | navireVol ?? camion
 *   numeroBl ?? bl                | portDestination ?? portEntree
 *   dateDepart ?? date            | dateArriveePrevue ?? dateEcheance
 *   dateArriveeEffective ?? dateDedouanement
 *   valeurDouane ?? droitDouane
 * Les deux noms sont donc whitelistés ici pour ne rejeter aucun payload
 * existant — retirer l'un des deux casserait soit la création normale,
 * soit l'import historique, qui n'envoient pas exactement le même sous-
 * ensemble de noms.
 *
 * `statut` et `voieTransport`/`modeTransport` sont volontairement typés en
 * simple `@IsString()` : normalizeStatutDossier()/normalizeVoieTransport()
 * acceptent des libellés FR libres ("En cours", "Aérien"…), pas seulement
 * la casse exacte de l'enum Prisma.
 */
export class DossierFieldsDto {
  @IsString()
  @IsOptional()
  numero?: string;

  @IsIn(['IMPORT', 'EXPORT', 'TRANSIT'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  voieTransport?: string;

  @IsString()
  @IsOptional()
  modeTransport?: string;

  @IsString()
  @IsOptional()
  marchandise?: string;

  @IsString()
  @IsOptional()
  nature?: string;

  @IsNumber()
  @IsOptional()
  poids?: number;

  @IsNumber()
  @IsOptional()
  poidsTotal?: number;

  @IsNumber()
  @IsOptional()
  volume?: number;

  @IsNumber()
  @IsOptional()
  nombreColis?: number;

  @IsString()
  @IsOptional()
  navireVol?: string;

  @IsString()
  @IsOptional()
  camion?: string;

  @IsString()
  @IsOptional()
  compagnie?: string;

  @IsString()
  @IsOptional()
  numeroBl?: string;

  @IsString()
  @IsOptional()
  bl?: string;

  @IsString()
  @IsOptional()
  portProvenance?: string;

  @IsString()
  @IsOptional()
  portDestination?: string;

  @IsString()
  @IsOptional()
  portEntree?: string;

  @IsDateString()
  @IsOptional()
  dateDepart?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  dateArriveePrevue?: string;

  @IsDateString()
  @IsOptional()
  dateEcheance?: string;

  @IsDateString()
  @IsOptional()
  dateArriveeEffective?: string;

  @IsDateString()
  @IsOptional()
  dateDedouanement?: string;

  @IsDateString()
  @IsOptional()
  dateLivraison?: string;

  @IsString()
  @IsOptional()
  bureauDouane?: string;

  @IsString()
  @IsOptional()
  numeroDeclaration?: string;

  @IsDateString()
  @IsOptional()
  dateDeclaration?: string;

  @IsNumber()
  @IsOptional()
  valeurDouane?: number;

  @IsNumber()
  @IsOptional()
  droitDouane?: number;

  @IsNumber()
  @IsOptional()
  fraisCircuit?: number;

  @IsNumber()
  @IsOptional()
  fraisPrestation?: number;

  @IsNumber()
  @IsOptional()
  montantInvesti?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  noConteneur?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConteneurInputDto)
  @IsOptional()
  conteneurs?: ConteneurInputDto[];
}
