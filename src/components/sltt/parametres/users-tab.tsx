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
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
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
  const [deactivateTarget, setDeactivateTarget] = useState<UserAccount | null>(null);
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
      toastWarning(toast, {
        title: "Mot de passe trop court",
        description: "Utilisez au moins 8 caractères avec lettres et chiffres.",
      });
      return;
    }
    if (state.password !== state.confirmPassword) {
      toastWarning(toast, {
        title: "Les mots de passe ne correspondent pas",
        description: "Saisissez le même mot de passe dans les deux champs.",
      });
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === state.email.trim().toLowerCase())) {
      toastWarning(toast, {
        title: "Cette adresse e-mail est déjà utilisée",
        description: "Choisissez une autre adresse ou modifiez l'utilisateur existant.",
      });
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
      toastSuccess(toast, {
        title: "Utilisateur créé",
        description: `${state.nom.trim()} peut maintenant se connecter.`,
      });
      setFormOpen(false);
    } catch (err: unknown) {
      toastError(toast, err, {
        title: "Impossible de créer l'utilisateur",
        fallback: "Vérifiez les informations saisies et réessayez.",
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
      toastSuccess(toast, {
        title: "Utilisateur mis à jour",
        description: "Les modifications ont été enregistrées.",
      });
      setFormOpen(false);
      setEditingUserId(null);
    } catch (err: unknown) {
      toastError(toast, err, {
        title: "Impossible de mettre à jour l'utilisateur",
        fallback: "Vérifiez les informations saisies et réessayez.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(id: string, password: string) {
    setSaving(true);
    try {
      await resetUserPassword(id, password);
      toastSuccess(toast, {
        title: "Mot de passe réinitialisé",
        description: "L'utilisateur pourra se connecter avec son nouveau mot de passe.",
      });
    } catch (err: unknown) {
      toastError(toast, err, {
        title: "Impossible de réinitialiser le mot de passe",
        fallback: "Réessayez dans quelques instants.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: UserAccount) {
    if (u.id === currentUser?.id) return;
    if (u.actif) {
      setDeactivateTarget(u);
      return;
    }
    try {
      await toggleUserActive(u.id);
      toastSuccess(toast, {
        title: "Compte réactivé",
        description: `${u.nom} peut à nouveau se connecter.`,
      });
    } catch (err: unknown) {
      toastError(toast, err, {
        title: "Impossible de modifier le statut",
        fallback: "Réessayez dans quelques instants.",
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
            toastSuccess(toast, { title: "Utilisateur supprimé" });
          } catch (err: unknown) {
            toastError(toast, err, {
              title: "Impossible de supprimer l'utilisateur",
              fallback: "Vérifiez qu'aucune action en cours ne bloque la suppression.",
            });
          }
        }}
      />

      <ConfirmActionDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Désactiver cet utilisateur ?"
        description={
          <>
            <strong>{deactivateTarget?.nom}</strong> ne pourra plus se connecter à l&apos;application tant que son
            compte n&apos;aura pas été réactivé.
          </>
        }
        confirmLabel="Désactiver"
        variant="destructive"
        onConfirm={async () => {
          if (!deactivateTarget) return;
          try {
            await toggleUserActive(deactivateTarget.id);
            toastSuccess(toast, {
              title: "Compte désactivé",
              description: `${deactivateTarget.nom} ne peut plus se connecter.`,
            });
          } catch (err: unknown) {
            toastError(toast, err, {
              title: "Impossible de désactiver l'utilisateur",
              fallback: "Réessayez dans quelques instants.",
            });
          }
          setDeactivateTarget(null);
        }}
      />
    </div>
  );
}
