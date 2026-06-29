"use client";

import { useState } from "react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Warehouse,
  FileOutput,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/mock-data";

type NavRoleAccess = { roles?: UserRole[] };

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
  parametres: { title: "Paramètres", sub: "Utilisateurs, rôles et sécurité" },
};

const mobileNavItems: ({ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> } & NavRoleAccess)[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "dossiers", label: "Dossiers de transit", icon: FolderKanban, roles: ["Administrateur", "Agent de transit", "Comptable"] },
  { key: "comptabilite", label: "Comptabilité", icon: Wallet, roles: ["Administrateur", "Comptable"] },
  { key: "entreposage", label: "Entreposage", icon: Warehouse, roles: ["Administrateur", "Magasinier"] },
  { key: "bons", label: "Bons de sortie", icon: FileOutput, roles: ["Administrateur", "Magasinier", "Commercial"] },
  { key: "clients", label: "Clients", icon: Users, roles: ["Administrateur", "Agent de transit", "Commercial"] },
  { key: "bilans", label: "Bilans & rapports", icon: BarChart3, roles: ["Administrateur", "Comptable"] },
  { key: "parametres", label: "Paramètres", icon: Settings, roles: ["Administrateur"] },
];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Topbar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const logout = useNav((s) => s.logout);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const alertCount = lowStock.length + Math.min(unpaidDossiers.length, 3);
  const hasAlerts = alertCount > 0;

  function handleNav(key: ViewKey) {
    go(key);
    setMobileOpen(false);
  }

  const visibleMobileNavItems = mobileNavItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  const isActive = (key: ViewKey) => {
    if (key === "dossiers" && (view === "dossier-form" || view === "dossier-detail")) return true;
    if (key === "clients" && view === "client-fiche") return true;
    return view === key;
  };

  const renderBreadcrumb = () => {
    let parentKey: ViewKey | null = null;
    let parentLabel = "";

    if (view === "dossier-detail" || view === "dossier-form") {
      parentKey = "dossiers";
      parentLabel = "Dossiers de transit";
    } else if (view === "client-fiche") {
      parentKey = "clients";
      parentLabel = "Clients";
    }

    if (parentKey) {
      return (
        <div className="flex items-center text-sm font-medium text-slate-500">
          <button
            onClick={() => go(parentKey!)}
            className="hover:text-slate-900 transition-colors truncate"
          >
            {parentLabel}
          </button>
          <ChevronRight className="mx-1.5 size-4 shrink-0 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">{meta.title}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-base font-semibold leading-tight text-slate-900 truncate">
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
          className="shrink-0 text-slate-500 hover:text-slate-900 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Titre de la page courante / Fil d'Ariane */}
        <div className="min-w-0 flex-1">
          {renderBreadcrumb()}
          <p className="hidden truncate text-xs text-slate-500 sm:block mt-0.5">
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
              className="relative text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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

        {/* Avatar + menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-slate-100">
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none text-slate-900">
                  {shortName}
                </p>
                <p className="mt-0.5 text-[10px] leading-none text-slate-500">
                  {currentRole}
                </p>
              </div>
              <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
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
              onClick={logout}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile navigation drawer — Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="flex h-16 items-center justify-start border-b border-border px-5">
            <SheetTitle className="text-base font-bold text-slate-900">
              SLTT
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {visibleMobileNavItems.map((item) => {
              const active = isActive(item.key);
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-blue-600" />
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
                <p className="text-sm font-semibold text-slate-900 truncate">{shortName}</p>
                <p className="text-xs text-slate-500">{currentRole}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
