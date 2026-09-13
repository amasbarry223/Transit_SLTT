import type { ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir, SortKey } from "./shared";

export function SortableHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  align = "right",
}: {
  col: SortKey;
  label: ReactNode;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === col;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none bg-slate-50 text-xs font-medium uppercase hover:text-slate-900 dark:hover:text-slate-100",
        align === "right" ? "text-right text-muted-foreground" : "text-muted-foreground",
        active && "text-primary",
      )}
      onClick={() => onSort(col)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "w-full justify-end",
        )}
      >
        {align === "left" && <Icon className="size-3 shrink-0" />}
        {label}
        {align === "right" && <Icon className="size-3 shrink-0" />}
      </span>
    </TableHead>
  );
}
