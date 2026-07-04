"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useStore, type ClientInput } from "@/lib/store";
import type { ClientType } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const clientTypes: ClientType[] = ["Entreprise", "Particulier"];

interface Props {
  onCreated: (clientId: string) => void;
}

export function QuickClientButton({ onCreated }: Props) {
  const { toast } = useToast();
  const addClient = useStore((s) => s.addClient);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [type, setType] = useState<ClientType>("Entreprise");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  function reset() {
    setNom("");
    setType("Entreprise");
    setTelephone("");
    setEmail("");
  }

  async function handleCreate() {
    const trimmed = nom.trim();
    if (!trimmed) return;
    const input: ClientInput = {
      nom: trimmed,
      type,
      telephone: telephone.trim(),
      email: email.trim(),
      adresse: "",
    };
    try {
      const newClient = await addClient(input);
      toast({ title: "Client créé", description: trimmed });
      onCreated(newClient.id);
      setOpen(false);
      reset();
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Impossible de créer le client",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        title="Créer un nouveau client"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>
              Créez un client rapidement. Vous pourrez compléter sa fiche ultérieurement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom / Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Société des Établissements Diallo"
                className="h-10"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ClientType)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</Label>
                <Input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+223 76 00 00 00"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.ml"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!nom.trim()}>
              <UserPlus className="size-4" />
              Créer le client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
