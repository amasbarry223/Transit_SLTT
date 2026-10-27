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
} from "@/shared/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatDateTime, formatFCFA } from "@/lib/format";
import { resteDuDossier } from "@/lib/domain-types";
import { dossiersNonFactures } from "@/lib/client-stats";
import { Bell, CheckCheck, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { CommandPalette } from "./command-palette";
import { NavList } from "./nav-list";
import type { NavItem } from "@/lib/nav-items";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/shared/utils/cn";
import type { ComptaTab } from "@/lib/nav-store";
import { useVisibleNavItems } from "@/shared/hooks/use-visible-nav-items";
import { ROLE_SHORTCUTS } from "@/lib/role-shortcuts";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { AnnexeSelector } from "@/components/sltt/annexe-selector";
import { GLOSSARY } from "@/lib/glossary";
import { useCurrentUser, usePermission } from "@/shared/hooks/use-permission";
import { InstallPWA } from "@/components/pwa/InstallPWA";



/** Le serveur stocke un chemin (`lien`) ; la navigation de l'app se fait par
 *  vue. Un lien inconnu marque juste la notification lue, sans naviguer. */
const NOTIFICATION_LINK_VIEWS: Array<[prefix: string, view: ViewKey]> = [
  ["/recus", "recus-paiement"],
  ["/bons", "bons"],
];

function viewForNotificationLink(lien: string): ViewKey | null {
  return NOTIFICATION_LINK_VIEWS.find(([prefix]) => lien.startsWith(prefix))?.[1] ?? null;
}

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

  // Live alerts entièrement dynamiques
  const canSeeFactures = usePermission("factures:read");
  const factures = useStore((s) => s.factures);

  const lowStock = useMemo(
    () => (canSeeStock ? stock.filter((s) => s.quantite <= s.seuil) : []),
    [canSeeStock, stock],
  );

  const nowStr = new Date().toISOString().slice(0, 10);
  const overdueDossiers = useMemo(
    () =>
      canSeeDossiers
        ? dossiers.filter(
            (d) =>
              d.dateEcheance &&
              d.dateEcheance < nowStr &&
              d.statut !== "Soldé" &&
              (d.statut as string) !== "CLOTURE" &&
              (d.statut as string) !== "Clôturé",
          )
        : [],
    [canSeeDossiers, dossiers, nowStr],
  );

  const unpaidDossiers = useMemo(
    () =>
      canSeeDossiers
        // Un dossier déjà facturé est exclu : son reste dû réel est compté
        // dans unpaidFactures ci-dessous (sa propre facture) — sans cette
        // exclusion, la même créance gonflait deux fois le badge d'alertes
        // (ici avec le reste obsolète du dossier, plus bas avec celui,
        // exact, de sa facture).
        ? dossiersNonFactures(dossiers, factures).filter(
            (d) => resteDuDossier(d) > 0 && !overdueDossiers.some((od) => od.id === d.id),
          )
        : [],
    [canSeeDossiers, dossiers, factures, overdueDossiers],
  );

  const unpaidFactures = useMemo(
    () =>
      canSeeFactures
        ? factures.filter(
            (f) => f.statut !== "Soldée" && (f.statut as string) !== "PAYEE" && f.statut !== "Annulée",
          )
        : [],
    [canSeeFactures, factures],
  );

  const alertCount =
    lowStock.length + overdueDossiers.length + unpaidDossiers.length + unpaidFactures.length;

  const alertIds = useMemo(
    () => [
      ...lowStock.map((s) => `stock-${s.id}`),
      ...overdueDossiers.map((d) => `overdue-${d.id}`),
      ...unpaidDossiers.map((d) => `unpaid-${d.id}`),
      ...unpaidFactures.map((f) => `facture-${f.id}`),
    ],
    [lowStock, overdueDossiers, unpaidDossiers, unpaidFactures],
  );

  const hasUnread = alertIds.some((id) => !seenAlertIds.has(id));

  // Notifications persistées (serveur) — distinctes des alertes ci-dessus,
  // calculées localement : elles ont un état lu/non-lu durable par utilisateur.
  const notifications = useStore((s) => s.notifications);
  const notificationsUnread = useStore((s) => s.notificationsUnread);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const badgeCount = notificationsUnread + (hasUnread ? alertCount : 0);

  function openNotification(id: string, lien?: string) {
    markNotificationRead(id).catch(() => {});
    const view = lien ? viewForNotificationLink(lien) : null;
    if (view) goToView(view);
  }

  function navigateToView(key: ViewKey, comptaTab?: ComptaTab) {
    goToView(key, comptaTab ? { comptaTab } : undefined);
    setMobileOpen(false);
  }

  function handleNav(item: NavItem) {
    navigateToView(item.key, item.comptaTab);
  }

  const visibleMobileNavItems = useVisibleNavItems();
  const roleShortcuts = currentRole ? (ROLE_SHORTCUTS[currentRole] ?? []) : [];

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

          {/* Notifications dynamiques */}
          <DropdownMenu onOpenChange={(open) => { if (open) setSeenAlertIds(new Set(alertIds)); }}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full size-9"
                aria-label={badgeCount > 0 ? `${badgeCount} notification(s) non lue(s)` : "Notifications"}
              >
                <Bell className="size-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ED1C24] text-[9px] font-bold text-white shadow-xs">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-84 max-h-[85vh] overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between py-2">
                <span className="font-semibold text-sm">Notifications & Alertes</span>
                {alertCount > 0 && (
                  <Badge className="bg-[#ED1C24] text-[10px] text-white hover:bg-red-700">
                    {alertCount} active{alertCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* 0. Notifications persistées (reçus de paiement…) */}
              {notifications.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
                      Notifications{notificationsUnread > 0 ? ` (${notificationsUnread} non lue${notificationsUnread > 1 ? "s" : ""})` : ""}
                    </span>
                    {notificationsUnread > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          // Ne pas fermer le menu : l'utilisateur voit les
                          // points non-lus disparaître sur place.
                          e.preventDefault();
                          markAllNotificationsRead().catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <CheckCheck className="size-3.5" aria-hidden />
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  {notifications.slice(0, 6).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex cursor-pointer items-start gap-2 py-2"
                      onClick={() => openNotification(n.id, n.lien)}
                    >
                      <span
                        className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.lue ? "bg-transparent" : "bg-primary")}
                        aria-label={n.lue ? undefined : "Non lue"}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className={cn("text-xs text-foreground", n.lue ? "font-medium" : "font-semibold")}>
                          {n.titre}
                        </span>
                        <span className="text-[11px] leading-snug text-muted-foreground">{n.message}</span>
                        <span className="text-[10px] text-muted-foreground/80">{formatDateTime(n.createdAt)}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 1. Stocks faibles */}
              {lowStock.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase text-red-600 dark:text-red-400">
                    Stock critique ({lowStock.length})
                  </div>
                  {lowStock.slice(0, 3).map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                      onClick={() => goToView("entreposage")}
                    >
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {s.marchandise}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Quantité restante : {s.quantite} {s.unite} (seuil : {s.seuil})
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 2. Dossiers en retard / surestaries */}
              {overdueDossiers.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                    Dossiers en retard / Surestaries ({overdueDossiers.length})
                  </div>
                  {overdueDossiers.slice(0, 3).map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                      onClick={() => goToDossier(d.id)}
                    >
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {d.reference} — {d.clientNom}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Échéance dépassée : {d.dateEcheance} ({d.statut})
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 3. Dossiers non soldés */}
              {unpaidDossiers.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                    Dossiers avec solde dû ({unpaidDossiers.length})
                  </div>
                  {unpaidDossiers.slice(0, 3).map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                      onClick={() => goToDossier(d.id)}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {d.reference} — {d.clientNom}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Reste à payer : <strong>{formatFCFA(resteDuDossier(d))}</strong>
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 4. Factures impayées */}
              {unpaidFactures.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                    Factures à régler ({unpaidFactures.length})
                  </div>
                  {unpaidFactures.slice(0, 2).map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                      onClick={() => goToView("factures")}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        Facture {f.numero}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {f.clientNom} — {formatFCFA(f.montantTTC)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {alertCount === 0 && notifications.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Aucune notification ni alerte</p>
                  <p>Tous les stocks, dossiers et paiements sont à jour.</p>
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
