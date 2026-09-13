"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  DollarSign,
  Package,
  Shield,
  Building,
  Save,
  CheckCircle2,
  RefreshCw,
  Info,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useConfig, updateLocalConfig } from "@/shared/hooks/useConfig";
import { useToast } from "@/shared/hooks/use-toast";
import { toastSuccess, toastError } from "@/shared/utils/toast-helpers";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";

export function ConfigurationTab() {
  const { toast } = useToast();
  const { config, isLoading: isConfigLoading, refetch } = useConfig();

  // Local state for editable settings
  const [formData, setFormData] = useState({
    // Facturation & Finance
    taux_tva_defaut: "18",
    devise_principale: "FCFA (XOF)",
    delai_echeance_jours: "30",
    commission_rate: "5",

    // Entrepôt & Fichiers
    default_stock_seuil: "10",
    max_upload_size_mb: "10",

    // Sécurité & Sessions
    session_timeout_min: "60",
    security_mfa_enabled: false,

    // Application & Identité
    app_title: "SLTT - Transit & Logistique",
    app_subtitle: "Société Logistique Transit Transport",
    welcome_message: "Plateforme de gestion opérationnelle SLTT",
    support_email: "contact@sltt.ml",
    company_phone: "+223 20 22 00 00",
    maintenance_mode: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync formData with loaded config
  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      setFormData((prev) => ({
        ...prev,
        taux_tva_defaut: config.taux_tva_defaut?.toString() ?? prev.taux_tva_defaut,
        devise_principale: config.devise_principale ?? prev.devise_principale,
        delai_echeance_jours: config.delai_echeance_jours?.toString() ?? prev.delai_echeance_jours,
        commission_rate: config.commission_rate?.toString() ?? prev.commission_rate,
        default_stock_seuil: config.default_stock_seuil?.toString() ?? prev.default_stock_seuil,
        max_upload_size_mb: config.max_upload_size_mb?.toString() ?? prev.max_upload_size_mb,
        session_timeout_min: config.session_timeout_min?.toString() ?? prev.session_timeout_min,
        security_mfa_enabled:
          config.security_mfa_enabled === true || config.security_mfa_enabled === "true",
        app_title: config.app_title ?? prev.app_title,
        app_subtitle: config.app_subtitle ?? prev.app_subtitle,
        welcome_message: config.welcome_message ?? prev.welcome_message,
        support_email: config.support_email ?? prev.support_email,
        company_phone: config.company_phone ?? prev.company_phone,
        maintenance_mode:
          config.maintenance_mode === true || config.maintenance_mode === "true",
      }));
    }
  }, [config]);

  const handleChange = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Build settings list to persist
      const settingsPayload: Record<string, string> = {
        taux_tva_defaut: String(formData.taux_tva_defaut),
        devise_principale: String(formData.devise_principale),
        delai_echeance_jours: String(formData.delai_echeance_jours),
        commission_rate: String(formData.commission_rate),
        default_stock_seuil: String(formData.default_stock_seuil),
        max_upload_size_mb: String(formData.max_upload_size_mb),
        session_timeout_min: String(formData.session_timeout_min),
        security_mfa_enabled: String(formData.security_mfa_enabled),
        app_title: String(formData.app_title),
        app_subtitle: String(formData.app_subtitle),
        welcome_message: String(formData.welcome_message),
        support_email: String(formData.support_email),
        company_phone: String(formData.company_phone),
        maintenance_mode: String(formData.maintenance_mode),
      };

      await api.settings.setMany(settingsPayload);

      // Met à jour le cache local pour réactivité immédiate sans rechargement
      Object.entries(settingsPayload).forEach(([k, v]) => {
        updateLocalConfig(k, v);
      });

      await refetch();
      setIsDirty(false);
      toastSuccess(toast, {
        title: "Configuration enregistrée",
        description: "Toutes les variables dynamiques ont été mises à jour en base de données.",
      });
    } catch (err: any) {
      toastError(toast, err, {
        title: "Erreur",
        fallback: "Échec de l'enregistrement de la configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
            <Sliders className="size-5 text-primary" />
            Configuration Système & Variables Globales
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez toutes les règles métiers, taux par défaut et métadonnées applicatives sans redéploiement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Modifications non enregistrées
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isConfigLoading || isSaving}
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isConfigLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !isDirty}
            className="gap-1.5"
          >
            <Save className="size-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1 : Facturation & Finance */}
        <Card className="p-5 shadow-sm border-border/80">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Facturation & Finance</h3>
              <p className="text-xs text-muted-foreground">TVA légale, délais de paiement et devise</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="taux_tva_defaut" className="text-xs font-medium">
                  Taux TVA par défaut (%)
                </Label>
                <Input
                  id="taux_tva_defaut"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taux_tva_defaut}
                  onChange={(e) => handleChange("taux_tva_defaut", e.target.value)}
                  className="h-9"
                  placeholder="18"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="commission_rate" className="text-xs font-medium">
                  Commission de transit (%)
                </Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => handleChange("commission_rate", e.target.value)}
                  className="h-9"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="delai_echeance_jours" className="text-xs font-medium">
                  Délai d&apos;échéance (jours)
                </Label>
                <Input
                  id="delai_echeance_jours"
                  type="number"
                  min="0"
                  value={formData.delai_echeance_jours}
                  onChange={(e) => handleChange("delai_echeance_jours", e.target.value)}
                  className="h-9"
                  placeholder="30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="devise_principale" className="text-xs font-medium">
                  Devise principale
                </Label>
                <Input
                  id="devise_principale"
                  type="text"
                  value={formData.devise_principale}
                  onChange={(e) => handleChange("devise_principale", e.target.value)}
                  className="h-9"
                  placeholder="FCFA (XOF)"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2 : Entrepôt, Stock & Uploads */}
        <Card className="p-5 shadow-sm border-border/80">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Package className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stock, Entrepôt & Fichiers</h3>
              <p className="text-xs text-muted-foreground">Seuils de réapprovisionnement et quotas fichiers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="default_stock_seuil" className="text-xs font-medium">
                Seuil d&apos;alerte stock minimum
              </Label>
              <Input
                id="default_stock_seuil"
                type="number"
                min="1"
                value={formData.default_stock_seuil}
                onChange={(e) => handleChange("default_stock_seuil", e.target.value)}
                className="h-9"
                placeholder="10"
              />
              <p className="text-[11px] text-muted-foreground">
                Déclenche un indicateur visuel dès qu&apos;un article passe sous cette quantité.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max_upload_size_mb" className="text-xs font-medium">
                Taille max par fichier (Mo)
              </Label>
              <Input
                id="max_upload_size_mb"
                type="number"
                min="1"
                max="50"
                value={formData.max_upload_size_mb}
                onChange={(e) => handleChange("max_upload_size_mb", e.target.value)}
                className="h-9"
                placeholder="10"
              />
              <p className="text-[11px] text-muted-foreground">
                Limite pour les documents Sydonia, connaissements et fiches douanières.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 3 : Sécurité & Paramètres de Session */}
        <Card className="p-5 shadow-sm border-border/80">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Shield className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sécurité & Sessions</h3>
              <p className="text-xs text-muted-foreground">Expiration de token et contrôle d&apos;accès</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="session_timeout_min" className="text-xs font-medium">
                Délai d&apos;expiration de session (minutes)
              </Label>
              <Input
                id="session_timeout_min"
                type="number"
                min="5"
                max="1440"
                value={formData.session_timeout_min}
                onChange={(e) => handleChange("session_timeout_min", e.target.value)}
                className="h-9"
                placeholder="60"
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/80 bg-muted/20">
              <div>
                <p className="text-xs font-medium text-foreground">Authentification 2FA renforcée</p>
                <p className="text-[11px] text-muted-foreground">
                  Exiger un code de vérification pour les postes comptabilité et douane
                </p>
              </div>
              <Switch
                checked={formData.security_mfa_enabled}
                onCheckedChange={(v) => handleChange("security_mfa_enabled", v)}
              />
            </div>
          </div>
        </Card>

        {/* Section 4 : Application & Informations Publiques */}
        <Card className="p-5 shadow-sm border-border/80">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Building className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Application & Identité SLTT</h3>
              <p className="text-xs text-muted-foreground">Noms affichés sur les fiches et coordonnées de contact</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="app_title" className="text-xs font-medium">
                  Nom court
                </Label>
                <Input
                  id="app_title"
                  type="text"
                  value={formData.app_title}
                  onChange={(e) => handleChange("app_title", e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="support_email" className="text-xs font-medium">
                  Email assistance
                </Label>
                <Input
                  id="support_email"
                  type="email"
                  value={formData.support_email}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="welcome_message" className="text-xs font-medium">
                Message d&apos;accueil / Slogan
              </Label>
              <Input
                id="welcome_message"
                type="text"
                value={formData.welcome_message}
                onChange={(e) => handleChange("welcome_message", e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <p className="text-xs font-medium text-foreground">Mode maintenance</p>
                <p className="text-[11px] text-muted-foreground">
                  Restreint l&apos;accès à l&apos;application aux seuls administrateurs système
                </p>
              </div>
              <Switch
                checked={formData.maintenance_mode}
                onCheckedChange={(v) => handleChange("maintenance_mode", v)}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 text-primary shrink-0" />
          <span>
            Toutes les valeurs saisies sont stockées dans la table <code>settings</code> et répercutées instantanément sur les formulaires de factures, devis, stocks et calculs.
          </span>
        </div>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="shrink-0 gap-1.5"
        >
          <CheckCircle2 className="size-4" />
          {isSaving ? "Enregistrement..." : "Appliquer les paramètres"}
        </Button>
      </div>
    </form>
  );
}
