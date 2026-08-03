"use client";

import { useState } from "react";
import { Lock, Shield } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
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
      const res = await fetchWithAuth("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Impossible de changer le mot de passe.");
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
          La session actuelle utilise déjà une déconnexion automatique après 30 min d&apos;inactivité, avec un plafond de 8 h (ou 3 jours avec « Rester connecté »).
        </p>
      </Card>
    </div>
  );
}
