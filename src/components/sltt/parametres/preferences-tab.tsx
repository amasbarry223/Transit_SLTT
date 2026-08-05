"use client";

import { AlertTriangle, Bell, Calendar, Coins, Globe, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUiPrefs, type CurrencyLabel, type DateFormat } from "@/lib/session/ui-prefs-store";
import { useToast } from "@/hooks/use-toast";
import { GUIDE_DISMISS_KEY, emitGuideReset } from "@/lib/guide-progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PreferencesTab() {
  const { toast } = useToast();
  const refetchData = useStore((s) => s.refetchData);
  const dateFormat = useUiPrefs((s) => s.dateFormat);
  const setDateFormat = useUiPrefs((s) => s.setDateFormat);
  const currencyLabel = useUiPrefs((s) => s.currencyLabel);
  const setCurrencyLabel = useUiPrefs((s) => s.setCurrencyLabel);
  const notificationsEmail = useUiPrefs((s) => s.notificationsEmail);
  const setNotificationsEmail = useUiPrefs((s) => s.setNotificationsEmail);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Personnalisez la langue, les formats et les notifications.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 opacity-60">
              <Label htmlFor="lang" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Langue
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    Bientôt
                  </span>
                </span>
              </Label>
              <Select defaultValue="fr" disabled>
                <SelectTrigger id="lang" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bmb">Bambara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dfmt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Format de date
                </span>
              </Label>
              <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
                <SelectTrigger id="dfmt" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dmy">JJ/MM/AAAA</SelectItem>
                  <SelectItem value="mdy">MM/JJ/AAAA</SelectItem>
                  <SelectItem value="ymd">AAAA-MM-JJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cur" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="size-3.5 text-slate-400 dark:text-slate-500" />
                  Devise
                </span>
              </Label>
              <Select value={currencyLabel} onValueChange={(v) => setCurrencyLabel(v as CurrencyLabel)}>
                <SelectTrigger id="cur" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="XOF">XOF</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                FCFA et XOF désignent la même monnaie — seul le libellé affiché change.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                <Bell className="size-4 text-slate-400 dark:text-slate-500" />
                Notifications par e-mail
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recevez un message à chaque dossier en attente ou alerte de stock.
              </p>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                Préférence enregistrée dès maintenant ; l&apos;envoi effectif des e-mails sera activé
                dans une prochaine mise à jour.
              </p>
            </div>
            <Switch checked={notificationsEmail} onCheckedChange={setNotificationsEmail} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm border-border/80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Guide de démarrage</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Réaffichez le guide « Par où commencer ? » sur le tableau de bord.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => {
            try {
              localStorage.removeItem(GUIDE_DISMISS_KEY);
              emitGuideReset();
              toast({ title: "Guide réactivé", description: "Le guide est de nouveau visible sur le tableau de bord." });
            } catch {
              toast({ title: "Impossible de réactiver le guide", variant: "destructive" });
            }
          }}
        >
          Réafficher le guide
        </Button>
      </Card>

      <Card className="p-6 shadow-sm border-destructive/20">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Synchroniser les données
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Vide le cache local puis recharge toutes les données depuis Supabase.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9"
              onClick={async () => {
                try {
                  localStorage.removeItem("sltt-data-v9");
                  localStorage.removeItem("sltt-data-v10");
                  await refetchData();
                  toast({
                    title: "Cache vidé",
                    description: "Les données ont été rechargées depuis Supabase.",
                  });
                } catch {
                  toast({
                    title: "Échec du rechargement",
                    description: "Impossible de recharger les données.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <RotateCcw className="size-4" />
              Vider le cache et recharger
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
