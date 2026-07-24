"use client";

import { Building2, CalendarDays, Clock, FolderKanban, Percent, Receipt, User } from "lucide-react";
import type { Dossier, Facture } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { shouldShowTva } from "@/lib/export";
import { Card } from "@/components/ui/card";
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
      <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
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
        <InfoRow icon={Building2} label="Société" value={facture.societeNom ?? "—"} />
        <InfoRow
          icon={FolderKanban}
          label="Dossier lié"
          value={dossier ? `${dossier.reference} · BL ${dossier.bl}` : "—"}
        />
        <InfoRow icon={Clock} label="Créée le" value={formatDateShort(facture.creeLe)} />
      </div>
    </Card>
  );
}
