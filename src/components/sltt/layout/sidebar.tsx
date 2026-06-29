"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useNav, type ViewKey } from "@/lib/nav-store";
import type { UserRole } from "@/lib/mock-data";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Warehouse,
  FileOutput,
  Users,
  BarChart3,
  Settings,
  ClipboardList,
  CalendarDays,
  Truck,
} from "lucide-react";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "dossiers", label: "Dossiers de transit", icon: FolderKanban, roles: ["Administrateur", "Agent de transit", "Comptable"] },
  { key: "devis", label: "Devis", icon: ClipboardList, roles: ["Administrateur", "Agent de transit", "Commercial"] },
  { key: "calendrier", label: "Calendrier", icon: CalendarDays },
  { key: "comptabilite", label: "Comptabilité", icon: Wallet, roles: ["Administrateur", "Comptable"] },
  { key: "entreposage", label: "Entreposage", icon: Warehouse, roles: ["Administrateur", "Magasinier"] },
  { key: "bons", label: "Bons de sortie", icon: FileOutput, roles: ["Administrateur", "Magasinier", "Commercial"] },
  { key: "clients", label: "Clients", icon: Users, roles: ["Administrateur", "Agent de transit", "Commercial"] },
  { key: "transporteurs", label: "Transporteurs", icon: Truck, roles: ["Administrateur", "Agent de transit"] },
  { key: "bilans", label: "Bilans & rapports", icon: BarChart3, roles: ["Administrateur", "Comptable"] },
  { key: "parametres", label: "Paramètres", icon: Settings, roles: ["Administrateur"] },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);

  const isActive = (key: ViewKey) => {
    if (
      key === "dossiers" &&
      (view === "dossier-form" || view === "dossier-detail")
    ) {
      return true;
    }
    if (key === "clients" && view === "client-fiche") return true;
    return view === key;
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Logo — centré, h-16 aligné avec la Topbar */}
      <div className="flex h-16 w-full border-b border-border">
        <Image
          src="/logo.png"
          alt="SLTT"
          width={72}
          height={72}
          className="m-auto size-[52px] object-contain drop-shadow"
          unoptimized
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sltt-scroll px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActive(item.key);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => go(item.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-sm font-semibold shrink-0">
            {getInitials(currentUserName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {currentUserName.split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ")}
            </p>
            <p className="text-xs text-slate-500 truncate">{currentRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Compact top navigation for mobile (below lg breakpoint) */
export function MobileNav() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const currentRole = useNav((s) => s.currentRole);

  const isActive = (key: ViewKey) => {
    if (
      key === "dossiers" &&
      (view === "dossier-form" || view === "dossier-detail")
    ) {
      return true;
    }
    if (key === "clients" && view === "client-fiche") return true;
    return view === key;
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  return (
    <div className="lg:hidden border-b border-border bg-sidebar overflow-x-auto sltt-scroll">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
        <div className="flex items-center pr-3 mr-1 border-r border-border">
          <div className="flex items-center justify-center size-9 rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-blue-100/60">
            <Image
              src="/logo.png"
              alt="SLTT"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        </div>
        {visibleItems.map((item) => {
          const active = isActive(item.key);
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
