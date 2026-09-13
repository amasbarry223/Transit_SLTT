"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  Users,
  User,
  Building2,
  ScrollText,
  Globe,
  DatabaseBackup,
  Anchor,
  Sliders,
  Search,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session/session-store";
import { useCanManageUsers, usePermission, useCurrentUser } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { PageHeader } from "@/components/sltt/page-header";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/shared/utils/cn";

// Onglets existants (préservation intégrale de la logique métier)
import { UsersTab } from "@/components/sltt/parametres/users-tab";
import { ProfileTab } from "@/components/sltt/parametres/profile-tab";
import { SocietesTab } from "@/components/sltt/parametres/societe-tab";
import { SecurityTab } from "@/components/sltt/parametres/security-tab";
import { AuditTab } from "@/components/sltt/parametres/audit-tab";
import { PreferencesTab } from "@/features/parametres/components/parametres/preferences-tab";
import { ConfigurationTab } from "@/features/parametres/components/parametres/configuration-tab";
import { BackupTab } from "@/components/sltt/parametres/backup-tab";
import { PortsTab } from "@/components/sltt/parametres/ports-tab";
import { SettingsNavItem } from "./parametres/settings-nav-item";

export type ParamTab =
  | "profile"
  | "security"
  | "preferences"
  | "users"
  | "societes"
  | "ports"
  | "configuration"
  | "audit"
  | "backup";

interface SettingItem {
  key: ParamTab;
  label: string;
  shortLabel: string;
  description: string;
  category: "compte" | "organisation" | "systeme";
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  permissionRequired?: string;
  isPermitted: boolean;
}

export function ParametresScreen() {
  const canManageUsers = useCanManageUsers();
  const canViewAudit = usePermission("audit:read");
  const canManageSocietes = usePermission("parametres:write");
  const canBackup = usePermission("systeme:backup");

  const usersCount = useStore((s) => s.users.length);
  const currentUserName = useSession((s) => s.currentUserName);
  const currentRole = useSession((s) => s.currentRole);
  const { annexes, selectedAnnexeId } = useActiveAnnexe();

  const [activeTab, setActiveTab] = useState<ParamTab>("profile");
  const [searchQuery, setSearchQuery] = useState("");

  // Définition structurée et catégorisée des paramètres
  const settingsItems: SettingItem[] = useMemo(
    () => [
      // 1. Compte & Personnel
      {
        key: "profile",
        label: "Mon profil",
        shortLabel: "Profil",
        description: "Coordonnées, nom, email et identité",
        category: "compte",
        icon: User,
        keywords: "profil nom prenom email telephone contact photo signature",
        isPermitted: true,
      },
      {
        key: "security",
        label: "Sécurité du compte",
        shortLabel: "Sécurité",
        description: "Mot de passe, sessions et authentification",
        category: "compte",
        icon: Shield,
        keywords: "securite mot de passe password mdp session authentification 2fa",
        isPermitted: true,
      },
      {
        key: "preferences",
        label: "Préférences d'affichage",
        shortLabel: "Préférences",
        description: "Thème sombre/clair, format de date et cache",
        category: "compte",
        icon: Globe,
        keywords: "preferences theme mode sombre date format cache reload affichage",
        isPermitted: true,
      },

      // 2. Organisation & Métier SLTT
      {
        key: "users",
        label: "Utilisateurs & Rôles",
        shortLabel: "Utilisateurs",
        description: "Gestion des collaborateurs, accès et permissions",
        category: "organisation",
        icon: Users,
        keywords: "utilisateurs roles equipe membres permissions droits acces admin",
        permissionRequired: "Gestion des utilisateurs",
        isPermitted: canManageUsers,
      },
      {
        key: "societes",
        label: "Entreprise & Agences",
        shortLabel: "Entreprise",
        description: "Raison sociale, NIF, RCCM, Bamako & Abidjan",
        category: "organisation",
        icon: Building2,
        keywords: "entreprise societe agences siege bamako abidjan nif rccm rib adresse fiscal",
        permissionRequired: "Configuration générale",
        isPermitted: canManageSocietes,
      },
      {
        key: "ports",
        label: "Ports & Terminaux",
        shortLabel: "Ports",
        description: "Ports maritimes de transit (Abidjan, Dakar, etc.)",
        category: "organisation",
        icon: Anchor,
        keywords: "ports corridors terminaux maritime abidjan dakar lome transit",
        permissionRequired: "Configuration générale",
        isPermitted: canManageSocietes,
      },
      {
        key: "configuration",
        label: "Configuration & Statuts",
        shortLabel: "Config",
        description: "TVA UEMOA, seuils débours, workflow douanier",
        category: "organisation",
        icon: Sliders,
        keywords: "configuration tva uemoa 18 debours seuils statuts douane sydonia asycuda",
        permissionRequired: "Configuration générale",
        isPermitted: canManageSocietes,
      },

      // 3. Gouvernance & Système
      {
        key: "audit",
        label: "Audit & Traçabilité",
        shortLabel: "Audit",
        description: "Journal des modifications conforme SYSCOHADA",
        category: "systeme",
        icon: ScrollText,
        keywords: "audit journal tracabilite logs historique modifications syscohada",
        permissionRequired: "Consultation audit",
        isPermitted: canViewAudit,
      },
      {
        key: "backup",
        label: "Sauvegarde & Données",
        shortLabel: "Sauvegarde",
        description: "Sauvegarde de la base de données et restauration",
        category: "systeme",
        icon: DatabaseBackup,
        keywords: "sauvegarde backup export base donnees restauration securite json sql",
        permissionRequired: "Sauvegarde système",
        isPermitted: canBackup,
      },
    ],
    [canManageUsers, canManageSocietes, canViewAudit, canBackup]
  );

  // Filtrage selon les droits et la recherche
  const permittedItems = useMemo(
    () => settingsItems.filter((item) => item.isPermitted),
    [settingsItems]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return permittedItems;
    const q = searchQuery.toLowerCase().trim();
    return permittedItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [permittedItems, searchQuery]);

  // Groupement par catégorie
  const categories = useMemo(
    () => [
      {
        key: "compte" as const,
        label: "Compte & Personnel",
        items: filteredItems.filter((i) => i.category === "compte"),
      },
      {
        key: "organisation" as const,
        label: "Organisation & Métier SLTT",
        items: filteredItems.filter((i) => i.category === "organisation"),
      },
      {
        key: "systeme" as const,
        label: "Gouvernance & Système",
        items: filteredItems.filter((i) => i.category === "systeme"),
      },
    ],
    [filteredItems]
  );

  // Éléments actifs
  const activeItem = useMemo(
    () => permittedItems.find((i) => i.key === activeTab) || permittedItems[0],
    [permittedItems, activeTab]
  );

  // Annexe active textuelle
  const activeAnnexeLabel = useMemo(() => {
    if (!selectedAnnexeId || selectedAnnexeId === "all") return "Siège Bamako & Agence Abidjan";
    const a = annexes.find((item) => item.id === selectedAnnexeId);
    return a ? `${a.nom} (${a.villeSiege})` : "Toutes les annexes";
  }, [annexes, selectedAnnexeId]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HERO HEADER DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs dark:bg-blue-500">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Paramètres
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Gérez votre compte, les utilisateurs et les préférences de l&apos;application.
              </p>
            </div>
          </div>
        </div>

        {/* Badge d'accès et d'environnement */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SLTT Cloud</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">{currentRole}</span>
          </div>
        </div>
      </div>

      {/* 2. SÉLECTEUR MOBILE RESPONSIVE (écrans < lg) */}
      <div className="block lg:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {permittedItems.map((item) => {
            const Icon = item.icon;
            const isSel = item.key === activeItem.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                  isSel
                    ? "bg-blue-600 text-white shadow-xs dark:bg-blue-500"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-card dark:text-slate-300 dark:border-border"
                )}
              >
                <Icon className="size-3.5" />
                <span>{item.shortLabel}</span>
                {item.key === "users" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-black",
                      isSel
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {usersCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DISPOSITION SPLIT-VIEW (12 COLONNES SUR DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR DE NAVIGATION INTERNE (4 colonnes lg / 3 colonnes xl) */}
        <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-4 sticky top-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-card dark:border-border/70 p-4 shadow-xs">
            {/* Barre de recherche dans les paramètres */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un réglage..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-border dark:bg-slate-900/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Catégories de navigation */}
            <div className="space-y-5">
              {categories.map((cat) => {
                if (cat.items.length === 0) return null;
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <span className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      {cat.label}
                    </span>
                    <div className="space-y-1">
                      {cat.items.map((item) => (
                        <SettingsNavItem
                          key={item.key}
                          id={item.key}
                          label={item.label}
                          description={item.description}
                          icon={item.icon}
                          isActive={activeItem.key === item.key}
                          badge={
                            item.key === "users" ? (
                              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {usersCount}
                              </span>
                            ) : undefined
                          }
                          onClick={() => setActiveTab(item.key)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>Aucun réglage ne correspond à « {searchQuery} »</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-blue-600 hover:underline font-semibold"
                  >
                    Effacer la recherche
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mini carte d'identité utilisateur en bas de sidebar */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/40 dark:border-border/60 p-3.5 flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl text-white font-bold text-xs shadow-2xs",
                USER_AVATAR_GRADIENT
              )}
            >
              {getInitials(currentUserName || "Admin")}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                {currentUserName || "Administrateur"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {activeAnnexeLabel}
              </span>
            </div>
          </div>
        </aside>

        {/* CONTENU DU PANNEAU DE CONFIGURATION (8 colonnes lg / 9 colonnes xl) */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* En-tête contextuel riche de l'onglet actif */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-card dark:border-border/70 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  {React.createElement(activeItem.icon, { className: "size-5" })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {activeItem.category === "compte"
                        ? "Compte & Personnel"
                        : activeItem.category === "organisation"
                        ? "Organisation & Métier SLTT"
                        : "Gouvernance & Système"}
                    </span>
                    <span>·</span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {activeItem.label}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              {/* Badge d'accès ou statut */}
              <div className="self-start sm:self-auto shrink-0">
                {activeItem.permissionRequired ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                    <Shield className="size-3" />
                    <span>{activeItem.permissionRequired}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                    <CheckCircle2 className="size-3" />
                    <span>Accès actif</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rendu dynamique du composant d'onglet sélectionné */}
          <div className="transition-opacity duration-200">
            {activeItem.key === "profile" && <ProfileTab />}
            {activeItem.key === "security" && <SecurityTab />}
            {activeItem.key === "preferences" && <PreferencesTab />}
            {activeItem.key === "users" && canManageUsers && <UsersTab />}
            {activeItem.key === "societes" && canManageSocietes && <SocietesTab />}
            {activeItem.key === "ports" && canManageSocietes && <PortsTab />}
            {activeItem.key === "configuration" && canManageSocietes && <ConfigurationTab />}
            {activeItem.key === "audit" && canViewAudit && <AuditTab />}
            {activeItem.key === "backup" && canBackup && <BackupTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
