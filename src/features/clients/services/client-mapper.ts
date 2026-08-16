import type { ClientRow } from "@/lib/db-rows";
import type { Client } from "@/features/clients/types";

export function mapClientFromDb(row: ClientRow): Client {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    telephone: row.telephone,
    email: row.email,
    adresse: row.adresse,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    societeId: row.societe_id,
    societeNom: row.societes?.nom,
    nbDossiers: 0,
    totalDu: 0,
    totalPaye: 0,
  };
}

export function mapClientInputToDb(input: {
  nom: string;
  type: Client["type"];
  telephone: string;
  email: string;
  adresse: string;
  annexeId: string;
  societeId: string;
}) {
  return {
    nom: input.nom,
    type: input.type,
    telephone: input.telephone,
    email: input.email,
    adresse: input.adresse,
    annexe_id: input.annexeId,
    societe_id: input.societeId,
  };
}
