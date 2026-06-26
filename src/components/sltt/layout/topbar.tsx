"use client";

import { useNav, type ViewKey } from "@/lib/nav-store";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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

      {/* Global search */}
      <div className="relative hidden md:block w-64 lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Rechercher un dossier, un client…"
          className="h-9 pl-9 pr-3 bg-slate-50 border-border text-sm"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            <Badge variant="secondary" className="text-[10px]">
              3 nouvelles
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
            <span className="text-sm font-medium text-slate-900">
              Stock faible · Riz parfumé
            </span>
            <span className="text-xs text-slate-500">
              65 sacs restants — Entrepôt B
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
            <span className="text-sm font-medium text-slate-900">
              Paiement reçu · Keïta
            </span>
            <span className="text-xs text-slate-500">
              1 900 000 FCFA — Virement
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
            <span className="text-sm font-medium text-slate-900">
              Dossier non soldé · SLTT-TR-2026-0042
            </span>
            <span className="text-xs text-slate-500">
              Reste à payer : 700 000 FCFA
            </span>
          </DropdownMenuItem>
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
