"use client";

import { useEffect, useState } from "react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Warehouse,
  FileOutput,
  Users,
  BarChart3,
  Settings,
  Search,
  User as UserIcon,
  FileText,
} from "lucide-react";

const navItems: {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "dossiers", label: "Dossiers de transit", icon: FolderKanban },
  { key: "comptabilite", label: "Comptabilité", icon: Wallet },
  { key: "entreposage", label: "Entreposage", icon: Warehouse },
  { key: "bons", label: "Bons de sortie", icon: FileOutput },
  { key: "clients", label: "Clients", icon: Users },
  { key: "bilans", label: "Bilans & rapports", icon: BarChart3 },
  { key: "parametres", label: "Paramètres", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const openClient = useNav((s) => s.openClient);

  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function run(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 w-64 lg:w-80 rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-400 hover:bg-slate-100 transition-colors"
      >
        <Search className="size-4" />
        <span>Rechercher un dossier, un client…</span>
        <kbd className="ml-auto pointer-events-none select-none rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center size-9 rounded-md text-slate-500 hover:bg-slate-100"
        aria-label="Rechercher"
      >
        <Search className="size-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un écran, un dossier, un client…" />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          <CommandGroup heading="Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.key}
                  value={`page ${item.label}`}
                  onSelect={() => run(() => go(item.key))}
                >
                  <Icon className="size-4 text-slate-400" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {dossiers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Dossiers de transit">
                {dossiers.slice(0, 8).map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`dossier ${d.reference} ${d.clientNom} ${d.bl} ${d.nature}`}
                    onSelect={() => run(() => openDossier(d.id, "edit"))}
                  >
                    <FileText className="size-4 text-blue-500" />
                    <span className="font-mono text-xs">{d.reference}</span>
                    <span className="text-slate-500 truncate">
                      {d.clientNom}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Clients">
                {clients.slice(0, 8).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`client ${c.nom} ${c.telephone} ${c.email}`}
                    onSelect={() => run(() => openClient(c.id))}
                  >
                    <UserIcon className="size-4 text-emerald-500" />
                    <span>{c.nom}</span>
                    <span className="ml-auto text-xs text-slate-400">
                      {c.type}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
