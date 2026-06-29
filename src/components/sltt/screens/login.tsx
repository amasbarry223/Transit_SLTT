"use client";

import { useState } from "react";
import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base gradient — profondeur bleue SLTT */}
      <div className="absolute inset-0 bg-[#0c1a4a]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#0f172a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(96,165,250,0.45),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(30,64,175,0.6),transparent_50%)]" />

      {/* Grille technique */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "16px 16px",
        }}
      />

      {/* Orbes lumineux */}
      <div className="absolute -left-24 top-1/4 size-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />

      {/* Vignette pour focaliser le container */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.35)_100%)]" />
    </div>
  );
}

export function LoginScreen() {
  const login = useNav((s) => s.login);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("amadou.traore@sltt.ml");
  const [password, setPassword] = useState("sltt2026");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email === "amadou.traore@sltt.ml" && password === "sltt2026") {
        login();
      } else {
        setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
      }
    }, 700);
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Identifiant ou e-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="vous@sltt.ml"
                    className="h-11 border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                    required
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
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    className="h-11 border-slate-200 bg-slate-50/50 pl-10 pr-10 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"
                    }
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
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="cursor-pointer text-sm text-slate-600">
                  Rester connecté
                </Label>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold shadow-md shadow-primary/20"
                disabled={loading}
              >
                {loading ? "Connexion en cours…" : "Se connecter"}
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
