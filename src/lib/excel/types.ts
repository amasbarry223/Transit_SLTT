export interface ExcelWorkbook {
  id: string;
  clientId: string;
  societeId?: string;
  nom: string;
  storagePath?: string;
  snapshotJson?: Record<string, unknown> | null;
  version: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelWorkbookRow {
  id: string;
  client_id: string;
  societe_id: string | null;
  nom: string;
  storage_path: string | null;
  snapshot_json: Record<string, unknown> | null;
  version: number | string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
