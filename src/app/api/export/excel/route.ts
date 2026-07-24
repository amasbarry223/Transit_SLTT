import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth/require-admin";
import { normalizeExportRows } from "@/lib/export/normalize-export-cell";
import { buildXlsxBuffer } from "@/lib/export/xlsx-builder";

export const runtime = "nodejs";

const MAX_ROWS = 10_000;
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.(csv|xls|xlsx)$/i, "");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return safe || "export";
}

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);

    const body = (await request.json()) as {
      filename?: string;
      headers?: unknown;
      rows?: unknown;
    };

    const { filename = "export", headers, rows } = body;

    if (!Array.isArray(headers) || headers.length === 0) {
      return Response.json(
        { error: "En-têtes de colonnes requis." },
        { status: 400 },
      );
    }

    if (
      !headers.every((h) => typeof h === "string" && h.trim().length > 0)
    ) {
      return Response.json({ error: "En-têtes invalides." }, { status: 400 });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json(
        { error: "Aucune ligne à exporter." },
        { status: 400 },
      );
    }

    if (rows.length > MAX_ROWS) {
      return Response.json(
        { error: `Maximum ${MAX_ROWS} lignes par export.` },
        { status: 400 },
      );
    }

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
