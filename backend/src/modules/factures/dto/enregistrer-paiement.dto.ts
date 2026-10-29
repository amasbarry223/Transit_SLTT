import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MODES_PAIEMENT } from '../../dossiers/dossier-finances';

/** Corps de POST /factures/:id/paiements (avant : objet non typé, donc non
 *  validé par le ValidationPipe global). */
export class EnregistrerPaiementFactureDto {
  @IsNumber()
  @Min(1)
  montant!: number;

  @IsString()
  caisseId!: string;

  @IsString()
  @IsOptional()
  motif?: string;

  /** Mode du règlement (repris sur le dossier lié et dans le journal). */
  @IsIn(MODES_PAIEMENT)
  @IsOptional()
  mode?: string;
}
