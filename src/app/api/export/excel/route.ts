import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser, AuthError } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import {
  EXPORT_MODULE_PERMISSIONS,
  type ExportModule,
} from "@/lib/export/export-modules";
import {
  exportExcelBodySchema,
  zodErrorMessage,
} from "@/lib/api/schemas";

export const runtime = "nodejs";

/**
 * N'autorise que l'export d'un module — ne construit plus le fichier .xlsx
 * côté serveur (voir `src/lib/export/build-xlsx-client.ts`) : les données
 * sont déjà en mémoire côté client, inutile de les faire transiter par le
 * réseau pour les reconstruire en binaire ici. Cette route reste le seul
 * endroit qui vérifie la permission métier du module — ne pas la retirer.
 */
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

    const { module } = parsed.data;
    const requiredPerm = EXPORT_MODULE_PERMISSIONS[module as ExportModule];
    const canExport = isAdmin || perms.includes(requiredPerm);
    if (!canExport) {
      throw new AuthError(
        `Permission insuffisante pour exporter le module « ${module} » (${requiredPerm} requis).`,
        403,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
