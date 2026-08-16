"use client";

import { useState } from "react";
import {
  Shield,
  Users,
  User,
  Building2,
  ScrollText,
  Globe,
  DatabaseBackup,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useCanManageUsers, usePermission } from "@/hooks/use-permission";
import { UsersTab } from "@/components/sltt/parametres/users-tab";
import { PageHeader } from "@/components/sltt/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProfileTab } from "@/components/sltt/parametres/profile-tab";
import { SocietesTab } from "@/components/sltt/parametres/societe-tab";
import { SecurityTab } from "@/components/sltt/parametres/security-tab";
import { AuditTab } from "@/components/sltt/parametres/audit-tab";
import { PreferencesTab } from "@/components/sltt/parametres/preferences-tab";
import { BackupTab } from "@/components/sltt/parametres/backup-tab";

type ParamTab = "users" | "societes" | "profile" | "security" | "audit" | "preferences" | "backup";

const tabs: {
  key: ParamTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "users", label: "Utilisateurs & rôles", shortLabel: "Utilisateurs", icon: Users },
  { key: "societes", label: "Sociétés", shortLabel: "Sociétés", icon: Building2 },
  { key: "profile", label: "Mon profil", shortLabel: "Profil", icon: User },
  { key: "security", label: "Sécurité", shortLabel: "Sécurité", icon: Shield },
  { key: "audit", label: "Audit & traçabilité", shortLabel: "Audit", icon: ScrollText },
  { key: "preferences", label: "Préférences", shortLabel: "Préférences", icon: Globe },
  { key: "backup", label: "Sauvegarde", shortLabel: "Sauvegarde", icon: DatabaseBackup },
];

function UsersTabBadge() {
  const count = useStore((s) => s.users.length);
  return (
    <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

export function ParametresScreen() {
  const canManageUsers = useCanManageUsers();
  const canViewAudit = usePermission("audit:read");
  const canManageSocietes = usePermission("parametres:write");
  // Non répertorié dans PERMISSION_MODULES : has_permission() ne le satisfait
  // que pour role === "Administrateur", jamais délégable via l'éditeur de
  // permissions (cf. migration 20260821_admin_backup_restore.sql).
  const canBackup = usePermission("systeme:backup");
  const [active, setActive] = useState<ParamTab>("profile");

  const [prevPerms, setPrevPerms] = useState({ canManageUsers, canViewAudit, canManageSocietes, canBackup });
  if (
    prevPerms.canManageUsers !== canManageUsers ||
    prevPerms.canViewAudit !== canViewAudit ||
    prevPerms.canManageSocietes !== canManageSocietes ||
    prevPerms.canBackup !== canBackup
  ) {
    setPrevPerms({ canManageUsers, canViewAudit, canManageSocietes, canBackup });
    setActive((prev) => {
      if (prev === "users" && !canManageUsers) return "profile";
      if (prev === "audit" && !canViewAudit) return "profile";
      if (prev === "societes" && !canManageSocietes) return "profile";
      if (prev === "backup" && !canBackup) return "profile";
      return prev;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, les utilisateurs et les préférences de l'application."
      />

      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as ParamTab)}
        className="gap-0"
      >
        {/* Barre d'onglets pleine largeur (alignée sur les bords du layout) */}
        <div
          className={cn(
            "sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8",
            "supports-[backdrop-filter]:bg-background/80",
          )}
        >
          <TabsList
            className={cn(
              "flex h-12 w-full items-stretch rounded-none bg-muted/80 p-0",
              "dark:bg-muted/30",
            )}
          >
            {tabs.filter((t) => {
              if (t.key === "users") return canManageUsers;
              if (t.key === "audit") return canViewAudit;
              if (t.key === "societes") return canManageSocietes;
              if (t.key === "backup") return canBackup;
              return true;
            }).map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 rounded-none",
                    "border-0 border-b-2 border-transparent bg-transparent px-2 py-0",
                    "text-sm font-medium text-muted-foreground shadow-none transition-colors",
                    "hover:bg-white/60 hover:text-slate-900 dark:hover:text-slate-100",
                    "data-[state=active]:border-primary data-[state=active]:bg-white bg-muted/40",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                    "min-w-0",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="hidden truncate sm:inline">{t.label}</span>
                  <span className="truncate sm:hidden">{t.shortLabel}</span>
                  {t.key === "users" && <UsersTabBadge />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {canManageUsers && (
          <TabsContent value="users" className="mt-6 focus-visible:outline-none">
            <UsersTab />
          </TabsContent>
        )}
        {canManageSocietes && (
          <TabsContent value="societes" className="mt-6 focus-visible:outline-none">
            <SocietesTab />
          </TabsContent>
        )}
        <TabsContent value="profile" className="mt-6 focus-visible:outline-none">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6 focus-visible:outline-none">
          <SecurityTab />
        </TabsContent>
        {canViewAudit && (
          <TabsContent value="audit" className="mt-6 focus-visible:outline-none">
            <AuditTab />
          </TabsContent>
        )}
        <TabsContent value="preferences" className="mt-6 focus-visible:outline-none">
          <PreferencesTab />
        </TabsContent>
        {canBackup && (
          <TabsContent value="backup" className="mt-6 focus-visible:outline-none">
            <BackupTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
