"use client";

import { CheckCircle2, ClipboardList, FileOutput, Send } from "lucide-react";
import { KpiCard } from "@/components/sltt/kpi-card";
import { formatFCFA } from "@/lib/format";

export function DevisListKpis({ totalDevis, enAttente, acceptes, totalEstime }: {
  totalDevis: number;
  enAttente: number;
  acceptes: number;
  totalEstime: number;
}) {
  return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total devis"          value={String(totalDevis)}       icon={ClipboardList} tone="blue"    sublabel="devis enregistrés" />
        <KpiCard label="En attente de réponse" value={String(enAttente)}       icon={Send}          tone="amber"   sublabel="envoyés, sans retour" />
        <KpiCard label="Acceptés"              value={String(acceptes)}        icon={CheckCircle2}  tone="emerald" sublabel="convertibles en dossier" />
        <KpiCard label="Montant estimé actif"  value={formatFCFA(totalEstime)} icon={FileOutput}    tone="indigo"  sublabel="hors refusés et expirés" />
      </div>
  );
}
