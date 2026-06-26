"use client";

import { useMemo } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Pencil,
  Plus,
  FolderKanban,
  Wallet,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import {
  resteAPayer,
  type Ecriture,
  type EcritureStatut,
  type BonMotif,
} from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { KpiCard } from "@/components/sltt/kpi-card";
import {
  ToneBadge,
  DossierStatutBadge,
  EcritureStatutBadge,
} from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

function deriveEcritureStatut(e: Ecriture): EcritureStatut {
  return e.montantPaye >= e.montantInvesti ? "Soldé" : "En attente";
}

const bonMotifTone: Record<BonMotif, "blue" | "emerald" | "indigo"> = {
  Vente: "blue",
  Livraison: "emerald",
  Transfert: "indigo",
};

function bonStatutTone(statut: "Validé" | "Brouillon"): "emerald" | "amber" {
  return statut === "Validé" ? "emerald" : "amber";
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">{label}</div>
  );
}

export function ClientFicheScreen() {
  const { selectedId, go, openDossier } = useNav();
  const clients = useStore((s) => s.clients);
  const allDossiers = useStore((s) => s.dossiers);
  const allEcritures = useStore((s) => s.ecritures);
  const allBons = useStore((s) => s.bons);

  const client = useMemo(
    () => clients.find((c) => c.id === selectedId),
    [clients, selectedId],
  );

  const dossiers = useMemo(
    () =>
      selectedId
        ? allDossiers.filter((d) => d.clientId === selectedId)
        : [],
    [allDossiers, selectedId],
  );
  const ecritures = useMemo(
    () =>
      selectedId
        ? allEcritures.filter((e) => e.clientId === selectedId)
        : [],
    [allEcritures, selectedId],
  );
  const bons = useMemo(
    () =>
      selectedId ? allBons.filter((b) => b.clientId === selectedId) : [],
    [allBons, selectedId],
  );

  // Compute live KPI values from the client's ecritures for accuracy.
  const { totalPaye, totalDu } = useMemo(() => {
    let paye = 0;
    let du = 0;
    for (const e of ecritures) {
      paye += e.montantPaye;
      du += resteAPayer(e);
    }
    return { totalPaye: paye, totalDu: du };
  }, [ecritures]);

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => go("clients")} className="text-slate-600">
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
        <Card className="p-10 shadow-sm border-border/80 text-center">
          <p className="text-lg font-semibold text-slate-900">Client introuvable</p>
          <p className="mt-1 text-sm text-slate-500">
            Le client demandé n'existe pas ou a été supprimé.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => go("clients")}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
      </div>

      {/* Client header card */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xl font-bold">
              {getInitials(client.nom)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {client.nom}
                </h2>
                <ToneBadge tone={client.type === "Entreprise" ? "blue" : "slate"}>
                  {client.type}
                </ToneBadge>
              </div>
              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-slate-400" />
                  <span className="font-mono text-xs">{client.telephone}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400" />
                  {client.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {client.adresse}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <Pencil className="size-4" />
              Modifier la fiche
            </Button>
            <Button onClick={() => openDossier(null, "create")}>
              <Plus className="size-4" />
              Nouveau dossier pour ce client
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total dossiers"
          value={String(dossiers.length)}
          icon={FolderKanban}
          tone="blue"
          sublabel="dossiers de transit"
        />
        <KpiCard
          label="Total payé"
          value={formatFCFA(totalPaye)}
          icon={Wallet}
          tone="emerald"
          sublabel="encaissements"
        />
        <KpiCard
          label="Reste à payer"
          value={formatFCFA(totalDu)}
          icon={Clock}
          tone="amber"
          sublabel="solde dû"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dossiers" className="gap-4">
        <TabsList>
          <TabsTrigger value="dossiers">
            Dossiers
            <span className="ml-1 rounded bg-slate-200/70 px-1.5 py-0.5 text-xs tabular-nums text-slate-700">
              {dossiers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="paiements">
            Paiements
            <span className="ml-1 rounded bg-slate-200/70 px-1.5 py-0.5 text-xs tabular-nums text-slate-700">
              {ecritures.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="bons">
            Bons de sortie
            <span className="ml-1 rounded bg-slate-200/70 px-1.5 py-0.5 text-xs tabular-nums text-slate-700">
              {bons.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Dossiers tab */}
        <TabsContent value="dossiers">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Dossiers de transit
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {dossiers.length} enregistrement{dossiers.length > 1 ? "s" : ""}
              </span>
            </div>
            {dossiers.length === 0 ? (
              <EmptyState label="Aucun enregistrement" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Référence
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      N° BL
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Statut
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((d) => (
                    <TableRow
                      key={d.id}
                      className="hover:bg-slate-50/60 border-b border-border"
                    >
                      <TableCell className="py-3 font-medium text-slate-900">
                        {d.reference}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600 tabular-nums">
                        {formatDateShort(d.date)}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600 font-mono text-xs">
                        {d.bl}
                      </TableCell>
                      <TableCell className="py-3">
                        <DossierStatutBadge statut={d.statut} />
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-slate-900 font-medium">
                        {formatFCFA(d.montantInvesti)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Paiements tab */}
        <TabsContent value="paiements">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Écritures de paiement
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {ecritures.length} enregistrement{ecritures.length > 1 ? "s" : ""}
              </span>
            </div>
            {ecritures.length === 0 ? (
              <EmptyState label="Aucun enregistrement" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Montant investi
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Montant payé
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Reste à payer
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Mode
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecritures.map((e) => (
                    <TableRow
                      key={e.id}
                      className="hover:bg-slate-50/60 border-b border-border"
                    >
                      <TableCell className="py-3 text-slate-600 tabular-nums">
                        {formatDateShort(e.date)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-slate-700">
                        {formatFCFA(e.montantInvesti)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-emerald-700 font-medium">
                        {formatFCFA(e.montantPaye)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums">
                        {resteAPayer(e) > 0 ? (
                          <span className="font-medium text-amber-600">
                            {formatFCFA(resteAPayer(e))}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600">
                        {e.modePaiement}
                      </TableCell>
                      <TableCell className="py-3">
                        <EcritureStatutBadge statut={deriveEcritureStatut(e)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Bons tab */}
        <TabsContent value="bons">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Bons de sortie
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {bons.length} enregistrement{bons.length > 1 ? "s" : ""}
              </span>
            </div>
            {bons.length === 0 ? (
              <EmptyState label="Aucun enregistrement" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Référence
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Marchandise
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Quantité
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Motif
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                      Montant
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-slate-500">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bons.map((b) => (
                    <TableRow
                      key={b.id}
                      className="hover:bg-slate-50/60 border-b border-border"
                    >
                      <TableCell className="py-3 font-medium text-slate-900">
                        {b.reference}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600 tabular-nums">
                        {formatDateShort(b.date)}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600">
                        {b.marchandise}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-slate-700">
                        {b.quantite} {b.unite}
                      </TableCell>
                      <TableCell className="py-3">
                        <ToneBadge tone={bonMotifTone[b.motif]}>{b.motif}</ToneBadge>
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-slate-900 font-medium">
                        {formatFCFA(b.montant)}
                      </TableCell>
                      <TableCell className="py-3">
                        <ToneBadge tone={bonStatutTone(b.statut)}>
                          {b.statut}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
