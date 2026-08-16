"use client";

import { useState } from "react";
import {
  UserPlus,
  Lock,
  Mail,
  User,
  KeyRound,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-permission";
import { selectionToPermissions } from "@/lib/permissions";
import {
  PermissionMatrix,
  defaultSelectionForRole,
  permissionsFromSelection,
} from "@/components/sltt/permission-matrix";
import type { UserRole } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastWarning } from "@/lib/toast-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/lib/utils";
import { AnnexePicker } from "./annexe-picker";
import { PasswordField } from "./password-field";
import { RolePicker } from "./role-picker";
import {
  allRoles,
  isCustomPermissionSet,
  type FormMode,
  type FormTab,
  type UserFormState,
} from "./shared";

export function UserFormModal({
  open,
  onOpenChange,
  mode,
  initialState,
  editingUserId,
  saving,
  onSubmitCreate,
  onSubmitEdit,
  onResetPassword,
  isCurrentActorAdmin,
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
  /** False pour un délégué non-admin (permission utilisateurs:manage) — borne ce qu'il peut faire. */
  isCurrentActorAdmin: boolean;
}) {
  const [tab, setTab] = useState<FormTab>("identity");
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [advancedPermsOpen, setAdvancedPermsOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(initialState);
  const [showPwd, setShowPwd] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const annexes = useStore((s) => s.annexes);
  const isEditingSelf = mode === "edit" && editingUserId === currentUser?.id;
  const isDemotingSelf = isEditingSelf && initialState.role === "Administrateur" && form.role !== "Administrateur";

  const permCount = permissionsFromSelection(form.perms).length;
  const selectableRoles = isCurrentActorAdmin ? allRoles : allRoles.filter((r) => r !== "Administrateur");
  // Un délégué non-admin ne peut ni créer, ni modifier un compte Administrateur —
  // le serveur refuse déjà ces requêtes ; ceci évite juste de lui montrer un
  // formulaire qui échouera silencieusement.
  const readOnly = mode === "edit" && initialState.role === "Administrateur" && !isCurrentActorAdmin;

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
      toastWarning(toast, { title: "Mot de passe trop court", description: "Minimum 8 caractères." });
      return;
    }
    if (form.resetPassword !== form.resetConfirmPassword) {
      toastWarning(toast, { title: "Les mots de passe ne correspondent pas" });
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
            <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md", USER_AVATAR_GRADIENT)}>
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
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
                          placeholder="ex. Prénom Nom"
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
                          placeholder="ex. utilisateur@exemple.com"
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
                      <RolePicker value={form.role} onChange={applyRole} roles={selectableRoles} />
                      {!isCurrentActorAdmin && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Seul un administrateur peut créer un compte Administrateur.
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label>Annexes assignées <span className="text-red-500">*</span></Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Détermine les données visibles par l&apos;utilisateur — plusieurs annexes donnent accès au reporting consolidé.
                      </p>
                      <AnnexePicker
                        annexes={annexes}
                        value={form.annexeIds}
                        onChange={(annexeIds) => setForm((p) => ({ ...p, annexeIds }))}
                      />
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
                      <>
                        {form.role === "Administrateur" && (
                          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            Un Administrateur a toujours accès à tout, quelles que soient les cases cochées ci-dessous — ces permissions ne peuvent pas être restreintes.
                          </p>
                        )}
                        <PermissionMatrix
                          selection={form.perms}
                          onChange={(perms) => setForm((p) => ({ ...p, perms }))}
                          disabled={form.role === "Administrateur"}
                          presetFirst
                          currentRole={form.role}
                        />
                      </>
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
                          toastWarning(toast, { title: "Champs requis", description: "Nom et e-mail sont obligatoires." });
                          return;
                        }
                        if (form.password.length < 8) {
                          toastWarning(toast, { title: "Mot de passe trop court", description: "Minimum 8 caractères." });
                          return;
                        }
                        if (form.password !== form.confirmPassword) {
                          toastWarning(toast, { title: "Mots de passe différents" });
                          return;
                        }
                        setCreateStep(2);
                      }}
                    >
                      Suivant
                      <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={saving || form.annexeIds.length === 0}>
                      {saving ? "Création…" : "Créer l'utilisateur"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as FormTab)} className="flex min-h-0 flex-1 flex-col">
            {readOnly && (
              <div className="border-b border-border bg-amber-50 px-6 py-2.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Seul un administrateur peut modifier un compte Administrateur — vous consultez cette fiche en lecture seule.
              </div>
            )}
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
                      placeholder="ex. Prénom Nom"
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
                        placeholder="ex. utilisateur@exemple.com"
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
                  <RolePicker value={form.role} onChange={applyRole} roles={selectableRoles} />
                  {isDemotingSelf && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                      Vous modifiez votre propre rôle : en enregistrant, vous perdrez immédiatement l&apos;accès aux écrans réservés aux administrateurs.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Annexes assignées</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Détermine les données visibles par l&apos;utilisateur — plusieurs annexes donnent accès au reporting consolidé.
                  </p>
                  <AnnexePicker
                    annexes={annexes}
                    value={form.annexeIds}
                    onChange={(annexeIds) => setForm((p) => ({ ...p, annexeIds }))}
                  />
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
                        label="Confirmer le nouveau mot de passe"
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
                      disabled={saving || !form.resetPassword || readOnly}
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
                {form.role === "Administrateur" && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    Un Administrateur a toujours accès à tout, quelles que soient les cases cochées ci-dessous — ces permissions ne peuvent pas être restreintes.
                  </p>
                )}
                <PermissionMatrix
                  selection={form.perms}
                  onChange={(perms) => setForm((p) => ({ ...p, perms }))}
                  disabled={form.role === "Administrateur"}
                  presetFirst
                  currentRole={form.role}
                />
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
                <Button
                  type="submit"
                  disabled={saving || !form.nom.trim() || !form.email.trim() || form.annexeIds.length === 0 || readOnly}
                >
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
