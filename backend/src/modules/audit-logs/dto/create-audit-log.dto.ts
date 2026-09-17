import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/** `POST /audit-logs` accepte l'écriture par n'importe quel utilisateur
 *  authentifié (chaque action de l'app journalise la sienne — restreindre à
 *  une permission casserait ce mécanisme pour tout utilisateur non-admin),
 *  mais acceptait jusqu'ici un `body: any` sans aucune validation :
 *  `action`/`entite` de longueur arbitraire, valeurs non-string possibles.
 *  Le contenu reste client-déclaratif (une entrée peut mentir sur ce qui
 *  s'est passé), mais au moins la forme est maintenant bornée. */
const AUDIT_ACTIONS = ['Création', 'Modification', 'Suppression', 'Connexion', 'Déconnexion', 'Paiement', 'Export', 'Validation'] as const;

export class CreateAuditLogDto {
  @IsIn(AUDIT_ACTIONS)
  action!: string;

  // `entite` (nom réel envoyé par insertAuditLog) ou `module` (compat) — le
  // contrôleur retombe sur "Utilisateurs" si aucun des deux n'est fourni,
  // d'où @IsOptional() sur les deux plutôt que d'en rendre un obligatoire.
  @IsString()
  @IsOptional()
  @MaxLength(100)
  entite?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  module?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  entiteId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  detail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  userName?: string;

  @IsObject()
  @IsOptional()
  donnees?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  ip?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  adresseIp?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  userAgent?: string;
}
