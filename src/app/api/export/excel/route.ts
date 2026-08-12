import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser, AuthError } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import { normalizeExportRows } from "@/lib/export/normalize-export-cell";
import { buildXlsxBuffer } from "@/lib/export/xlsx-builder";
import {
  EXPORT_MODULE_PERMISSIONS,
  type ExportModule,
} from "@/lib/export/export-modules";
import {
  exportExcelBodySchema,
  zodErrorMessage,
} from "@/lib/api/schemas";

export const runtime = "nodejs";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Taille max d'une cellule exportée (anti-exfiltration de payloads énormes). */
const EXPORT_MAX_CELL_CHARS = 2_000;

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.(csv|xls|xlsx)$/i, "");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return safe || "export";
}

function assertCellSizes(rows: unknown[][], columnCount: number): void {
  for (const row of rows) {
    if (!Array.isArray(row)) {
      throw new AuthError("Format de lignes invalide.", 400);
    }
    if (row.length > columnCount) {
      throw new AuthError("Nombre de colonnes incohérent.", 400);
    }
    for (const cell of row) {
      const text =
        cell === null || cell === undefined
          ? ""
          : typeof cell === "string"
            ? cell
            : String(cell);
      if (text.length > EXPORT_MAX_CELL_CHARS) {
        throw new AuthError(
          `Contenu de cellule trop volumineux (max ${EXPORT_MAX_CELL_CHARS} caractères).`,
          400,
        );
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireUser(request);
    const isAdmin = profile.role === "Administrateur";
    const perms = normalizePermissions(profile.permissions ?? []);

    const raw = await request.json();
    const parsed = exportExcelBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }

    const { module, filename, headers, rows } = parsed.data;
    const requiredPerm = EXPORT_MODULE_PERMISSIONS[module as ExportModule];
    const canExport = isAdmin || perms.includes(requiredPerm);
    if (!canExport) {
      throw new AuthError(
        `Permission insuffisante pour exporter le module « ${module} » (${requiredPerm} requis).`,
        403,
      );
    }

    const columnCount = headers.length;
    assertCellSizes(rows as unknown[][], columnCount);
    const normalizedRows = normalizeExportRows(rows as unknown[][], columnCount);

    const safeName = sanitizeFilename(String(filename));
    const buffer = await buildXlsxBuffer(headers, normalizedRows);

    if (!buffer.length) {
      throw new AuthError("Génération du fichier Excel échouée.", 500);
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
        "Cache-Control": "no-store",
        "X-Export-Module": module,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
