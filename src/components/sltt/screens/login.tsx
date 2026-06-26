"use client";

import { useState } from "react";
import { useNav } from "@/lib/nav-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Truck, ShieldCheck, Lock, Mail } from "lucide-react";

export function LoginScreen() {
  const login = useNav((s) => s.login);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("amadou.traore@sltt.ml");
  const [password, setPassword] = useState("sltt2026");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      login();
    }, 700);
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left visual panel (60%) */}
      <div className="relative hidden md:flex md:w-[60%] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-12 text-white">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Decorative blurred blobs */}
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 size-80 rounded-full bg-emerald-400/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Truck className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">SLTT</p>
            <p className="text-xs text-blue-100/80">
              Société Traoré de Logistique, Transit et Transport
            </p>
          </div>
        </div>

        {/* Center message + illustration */}
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            Votre gestion logistique et financière, centralisée.
          </h1>
          <p className="mt-4 text-blue-100/90 leading-relaxed">
            Gérez vos dossiers de transit douanier, votre comptabilité,
            l'entreposage et les bons de sortie — le tout depuis une plateforme
            unique, claire et sécurisée.
          </p>

          {/* Line-art illustration */}
          <div className="mt-10 flex items-end gap-6 opacity-90">
            <svg
              viewBox="0 0 240 120"
              className="h-28 w-auto"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Warehouse */}
              <path d="M10 110 V50 L50 30 L90 50 V110 Z" />
              <path d="M10 110 H90" />
              <path d="M30 110 V70 H70 V110" />
              {/* Truck */}
              <path d="M110 110 V60 H160 V110" />
              <path d="M160 70 L195 70 L210 85 V110 H160" />
              <circle cx="125" cy="112" r="8" />
              <circle cx="185" cy="112" r="8" />
              {/* Container */}
              <rect x="100" y="40" width="40" height="18" rx="2" />
              <path d="M105 40 V58 M115 40 V58 M125 40 V58 M135 40 V58" />
            </svg>
          </div>
        </div>

        {/* Bottom badges */}
        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-100/80">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Données sécurisées
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="size-4" /> Conçu pour l'UEMOA
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-4" /> Accès réservé
          </span>
        </div>
      </div>

      {/* Right form panel (40%) */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-[40%] md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">SLTT</p>
              <p className="text-xs text-slate-500">Logistique · Transit</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Connexion à votre espace
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@sltt.ml"
                  className="h-11 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
              <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                Rester connecté
              </Label>
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Accès sécurisé · SLTT © 2026
          </p>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Démo — identifiants pré-remplis, cliquez sur « Se connecter ».
          </p>
        </div>
      </div>
    </div>
  );
}
