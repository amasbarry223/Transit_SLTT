"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SecurityTab() {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!curPwd) {
      toastWarning(toast, { title: "Mot de passe actuel requis" });
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      toastWarning(toast, { title: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
      return;
    }
    if (newPwd !== confPwd) {
      toastWarning(toast, { title: "Les mots de passe ne correspondent pas" });
      return;
    }
    if (!currentUser) {
      toastWarning(toast, { title: "Utilisateur introuvable" });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetchWithAuth("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Impossible de changer le mot de passe.");
      toastSuccess(toast, { title: "Mot de passe mis à jour" });
      setCurPwd("");
      setNewPwd("");
      setConfPwd("");
    } catch (err: unknown) {
      toastError(toast, err, { title: "Changement impossible", fallback: "Changement impossible." });
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Mot de passe, authentification et options de sécurité du compte.
      </p>

      {/* Mot de passe */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Mot de passe</h3>
        </div>
        <form
          onSubmit={handlePasswordSubmit}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor="cur-pwd" className="text-sm font-medium text-foreground/90">
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
            <Label htmlFor="new-pwd" className="text-sm font-medium text-foreground/90">
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
            <Label htmlFor="conf-pwd" className="text-sm font-medium text-foreground/90">
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
    </div>
  );
}
