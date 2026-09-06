"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useSession } from "@/lib/session/session-store";

import { useMemo, useState } from "react";
import { SidebarBrand } from "./sidebar";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
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
import { Bell, Calendar, ChevronDown, CircleHelp, Menu, Moon, Sun } from "lucide-react";
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
import type { NavItem } from "@/lib/nav-items";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/lib/utils";
import type { ComptaTab } from "@/lib/nav-store";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
import { ROLE_SHORTCUTS } from "@/lib/role-shortcuts";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { AnnexeSelector } from "@/components/sltt/annexe-selector";
import { GLOSSARY } from "@/lib/glossary";
import { useCurrentUser, usePermission } from "@/hooks/use-permission";
import { InstallPWA } from "@/components/pwa/InstallPWA";

const viewTitles: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Tableau de bord", sub: "Dossiers, paiements et alertes du jour" },
  dossiers: { title: "Dossiers", sub: "Cycle devis → dossier → dédouanement → livraison → solde" },
  "dossier-form": { title: "Dossier de transit", sub: "Création et édition" },
  "dossier-detail": { title: "Dossier de transit", sub: "Statut, montants et documents du dossier" },
  "dossier-ocr-review": { title: "Validation OCR", sub: "Vérifiez les champs extraits avant de créer le dossier" },
  comptabilite: { title: "Comptabilité", sub: "Écritures dossiers et journal de caisse par entité" },
  "recus-paiement": { title: "Nouveau reçu", sub: "Créer un reçu de paiement — format 19,5 × 8,2 cm paysage" },
  bilans: { title: "Bilans", sub: "Analyse financière périodique" },
  entreposage: { title: "Entreposage", sub: "Entrées, sorties et suivi du stock" },
  bons: { title: "Bons de sortie", sub: "Sorties de marchandises entreposées" },
  clients: { title: "Clients", sub: "Annuaire et fiches clients" },
  "client-fiche": { title: "Fiche client", sub: "Historique dossiers, devis et paiements" },
  devis: { title: "Devis", sub: "Estimations avant ouverture de dossier" },
  "devis-detail": { title: "Fiche devis", sub: "Détail, modification et conversion en dossier" },
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
  const comptaTab = useNav((s) => s.comptaTab);
  const { goToView, goToDossier } = useAppNavigation();
  const logout = useSession((s) => s.logout);
  const currentUserName = useSession((s) => s.currentUserName);
  const currentUser = useCurrentUser();
  const currentRole = currentUser?.role;
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const mobileOpen = useNav((s) => s.mobileMenuOpen);
  const setMobileOpen = useNav((s) => s.setMobileMenuOpen);
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

  const meta =
    view === "comptabilite"
      ? comptaTab === "journal"
        ? {
            title: "Journal de caisse",
            sub: "Opérations, clôtures et import — par entité comptable",
          }
        : {
            title: "Paiements dossiers",
            sub: "Suivi des paiements liés aux dossiers de transit et entreposage",
          }
      : (viewTitles[view] ?? {
          title: shellBrand.appTitle,
          sub: shellBrand.appSubtitle,
        });

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

  function navigateToView(key: ViewKey, comptaTab?: ComptaTab) {
    goToView(key, comptaTab ? { comptaTab } : undefined);
    setMobileOpen(false);
  }

  function handleNav(item: NavItem) {
    navigateToView(item.key, item.comptaTab);
  }

  const visibleMobileNavItems = useVisibleNavItems();
  const roleShortcuts = currentRole ? (ROLE_SHORTCUTS[currentRole] ?? []) : [];

  const currentPeriodLabel = new Date()
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-border/70 bg-white/95 dark:bg-card/95 px-4 sm:px-8 backdrop-blur">
        {/* Left side: Hamburger (mobile) + Global Search Input */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 lg:hidden rounded-xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </Button>

          <CommandPalette />
        </div>

        {/* Right side: Actions, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <InstallPWA />

          {/* Annexe active — si multi-annexes */}
          <AnnexeSelector className="hidden shrink-0 xl:flex xl:w-36" />

          {/* Notifications avec badge rouge compact "3" */}
          <DropdownMenu onOpenChange={(open) => { if (open) setSeenAlertIds(new Set(alertIds)); }}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full size-9"
                aria-label={hasUnread ? `${alertCount} notifications non lues` : "Notifications"}
              >
                <Bell className="size-5" />
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ED1C24] text-[9px] font-bold text-white shadow-xs">
                  {alertCount > 0 ? (alertCount > 9 ? "9+" : alertCount) : "3"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {alertCount > 0 && (
                  <Badge className="bg-[var(--brand-secondary)] text-[10px] text-white hover:bg-[var(--brand-secondary-hover)]">
                    {alertCount} alerte{alertCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {lowStock.slice(0, 3).map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  className="flex flex-col items-start gap-1 py-2.5"
                  onClick={() => goToView("entreposage")}
                >
                  <span className="text-sm font-medium text-red-600">
                    Stock faible · {s.marchandise}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.quantite} {s.unite} restant{s.quantite > 1 ? "s" : ""} — {s.depositaire}
                  </span>
                </DropdownMenuItem>
              ))}
              {unpaidDossiers.slice(0, 5).map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  className="flex flex-col items-start gap-1 py-2.5"
                  onClick={() => goToDossier(d.id)}
                >
                  <span className="text-sm font-medium text-amber-600">
                    Dossier non soldé · {d.reference}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Reste : {formatFCFA(resteAPayer(d))} — {d.clientNom}
                  </span>
                </DropdownMenuItem>
              ))}
              {unpaidDossiers.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-muted-foreground"
                    onClick={() => goToView("dossiers")}
                  >
                    Voir les {unpaidDossiers.length - 5} autres dossiers non soldés →
                  </DropdownMenuItem>
                </>
              )}
              {alertCount === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Aucune notification.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Thème clair/sombre */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full size-9"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          {/* Avatar + profil utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-muted focus-visible:outline-none">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#0B2A78] text-white text-xs font-bold shadow-xs">
                  {initials || "AT"}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold leading-tight text-foreground">
                    {shortName || "Amadou Traoré"}
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-muted-foreground">
                    {currentRole ?? "Administrateur"}
                  </p>
                </div>
                <ChevronDown className="hidden size-3 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => goToView("parametres")}>
                Paramètres & profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLogoutConfirm(true)}
                className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700"
              >
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                <p className="text-sm text-muted-foreground">{entry.definition}</p>
              </div>
            ))}
          </div>
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Une question qui n&apos;est pas ici ? Contactez votre administrateur.
          </p>
        </DialogContent>
      </Dialog>

      {/* Mobile navigation drawer — Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[264px] p-0 bg-[#0B2A78] text-white border-r-0">
          <SheetHeader className="relative flex h-[4.75rem] flex-row items-center justify-start border-b border-white/10 px-4">
            <SidebarBrand
              logoUrl={shellBrand.logoUrl}
              alt={shellBrand.appTitle}
              size="sm"
              onClick={() => navigateToView("dashboard")}
            />
            <SheetTitle className="sr-only">{shellBrand.appTitle}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 overflow-y-auto sltt-scroll px-2 py-4 pb-24">
            {roleShortcuts.length > 0 && (
              <div className="px-1">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-blue-200/60">
                  Raccourcis {currentRole}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {roleShortcuts.map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={sc.key}
                        type="button"
                        onClick={() => navigateToView(sc.key, sc.comptaTab)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-blue-100 hover:bg-white/20 hover:text-white"
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
              currentComptaTab={comptaTab}
              onNavigate={handleNav}
            />
          </nav>
          {/* User info en bas du drawer */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#071B50] p-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", USER_AVATAR_GRADIENT)}>
                {initials || "AT"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{shortName || "Amadou Traoré"}</p>
                <p className="text-xs text-blue-200/70">{currentRole ?? "Administrateur"}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
