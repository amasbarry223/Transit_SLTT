import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser, AuthError } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import { normalizeExportRows } from "@/lib/export/normalize-export-cell";
import { buildXlsxBuffer } from "@/lib/export/xlsx-builder";
import {
  exportExcelBodySchema,
  zodErrorMessage,
} from "@/lib/api/schemas";

export const runtime = "nodejs";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Au moins une permission de lecture métier pour exporter. */
const EXPORT_PERMISSIONS = [
  "clients:read",
  "dossiers:read",
  "factures:read",
  "devis:read",
  "comptabilite:read",
  "stock:read",
  "contrats:read",
] as const;

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.(csv|xls|xlsx)$/i, "");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return safe || "export";
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireUser(request);
    const isAdmin = profile.role === "Administrateur";
    const perms = normalizePermissions(profile.permissions ?? []);
    const canExport =
      isAdmin || EXPORT_PERMISSIONS.some((p) => perms.includes(p));
    if (!canExport) {
      throw new AuthError(
        "Permission insuffisante pour exporter (lecture métier requise).",
        403,
      );
    }

    const raw = await request.json();
    const parsed = exportExcelBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }

    const { filename, headers, rows } = parsed.data;
    const columnCount = headers.length;
    const normalizedRows = normalizeExportRows(rows as unknown[][], columnCount);

    const safeName = sanitizeFilename(String(filename));
    const buffer = await buildXlsxBuffer(headers, normalizedRows);

    if (!buffer.length) {
      return Response.json(
        { error: "Génération du fichier Excel échouée." },
        { status: 500 },
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
