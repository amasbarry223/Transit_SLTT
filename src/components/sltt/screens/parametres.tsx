"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Bell,
  Globe,
  Calendar,
  Coins,
  Users,
  User,
  RotateCcw,
  AlertTriangle,
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { useCurrentUser, useCanManageUsers, usePermission } from "@/hooks/use-permission";
import { hashPassword } from "@/lib/crypto";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { UsersTab } from "@/components/sltt/screens/users-tab";
import type { UserRole, AuditAction, AuditModule, AuditEntry } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";
import { GUIDE_DISMISS_KEY, emitGuideReset } from "@/lib/guide-progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PageHeader } from "@/components/sltt/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

type ParamTab = "users" | "profile" | "security" | "audit" | "preferences";

const AUDIT_PAGE_SIZE = 8;

const actionTone: Record<
  AuditAction,
  "blue" | "emerald" | "amber" | "indigo" | "slate" | "red"
> = {
  Connexion: "slate",
  Création: "blue",
  Modification: "indigo",
  Validation: "emerald",
  Paiement: "emerald",
  Export: "amber",
  Suppression: "red",
};

const tabs: {
  key: ParamTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "users", label: "Utilisateurs & rôles", shortLabel: "Utilisateurs", icon: Users },
  { key: "profile", label: "Mon profil", shortLabel: "Profil", icon: User },
  { key: "security", label: "Sécurité", shortLabel: "Sécurité", icon: Shield },
  { key: "audit", label: "Audit & traçabilité", shortLabel: "Audit", icon: ScrollText },
  { key: "preferences", label: "Préférences", shortLabel: "Préférences", icon: Globe },
];

function ProfileTab() {
  const { toast } = useToast();
  const users = useStore((s) => s.users);
  const updateOwnProfile = useStore((s) => s.updateOwnProfile);
  const currentUserId = useNav((s) => s.currentUserId);
  const currentUserName = useNav((s) => s.currentUserName);
  const currentRole = useNav((s) => s.currentRole);

  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <ProfileTabForm
      key={currentUserId ?? "anonymous"}
      currentUser={currentUser}
      currentUserName={currentUserName}
      currentRole={currentRole}
      currentUserId={currentUserId}
      updateOwnProfile={updateOwnProfile}
      toast={toast}
    />
  );
}

function ProfileTabForm({
  currentUser,
  currentUserName,
  currentRole,
  currentUserId,
  updateOwnProfile,
  toast,
}: {
  currentUser: ReturnType<typeof useStore.getState>["users"][number] | undefined;
  currentUserName: string;
  currentRole: string;
  currentUserId: string | null;
  updateOwnProfile: ReturnType<typeof useStore.getState>["updateOwnProfile"];
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [pNom, setPNom] = useState(currentUser?.nom ?? currentUserName);
  const [pEmail, setPEmail] = useState(currentUser?.email ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      toast({ title: "Utilisateur introuvable", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile(currentUserId, { nom: pNom, email: pEmail });
      toast({ title: "Profil mis à jour avec succès" });
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Vos informations personnelles et professionnelles.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xl font-bold">
              {getInitials(pNom || currentUserName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{pNom || currentUserName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser?.role || currentRole}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-nom" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom complet
              </Label>
              <Input
                id="p-nom"
                value={pNom}
                onChange={(e) => setPNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                E-mail
              </Label>
              <Input
                id="p-email"
                type="email"
                value={pEmail}
                onChange={(e) => setPEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-poste" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Poste
              </Label>
              <Input
                id="p-poste"
                value={currentUser?.role || currentRole}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-400">Le poste est géré par un administrateur.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const updateUser = useStore((s) => s.updateUser);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!curPwd) {
      toast({ title: "Mot de passe actuel requis", variant: "destructive" });
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      toast({ title: "Le nouveau mot de passe doit contenir au moins 8 caractères", variant: "destructive" });
      return;
    }
    if (newPwd !== confPwd) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Utilisateur introuvable", variant: "destructive" });
      return;
    }
    setSavingPwd(true);
    try {
      if (isSupabaseConfigured) {
        const res = await fetchWithAuth("/api/auth/password", {
          method: "PATCH",
          body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de changer le mot de passe.");
      } else {
        const hashed = await hashPassword(newPwd);
        await updateUser(currentUser.id, {
          nom: currentUser.nom,
          email: currentUser.email,
          role: currentUser.role,
          permissions: currentUser.permissions,
          motDePasse: hashed,
        });
      }
      toast({ title: "Mot de passe mis à jour" });
      setCurPwd("");
      setNewPwd("");
      setConfPwd("");
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Changement impossible.",
        variant: "destructive",
      });
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Mot de passe, authentification et options de sécurité du compte.
      </p>

      {/* Mot de passe */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mot de passe</h3>
        </div>
        <form
          onSubmit={handlePasswordSubmit}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor="cur-pwd" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mot de passe actuel
            </Label>
            <Input
              id="cur-pwd"
              type="password"
              placeholder="••••••••"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pwd" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-pwd"
              type="password"
              placeholder="••••••••"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf-pwd" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmer
            </Label>
            <Input
              id="conf-pwd"
              type="password"
              placeholder="••••••••"
              value={confPwd}
              onChange={(e) => setConfPwd(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" disabled={savingPwd}>
              {savingPwd ? "Enregistrement…" : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Options avancées — bientôt disponibles */}
      <Card className="p-6 shadow-sm border-border/80 border-dashed">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Options avancées
          </h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            Bientôt
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          La déconnexion automatique personnalisée et l&apos;authentification à deux facteurs seront disponibles dans une prochaine version.
          La session actuelle utilise déjà un délai de sécurité à la connexion (8 h ou 7 jours avec « Rester connecté »).
        </p>
      </Card>
    </div>
  );
}

function AuditTab() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const modules = useMemo(
    () => [...new Set(auditLogs.map((e) => e.module))].sort(),
    [auditLogs],
  );
  const actions = useMemo(
    () => [...new Set(auditLogs.map((e) => e.action))].sort(),
    [auditLogs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLogs.filter((e) => {
      if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (q) {
        const haystack = `${e.user} ${e.module} ${e.action} ${e.detail} ${e.ip}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, query, moduleFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE,
  );
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * AUDIT_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * AUDIT_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" || moduleFilter !== "all" || actionFilter !== "all";

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Journal des actions utilisateurs — connexions, modifications et opérations
        sensibles.
      </p>

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher utilisateur, action…"
              className="h-10 pl-9"
              aria-label="Rechercher dans le journal d'audit"
            />
          </div>

          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrer par module">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 dark:text-slate-400"
              onClick={() => {
                setQuery("");
                setModuleFilter("all");
                setActionFilter("all");
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ScrollText className="size-4 text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Journal d&apos;audit
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucune entrée ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date / Heure
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Utilisateur
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Module
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Action
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Détail
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      IP
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                    >
                      <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                        {formatDateShort(row.date)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {row.user}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                        <ToneBadge tone="slate">{row.module}</ToneBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={actionTone[row.action]}>{row.action}</ToneBadge>
                      </TableCell>
                      <TableCell className="max-w-[280px] px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                        <span className="line-clamp-2" title={row.detail}>
                          {row.detail}
                        </span>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 md:table-cell">
                        {row.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {startIdx}–{endIdx} sur {filtered.length} entrée
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function PreferencesTab() {
  const { toast } = useToast();
  const refetchData = useStore((s) => s.refetchData);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personnalisez la langue, les formats et les notifications.
        </p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          Bientôt disponible
        </span>
      </div>
      <Card className="p-6 shadow-sm border-border/80 border-dashed opacity-75">
        <fieldset disabled className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lang" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Langue
                </span>
              </Label>
              <Select defaultValue="fr">
                <SelectTrigger id="lang" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bmb">Bambara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dfmt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Format de date
                </span>
              </Label>
              <Select defaultValue="dmy">
                <SelectTrigger id="dfmt" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dmy">JJ/MM/AAAA</SelectItem>
                  <SelectItem value="mdy">MM/JJ/AAAA</SelectItem>
                  <SelectItem value="ymd">AAAA-MM-JJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cur" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Devise
                </span>
              </Label>
              <Select defaultValue="fcfa">
                <SelectTrigger id="cur" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fcfa">FCFA (XOF)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                  <SelectItem value="usd">Dollar US ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                <Bell className="size-4 text-slate-400 dark:text-slate-500" />
                Notifications par e-mail
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recevez un message à chaque dossier en attente ou alerte de stock.
              </p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" disabled>Enregistrer</Button>
          </div>
        </fieldset>
      </Card>

      <Card className="p-6 shadow-sm border-border/80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Guide de démarrage</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Réaffichez le guide « Par où commencer ? » sur le tableau de bord.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => {
            try {
              localStorage.removeItem(GUIDE_DISMISS_KEY);
              emitGuideReset();
              toast({ title: "Guide réactivé", description: "Le guide est de nouveau visible sur le tableau de bord." });
            } catch {
              toast({ title: "Impossible de réactiver le guide", variant: "destructive" });
            }
          }}
        >
          Réafficher le guide
        </Button>
      </Card>

      <Card className="p-6 shadow-sm border-border/80 border-red-200/60">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Synchroniser les données
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Vide le cache local puis recharge toutes les données depuis Supabase.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9"
              onClick={async () => {
                try {
                  localStorage.removeItem("sltt-data-v9");
                  localStorage.removeItem("sltt-data-v10");
                  await refetchData();
                  toast({
                    title: "Cache vidé",
                    description: "Les données ont été rechargées depuis Supabase.",
                  });
                } catch {
                  toast({
                    title: "Échec du rechargement",
                    description: "Impossible de recharger les données.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <RotateCcw className="size-4" />
              Vider le cache et recharger
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN SCREEN                                                          */
/* ------------------------------------------------------------------ */

function UsersTabBadge() {
  const count = useStore((s) => s.users.length);
  return (
    <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
      {count}
    </span>
  );
}

export function ParametresScreen() {
  const canManageUsers = useCanManageUsers();
  const canViewAudit = usePermission("parametres:read");
  const [active, setActive] = useState<ParamTab>("profile");

  const [prevCanManageUsers, setPrevCanManageUsers] = useState(canManageUsers);
  const [prevCanViewAudit, setPrevCanViewAudit] = useState(canViewAudit);
  if (canManageUsers !== prevCanManageUsers) {
    setPrevCanManageUsers(canManageUsers);
    if (canManageUsers) {
      setActive((prev) => (prev === "profile" ? "users" : prev));
    } else {
      setActive((prev) => (prev === "users" ? "profile" : prev));
    }
  }
  if (canViewAudit !== prevCanViewAudit) {
    setPrevCanViewAudit(canViewAudit);
    if (!canViewAudit) {
      setActive((prev) => (prev === "audit" ? "profile" : prev));
    }
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
              "flex h-12 w-full items-stretch rounded-none bg-slate-50/80 dark:bg-slate-800/80 p-0",
              "dark:bg-muted/30",
            )}
          >
            {tabs.filter((t) => {
              if (t.key === "users") return canManageUsers;
              if (t.key === "audit") return canViewAudit;
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
                    "text-sm font-medium text-slate-500 dark:text-slate-400 shadow-none transition-colors",
                    "hover:bg-white/60 hover:text-slate-900 dark:hover:text-slate-100",
                    "data-[state=active]:border-primary data-[state=active]:bg-white dark:bg-slate-900",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                    "min-w-0",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
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
      </Tabs>
    </div>
  );
}
