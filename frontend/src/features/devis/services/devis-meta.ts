export interface DevisExtraMeta {
  ville?: string;
  pays?: string;
  numeroBordereau?: string;
}

/**
 * Encode les champs Ville, Pays, et N° de Bordereau de façon sécurisée
 * dans le champ textuel `notes` de Prisma pour assurer une persistance
 * sans migration de schéma destructive sur MySQL Hostinger.
 */
export function encodeDevisNotes(notes?: string, meta?: DevisExtraMeta): string {
  const cleanNotes = (notes || "").replace(/\[DEVIS_META:[^\]]*\]/g, "").trim();
  const metaObj: Record<string, string> = {};
  if (meta?.ville?.trim()) metaObj.ville = meta.ville.trim();
  if (meta?.pays?.trim()) metaObj.pays = meta.pays.trim();
  if (meta?.numeroBordereau?.trim()) metaObj.numeroBordereau = meta.numeroBordereau.trim();

  if (Object.keys(metaObj).length === 0) {
    return cleanNotes;
  }
  const tag = `[DEVIS_META:${JSON.stringify(metaObj)}]`;
  return cleanNotes ? `${cleanNotes}\n${tag}` : tag;
}

export function decodeDevisNotes(rawNotes?: string): { cleanNotes: string } & DevisExtraMeta {
  if (!rawNotes) return { cleanNotes: "" };
  const match = rawNotes.match(/\[DEVIS_META:([^\]]*)\]/);
  const cleanNotes = rawNotes.replace(/\[DEVIS_META:[^\]]*\]/g, "").trim();
  if (!match) {
    return { cleanNotes };
  }
  try {
    const meta = JSON.parse(match[1]);
    return {
      cleanNotes,
      ville: meta.ville || undefined,
      pays: meta.pays || undefined,
      numeroBordereau: meta.numeroBordereau || undefined,
    };
  } catch {
    return { cleanNotes };
  }
}
