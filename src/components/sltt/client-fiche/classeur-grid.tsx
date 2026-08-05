"use client";

import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  type CellValueChangedEvent,
  type ColDef,
  type GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import type { ClasseurEntry } from "@/lib/classeur";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

type ClasseurGridProps = {
  rows: ClasseurEntry[];
  onRowClick: (entry: ClasseurEntry) => void;
  onDataChanged?: () => void;
  className?: string;
};

export function ClasseurGrid({ rows, onRowClick, onDataChanged, className }: ClasseurGridProps) {
  const { toast } = useToast();
  const gridRef = useRef<AgGridReact<ClasseurEntry>>(null);
  const canEditDossier = usePermission("dossiers:write");
  const canEditCompta = usePermission("comptabilite:write");
  const canEditFacture = usePermission("factures:write");

  const patchDossierClasseur = useStore((s) => s.patchDossierClasseur);
  const patchEcriture = useStore((s) => s.patchEcriture);
  const patchFactureMontantPaye = useStore((s) => s.patchFactureMontantPaye);

  const columnDefs = useMemo<ColDef<ClasseurEntry>[]>(
    () => [
      {
        field: "date",
        headerName: "Date",
        width: 110,
        pinned: "left",
        editable: false,
        valueFormatter: (p) => (p.value ? formatDateShort(String(p.value)) : ""),
      },
      {
        field: "societeNom",
        headerName: "Société",
        width: 140,
        editable: false,
      },
      {
        field: "type",
        headerName: "Type",
        width: 100,
        editable: false,
      },
      {
        field: "reference",
        headerName: "Référence",
        width: 140,
        editable: false,
      },
      {
        field: "libelle",
        headerName: "Libellé",
        flex: 1,
        minWidth: 180,
        editable: (p) => {
          // Libellé Dossier reconstruit depuis nature+bl (buildDossierLibelle) : non
          // éditable ici pour éviter un reparsing regex fragile qui échouerait
          // silencieusement dès que le texte retapé ne suit plus exactement le
          // gabarit "Dossier transit — {nature} · BL {bl}". Modifier nature/BL
          // depuis la fiche dossier.
          if (p.data?.type === "Paiement") return canEditCompta;
          return false;
        },
      },
      {
        field: "debit",
        headerName: "Débit",
        width: 120,
        type: "numericColumn",
        editable: (p) => {
          if (p.data?.type === "Dossier") return canEditDossier;
          if (p.data?.type === "Paiement") return canEditCompta;
          return false;
        },
        valueFormatter: (p) => (p.value > 0 ? formatFCFA(Number(p.value)) : "—"),
        valueParser: (p) => Number(String(p.newValue).replace(/\s/g, "").replace(",", ".")) || 0,
      },
      {
        field: "credit",
        headerName: "Crédit",
        width: 120,
        type: "numericColumn",
        editable: (p) => {
          if (p.data?.type === "Dossier") return canEditDossier;
          if (p.data?.type === "Paiement") return canEditCompta;
          if (p.data?.type === "Facture") return canEditFacture;
          return false;
        },
        valueFormatter: (p) => (p.value > 0 ? formatFCFA(Number(p.value)) : "—"),
        valueParser: (p) => Number(String(p.newValue).replace(/\s/g, "").replace(",", ".")) || 0,
      },
      {
        field: "soldeCumule",
        headerName: "Solde",
        width: 120,
        editable: false,
        valueFormatter: (p) => formatFCFA(Number(p.value)),
        cellClass: (p) =>
          Number(p.value) > 0
            ? "text-amber-700 font-semibold"
            : "text-emerald-700 font-semibold",
      },
      {
        field: "statut",
        headerName: "Statut",
        width: 110,
        editable: false,
      },
    ],
    [canEditDossier, canEditCompta, canEditFacture],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent<ClasseurEntry>) => {
      const entry = event.data;
      if (!entry) return;
      const field = event.colDef.field;
      if (!field) return;

      try {
        if (entry.type === "Dossier") {
          if (field === "debit") {
            await patchDossierClasseur(entry.sourceId, { montantInvesti: Number(event.newValue) });
          } else if (field === "credit") {
            await patchDossierClasseur(entry.sourceId, { montantPaye: Number(event.newValue) });
          }
        } else if (entry.type === "Paiement") {
          if (field === "debit") {
            await patchEcriture(entry.sourceId, { montantInvesti: Number(event.newValue) });
          } else if (field === "credit") {
            await patchEcriture(entry.sourceId, { montantPaye: Number(event.newValue) });
          } else if (field === "libelle") {
            await patchEcriture(entry.sourceId, { note: String(event.newValue || "") });
          }
        } else if (entry.type === "Facture" && field === "credit") {
          await patchFactureMontantPaye(entry.sourceId, Number(event.newValue));
        }

        toast({ title: "Modification enregistrée" });
        onDataChanged?.();
      } catch (e) {
        toast({
          title: "Enregistrement impossible",
          description: e instanceof Error ? e.message : "Erreur",
          variant: "destructive",
        });
        event.node.setDataValue(field, event.oldValue);
      }
    },
    [patchDossierClasseur, patchEcriture, patchFactureMontantPaye, toast, onDataChanged],
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <div className={cn("w-full", className)} style={{ height: 420 }}>
      <AgGridReact<ClasseurEntry>
        ref={gridRef}
        theme={themeQuartz}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows
        getRowId={(p) => p.data.id}
        onCellValueChanged={onCellValueChanged}
        onGridReady={onGridReady}
        onRowClicked={(e) => {
          if (e.data && !(e.event as MouseEvent | undefined)?.defaultPrevented) {
            // Double-clic / édition : ne pas ouvrir le suivi immédiatement
          }
        }}
        onRowDoubleClicked={(e) => {
          if (e.data) onRowClick(e.data);
        }}
        stopEditingWhenCellsLoseFocus
        singleClickEdit
      />
      <p className="mt-1 px-1 text-[11px] text-slate-400">
        Double-clic sur une ligne pour le suivi. Éditez débit / crédit / libellé selon vos
        permissions.
      </p>
    </div>
  );
}
