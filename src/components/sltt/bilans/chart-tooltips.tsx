import { formatFCFA } from "@/lib/format";

interface ChartPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white bg-muted/40 p-3 text-sm shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {formatFCFA(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PiePayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; color: string };
}

export function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PiePayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white bg-muted/40 p-3 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="text-muted-foreground">{p.name}</span>
        <span className="ml-auto font-medium tabular-nums text-foreground">
          {formatFCFA(p.value)}
        </span>
      </div>
    </div>
  );
}
