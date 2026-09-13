"use client";

import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  type ColDef,
  type GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import type { ClasseurEntry } from "@/lib/classeur";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { cn } from "@/shared/utils/cn";

ModuleRegistry.registerModules([AllCommunityModule]);

type ClasseurGridProps = {
  rows: ClasseurEntry[];
  onRowClick: (entry: ClasseurEntry) => void;
  className?: string;
};

/**
 * Grille du classeur — lecture seule. Le classeur est une vue calculée du
 * grand livre client (dossiers + écritures + factures) ; les montants se
 * modifient depuis leur source (fiche dossier, facture, écriture comptable),
 * pas ici.
 */
export function ClasseurGrid({ rows, onRowClick, className }: ClasseurGridProps) {
  const gridRef = useRef<AgGridReact<ClasseurEntry>>(null);

  const columnDefs = useMemo<ColDef<ClasseurEntry>[]>(
    () => [
      {
        field: "date",
        headerName: "Date",
        width: 110,
        pinned: "left",
        valueFormatter: (p) => (p.value ? formatDateShort(String(p.value)) : ""),
      },
      { field: "type", headerName: "Type", width: 100 },
      { field: "reference", headerName: "Référence", width: 140 },
      { field: "libelle", headerName: "Libellé", flex: 1, minWidth: 180 },
      {
        field: "debit",
        headerName: "Débit",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => (p.value > 0 ? formatFCFA(Number(p.value)) : "—"),
      },
      {
        field: "credit",
        headerName: "Crédit",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => (p.value > 0 ? formatFCFA(Number(p.value)) : "—"),
      },
      {
        field: "soldeCumule",
        headerName: "Solde",
        width: 120,
        valueFormatter: (p) => formatFCFA(Number(p.value)),
        cellClass: (p) =>
          Number(p.value) > 0
            ? "text-amber-700 font-semibold"
            : "text-emerald-700 font-semibold",
      },
      { field: "statut", headerName: "Statut", width: 110 },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      editable: false,
    }),
    [],
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
        onGridReady={onGridReady}
        onRowClicked={(e) => {
          if (e.data) onRowClick(e.data);
        }}
      />
      <p className="mt-1 px-1 text-[11px] text-slate-400">
        Cliquez sur une ligne pour voir son suivi. Les montants se modifient depuis leur source
        (dossier, facture, écriture).
      </p>
    </div>
  );
}
