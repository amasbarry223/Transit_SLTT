"use client";

import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "./command-palette";

const viewTitles: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Tableau de bord", sub: "Vue d'ensemble de votre activité" },
  dossiers: { title: "Dossiers de transit", sub: "Suivi des dossiers douaniers" },
  "dossier-form": { title: "Dossier de transit", sub: "Création et édition" },
  comptabilite: { title: "Comptabilité", sub: "Écritures et paiements" },
  bilans: { title: "Bilans & rapports", sub: "Analyse financière périodique" },
  entreposage: { title: "Entreposage", sub: "Gestion du stock et mouvements" },
  bons: { title: "Bons de sortie", sub: "Sorties de marchandises" },
  clients: { title: "Clients", sub: "Annuaire et fiches clients" },
  "client-fiche": { title: "Fiche client", sub: "Vue consolidée du client" },
  parametres: { title: "Paramètres", sub: "Utilisateurs, rôles et sécurité" },
};

export function Topbar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const logout = useNav((s) => s.logout);
  const meta = viewTitles[view];

  const stock = useStore((s) => s.stock);
  const dossiers = useStore((s) => s.dossiers);

  // Live alerts
  const lowStock = stock.filter((s) => s.quantite < s.seuil);
  const unpaidDossiers = dossiers.filter(
    (d) => d.montantInvesti - d.montantPaye > 0,
  );
  const alertCount = lowStock.length + Math.min(unpaidDossiers.length, 3);
  const hasAlerts = alertCount > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-slate-900 leading-tight truncate">
          {meta.title}
        </h2>
        <p className="hidden sm:block text-xs text-slate-500 truncate">
          {meta.sub}
        </p>
      </div>

      {/* Global search — command palette */}
      <CommandPalette />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Bell className="size-5" />
            {hasAlerts && (
              <span className="absolute right-1.5 top-1.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            <Badge variant="secondary" className="text-[10px]">
              {alertCount} {alertCount > 1 ? "nouvelles" : "nouvelle"}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {lowStock.slice(0, 3).map((s) => (
            <DropdownMenuItem
              key={s.id}
              className="flex flex-col items-start gap-1 py-2.5"
              onClick={() => go("entreposage")}
            >
              <span className="text-sm font-medium text-red-600">
                Stock faible · {s.marchandise}
              </span>
              <span className="text-xs text-slate-500">
                {s.quantite} {s.unite} restants — {s.depositaire}
              </span>
            </DropdownMenuItem>
          ))}
          {unpaidDossiers.slice(0, 3).map((d) => (
            <DropdownMenuItem
              key={d.id}
              className="flex flex-col items-start gap-1 py-2.5"
              onClick={() => go("comptabilite")}
            >
              <span className="text-sm font-medium text-amber-600">
                Dossier non soldé · {d.reference}
              </span>
              <span className="text-xs text-slate-500">
                Reste à payer : {formatFCFA(d.montantInvesti - d.montantPaye)} —{" "}
                {d.clientNom}
              </span>
            </DropdownMenuItem>
          ))}
          {!hasAlerts && (
            <div className="py-8 text-center text-sm text-slate-400">
              Aucune notification.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 transition-colors">
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs font-semibold">
                AT
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                Amadou T.
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-none">
                Administrateur
              </p>
            </div>
            <ChevronDown className="hidden sm:block size-3.5 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => go("parametres")}>
            Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => go("parametres")}>
            Paramètres
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
