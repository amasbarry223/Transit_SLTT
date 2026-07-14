"use client";

import { useMemo, useState, useEffect } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  Lock,
  Users,
  Search,
  Eye,
  EyeOff,
  Shield,
  Truck,
  Wallet,
  Warehouse,
  Mail,
  User,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-permission";
import {
  getModuleSummary,
  normalizePermissions,
  permissionsToSelection,
  selectionToPermissions,
  ROLE_DEFAULT_PERMISSIONS,
} from "@/lib/permissions";
import {
  PermissionMatrix,
  defaultSelectionForRole,
  permissionsFromSelection,
} from "@/components/sltt/permission-matrix";
import type { UserInput, UserRole } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";

const USERS_PAGE_SIZE = 5;

const allRoles: UserRole[] = [
  "Administrateur",
  "Agent de transit",
  "Comptable",
  "Magasinier",
];

const roleTone: Record<UserRole, "red" | "blue" | "emerald" | "amber" | "indigo"> = {
  Administrateur: "red",
  "Agent de transit": "blue",
  Comptable: "emerald",
  Magasinier: "amber",
};

const roleMeta: Record<
  UserRole,
  { icon: LucideIcon; description: string; gradient: string }
> = {
  Administrateur: {
    icon: Shield,
    description: "Accès complet et gestion de l'équipe",
    gradient: "from-red-500/10 to-orange-500/10 border-red-200/60 dark:border-red-900/40",
  },
  "Agent de transit": {
    icon: Truck,
    description: "Dossiers, clients et opérations transit",
    gradient: "from-blue-500/10 to-cyan-500/10 border-blue-200/60 dark:border-blue-900/40",
  },
  Comptable: {
    icon: Wallet,
    description: "Comptabilité, factures et rapports",
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/60 dark:border-emerald-900/40",
  },
  Magasinier: {
    icon: Warehouse,
    description: "Entreposage et bons de sortie",
    gradient: "from-amber-500/10 to-yellow-500/10 border-amber-200/60 dark:border-amber-900/40",
  },
};

type FormMode = "create" | "edit";
type FormTab = "identity" | "access" | "permissions";
type RoleFilter = "all" | UserRole;

interface UserFormState {
  nom: string;
  email: string;
  role: UserRole;
  perms: Record<string, boolean>;
  password: string;
  confirmPassword: string;
  resetPassword: string;
  resetConfirmPassword: string;
}

/** True si les permissions de l'utilisateur s'écartent du standard de son rôle (LOGIC-audit). */
function isCustomPermissionSet(role: UserRole, permissions: string[]): boolean {
  const actual = new Set(normalizePermissions(permissions));
  const standard = ROLE_DEFAULT_PERMISSIONS[role];
  if (actual.size !== standard.length) return true;
  return standard.some((p) => !actual.has(p));
}

function emptyFormState(role: UserRole = "Agent de transit"): UserFormState {
  return {
    nom: "",
    email: "",
    role,
    perms: defaultSelectionForRole(role),
    password: "",
    confirmPassword: "",
    resetPassword: "",
    resetConfirmPassword: "",
  };
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={8}
          className="h-11 pr-10 bg-white dark:bg-slate-950"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          onClick={onToggleShow}
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {allRoles.map((r) => {
        const meta = roleMeta[r];
        const Icon = meta.icon;
        const selected = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
              "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              meta.gradient,
              selected
                ? "ring-2 ring-primary border-primary/40 bg-white dark:bg-slate-900"
                : "bg-white/60 dark:bg-slate-900/40",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                selected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                {meta.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function UserFormModal({
  open,
  onOpenChange,
  mode,
  initialState,
  editingUserId,
  saving,
  onSubmitCreate,
  onSubmitEdit,
  onResetPassword,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  initialState: UserFormState;
  editingUserId: string | null;
  saving: boolean;
  onSubmitCreate: (state: UserFormState) => Promise<void>;
  onSubmitEdit: (id: string, state: UserFormState) => Promise<void>;
  onResetPassword: (id: string, password: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<FormTab>("identity");
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [advancedPermsOpen, setAdvancedPermsOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(initialState);
  const [showPwd, setShowPwd] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const { toast } = useToast();

  const permCount = permissionsFromSelection(form.perms).length;

  function applyRole(role: UserRole) {
    setForm((prev) => ({
      ...prev,
      role,
      perms: defaultSelectionForRole(role),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create") {
      await onSubmitCreate(form);
    } else if (editingUserId) {
      await onSubmitEdit(editingUserId, form);
    }
  }

  async function handleResetPassword() {
    if (!editingUserId) return;
    if (form.resetPassword.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "destructive" });
      return;
    }
    if (form.resetPassword !== form.resetConfirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    await onResetPassword(editingUserId, form.resetPassword);
    setForm((prev) => ({ ...prev, resetPassword: "", resetConfirmPassword: "" }));
  }

  const tabs: { key: FormTab; label: string; icon: LucideIcon }[] = [
    { key: "identity", label: "Identité", icon: User },
    { key: "access", label: mode === "create" ? "Accès" : "Sécurité", icon: KeyRound },
    { key: "permissions", label: "Permissions", icon: ShieldCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-3 border-b border-border bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-lg font-bold text-white shadow-md">
              {form.nom ? getInitials(form.nom) : <UserPlus className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg">
                {mode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {mode === "create"
                  ? "Créez un compte, définissez le mot de passe et les droits d'accès."
                  : "Mettez à jour les informations, le rôle et les permissions."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {mode === "create" ? (
            <>
              <div className="border-b border-border px-6 py-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Étape {createStep} sur 2 — {createStep === 1 ? "Identité" : "Rôle et accès"}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <div className={cn("h-1 flex-1 rounded-full", createStep >= 1 ? "bg-primary" : "bg-slate-200")} />
                  <div className={cn("h-1 flex-1 rounded-full", createStep >= 2 ? "bg-primary" : "bg-slate-200")} />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sltt-scroll">
                {createStep === 1 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="form-nom">Nom complet <span className="text-red-500">*</span></Label>
                        <Input
                          id="form-nom"
                          value={form.nom}
                          onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                          placeholder="ex. Awa Traoré"
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="form-email">Adresse e-mail <span className="text-red-500">*</span></Label>
                        <Input
                          id="form-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="awa.traore@sltt.ml"
                          required
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <PasswordField
                        id="form-password"
                        label="Mot de passe"
                        value={form.password}
                        onChange={(v) => setForm((p) => ({ ...p, password: v }))}
                        show={showPwd}
                        onToggleShow={() => setShowPwd((v) => !v)}
                        placeholder="Minimum 8 caractères"
                      />
                      <PasswordField
                        id="form-password-confirm"
                        label="Confirmer le mot de passe"
                        value={form.confirmPassword}
                        onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
                        show={showPwd}
                        onToggleShow={() => setShowPwd((v) => !v)}
                        placeholder="Répétez le mot de passe"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Rôle prédéfini</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choisissez un profil métier — les permissions standard sont appliquées automatiquement.
                      </p>
                      <RolePicker value={form.role} onChange={applyRole} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdvancedPermsOpen((v) => !v)}
                      className="flex w-full items-center justify-between border-t border-border pt-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300"
                    >
                      Avancé — matrice des permissions
                      <ChevronRight className={cn("size-4 transition-transform", advancedPermsOpen && "rotate-90")} />
                    </button>
                    {advancedPermsOpen && (
                      <PermissionMatrix selection={form.perms} onChange={(perms) => setForm((p) => ({ ...p, perms }))} />
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 border-t border-border bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <div className="flex gap-2">
                  {createStep === 2 && (
                    <Button type="button" variant="outline" onClick={() => setCreateStep(1)}>
                      Précédent
                    </Button>
                  )}
                  {createStep === 1 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (!form.nom.trim() || !form.email.trim()) {
                          toast({ title: "Champs requis", description: "Nom et e-mail sont obligatoires.", variant: "destructive" });
                          return;
                        }
                        if (form.password.length < 8) {
                          toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "destructive" });
                          return;
                        }
                        if (form.password !== form.confirmPassword) {
                          toast({ title: "Mots de passe différents", variant: "destructive" });
                          return;
                        }
                        setCreateStep(2);
                      }}
                    >
                      Suivant
                      <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={saving}>
                      {saving ? "Création…" : "Créer l'utilisateur"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as FormTab)} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border px-6 pt-4">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-slate-100/80 p-1 dark:bg-slate-800/80">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger
                      key={t.key}
                      value={t.key}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                      {t.key === "permissions" && (
                        <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
                          {permCount}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sltt-scroll">
              <TabsContent value="identity" className="mt-0 space-y-4 focus-visible:outline-none">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="form-nom">Nom complet</Label>
                    <Input
                      id="form-nom"
                      value={form.nom}
                      onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                      placeholder="ex. Awa Traoré"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="form-email">Adresse e-mail</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="form-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="awa.traore@sltt.ml"
                        required
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Rôle métier</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Le rôle pré-remplit les permissions — vous pourrez les ajuster à l'étape suivante.
                  </p>
                  <RolePicker value={form.role} onChange={applyRole} />
                </div>
              </TabsContent>

              <TabsContent value="access" className="mt-0 space-y-5 focus-visible:outline-none">
                  <div className="rounded-xl border border-border bg-slate-50/50 p-4 dark:bg-slate-800/30">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                        <Lock className="size-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Réinitialiser le mot de passe
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          L&apos;utilisateur devra se reconnecter avec le nouveau mot de passe.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <PasswordField
                        id="reset-password"
                        label="Nouveau mot de passe"
                        value={form.resetPassword}
                        onChange={(v) => setForm((p) => ({ ...p, resetPassword: v }))}
                        show={showResetPwd}
                        onToggleShow={() => setShowResetPwd((v) => !v)}
                        placeholder="Minimum 8 caractères"
                      />
                      <PasswordField
                        id="reset-password-confirm"
                        label="Confirmer"
                        value={form.resetConfirmPassword}
                        onChange={(v) => setForm((p) => ({ ...p, resetConfirmPassword: v }))}
                        show={showResetPwd}
                        onToggleShow={() => setShowResetPwd((v) => !v)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-4"
                      disabled={saving || !form.resetPassword}
                      onClick={handleResetPassword}
                    >
                      <Lock className="size-4" />
                      Appliquer le nouveau mot de passe
                    </Button>
                  </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-0 space-y-3 focus-visible:outline-none">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold tabular-nums text-primary">{permCount}</span> permission
                    {permCount > 1 ? "s" : ""} sélectionnée{permCount > 1 ? "s" : ""}
                    {isCustomPermissionSet(form.role, selectionToPermissions(form.perms)) && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Personnalisé — différent du standard {form.role}
                      </span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setForm((p) => ({ ...p, perms: defaultSelectionForRole(p.role) }))}
                  >
                    Réinitialiser selon le rôle
                  </Button>
                </div>
                <PermissionMatrix selection={form.perms} onChange={(perms) => setForm((p) => ({ ...p, perms }))} />
              </TabsContent>
            </div>

            <DialogFooter className="flex-col gap-2 border-t border-border bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50 sm:flex-row sm:justify-between">
              <div className="flex w-full gap-2 sm:w-auto">
                {tab !== "identity" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTab(tab === "permissions" ? "access" : "identity")}
                  >
                    Retour
                  </Button>
                )}
                {tab !== "permissions" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTab(tab === "identity" ? "access" : "permissions")}
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
              <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving || !form.nom.trim() || !form.email.trim()}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </DialogFooter>
          </Tabs>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersEmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Users className="size-7" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasFilters ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "Modifiez votre recherche ou le filtre par rôle."
          : "Ajoutez le premier membre de votre équipe pour commencer."}
      </p>
      {!hasFilters && (
        <Button className="mt-5" onClick={onCreate}>
          <UserPlus className="size-4" />
          Ajouter un utilisateur
        </Button>
      )}
    </div>
  );
}

export function UsersTab() {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const users = useStore((s) => s.users);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);
  const removeUser = useStore((s) => s.removeUser);
  const resetUserPassword = useStore((s) => s.resetUserPassword);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<UserFormState>(emptyFormState());
  const [saving, setSaving] = useState(false);

  const userToDelete = users.find((u) => u.id === deleteId);

  const stats = useMemo(
    () => ({
      total: users.length,
      actifs: users.filter((u) => u.actif).length,
      inactifs: users.filter((u) => !u.actif).length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const safePage = Math.min(page, totalPages);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const paged = filtered.slice((safePage - 1) * USERS_PAGE_SIZE, safePage * USERS_PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * USERS_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * USERS_PAGE_SIZE, filtered.length);

  function openCreate() {
    setFormMode("create");
    setEditingUserId(null);
    setFormInitial(emptyFormState());
    setFormOpen(true);
  }

  function openEdit(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setFormMode("edit");
    setEditingUserId(id);
    setFormInitial({
      nom: u.nom,
      email: u.email,
      role: u.role,
      perms: permissionsToSelection(normalizePermissions(u.permissions)),
      password: "",
      confirmPassword: "",
      resetPassword: "",
      resetConfirmPassword: "",
    });
    setFormOpen(true);
  }

  async function handleCreate(state: UserFormState) {
    if (state.password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "destructive" });
      return;
    }
    if (state.password !== state.confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === state.email.trim().toLowerCase())) {
      toast({ title: "E-mail déjà utilisé", variant: "destructive" });
      return;
    }
    const input: UserInput = {
      nom: state.nom.trim(),
      email: state.email.trim(),
      role: state.role,
      permissions: permissionsFromSelection(state.perms),
      motDePasse: state.password,
    };
    setSaving(true);
    try {
      await addUser(input);
      toast({ title: "Utilisateur créé avec succès" });
      setFormOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Création impossible.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string, state: UserFormState) {
    const input: UserInput = {
      nom: state.nom.trim(),
      email: state.email.trim(),
      role: state.role,
      permissions: permissionsFromSelection(state.perms),
    };
    setSaving(true);
    try {
      await updateUser(id, input);
      toast({ title: "Utilisateur mis à jour" });
      setFormOpen(false);
      setEditingUserId(null);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Mise à jour impossible.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(id: string, password: string) {
    setSaving(true);
    try {
      await resetUserPassword(id, password);
      toast({ title: "Mot de passe réinitialisé" });
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Réinitialisation impossible.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search.trim().length > 0 || roleFilter !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Équipe & accès</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comptes, rôles et permissions de l&apos;application.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 shadow-sm">
          <UserPlus className="size-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total, tone: "text-slate-900 dark:text-slate-100" },
          { label: "Actifs", value: stats.actifs, tone: "text-emerald-600 dark:text-emerald-400" },
          { label: "Inactifs", value: stats.inactifs, tone: "text-slate-500 dark:text-slate-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/80 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums", kpi.tone)}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-slate-50/50 px-4 py-3 dark:bg-slate-800/30 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, e-mail ou rôle…"
              className="h-10 bg-white pl-9 dark:bg-slate-950"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="h-10 w-full sm:w-[200px] bg-white dark:bg-slate-950">
              <Filter className="mr-2 size-3.5 text-slate-400" />
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {allRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <UsersEmptyState hasFilters={hasFilters} onCreate={openCreate} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-950">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisateur</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rôle</TableHead>
                    <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                      Modules
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</TableHead>
                    <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                      Dernière connexion
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((u) => (
                    <TableRow
                      key={u.id}
                      className="group border-b border-border/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-bold text-white">
                            {getInitials(u.nom)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{u.nom}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ToneBadge tone={roleTone[u.role]}>{u.role}</ToneBadge>
                          {isCustomPermissionSet(u.role, u.permissions) && (
                            <span title="Les permissions de cet utilisateur diffèrent du standard de son rôle">
                              <ToneBadge tone="slate" dot={false}>
                                Personnalisé
                              </ToneBadge>
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden py-3.5 md:table-cell">
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {getModuleSummary(u.permissions).slice(0, 3).map((label) => (
                            <span
                              key={label}
                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {label}
                            </span>
                          ))}
                          {getModuleSummary(u.permissions).length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{getModuleSummary(u.permissions).length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.actif}
                            disabled={u.id === currentUser?.id}
                            onCheckedChange={async () => {
                              if (u.id === currentUser?.id) return;
                              try {
                                await toggleUserActive(u.id);
                                toast({
                                  title: "Statut mis à jour",
                                  description: `${u.nom} est maintenant ${u.actif ? "inactif" : "actif"}.`,
                                });
                              } catch (err: unknown) {
                                toast({
                                  title: "Erreur",
                                  variant: "destructive",
                                  description: err instanceof Error ? err.message : undefined,
                                });
                              }
                            }}
                            aria-label={`Statut de ${u.nom}`}
                          />
                          <ToneBadge tone={u.actif ? "emerald" : "slate"}>
                            {u.actif ? "Actif" : "Inactif"}
                          </ToneBadge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden py-3.5 tabular-nums text-sm text-slate-500 lg:table-cell">
                        {formatDateShort(u.derniereConnexion)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-70 group-hover:opacity-100"
                            onClick={() => openEdit(u.id)}
                            title="Modifier"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 opacity-70 hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                            disabled={u.id === currentUser?.id}
                            onClick={() => setDeleteId(u.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={safePage}
              totalPages={totalPages}
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              onPageChange={setPage}
              itemLabel="utilisateurs"
            />
          </>
        )}
      </Card>

      <UserFormModal
        key={formOpen ? `${formMode}-${editingUserId ?? "create"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialState={formInitial}
        editingUserId={editingUserId}
        saving={saving}
        onSubmitCreate={handleCreate}
        onSubmitEdit={handleEdit}
        onResetPassword={handleResetPassword}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.nom}</strong> sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await removeUser(deleteId);
                  toast({ title: "Utilisateur supprimé" });
                  setDeleteId(null);
                } catch (err: unknown) {
                  toast({
                    title: "Erreur",
                    description: err instanceof Error ? err.message : "Suppression impossible.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
