"use client";

import { useSession } from "@/lib/session/session-store";
import { api } from "@/lib/api-client";
import type { UserRole } from "@/lib/domain-types";

import { BRAND } from "@/lib/brand-colors";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pathForView } from "@/lib/app-navigation";
import { cn, getErrorMessage } from "@/lib/utils";
import { mapErrorToUserMessage } from "@/lib/error-messages";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { prefsFromProfile, useUiPrefs } from "@/lib/session/ui-prefs-store";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { InstallPWA } from "@/components/pwa/InstallPWA";



function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/bg.jpg')` }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `${BRAND.primary}8C` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(22,27,35,0.45)_100%)]" />
    </div>
  );
}

function mapRole(role: string): UserRole {
  switch (role) {
    case "ADMIN":
    case "Administrateur":
      return "Administrateur";
    case "TRANSITAIRE":
    case "AGENT_TRANSIT":
    case "Agent de transit":
      return "Agent de transit";
    case "COMPTABLE":
    case "Comptable":
      return "Comptable";
    case "MAGASINIER":
    case "Magasinier":
      return "Magasinier";
    default:
      return "Administrateur";
  }
}


export function LoginScreen() {
  const loginNav = useSession((s) => s.login);
  const router = useRouter();

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function signInWithCredentials(userEmail: string, userPassword: string) {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const authRes = await api.auth.login(userEmail.toLowerCase().trim(), userPassword);
      const user = authRes.user;

      if (!user) {
        setError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
        return;
      }

      const role = mapRole(user.role);
      loginNav(role, user.nom, user.id);
      router.replace(pathForView("dashboard"));
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Connexion impossible. Vérifiez que le serveur backend tourne.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWithCredentials(email, password);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="overflow-hidden rounded-2xl border border-white/25 bg-card/95 backdrop-blur-md shadow-[0_24px_80px_-12px_rgba(45,52,140,0.35)] dark:border-border/60">
          <div className="flex flex-col items-center px-8 pb-5 pt-8">
            <Image
              src="/logoV.png"
              alt="Transit"
              width={140}
              height={140}
              className="size-[124px] object-contain drop-shadow-md sm:size-[136px] transition-transform duration-300 hover:scale-105"
              priority
              unoptimized
            />
          </div>

          <Separator className="bg-border/60" />

          <div className="px-8 py-6">
            <div className="mb-5 text-center sm:text-left">
              <h2 className="text-lg font-bold text-foreground font-heading">
                Connexion à votre espace
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Plateforme logistique et gestion intégrale de transit SLTT.
              </p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground/90"
                >
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder={UI.placeholders.email}
                    className={cn(
                      "h-10.5 pl-10 bg-muted/40 transition-colors focus:bg-background",
                      error && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium text-foreground/90"
                  >
                    Mot de passe
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder={UI.placeholders.password}
                    className={cn(
                      "h-10.5 pl-10 pr-10 bg-muted/40 transition-colors focus:bg-background",
                      error && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold shadow-md shadow-primary/25 transition-all duration-200 active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? UI.loading.verifying : "Se connecter"}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                Mot de passe oublié ? Contactez l&apos;administrateur de votre société pour réinitialiser vos accès.
              </p>
            </form>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary/80" />
              <span>Accès sécurisé · Transit SLTT © {new Date().getFullYear()}</span>
            </div>

            <div className="mt-3">
              <InstallPWA variant="login" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
