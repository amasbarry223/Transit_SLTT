"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useSession } from "@/lib/session/session-store";
import * as React from "react";
import {
  Package,
  Users,
  FileText,
  Ship,
  Truck,
  Plus,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { getDashboardAnchorDate, getDashboardAnchorDayKey } from "@/lib/calendar-anchor";
import { getDashboardSections, type DashboardSection } from "@/lib/dashboard-config";
import { buildMonthlyCounts, computeCountVariation, type LiveAlert } from "@/lib/dashboard-metrics";
import { useBeneficeParSociete } from "@/shared/hooks/use-benefice-par-societe";
import { useCurrentUser, usePermission } from "@/shared/hooks/use-permission";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

import { DashboardStatStrip, type DashboardStat } from "@/components/sltt/dashboard/dashboard-stat-strip";
import { AgentPanel } from "@/components/sltt/dashboard/agent-panel";
import { ComptablePanel } from "@/components/sltt/dashboard/comptable-panel";
import { DossiersEvolutionChartLazy } from "@/components/sltt/dashboard/dossiers-evolution-chart-lazy";
import { StockRepartitionChartLazy } from "@/components/sltt/dashboard/stock-repartition-chart-lazy";
import { DerniersDossiersCard } from "@/components/sltt/dashboard/derniers-dossiers-card";
import { AlertesCard } from "@/components/sltt/dashboard/alertes-card";
import { useDashboardMetrics } from "@/components/sltt/dashboard/use-dashboard-metrics";

const SLTT_GRID = "#E2E8F0";

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const currentUserName = useSession((s) => s.currentUserName);
  const canCreateDossier = usePermission("dossiers:write");
  const theme = useUiPrefs((s) => s.theme);
  const isDark = theme === "dark";
  const gridColor = isDark ? "#27283F" : SLTT_GRID;
  const tickColor = isDark ? "#92A3BA" : "#64748B";
  const barCursorFill = isDark ? "#27283F" : "#F1F5F9";

  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);
  const clients = useStore((s) => s.clients);
  const currentUser = useCurrentUser();
  // Pas de repli sur "Administrateur" ici : currentUser === null (session pas
  // encore hydratée / déconnecté) est géré explicitement plus bas (aucun
  // panneau de rôle tant que la session n'est pas résolue) — un repli sur le
  // rôle le plus privilégié afficherait un instant le panneau admin à
  // quiconque, l'inverse du principe de moindre privilège.
  const currentRole = currentUser?.role;

  const sections = React.useMemo(
    () => getDashboardSections(currentUser),
    [currentUser],
  );
  const hasSection = (section: DashboardSection) => sections.has(section);

  const anchorDayKey = getDashboardAnchorDayKey();
  const anchorDate = React.useMemo(() => getDashboardAnchorDate(), [anchorDayKey]);
  const { ecrituresAvecDate } = useBeneficeParSociete(anchorDate);

  const periodeLabel = anchorDate
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const {
    dossiersEnCours,
    valeurStock,
    totalRestesAPayer,
    nbDossiersNonSoldes,
    dossiersParMois,
    stockRepartition,
    derniersDossiers,
    alertes,
  } = useDashboardMetrics({ dossiers, factures, stock, ecrituresAvecDate, anchorDate });

  // "vs mois dernier" réel (créations ce mois-ci vs le précédent) — seulement
  // pour les flux d'éléments créés, jamais pour un état instantané comme
  // "Dossiers en cours" (aucune date de création à comparer n'a de sens ici).
  const dossiersVariation = React.useMemo(
    () => computeCountVariation(dossiers, (d) => d.date, anchorDate),
    [dossiers, anchorDate],
  );
  const clientsVariation = React.useMemo(
    () => computeCountVariation(clients, (c) => c.createdAt, anchorDate),
    [clients, anchorDate],
  );
  const facturesVariation = React.useMemo(
    () => computeCountVariation(factures, (f) => f.date, anchorDate),
    [factures, anchorDate],
  );
  const bonsVariation = React.useMemo(
    () => computeCountVariation(bons, (b) => b.date, anchorDate),
    [bons, anchorDate],
  );

  // Historique mensuel pour les mini-graphiques du registre d'activité —
  // même donnée que les variations ci-dessus, sous forme de série complète
  // au lieu d'un seul pourcentage.
  const dossiersSeries = React.useMemo(
    () => buildMonthlyCounts(dossiers, (d) => d.date, anchorDate),
    [dossiers, anchorDate],
  );
  const clientsSeries = React.useMemo(
    () => buildMonthlyCounts(clients, (c) => c.createdAt, anchorDate),
    [clients, anchorDate],
  );
  const facturesSeries = React.useMemo(
    () => buildMonthlyCounts(factures, (f) => f.date, anchorDate),
    [factures, anchorDate],
  );
  const bonsSeries = React.useMemo(
    () => buildMonthlyCounts(bons, (b) => b.date, anchorDate),
    [bons, anchorDate],
  );

  // Le repli "return items.length > 0 ? items : alertes" réintroduisait
  // TOUTES les alertes (y compris hors permission) dès que la sélection
  // autorisée était vide — pas seulement quand l'utilisateur manquait des
  // deux permissions, mais aussi quand sa seule catégorie autorisée n'avait
  // simplement aucune alerte ce jour-là. On ne retombe jamais sur la liste
  // non filtrée.
  const filteredAlertes = React.useMemo(() => {
    const items: LiveAlert[] = [];
    if (hasSection("alertes_stock")) {
      items.push(...alertes.filter((a) => a.id.startsWith("stock-")));
    }
    if (hasSection("alertes_dossiers")) {
      items.push(...alertes.filter((a) => !a.id.startsWith("stock-")));
    }
    return items;
  }, [alertes, sections]);

  const firstName = currentUserName ? currentUserName.split(" ")[0] : null;

  // Une phrase, pas une bannière publicitaire : le fait le plus utile à
  // savoir aujourd'hui, propre à ce que ce rôle gère réellement.
  const headline = React.useMemo(() => {
    if (currentRole === "Comptable") {
      return nbDossiersNonSoldes > 0
        ? `${formatFCFA(totalRestesAPayer)} restent à recouvrer sur ${nbDossiersNonSoldes} dossier${nbDossiersNonSoldes > 1 ? "s" : ""}.`
        : "Aucune créance en attente sur les dossiers non facturés.";
    }
    if (currentRole === "Agent de transit") {
      return dossiersEnCours > 0
        ? `${dossiersEnCours} dossier${dossiersEnCours > 1 ? "s" : ""} en cours de traitement.`
        : "Aucun dossier en cours de traitement.";
    }
    if (currentRole === "Administrateur") {
      return `${dossiersEnCours} dossier${dossiersEnCours > 1 ? "s" : ""} en cours · ${formatFCFA(totalRestesAPayer)} à recouvrer.`;
    }
    return "Voici l'activité de votre agence ce mois-ci.";
  }, [currentRole, dossiersEnCours, nbDossiersNonSoldes, totalRestesAPayer]);

  const stats: DashboardStat[] = [
    { key: "dossiers", label: "Dossiers", value: dossiers.length, icon: Package, trend: dossiersVariation, series: dossiersSeries, onClick: () => go("dossiers") },
    { key: "en-cours", label: "En cours", value: dossiersEnCours, icon: Truck, onClick: () => go("dossiers") },
    { key: "clients", label: "Clients", value: clients.length, icon: Users, trend: clientsVariation, series: clientsSeries, onClick: () => go("clients") },
    { key: "factures", label: "Factures", value: factures.length, icon: FileText, trend: facturesVariation, series: facturesSeries, onClick: () => go("factures") },
    { key: "bons", label: "Bons de sortie", value: bons.length, icon: Ship, trend: bonsVariation, series: bonsSeries, onClick: () => go("bons") },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* En-tête — un fait réel plutôt qu'une bannière : le seul accent
          appuyé de la page, tout le reste reste sobre. */}
      <div className="overflow-hidden rounded-2xl bg-[#0B2A78] text-white shadow-md">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-300/70">{periodeLabel}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {firstName ? `Bonjour, ${firstName}` : "Tableau de bord"}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-blue-100/90">{headline}</p>
          </div>
          {canCreateDossier && (
            <Button
              onClick={() => openDossier(null, "create")}
              className="shrink-0 gap-2 rounded-xl border border-red-500/40 bg-[#ED1C24] px-5 font-bold text-white shadow-lg shadow-red-950/30 transition-all hover:bg-[#D9161E]"
            >
              <Plus className="size-4 shrink-0 stroke-[3]" />
              Nouveau dossier
            </Button>
          )}
        </div>
      </div>

      {/* Registre d'activité — un bandeau, pas cinq tuiles publicitaires. */}
      <DashboardStatStrip stats={stats} />

      {/* Module métier du rôle + analyses */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-7">
          {!currentUser ? null : currentRole === "Agent de transit" ? (
            <AgentPanel
              go={go as (v: "dossiers" | "devis", opts?: { id?: string | null }) => void}
              openDossier={openDossier}
            />
          ) : currentRole === "Comptable" ? (
            <ComptablePanel go={go as (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void} />
          ) : (
            // Administrateur (et tout rôle non explicitement géré) voit la
            // synthèse combinée : à la fois le pipeline opérationnel et
            // l'état des créances, puisqu'il a la visibilité des deux —
            // pas un annuaire des utilisateurs déjà consultable depuis
            // Paramètres, ni des compteurs déjà présents dans le registre
            // au-dessus.
            <>
              <AgentPanel
                go={go as (v: "dossiers" | "devis", opts?: { id?: string | null }) => void}
                openDossier={openDossier}
              />
              <ComptablePanel go={go as (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
          <DossiersEvolutionChartLazy
            data={dossiersParMois}
            gridColor={gridColor}
            tickColor={tickColor}
            barCursorFill={barCursorFill}
          />
          <StockRepartitionChartLazy
            data={stockRepartition}
            totalValue={valeurStock}
          />
        </div>
      </div>

      {/* Activité récente & alertes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        <div className={cn(filteredAlertes.length > 0 ? "lg:col-span-2" : "lg:col-span-3")}>
          <DerniersDossiersCard
            dossiers={derniersDossiers}
            onGoToDossiers={() => go("dossiers")}
            onOpenDossier={(id) => go("dossier-detail", { id })}
          />
        </div>

        {filteredAlertes.length > 0 && (
          <div className="lg:col-span-1">
            <AlertesCard
              alertes={filteredAlertes}
              onAlertClick={(alert) =>
                go(alert.target.view, alert.target.id ? { id: alert.target.id } : undefined)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
