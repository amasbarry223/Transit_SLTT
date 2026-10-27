"use client";

import { useMemo, useRef } from "react";
import { AlertTriangle, Printer } from "lucide-react";
import type { BonLivraison, Societe } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { buildBonLivraisonHTML, type BonLivraisonModuleData } from "@/lib/export";
import { resolveTransitSociete } from "@/lib/societe-brand";
import { useToast } from "@/shared/hooks/use-toast";
import { toastWarning } from "@/shared/utils/toast-helpers";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

/** Même résolution de société que le bon de caisse (resolveTransitSociete),
 *  pour que tous les documents sortent sur le même papier à en-tête. */
function buildLivraisonPrintData(bon: BonLivraison, societes: Societe[]): BonLivraisonModuleData | null {
  const societe = resolveTransitSociete(societes);
  if (!societe?.nom) return null;
  return {
    reference: bon.reference,
    date: bon.date,
    bonSortieReference: bon.bonSortieReference,
    clientNom: bon.clientNom,
    adresseLivraison: bon.adresseLivraison,
    lignes: bon.lignes,
    transporteurNom: bon.transporteurNom,
    immatriculation: bon.immatriculation,
    chauffeurNom: bon.chauffeurNom,
    chauffeurTelephone: bon.chauffeurTelephone,
    observations: bon.observations,
    societeNom: societe.nom,
    raisonSociale: societe.raisonSociale,
    logoUrl: societe.logoUrl,
    afficherNomAvecLogo: societe.afficherNomAvecLogo,
    legal: { adresse: societe.adresse, telephone: societe.telephone, rccm: societe.rccm, nif: societe.nif },
  };
}

export function BonLivraisonPreviewDialog({ bon, onClose }: { bon: BonLivraison | null; onClose: () => void }) {
  const { toast } = useToast();
  const societes = useStore((s) => s.societes);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(() => {
    if (!bon) return null;
    const data = buildLivraisonPrintData(bon, societes);
    return data ? buildBonLivraisonHTML(data) : null;
  }, [bon, societes]);

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      toastWarning(toast, { title: "Impression impossible", description: "L'aperçu n'est pas encore chargé." });
      return;
    }
    win.focus();
    win.print();
  }

  return (
    <Dialog open={!!bon} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[min(100%,880px)] max-w-[880px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[880px]">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Bon de livraison {bon?.reference}</DialogTitle>
          <DialogDescription>
            {bon ? `${bon.clientNom} — vérifiez le document puis imprimez-le en deux exemplaires (client et souche).` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[420px] flex-1 bg-muted/40">
          {html ? (
            <iframe
              ref={iframeRef}
              title={`Aperçu ${bon?.reference ?? ""}`}
              srcDoc={html}
              className="h-[min(65vh,620px)] w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Identité de l&apos;entreprise introuvable</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Configurez-la dans Paramètres &gt; Entreprise, puis réessayez.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button disabled={!html} onClick={handlePrint}>
            <Printer className="size-4" />
            Imprimer / Enregistrer en PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
