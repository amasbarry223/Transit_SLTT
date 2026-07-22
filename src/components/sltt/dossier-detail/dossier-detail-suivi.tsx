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
import { resteAPayer } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import type { Ecriture, Facture } from "@/lib/store";
import type { DossierFournisseur } from "@/lib/store";
import type { AuditEntry } from "@/lib/audit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/sltt/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EcritureStatutBadge,
  FactureStatutBadge,
  DossierFournisseurStatutBadge,
} from "@/components/sltt/status-badge";

export function DossierDetailSuivi({
  dossier,
  ecritures,
  factures,
  fournisseurs,
  auditLogs,
  onNewFacture,
  onOpenFacture,
  onAddFournisseur,
  onGoComptabilite,
  canWrite = true,
}: {
  dossier: Dossier;
  ecritures: Ecriture[];
  factures: Facture[];
  fournisseurs: DossierFournisseur[];
  auditLogs: AuditEntry[];
  onNewFacture: () => void;
  onOpenFacture: (id: string) => void;
  onAddFournisseur: () => void;
  onGoComptabilite: () => void;
  canWrite?: boolean;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Paiements enregistrés</h2>
          <p className="text-xs text-slate-500">Écritures comptables liées à {dossier.reference}</p>
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {ecritures.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Aucun paiement"
              description="Les paiements apparaissent ici lors du passage en statut Soldé ou via le module Comptabilité."
              action={
                <Button variant="outline" onClick={onGoComptabilite}>
                  Ouvrir la comptabilité
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Investi</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecritures.map((e) => {
                    const resteE = resteAPayer(e);
                    const statut: "Soldé" | "En attente" = resteE === 0 ? "Soldé" : "En attente";
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="tabular-nums">{formatDateShort(e.date)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatFCFA(e.montantInvesti)}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-700">{formatFCFA(e.montantPaye)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {resteE > 0 ? formatFCFA(resteE) : "—"}
                        </TableCell>
                        <TableCell>
                          <EcritureStatutBadge statut={statut} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            <p className="text-xs text-slate-500">Factures client émises pour ce dossier</p>
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
              description="Créez une facture client depuis ce dossier ou le module Factures."
              action={
                <Button variant="outline" onClick={onNewFacture}>
                  Créer une facture
                </Button>
              }
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
                      <TableCell className="font-mono text-xs font-semibold text-blue-700">{f.numero}</TableCell>
                      <TableCell className="tabular-nums">{formatDateShort(f.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatFCFA(f.montantTTC)}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700">{formatFCFA(f.montantPaye)}</TableCell>
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
            <h2 className="text-base font-semibold">Prestataires & transporteurs</h2>
            <p className="text-xs text-slate-500">Coûts de sous-traitance imputés au dossier</p>
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
              title="Aucun prestataire"
              description="Ajoutez un transporteur ou commissionnaire et le coût associé à ce dossier."
              action={
                canWrite ? (
                  <Button onClick={onAddFournisseur}>
                    <Plus className="size-4" />
                    Ajouter un prestataire
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestataire</TableHead>
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
          <p className="text-xs text-slate-500">Journal des actions sur ce dossier</p>
        </div>
        <Card className="border-border/80 p-6 shadow-sm">
          {auditLogs.length === 0 ? (
            <EmptyState icon={History} title="Aucune activité" description="Les modifications apparaîtront ici automatiquement." />
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-3.5">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Clock className="size-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{a.detail}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-500">
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
