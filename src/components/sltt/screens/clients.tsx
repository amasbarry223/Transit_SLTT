"use client";

import { useMemo, useState } from "react";
import { UserPlus, Search, Eye, Pencil } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { clients } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export function ClientsScreen() {
  const openClient = useNav((s) => s.openClient);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.telephone, c.email, c.adresse]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Annuaire et fiches clients">
        <Button>
          <UserPlus className="size-4" />
          Nouveau client
        </Button>
      </PageHeader>

      {/* Search bar */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="relative w-full sm:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, e-mail…"
            className="pl-9"
            aria-label="Rechercher un client"
          />
        </div>
      </Card>

      {/* Clients table */}
      <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Nom / Raison sociale
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Téléphone
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Adresse
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500 text-center">
                Nb dossiers
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                Total dû
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-b border-border">
                <TableCell colSpan={7} className="text-center text-slate-500 py-10">
                  Aucun client ne correspond à votre recherche.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/60 border-b border-border"
                >
                  <TableCell className="py-3">
                    <button
                      onClick={() => openClient(c.id)}
                      className="font-medium text-slate-900 hover:text-primary hover:underline text-left"
                    >
                      {c.nom}
                    </button>
                  </TableCell>
                  <TableCell className="py-3">
                    <ToneBadge tone={c.type === "Entreprise" ? "blue" : "slate"}>
                      {c.type}
                    </ToneBadge>
                  </TableCell>
                  <TableCell className="py-3 text-slate-600 font-mono text-xs">
                    {c.telephone}
                  </TableCell>
                  <TableCell className="py-3 text-slate-600">
                    <span className="block max-w-[220px] truncate" title={c.adresse}>
                      {c.adresse}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center tabular-nums text-slate-700">
                    {c.nbDossiers}
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums">
                    {c.totalDu > 0 ? (
                      <span className="font-medium text-amber-600">
                        {formatFCFA(c.totalDu)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:text-primary"
                        onClick={() => openClient(c.id)}
                        aria-label={`Voir la fiche de ${c.nom}`}
                        title="Voir la fiche"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:text-primary"
                        aria-label={`Modifier ${c.nom}`}
                        title="Modifier"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
