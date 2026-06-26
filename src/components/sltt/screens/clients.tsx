"use client";

import { useMemo, useState } from "react";
import { UserPlus, Search, Eye, Pencil, X, Check } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/lib/store";
import type { ClientType } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/sltt/page-header";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const clientTypes: ClientType[] = ["Entreprise", "Particulier"];

export function ClientsScreen() {
  const { toast } = useToast();
  const openClient = useNav((s) => s.openClient);
  const clients = useStore((s) => s.clients);
  const addClient = useStore((s) => s.addClient);

  const [query, setQuery] = useState("");

  // Creation dialog state
  const [open, setOpen] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formType, setFormType] = useState<ClientType>("Entreprise");
  const [formTelephone, setFormTelephone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAdresse, setFormAdresse] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.telephone, c.email, c.adresse]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, clients]);

  function resetForm() {
    setFormNom("");
    setFormType("Entreprise");
    setFormTelephone("");
    setFormEmail("");
    setFormAdresse("");
  }

  function openDialog() {
    resetForm();
    setOpen(true);
  }

  function handleCreate() {
    const trimmedNom = formNom.trim();
    if (!trimmedNom) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir le nom ou la raison sociale du client.",
        variant: "destructive",
      });
      return;
    }
    const input: ClientInput = {
      nom: trimmedNom,
      type: formType,
      telephone: formTelephone.trim(),
      email: formEmail.trim(),
      adresse: formAdresse.trim(),
    };
    addClient(input);
    toast({
      title: "Client créé avec succès",
      description: `${input.nom} a été ajouté à l'annuaire clients.`,
    });
    setOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Annuaire et fiches clients">
        <Button onClick={openDialog}>
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

      {/* Creation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription className="sr-only">
              Créez un nouveau client en renseignant son nom, son type et ses
              coordonnées (téléphone, e-mail, adresse).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cl-nom" className="text-sm text-slate-700">
                Nom / Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cl-nom"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex. Société des Établissements Diallo"
                className="h-10"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cl-type" className="text-sm text-slate-700">
                Type
              </Label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as ClientType)}
              >
                <SelectTrigger id="cl-type" className="w-full h-10">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {clientTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cl-tel" className="text-sm text-slate-700">
                  Téléphone
                </Label>
                <Input
                  id="cl-tel"
                  value={formTelephone}
                  onChange={(e) => setFormTelephone(e.target.value)}
                  placeholder="+223 …"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-email" className="text-sm text-slate-700">
                  E-mail
                </Label>
                <Input
                  id="cl-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@exemple.ml"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cl-adresse" className="text-sm text-slate-700">
                Adresse
              </Label>
              <Input
                id="cl-adresse"
                value={formAdresse}
                onChange={(e) => setFormAdresse(e.target.value)}
                placeholder="Quartier, ville"
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="size-4" />
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formNom.trim()}>
              <Check className="size-4" />
              Créer le client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
