import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFournisseurDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  nom!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  // Le front (fournisseurs-slice.ts) envoie ces deux champs mais le modèle
  // Prisma Fournisseur n'a NI colonne `tarifContractuel` NI `annexeId` — le
  // service les ignore déjà silencieusement aujourd'hui. Whitelistés pour ne
  // pas rejeter ce payload existant ; voir mémoire projet : perte de donnée
  // à traiter séparément (ajouter les colonnes, ou retirer ces champs du
  // formulaire si l'info n'est pas censée être conservée).
  @IsNumber()
  @IsOptional()
  tarifContractuel?: number;

  @IsString()
  @IsOptional()
  annexeId?: string;

  // Champ "statut" dérivé côté front vers `actif` (voir commentaire dans
  // fournisseurs-slice.ts) : le service ne le lit jamais mais le front
  // continue de l'envoyer en plus de `actif`.
  @IsString()
  @IsOptional()
  statut?: string;
}
