import type { ResponsiveColumn } from "@/components/sltt/responsive-data-list";
import { formatDateShort } from "@/lib/format";
import { formatFileSize, getFileIconMeta } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { TAB_META, TYPE_DOC_BADGE, type UnifiedDoc } from "./shared";

export const ARCHIVE_COLUMNS: ResponsiveColumn<UnifiedDoc>[] = [
  {
    key: "nom",
    header: "Document",
    cell: (d) => {
      const { icon: Icon, wrapClass } = getFileIconMeta(d.mimeType);
      const cat = TAB_META.find((t) => t.key === d.category);
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              wrapClass,
            )}
          >
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{d.nom}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              <span className={cn("font-medium", cat?.accent)}>{d.rattachement}</span>
              {d.clientNom ? ` · ${d.clientNom}` : ""}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    key: "type",
    header: "Type",
    cell: (d) => (
      <span
        className={cn(
          "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
          TYPE_DOC_BADGE[d.typeDocument],
        )}
      >
        {d.typeDocument}
      </span>
    ),
  },
  {
    key: "societe",
    header: "Société",
    cell: (d) => d.societeNom || "—",
    hideOnMobile: true,
  },
  {
    key: "date",
    header: "Date",
    cell: (d) => formatDateShort(d.date),
  },
  {
    key: "taille",
    header: "Taille",
    cell: (d) => formatFileSize(d.taille),
    hideOnMobile: true,
  },
];
