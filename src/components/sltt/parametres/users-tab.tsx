"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import {
  normalizePermissions,
  permissionsToSelection,
} from "@/lib/permissions";
import { permissionsFromSelection } from "@/components/sltt/permission-matrix";
import type { User as UserAccount, UserInput } from "@/lib/store";
import { matchesQuery } from "@/lib/search-filter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { UserFormModal } from "./users/user-form-modal";
import { UsersStatsRow, UsersTable } from "./users/users-table";
import {
  USERS_PAGE_SIZE,
  emptyFormState,
  type FormMode,
  type RoleFilter,
  type UserFormState,
} from "./users/shared";

export function UsersTab() {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const users = useStore((s) => s.users);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);
  const removeUser = useStore((s) => s.removeUser);
  const resetUserPassword = useStore((s) => s.resetUserPassword);
  const { activeAnnexeId } = useActiveAnnexe();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<UserFormState>(emptyFormState());
  const [saving, setSaving] = useState(false);

  const isCurrentAdmin = currentUser?.role === "Administrateur";
  const userToDelete = users.find((u) => u.id === deleteId);

  function actionDisabledReason(u: UserAccount): string | undefined {
    if (u.id === currentUser?.id) return "Vous ne pouvez pas modifier votre propre statut ici.";
    if (u.role === "Administrateur" && !isCurrentAdmin) return "Seul un administrateur peut modifier un autre administrateur.";
    return undefined;
  }

  const stats = useMemo(
    () => ({
      total: users.length,
      actifs: users.filter((u) => u.actif).length,
      inactifs: users.filter((u) => !u.actif).length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      return matchesQuery(u, ["nom", "email", "role"], search.trim());
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));

  const [prevSearch, setPrevSearch] = useState(search);
  const [prevRoleFilter, setPrevRoleFilter] = useState(roleFilter);
  if (search !== prevSearch || roleFilter !== prevRoleFilter) {
    setPrevSearch(search);
    setPrevRoleFilter(roleFilter);
    setPage(1);
  }

  const safePage = Math.min(page, totalPages);
  if (page !== safePage) {
    setPage(safePage);
  }

  const paged = filtered.slice((safePage - 1) * USERS_PAGE_SIZE, safePage * USERS_PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * USERS_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * USERS_PAGE_SIZE, filtered.length);

  function openCreate() {
    setFormMode("create");
    setEditingUserId(null);
    setFormInitial(emptyFormState("Agent de transit", activeAnnexeId ? [activeAnnexeId] : []));
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
      annexeIds: u.annexeIds,
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
      annexeIds: state.annexeIds,
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
      annexeIds: state.annexeIds,
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

  async function handleToggleActive(u: UserAccount) {
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

      <UsersStatsRow stats={stats} />

      <UsersTable
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        filtered={filtered}
        paged={paged}
        hasFilters={hasFilters}
        onCreate={openCreate}
        currentUserId={currentUser?.id}
        isCurrentAdmin={isCurrentAdmin}
        actionDisabledReason={actionDisabledReason}
        onEdit={openEdit}
        onDelete={setDeleteId}
        onToggleActive={handleToggleActive}
        safePage={safePage}
        totalPages={totalPages}
        startIdx={startIdx}
        endIdx={endIdx}
        onPageChange={setPage}
      />

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
        isCurrentActorAdmin={isCurrentAdmin}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Supprimer l'utilisateur ?"
        description={<><strong>{userToDelete?.nom}</strong> sera définitivement supprimé. Cette action est irréversible.</>}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await removeUser(deleteId);
            toast({ title: "Utilisateur supprimé" });
          } catch (err: unknown) {
            toast({
              title: "Erreur",
              description: err instanceof Error ? err.message : "Suppression impossible.",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
