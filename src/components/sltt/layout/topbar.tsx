"use client";

import { useState } from "react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { Bell, ChevronDown, ChevronRight, Menu, Moon, Sun } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "./command-palette";
import { cn, getInitials, isNavActive } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

const viewTitles: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Tableau de bord", sub: "Vue d'ensemble de votre activité" },
  dossiers: { title: "Dossiers de transit", sub: "Suivi des dossiers douaniers" },
  "dossier-form": { title: "Dossier de transit", sub: "Création et édition" },
  "dossier-detail": { title: "Dossier de transit", sub: "Fiche détaillée du dossier" },
  comptabilite: { title: "Comptabilité", sub: "Écritures et paiements" },
  bilans: { title: "Bilans & rapports", sub: "Analyse financière périodique" },
  entreposage: { title: "Entreposage", sub: "Gestion du stock et mouvements" },
  bons: { title: "Bons de sortie", sub: "Sorties de marchandises" },
  clients: { title: "Clients", sub: "Annuaire et fiches clients" },
  "client-fiche": { title: "Fiche client", sub: "Vue consolidée du client" },
  devis: { title: "Devis", sub: "Estimations avant ouverture de dossier" },
  "devis-detail": { title: "Fiche devis", sub: "Détail et modification du devis" },
  calendrier: { title: "Calendrier", sub: "Vue mensuelle des activités" },
  transporteurs:    { title: "Transporteurs",   sub: "Annuaire des transporteurs et chauffeurs partenaires" },
  factures:         { title: "Factures",         sub: "Gestion et suivi de la facturation client" },
  "facture-detail": { title: "Détail facture",   sub: "Visualiser, modifier et imprimer la facture" },
  fournisseurs:     { title: "Fournisseurs",     sub: "Prestataires, sous-traitants et coûts externes" },
  parametres:       { title: "Paramètres",       sub: "Utilisateurs, rôles et sécurité" },
};


export function Topbar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const logout = useNav((s) => s.logout);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const theme = useNav((s) => s.theme);
  const toggleTheme = useNav((s) => s.toggleTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const initials = getInitials(currentUserName);
  const shortName = currentUserName.split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ");

  const meta = viewTitles[view] ?? {
    title: "SLTT",
    sub: "Société Traoré de Logistique, Transit et Transport",
  };

  const stock = useStore((s) => s.stock);
  const dossiers = useStore((s) => s.dossiers);

  // Live alerts
  const lowStock = stock.filter((s) => s.quantite < s.seuil);
  const unpaidDossiers = dossiers.filter(
    (d) => d.montantInvesti - d.montantPaye > 0,
  );
  const alertCount = lowStock.length + unpaidDossiers.length;
  const hasUnread = alertCount > 0 && !notifRead;

  function handleNav(key: ViewKey) {
    go(key);
    setMobileOpen(false);
  }

  const visibleMobileNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  const renderBreadcrumb = () => {
    let parentKey: ViewKey | null = null;
    let parentLabel = "";

    if (view === "dossier-detail" || view === "dossier-form") {
      parentKey = "dossiers";
      parentLabel = "Dossiers de transit";
    } else if (view === "client-fiche") {
      parentKey = "clients";
      parentLabel = "Clients";
    } else if (view === "devis-detail") {
      parentKey = "devis";
      parentLabel = "Devis";
    } else if (view === "facture-detail") {
      parentKey = "factures";
      parentLabel = "Factures";
    }

    if (parentKey) {
      return (
        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            onClick={() => go(parentKey!)}
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate"
          >
            {parentLabel}
          </button>
          <ChevronRight className="mx-1.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">{meta.title}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-base font-semibold leading-tight text-slate-900 dark:text-slate-100 truncate">
        {meta.title}
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">

        {/* Hamburger — mobile uniquement */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Titre de la page courante / Fil d'Ariane */}
        <div className="min-w-0 flex-1">
          {renderBreadcrumb()}
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block mt-0.5">
            {meta.sub}
          </p>
        </div>

        {/* Global search — command palette */}
        <CommandPalette />

        {/* Thème clair/sombre */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) setNotifRead(true); }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              aria-label={hasUnread ? `${alertCount} notifications non lues` : "Notifications"}
            >
              <Bell className="size-5" />
              {hasUnread && (
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
              {alertCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {alertCount} alerte{alertCount > 1 ? "s" : ""}
                </Badge>
              )}
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
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {s.quantite} {s.unite} restant{s.quantite > 1 ? "s" : ""} — {s.depositaire}
                </span>
              </DropdownMenuItem>
            ))}
            {unpaidDossiers.slice(0, 5).map((d) => (
              <DropdownMenuItem
                key={d.id}
                className="flex flex-col items-start gap-1 py-2.5"
                onClick={() => go("comptabilite")}
              >
                <span className="text-sm font-medium text-amber-600">
                  Dossier non soldé · {d.reference}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Reste : {formatFCFA(d.montantInvesti - d.montantPaye)} — {d.clientNom}
                </span>
              </DropdownMenuItem>
            ))}
            {unpaidDossiers.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-xs text-slate-500 dark:text-slate-400"
                  onClick={() => go("comptabilite")}
                >
                  Voir les {unpaidDossiers.length - 5} autres dossiers non soldés →
                </DropdownMenuItem>
              </>
            )}
            {alertCount === 0 && (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Aucune notification.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar + menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                  {shortName}
                </p>
                <p className="mt-0.5 text-[10px] leading-none text-slate-500 dark:text-slate-400">
                  {currentRole}
                </p>
              </div>
              <ChevronDown className="hidden size-3.5 text-slate-400 dark:text-slate-500 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => go("parametres")}>
              Paramètres & profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLogoutConfirm(true)}
              className="text-red-600 focus:bg-red-50 dark:bg-red-950/40 focus:text-red-700"
            >
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Dialog de confirmation déconnexion */}
      <AlertDialog open={logoutConfirm} onOpenChange={setLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre session sera fermée. Les données non enregistrées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile navigation drawer — Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="flex h-16 items-center justify-start border-b border-border px-5">
            <SheetTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              SLTT
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {visibleMobileNavItems.map((item) => {
              const active = isNavActive(view, item.key);
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>
          {/* User info en bas du drawer */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{shortName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentRole}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
