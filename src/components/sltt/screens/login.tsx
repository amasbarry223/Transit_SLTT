"use client";

import { useState } from "react";
import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { supabase } from "@/lib/supabase";
import { insertAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";



function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/bg.jpg')` }}
      />
      <div className="absolute inset-0 bg-[#0c1a4a]/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.45)_100%)]" />
    </div>
  );
}

export function LoginScreen() {
  const loginNav = useNav((s) => s.login);

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  async function doLogin(userEmail: string, userPassword: string) {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail.toLowerCase().trim(),
        password: userPassword,
      });

      if (authError || !authData.user) {
        setError(authError?.message || "Identifiants incorrects.");
        return;
      }

      // Récupération du profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        setError("Profil utilisateur introuvable dans la base de données.");
        await supabase.auth.signOut();
        return;
      }

      if (!profile.actif) {
        setError("Votre compte est désactivé. Veuillez contacter votre administrateur.");
        await supabase.auth.signOut();
        return;
      }

      // Mise à jour de la dernière connexion
      await supabase
        .from("profiles")
        .update({ derniere_connexion: new Date().toISOString() })
        .eq("id", profile.id);

      void insertAuditLog({
        module: "Authentification",
        action: "Connexion",
        detail: `Connexion réussie — ${profile.email ?? userEmail.toLowerCase().trim()}`,
        userName: profile.nom,
      });

      loginNav(profile.role, profile.nom, profile.id, rememberMe);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(email, password);
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="overflow-hidden rounded-2xl border border-white/25 bg-white dark:bg-slate-900 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col items-center px-8 pb-6 pt-9">
            <Image
              src="/logoV.png"
              alt="SLTT — Traoré de Logistique Transit-Transport"
              width={140}
              height={140}
              className="size-[132px] object-contain drop-shadow-md sm:size-[140px]"
              priority
              unoptimized
            />
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800" />

          <div className="px-8 py-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Connexion à votre espace
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Saisissez vos identifiants pour accéder à la plateforme.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="vous@sltt.ml"
                    className="h-11 border-slate-200 dark:border-slate-700 bg-slate-50/50 pl-10 focus:bg-white dark:focus:bg-slate-900"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Mot de passe
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="h-11 border-slate-200 dark:border-slate-700 bg-slate-50/50 pl-10 pr-10 focus:bg-white dark:focus:bg-slate-900"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    tabIndex={-1}
                  >
                    {showPwd ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-slate-600 dark:text-slate-300"
                >
                  Rester connecté (3 jours)
                </Label>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold shadow-md shadow-primary/20"
                disabled={loading}
              >
                {loading ? "Vérification…" : "Se connecter"}
              </Button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Mot de passe oublié ou compte bloqué ?{" "}
                <a
                  href="mailto:?subject=R%C3%A9initialisation%20mot%20de%20passe%20SLTT"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Contactez votre administrateur
                </a>
              </p>
          </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="size-3.5" />
              Accès sécurisé · SLTT © 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
