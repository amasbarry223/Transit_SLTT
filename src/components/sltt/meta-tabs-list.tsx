import { type LucideIcon } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface MetaTabItem<K extends string> {
  key: K;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  iconWrap: string;
  badge: string;
  /** Rendu à la place de l'icône lucide (ex: image) — a priorité sur `icon`. */
  renderIcon?: () => React.ReactNode;
}

/**
 * Rangée d'onglets à icône + badge de compte, à placer dans un <Tabs> parent
 * (juste au-dessus de <TabsList>). Facteur commun entre archives.tsx et
 * fournisseurs.tsx — le <Tabs> englobant reste dans chaque écran car son
 * usage de TabsContent diffère d'un écran à l'autre.
 */
export function MetaTabsList<K extends string>({
  items,
  counts,
  gridClassName,
}: {
  items: MetaTabItem<K>[];
  counts: Record<K, number>;
  gridClassName?: string;
}) {
  return (
    <TabsList
      className={cn(
        "grid h-auto w-full gap-1 rounded-xl bg-slate-100/90 p-1.5 dark:bg-slate-800/60",
        gridClassName ?? "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {items.map((t) => {
        const Icon = t.icon;
        return (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className={cn(
              "group h-auto flex-col items-stretch gap-1 rounded-lg px-3 py-2.5 text-left sm:px-4 sm:py-3",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/80",
              "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:ring-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between gap-2 sm:gap-3">
              <span className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    t.iconWrap,
                  )}
                >
                  {t.renderIcon ? t.renderIcon() : <Icon className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.shortLabel}</span>
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  t.badge,
                )}
              >
                {counts[t.key]}
              </span>
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
