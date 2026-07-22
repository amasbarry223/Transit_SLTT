"use client";

import { useEffect, useState } from "react";
import { useNav } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { useStore } from "@/lib/store";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
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
  Search,
  User as UserIcon,
  FileText,
  ClipboardList,
  Receipt,
  Plus,
  Wallet,
  FolderKanban,
  FileSignature,
} from "lucide-react";
import { usePermission, useCanView } from "@/hooks/use-permission";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const { goToDossier, goToDevis, goToFacture, goToContrat, goToClient } = useAppNavigation();

  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);
  const devisList = useStore((s) => s.devis);
  const factures = useStore((s) => s.factures);
  const contrats = useStore((s) => s.contrats);

  const visibleNavItems = useVisibleNavItems();
  const canCreateDossier = usePermission("dossiers:write");
  const canSeeDossiers = useCanView("dossiers");
  const canSeeDevis = useCanView("devis");
  const canSeeFactures = useCanView("factures");
  const canSeeContrats = useCanView("contrats");
  const canSeeClients = useCanView("clients");
  const canSeeCompta = useCanView("comptabilite");

  const quickActions = [
    canCreateDossier && {
      label: "Nouveau dossier",
      value: "action nouveau dossier",
      icon: FolderKanban,
      run: () => openDossier(null, "create"),
    },
    canSeeCompta && {
      label: "Ouvrir la comptabilité",
      value: "action comptabilite paiement",
      icon: Wallet,
      run: () => go("comptabilite"),
    },
    canSeeClients && {
      label: "Voir les clients",
      value: "action liste clients",
      icon: UserIcon,
      run: () => go("clients"),
    },
  ].filter(Boolean) as { label: string; value: string; icon: typeof Plus; run: () => void }[];

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
        className="hidden md:flex items-center gap-2 h-9 w-64 lg:w-80 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Search className="size-4" />
        <span>Rechercher un dossier, un client, une facture…</span>
        <kbd className="ml-auto pointer-events-none select-none rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center size-9 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Rechercher"
      >
        <Search className="size-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un écran, un dossier, un client, une facture, un contrat…" />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          {quickActions.length > 0 && (
            <CommandGroup heading="Actions rapides">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.value}
                    value={action.value}
                    onSelect={() => run(action.run)}
                  >
                    <Icon className="size-4 text-primary" />
                    <span>{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.key}
                  value={`page ${item.label}`}
                  onSelect={() => run(() => go(item.key))}
                >
                  <Icon className="size-4 text-slate-400 dark:text-slate-500" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {canSeeDossiers && dossiers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Dossiers de transit">
                {dossiers.slice(0, 8).map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`dossier ${d.reference} ${d.clientNom} ${d.bl} ${d.nature}`}
                    onSelect={() => run(() => goToDossier(d.id))}
                  >
                    <FileText className="size-4 text-blue-500" />
                    <span className="font-mono text-xs">{d.reference}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {d.clientNom}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {canSeeDevis && devisList.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Devis">
                {devisList.slice(0, 8).map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`devis ${d.reference} ${d.clientNom} ${d.nature}`}
                    onSelect={() => run(() => goToDevis(d.id))}
                  >
                    <ClipboardList className="size-4 text-indigo-500" />
                    <span className="font-mono text-xs">{d.reference}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {d.clientNom}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {canSeeFactures && factures.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Factures">
                {factures.slice(0, 8).map((f) => (
                  <CommandItem
                    key={f.id}
                    value={`facture ${f.numero} ${f.clientNom}`}
                    onSelect={() => run(() => goToFacture(f.id))}
                  >
                    <Receipt className="size-4 text-blue-500" />
                    <span className="font-mono text-xs">{f.numero}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {f.clientNom}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {canSeeContrats && contrats.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Contrats">
                {contrats.slice(0, 8).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`contrat ${c.reference} ${c.clientNom} ${c.objet}`}
                    onSelect={() => run(() => goToContrat(c.id))}
                  >
                    <FileSignature className="size-4 text-violet-500" />
                    <span className="font-mono text-xs">{c.reference}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {c.clientNom}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {canSeeClients && clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Clients">
                {clients.slice(0, 8).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`client ${c.nom} ${c.telephone} ${c.email}`}
                    onSelect={() => run(() => goToClient(c.id))}
                  >
                    <UserIcon className="size-4 text-emerald-500" />
                    <span>{c.nom}</span>
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
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
