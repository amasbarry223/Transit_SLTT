"use client";

import { useSession } from "@/lib/session/session-store";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/lib/utils";

export function ProfileTab() {
  const users = useStore((s) => s.users);
  const updateOwnProfile = useStore((s) => s.updateOwnProfile);
  const currentUserId = useSession((s) => s.currentUserId);
  const currentUserName = useSession((s) => s.currentUserName);
  const currentRole = useSession((s) => s.currentRole);
  const { toast } = useToast();

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
      toastWarning(toast, { title: "Utilisateur introuvable" });
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile(currentUserId, { nom: pNom, email: pEmail });
      toastSuccess(toast, { title: "Profil mis à jour avec succès" });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible de mettre à jour le profil", fallback: "Impossible de mettre à jour le profil." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Vos informations personnelles et professionnelles.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-full text-white text-xl font-bold", USER_AVATAR_GRADIENT)}>
              {getInitials(pNom || currentUserName)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{pNom || currentUserName}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.role || currentRole}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-nom" className="text-sm font-medium text-foreground/90">
                Nom complet
              </Label>
              <Input
                id="p-nom"
                value={pNom}
                onChange={(e) => setPNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email" className="text-sm font-medium text-foreground/90">
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
              <Label htmlFor="p-poste" className="text-sm font-medium text-foreground/90">
                Poste
              </Label>
              <Input
                id="p-poste"
                value={currentUser?.role || currentRole}
                disabled
                className="bg-muted/50"
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
