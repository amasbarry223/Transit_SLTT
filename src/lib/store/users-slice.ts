import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { useNav } from "@/lib/nav-store";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { normalizePermissions, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions";
import type { User, UserRole } from "@/lib/domain-types";
import type { UserInput, SLTTState } from "@/lib/store";
import type { ProfileRow } from "@/lib/db-rows";

export function mapProfileFromDb(x: ProfileRow): User {
  const role = x.role as UserRole;
  const raw = Array.isArray(x.permissions) ? x.permissions : [];
  const normalized = normalizePermissions(raw);
  return {
    id: x.id,
    nom: x.nom,
    email: x.email,
    role,
    permissions:
      normalized.length > 0
        ? normalized
        : (ROLE_DEFAULT_PERMISSIONS[role] ?? []),
    actif: x.actif,
    derniereConnexion: x.derniere_connexion || "",
  };
}

export interface UsersSlice {
  users: User[];
  /** Sous-ensemble sans email/permissions, visible par tous les authentifiés (profiles_public) — pour l'affichage seul (ex. "utilisateurs récents"), jamais pour des décisions de permission. */
  usersPublic: Pick<User, "id" | "nom" | "role" | "actif" | "derniereConnexion">[];
  addUser: (input: UserInput) => Promise<User>;
  updateUser: (id: string, input: UserInput) => Promise<void>;
  updateOwnProfile: (id: string, input: { nom: string; email: string }) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string, password: string) => Promise<void>;
  updateLastLogin: (id: string) => Promise<void>;
}

export const createUsersSlice: StateCreator<SLTTState, [], [], UsersSlice> = (set, get) => ({
  users: [],
  usersPublic: [],

  addUser: async (input) => {
    const seq = get().userSeq;
    const permissions = normalizePermissions(input.permissions);

    const res = await fetchWithAuth("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        nom: input.nom,
        email: input.email,
        role: input.role,
        permissions,
        password: input.motDePasse,
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Impossible de créer l'utilisateur.");

    const newUser = mapProfileFromDb(payload.user);
    set((s) => ({
      users: [newUser, ...s.users],
      userSeq: seq + 1,
    }));
    await get().addAuditLog("Utilisateurs", "Création", `Utilisateur ${input.nom} créé`);
    return newUser;
  },

  updateUser: async (id, input) => {
    const permissions = normalizePermissions(input.permissions);

    const res = await fetchWithAuth(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nom: input.nom,
        email: input.email,
        role: input.role,
        permissions,
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Impossible de mettre à jour l'utilisateur.");

    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, ...input, permissions } : u,
      ),
    }));
    await get().addAuditLog("Utilisateurs", "Modification", `Utilisateur ${input.nom} mis à jour`);
  },

  toggleUserActive: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return;

    const newStatus = !user.actif;

    const res = await fetchWithAuth(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nom: user.nom,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        actif: newStatus,
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Impossible de modifier le statut.");

    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, actif: newStatus } : u)),
    }));
    await get().addAuditLog("Utilisateurs", "Modification", `Statut actif de l'utilisateur ${user.nom} basculé à ${newStatus}`);
  },

  removeUser: async (id) => {
    const user = get().users.find((u) => u.id === id);

    const res = await fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Impossible de supprimer l'utilisateur.");

    set((s) => ({
      users: s.users.filter((u) => u.id !== id),
    }));

    if (user) {
      await get().addAuditLog("Utilisateurs", "Suppression", `Utilisateur ${user.nom} supprimé`);
    }
  },

  resetUserPassword: async (id, password) => {
    const res = await fetchWithAuth(`/api/admin/users/${id}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Impossible de réinitialiser le mot de passe.");
  },

  updateLastLogin: async (id) => {
    await supabase
      .from("profiles")
      .update({ derniere_connexion: new Date().toISOString() })
      .eq("id", id);

    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, derniereConnexion: new Date().toISOString() } : u
      ),
    }));
  },

  updateOwnProfile: async (id, input) => {
    const trimmedNom = input.nom.trim();
    const trimmedEmail = input.email.trim();
    if (!trimmedNom) throw new Error("Le nom est requis.");
    if (!trimmedEmail) throw new Error("L'e-mail est requis.");

    const existing = get().users.find((u) => u.id === id);
    if (!existing) throw new Error("Utilisateur introuvable.");

    const { error } = await supabase
      .from("profiles")
      .update({ nom: trimmedNom, email: trimmedEmail })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, nom: trimmedNom, email: trimmedEmail } : u,
      ),
    }));

    useNav.getState().setCurrentUserName(trimmedNom);
    await get().addAuditLog("Utilisateurs", "Modification", `Profil de ${trimmedNom} mis à jour`);
  },
});
