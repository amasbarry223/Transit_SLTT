"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hashPassword } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
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
  Zap,
  ChevronDown,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "amadou.traore@sltt.ml",    password: "sltt2026",    nom: "Amadou Traoré",    role: "Admin" },
  { email: "fatoumata.diallo@sltt.ml", password: "compta2026",  nom: "Fatoumata Diallo", role: "Comptable" },
  { email: "ibrahim.keita@sltt.ml",    password: "transit2026", nom: "Ibrahim Keïta",    role: "Agent" },
  { email: "oumar.cisse@sltt.ml",      password: "stock2026",   nom: "Oumar Cissé",      role: "Magasinier" },
] as const;

function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#0c1a4a]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#0f172a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(96,165,250,0.45),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(30,64,175,0.6),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute -left-24 top-1/4 size-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.35)_100%)]" />
    </div>
  );
}

export function LoginScreen() {
  const loginNav = useNav((s) => s.login);
  const users = useStore((s) => s.users);
  const updateLastLogin = useStore((s) => s.updateLastLogin);

  const [showPwd, setShowPwd] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function doLogin(userEmail: string, userPassword: string) {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      // Si les clés Supabase ne sont pas configurées, on utilise la simulation locale (DX / Fallback)
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const hashedInput = await hashPassword(userPassword);
        const user = users.find(
          (u) =>
            u.email.toLowerCase() === userEmail.toLowerCase().trim() &&
            u.motDePasse === hashedInput,
        );

        if (!user) {
          setError("Identifiants incorrects.");
          return;
        }

        if (!user.actif) {
          setError(
            "Votre compte est désactivé. Veuillez contacter votre administrateur.",
          );
          return;
        }

        updateLastLogin(user.id);
        loginNav(user.role, user.nom, user.id, rememberMe);
        return;
      }

      // Connexion avec Supabase Auth
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

  async function handleDemoLogin(acc: typeof DEMO_ACCOUNTS[number]) {
    setEmail(acc.email);
    setPassword(acc.password);
    await doLogin(acc.email, acc.password);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col items-center px-8 pb-5 pt-8">
            <Image
              src="/logo-login.png"
              alt="SLTT"
              width={96}
              height={96}
              className="size-24 object-contain drop-shadow-md"
              priority
            />
          </div>

          <Separator className="bg-slate-200" />

          <div className="px-8 py-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Connexion à votre espace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Saisissez vos identifiants pour accéder à la plateforme.
              </p>
            </div>

            {/* Connexion rapide démo — masquée par défaut */}
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                aria-expanded={showDemo}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700">Connexion rapide · Démo</span>
                </div>
                <ChevronDown
                  className={`size-3.5 text-blue-400 transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`}
                />
              </button>

              {showDemo && (
                <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleDemoLogin(acc)}
                    disabled={loading}
                    className="flex flex-col items-start rounded-lg border border-blue-100 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <span className="text-xs font-medium text-slate-800 leading-tight">{acc.nom}</span>
                    <span className="text-[11px] text-blue-500 mt-0.5">{acc.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Adresse e-mail
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="vous@sltt.ml"
                  className="h-11 border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
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
                  className="text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </Label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="h-11 border-slate-200 bg-slate-50/50 pl-10 pr-10 focus:bg-white"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                className="cursor-pointer text-sm text-slate-600"
              >
                Rester connecté (7 jours)
              </Label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
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
          </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="size-3.5" />
              Accès sécurisé · SLTT © 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
