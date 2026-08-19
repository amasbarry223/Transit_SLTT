"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, Moon, RotateCcw, Sun } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUiPrefs, type DateFormat } from "@/lib/session/ui-prefs-store";
import { useToast } from "@/hooks/use-toast";
import { toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
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
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";

export function PreferencesTab() {
  const { toast } = useToast();
  const refetchData = useStore((s) => s.refetchData);
  const dateFormat = useUiPrefs((s) => s.dateFormat);
  const setDateFormat = useUiPrefs((s) => s.setDateFormat);
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [cacheConfirmOpen, setCacheConfirmOpen] = useState(false);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Personnalisez le format de date et le thème.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <div className="space-y-5">
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="dfmt" className="text-sm font-medium text-foreground/90">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
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

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                {theme === "dark" ? <Moon className="size-4 text-muted-foreground" /> : <Sun className="size-4 text-muted-foreground" />}
                Thème sombre
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mode navy adouci — meilleur confort visuel en faible luminosité.
              </p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={() => toggleTheme()} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm border-border/80">
        <h3 className="text-sm font-semibold text-foreground">Guide de démarrage</h3>
        <p className="mt-1 text-xs text-muted-foreground">
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
              toastSuccess(toast, { title: "Guide réactivé", description: "Le guide est de nouveau visible sur le tableau de bord." });
            } catch {
              toastWarning(toast, { title: "Impossible de réactiver le guide" });
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
            <h3 className="text-sm font-semibold text-foreground">
              Synchroniser les données
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Vide le cache local puis recharge toutes les données depuis Supabase.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9"
              onClick={() => setCacheConfirmOpen(true)}
            >
              <RotateCcw className="size-4" />
              Vider le cache et recharger
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmActionDialog
        open={cacheConfirmOpen}
        onOpenChange={setCacheConfirmOpen}
        title="Vider le cache local et recharger ?"
        description="Les données en cache sur cet appareil seront effacées puis rechargées depuis Supabase. Les modifications non synchronisées pourraient être perdues."
        confirmLabel="Vider et recharger"
        onConfirm={async () => {
          try {
            localStorage.removeItem("sltt-data-v9");
            localStorage.removeItem("sltt-data-v10");
            await refetchData();
            toastSuccess(toast, { title: "Cache vidé", description: "Les données ont été rechargées depuis Supabase.", });
          } catch {
            toastWarning(toast, { title: "Échec du rechargement", description: "Impossible de recharger les données." });
          }
        }}
      />
    </div>
  );
}
