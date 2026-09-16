import { Anchor, CalendarDays, Clock, FolderKanban, Percent, Receipt, Truck, User, Weight } from "lucide-react";
import type { Dossier, Facture } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { shouldShowTva } from "@/lib/export";
import { Card } from "@/shared/components/ui/card";
import { InfoRow } from "./info-row";

export function InformationsCard({
  facture,
  dossier,
  isEchue,
}: {
  facture: Facture;
  dossier: Dossier | null | undefined;
  isEchue: boolean;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <div className="border-b border-border/60 px-5 py-3 bg-muted/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Informations</h2>
      </div>
      <div className="px-5">
        <InfoRow icon={User} label="Client" value={facture.clientNom} />
        <InfoRow icon={Receipt} label="N° Facture" value={facture.numero} mono />
        <InfoRow icon={CalendarDays} label="Date d'émission" value={formatDateShort(facture.date)} />
        <InfoRow
          icon={CalendarDays}
          label="Date d'échéance"
          value={formatDateShort(facture.dateEcheance)}
          warn={isEchue}
        />
        {shouldShowTva(facture.tauxTVA) && (
          <InfoRow icon={Percent} label="Taux de TVA" value={`${facture.tauxTVA} %`} />
        )}
        <InfoRow
          icon={FolderKanban}
          label="Dossier lié"
          value={dossier ? `${dossier.reference} · BL ${dossier.bl}` : "—"}
        />
        {dossier?.portEntree && (
          <InfoRow icon={Anchor} label="Port de transit" value={dossier.portEntree} />
        )}
        {dossier?.nature && (
          <InfoRow icon={FolderKanban} label="Nature marchandise" value={dossier.nature} />
        )}
        {dossier?.poidsTotal != null && (
          <InfoRow
            icon={Weight}
            label="Tonnage"
            value={
              dossier.poidsTotal >= 1000
                ? `${(dossier.poidsTotal / 1000).toFixed(0)} T`
                : `${dossier.poidsTotal} Kg`
            }
          />
        )}
        {dossier?.camion && (
          <InfoRow icon={Truck} label="Transport" value={dossier.camion} />
        )}
        <InfoRow icon={Clock} label="Créée le" value={formatDateShort(facture.creeLe)} />
      </div>
    </Card>
  );
}
