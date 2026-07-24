"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
import { resteAPayer } from "@/lib/domain-types";
import { Bell, ChevronDown, CircleHelp, Menu, Moon, Sun } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "./command-palette";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { NavList } from "./nav-list";
import { getInitials } from "@/lib/utils";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
import { ROLE_SHORTCUTS } from "@/lib/role-shortcuts";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { GLOSSARY } from "@/lib/glossary";
import { usePermission } from "@/hooks/use-permission";

const viewTitles: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Tableau de bord", sub: "Dossiers, paiements et alertes du jour" },
  dossiers: { title: "Dossiers", sub: "Cycle devis → dossier → dédouanement → livraison → solde" },
  "dossier-form": { title: "Dossier de transit", sub: "Création et édition" },
  "dossier-detail": { title: "Dossier de transit", sub: "Statut, montants et documents du dossier" },
  comptabilite: { title: "Comptabilité", sub: "Écritures, paiements et créances des dossiers" },
  bilans: { title: "Bilans", sub: "Analyse financière périodique" },
  entreposage: { title: "Entreposage", sub: "Entrées, sorties et suivi du stock" },
  bons: { title: "Bons de sortie", sub: "Sorties de marchandises entreposées" },
  clients: { title: "Clients", sub: "Annuaire et fiches clients" },
  "client-fiche": { title: "Fiche client", sub: "Historique dossiers, devis et paiements" },
  devis: { title: "Devis", sub: "Estimations avant ouverture de dossier" },
  "devis-detail": { title: "Fiche devis", sub: "Détail, modification et conversion en dossier" },
  calendrier: { title: "Calendrier", sub: "Échéances et activités du mois" },
  transporteurs:    { title: "Transporteurs",   sub: "Annuaire des transporteurs et chauffeurs partenaires" },
  factures:         { title: "Factures",         sub: "Gestion et suivi de la facturation client" },
  "facture-detail": { title: "Détail facture",   sub: "Visualiser, modifier et imprimer la facture" },
  fournisseurs:     { title: "Fournisseurs",     sub: "Prestataires, sous-traitants et coûts externes" },
  contrats:         { title: "Contrats",         sub: "Contrats d'entreposage, dépenses et prestations optionnelles" },
  "contrat-detail": { title: "Détail contrat",   sub: "Infos, dépenses, prestations optionnelles et documents" },
  archives:         { title: "Archives",         sub: "Documents scannés — dossiers, factures, dépenses" },
  parametres:       { title: "Paramètres",       sub: "Utilisateurs, rôles et sécurité" },
};


export function Topbar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const logout = useNav((s) => s.logout);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const theme = useNav((s) => s.theme);
  const toggleTheme = useNav((s) => s.toggleTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [seenAlertIds, setSeenAlertIds] = useState<Set<string>>(new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const initials = getInitials(currentUserName);
  const shortName = currentUserName.split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ");

  const canSeeStock = usePermission("stock:read");
  const canSeeDossiers = usePermission("dossiers:read");
  const stock = useStore((s) => s.stock);
  const dossiers = useStore((s) => s.dossiers);
  const societes = useStore((s) => s.societes);
  const shellBrand = resolveAppShellBranding(societes);

  const meta = viewTitles[view] ?? {
    title: shellBrand.appTitle,
    sub: shellBrand.appSubtitle,
  };

  // Live alerts — chaque source reste soumise à la permission de son module
  // d'origine : la cloche ne doit pas devenir un canal de fuite de données
  // (client, montants dus) vers un rôle qui n'a pas accès au module concerné.
  const lowStock = canSeeStock ? stock.filter((s) => s.quantite < s.seuil) : [];
  const unpaidDossiers = canSeeDossiers ? dossiers.filter((d) => resteAPayer(d) > 0) : [];
  const alertCount = lowStock.length + unpaidDossiers.length;
  // Comparaison par identifiants (pas un simple booléen) : une nouvelle alerte
  // qui apparaît après une première consultation doit redéclencher le badge.
  const alertIds = useMemo(
    () => [...lowStock.map((s) => `stock-${s.id}`), ...unpaidDossiers.map((d) => `dossier-${d.id}`)],
    [lowStock, unpaidDossiers],
  );
  const hasUnread = alertIds.some((id) => !seenAlertIds.has(id));

  function handleNav(key: ViewKey) {
    go(key);
    setMobileOpen(false);
  }

  const visibleMobileNavItems = useVisibleNavItems();
  const roleShortcuts = ROLE_SHORTCUTS[currentRole] ?? [];

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

        <div className="min-w-0 flex-1">
          <BreadcrumbNav title={meta.title} subtitle={meta.sub} />
        </div>

        {/* Global search — command palette */}
        <CommandPalette />

        {/* Aide — lexique des termes métier */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          onClick={() => setHelpOpen(true)}
          aria-label="Aide"
          title="Aide et lexique"
        >
          <CircleHelp className="size-5" />
        </Button>

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
        <DropdownMenu onOpenChange={(open) => { if (open) setSeenAlertIds(new Set(alertIds)); }}>
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
                onClick={() => openDossierDetail(d.id)}
              >
                <span className="text-sm font-medium text-amber-600">
                  Dossier non soldé · {d.reference}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Reste : {formatFCFA(resteAPayer(d))} — {d.clientNom}
                </span>
              </DropdownMenuItem>
            ))}
            {unpaidDossiers.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-xs text-slate-500 dark:text-slate-400"
                  onClick={() => go("dossiers")}
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

      {/* Aide — lexique des termes métier */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lexique</DialogTitle>
            <DialogDescription>
              Les termes qui reviennent le plus souvent dans l&apos;application, expliqués simplement.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto sltt-scroll pr-1">
            {Object.values(GLOSSARY).map((entry) => (
              <div key={entry.label} className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.definition}</p>
              </div>
            ))}
          </div>
          <p className="border-t border-border pt-3 text-xs text-slate-400 dark:text-slate-500">
            Une question qui n&apos;est pas ici ? Contactez votre administrateur.
          </p>
        </DialogContent>
      </Dialog>

      {/* Mobile navigation drawer — Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="flex h-16 flex-row items-center justify-start gap-3 border-b border-border px-5">
            <Image
              src={shellBrand.logoUrl ?? "/logoV.png"}
              alt={shellBrand.appTitle}
              width={48}
              height={48}
              className="size-11 object-contain"
              unoptimized
            />
            <SheetTitle className="sr-only">{shellBrand.appTitle}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 overflow-y-auto sltt-scroll px-3 py-4 pb-24">
            {roleShortcuts.length > 0 && (
              <div>
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Raccourcis {currentRole}
                </p>
                <div className="flex flex-wrap gap-2 px-1">
                  {roleShortcuts.map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={sc.key}
                        type="button"
                        onClick={() => handleNav(sc.key)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-muted dark:text-slate-200"
                      >
                        <Icon className="size-3.5" />
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <NavList
              items={visibleMobileNavItems}
              currentView={view}
              onNavigate={handleNav}
            />
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
