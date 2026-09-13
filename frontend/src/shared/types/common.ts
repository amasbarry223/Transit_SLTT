/**
 * Types transverses partagés entre plusieurs features.
 * Les types métier spécifiques vivent dans features/[name]/types/.
 */

export type { ClientType, Client } from "@/features/clients/types";
export type { DevisStatut, Devis, DevisInput } from "@/features/devis/types";

/** Identifiant UUID string. */
export type EntityId = string;

/** Montant en FCFA. */
export type FcfaAmount = number;
