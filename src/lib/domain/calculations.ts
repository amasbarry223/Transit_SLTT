/**
 * Marge métier dossier = prestation − (droit de douane + frais de circuit).
 *
 * `montantInvesti` est accepté pour permettre de passer un `Dossier` entier,
 * mais n'entre pas dans la formule : côté formulaire, `montantInvesti` vaut
 * droit+circuit+prestation (assiette à payer), pas le coût engagé.
 */
export function calculerEcart(d: {
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti?: number;
}): number {
  return d.fraisPrestation - (d.droitDouane + d.fraisCircuit);
}

export function resteAPayer(d: {
  montantInvesti: number;
  montantPaye: number;
}): number {
  return Math.max(0, d.montantInvesti - d.montantPaye);
}
