"use client";

import {
  Wallet,
  Receipt as ReceiptIcon,
  Truck,
  History,
  Clock,
  Plus,
} from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { financesDossier, MODE_PAIEMENT_LABELS } from "@/lib/domain/dossier-finances";
import { formatFCFA, formatDateShort } from "@/lib/format";
import type { Facture } from "@/lib/store";
import type { DossierFournisseur } from "@/lib/store";
import type { AuditEntry } from "@/lib/audit";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { EmptyState } from "@/components/sltt/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  FactureStatutBadge,
  DossierFournisseurStatutBadge,
} from "@/components/sltt/status-badge";

export function DossierDetailSuivi({
  dossier,
  factures,
  fournisseurs,
  auditLogs,
  onNewFacture,
  onOpenFacture,
  onAddFournisseur,
  canWrite = true,
}: {
  dossier: Dossier;
  factures: Facture[];
  fournisseurs: DossierFournisseur[];
  auditLogs: AuditEntry[];
  onNewFacture: () => void;
  onOpenFacture: (id: string) => void;
  onAddFournisseur: () => void;
  canWrite?: boolean;
}) {
  // Règlements réels du dossier (avant : « écritures », tableau toujours vide —
  // la section affichait « Aucun paiement » même pour un dossier soldé).
  const finances = financesDossier(dossier);
  const paiements =
    dossier.paiements && dossier.paiements.length > 0
      ? dossier.paiements
      : dossier.montantPaye > 0
        ? [{ date: dossier.dateSolde || dossier.date, montant: dossier.montantPaye, mode: "ESPECES" as const, reference: "Cumul" }]
        : [];
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Paiements enregistrés</h2>
          <p className="text-xs text-muted-foreground">
            Règlements reçus du client pour {dossier.reference} — encaissé {formatFCFA(finances.montantPaye)} sur{" "}
            {formatFCFA(finances.totalContrat)}
            {finances.resteAPayer > 0
              ? `, reste ${formatFCFA(finances.resteAPayer)}`
              : finances.resteAPayer < 0
                ? `, trop-perçu ${formatFCFA(-finances.resteAPayer)}`
                : ", soldé"}
          </p>
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {paiements.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Aucun paiement"
              description="Les règlements s'ajoutent depuis la fiche du dossier (bouton Modifier) ou à l'encaissement d'une facture liée."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.map((p, i) => (
                    <TableRow key={`${p.date}-${i}`}>
                      <TableCell className="tabular-nums">{formatDateShort(p.date)}</TableCell>
                      <TableCell>{MODE_PAIEMENT_LABELS[p.mode] ?? p.mode}</TableCell>
                      <TableCell className="text-muted-foreground">{p.reference || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                        {formatFCFA(p.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Factures liées</h2>
            <p className="text-xs text-muted-foreground">Factures client émises pour ce dossier</p>
          </div>
          <Button variant="outline" size="sm" onClick={onNewFacture}>
            <ReceiptIcon className="size-4" />
            Nouvelle facture
          </Button>
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {factures.length === 0 ? (
            <EmptyState
              icon={ReceiptIcon}
              title="Aucune facture"
              description="Utilisez le bouton « Nouvelle facture » ci-dessus, ou créez-en une depuis le module Factures."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.map((f) => (
                    <TableRow
                      key={f.id}
                      className="cursor-pointer"
                      onClick={() => onOpenFacture(f.id)}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">{f.numero}</TableCell>
                      <TableCell className="tabular-nums">{formatDateShort(f.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatFCFA(f.montantTTC)}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">{formatFCFA(f.montantPaye)}</TableCell>
                      <TableCell>
                        <FactureStatutBadge statut={f.statut} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Fournisseurs</h2>
            <p className="text-xs text-muted-foreground">Coûts de sous-traitance imputés au dossier</p>
          </div>
          {canWrite && (
          <Button size="sm" onClick={onAddFournisseur}>
            <Plus className="size-4" />
            Ajouter
          </Button>
          )}
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {fournisseurs.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Aucun fournisseur"
              description="Utilisez le bouton « Ajouter » ci-dessus pour imputer un transporteur ou commissionnaire et son coût à ce dossier."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Budgété</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fournisseurs.map((df) => (
                    <TableRow key={df.id}>
                      <TableCell>
                        <p className="font-medium">{df.fournisseurNom}</p>
                        <p className="text-xs text-slate-400">{df.type}</p>
                      </TableCell>
                      <TableCell className="text-sm">{df.description || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatFCFA(df.montantBudgete)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatFCFA(df.montantReel)}</TableCell>
                      <TableCell>
                        <DossierFournisseurStatutBadge statut={df.statut} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Historique d&apos;activité</h2>
          <p className="text-xs text-muted-foreground">Journal des actions sur ce dossier</p>
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {auditLogs.length === 0 ? (
            <EmptyState icon={History} title="Aucune activité" description="Les modifications apparaîtront ici automatiquement." />
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-3.5">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Clock className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>{formatDateShort(a.date.slice(0, 10))}</p>
                    <p className="mt-0.5">{a.user}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
