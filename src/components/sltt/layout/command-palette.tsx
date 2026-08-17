"use client";

import { useEffect, useState } from "react";
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
import { UI } from "@/lib/ui-messages";
import {
  Search,
  User as UserIcon,
  FileText,
  ClipboardList,
  Receipt,
  Plus,
  Wallet,
  FileSignature,
  ScrollText,
  FolderKanban,
} from "lucide-react";
import { usePermission, useCanView } from "@/hooks/use-permission";
import type { NavItem } from "@/lib/nav-items";

type QuickAction = {
  label: string;
  value: string;
  icon: typeof Plus;
  section: string;
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const {
    goToDossier,
    goToDevis,
    goToFacture,
    goToContrat,
    goToClient,
    goToView,
    goToNewDossier,
    goToNewDevis,
    goToNewFacture,
    goToNewRecu,
    goToCompta,
  } = useAppNavigation();

  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);
  const devisList = useStore((s) => s.devis);
  const factures = useStore((s) => s.factures);
  const contrats = useStore((s) => s.contrats);

  const visibleNavItems = useVisibleNavItems();
  const canCreateDossier = usePermission("dossiers:write");
  const canCreateDevis = usePermission("devis:write");
  const canCreateFacture = usePermission("factures:write");
  const canCreateRecu = usePermission("recus-paiement:write");
  const canSeeDossiers = useCanView("dossiers");
  const canSeeDevis = useCanView("devis");
  const canSeeFactures = useCanView("factures");
  const canSeeContrats = useCanView("contrats");
  const canSeeClients = useCanView("clients");
  const canSeeCompta = useCanView("comptabilite");
  const canSeeRecus = useCanView("recus-paiement");

  const quickActions = [
    canCreateDossier && {
      label: "Nouveau dossier",
      value: "action nouveau dossier transit",
      icon: FolderKanban,
      section: "Cycle commercial",
      run: () => goToNewDossier(),
    },
    canCreateDevis && {
      label: "Nouveau devis",
      value: "action nouveau devis",
      icon: ClipboardList,
      section: "Cycle commercial",
      run: () => goToNewDevis(),
    },
    canCreateFacture && {
      label: "Nouvelle facture",
      value: "action nouvelle facture",
      icon: Receipt,
      section: "Cycle commercial",
      run: () => goToNewFacture(),
    },
    canSeeRecus && canCreateRecu && {
      label: "Nouveau reçu de paiement",
      value: "action nouveau recu paiement",
      icon: FileText,
      section: "Finance",
      run: () => goToNewRecu(),
    },
    canSeeCompta && {
      label: "Paiements dossiers",
      value: "action comptabilite ecritures",
      icon: Wallet,
      section: "Finance",
      run: () => goToCompta("ecritures"),
    },
    canSeeCompta && {
      label: "Journal de caisse",
      value: "action journal caisse",
      icon: ScrollText,
      section: "Finance",
      run: () => goToCompta("journal"),
    },
    canSeeClients && {
      label: "Voir les clients",
      value: "action liste clients",
      icon: UserIcon,
      section: "Cycle commercial",
      run: () => goToView("clients"),
    },
  ].filter(Boolean) as QuickAction[];

  const actionsBySection = quickActions.reduce<Record<string, QuickAction[]>>((acc, action) => {
    acc[action.section] = acc[action.section] ?? [];
    acc[action.section].push(action);
    return acc;
  }, {});

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

  function navigateToItem(item: NavItem) {
    goToView(item.key, item.comptaTab ? { comptaTab: item.comptaTab } : undefined);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 w-64 lg:w-80 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="size-4" />
        <span>Rechercher un dossier, un client, une facture…</span>
        <kbd className="ml-auto pointer-events-none select-none rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-600 bg-muted/40 dark:text-slate-400">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center size-9 rounded-md text-muted-foreground dark:hover:text-slate-400 hover:bg-muted"
        aria-label="Rechercher"
      >
        <Search className="size-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={UI.placeholders.searchGlobal} />
        <CommandList>
          <CommandEmpty>{UI.empty.search.title}. {UI.empty.search.description}</CommandEmpty>

          {Object.entries(actionsBySection).map(([section, actions]) => (
            <CommandGroup key={section} heading={`Actions — ${section}`}>
              {actions.map((action) => {
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
          ))}

          {quickActions.length > 0 && <CommandSeparator />}

          <CommandGroup heading="Navigation">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.navId}
                  value={`page ${item.label} ${item.section ?? ""}`}
                  onSelect={() => run(() => navigateToItem(item))}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.section && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.section}</span>
                  )}
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
                    <span className="text-muted-foreground truncate">
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
                    <span className="text-muted-foreground truncate">
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
                    <span className="text-muted-foreground truncate">
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
                    <span className="text-muted-foreground truncate">
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
                    <span className="ml-auto text-xs text-muted-foreground">
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
