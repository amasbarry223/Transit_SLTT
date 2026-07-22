"use client";

import {
  Phone,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Building2,
  User,
  BellRing,
} from "lucide-react";
import type { Client } from "@/lib/domain-types";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { avatarGradient } from "./shared";

type ClientProfileCardProps = {
  client: Client;
  totalDu: number;
  onEdit?: () => void;
  onNewDossier: () => void;
  onRelance: () => void;
};

export function ClientProfileCard({
  client,
  totalDu,
  onEdit,
  onNewDossier,
  onRelance,
}: ClientProfileCardProps) {
  const TypeIcon = client.type === "Entreprise" ? Building2 : User;

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="bg-gradient-to-r from-primary/5 via-blue-50/50 to-transparent px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-md",
                avatarGradient(client.type),
              )}
            >
              {getInitials(client.nom)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {client.nom}
                </h2>
                <ToneBadge tone={client.type === "Entreprise" ? "blue" : "slate"}>
                  <TypeIcon className="size-3" />
                  {client.type}
                </ToneBadge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {client.telephone && (
                  <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="font-mono text-xs">{client.telephone}</span>
                  </span>
                )}
                {client.email && (
                  <span className="inline-flex items-center gap-2 truncate text-slate-600 dark:text-slate-300">
                    <Mail className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="truncate text-xs">{client.email}</span>
                  </span>
                )}
                {client.adresse && (
                  <span className="inline-flex items-start gap-2 text-slate-600 dark:text-slate-300 sm:col-span-2 lg:col-span-1">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs leading-relaxed">{client.adresse}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {totalDu > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:bg-amber-950/40"
                onClick={onRelance}
              >
                <BellRing className="size-4" />
                Relancer
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" className="h-9" onClick={onEdit}>
                <Pencil className="size-4" />
                Modifier
              </Button>
            )}
            <Button size="sm" className="h-9" onClick={onNewDossier}>
              <Plus className="size-4" />
              Nouveau dossier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
