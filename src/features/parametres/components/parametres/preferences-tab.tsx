"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, Moon, RotateCcw, Sun } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUiPrefs, type DateFormat } from "@/lib/session/ui-prefs-store";
import { useToast } from "@/shared/hooks/use-toast";
import { toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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

      <Card className="p-6 shadow-sm border-destructive/20">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Recharger les données
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Relance la lecture de toutes les données depuis le serveur.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9"
              onClick={() => setCacheConfirmOpen(true)}
            >
              <RotateCcw className="size-4" />
              Recharger depuis le serveur
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmActionDialog
        open={cacheConfirmOpen}
        onOpenChange={setCacheConfirmOpen}
        title="Recharger les données depuis le serveur ?"
        description="Toutes les données affichées seront relues depuis la base. Les modifications non enregistrées pourraient être perdues."
        confirmLabel="Recharger"
        onConfirm={async () => {
          try {
            await refetchData();
            toastSuccess(toast, { title: "Données rechargées", description: "Les données ont été relues depuis le serveur.", });
          } catch {
            toastWarning(toast, { title: "Échec du rechargement", description: "Impossible de recharger les données." });
          }
        }}
      />
    </div>
  );
}
