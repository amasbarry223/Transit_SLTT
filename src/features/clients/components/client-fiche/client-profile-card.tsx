"use client";

import { Phone, Mail, MapPin, Pencil, Building2, User, FolderPlus } from "lucide-react";
import type { Client } from "@/lib/domain-types";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn, getInitials } from "@/shared/utils/cn";
import { avatarGradient } from "./shared";

type ClientProfileCardProps = {
  client: Client;
  onEdit?: () => void;
  onNewDossier?: () => void;
};

export function ClientProfileCard({ client, onEdit, onNewDossier }: ClientProfileCardProps) {
  const TypeIcon = client.type === "Entreprise" ? Building2 : User;

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="bg-gradient-to-r from-primary/[0.07] via-blue-50/50 to-transparent px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {client.nom}
                </h1>
                <ToneBadge tone={client.type === "Entreprise" ? "blue" : "slate"}>
                  <TypeIcon className="size-3" />
                  {client.type}
                </ToneBadge>
              </div>

              <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {client.telephone ? (
                  <a
                    href={`tel:${client.telephone.replace(/\s/g, "")}`}
                    className="inline-flex w-fit items-center gap-2 hover:text-foreground"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    <span className="font-mono text-xs">{client.telephone}</span>
                  </a>
                ) : null}
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex w-fit items-center gap-2 truncate hover:text-foreground"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate text-xs">{client.email}</span>
                  </a>
                ) : null}
                {client.adresse ? (
                  <span className="inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span className="text-xs leading-relaxed">{client.adresse}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" className="h-9" onClick={onEdit}>
                <Pencil className="size-4" />
                Modifier
              </Button>
            )}
            {onNewDossier && (
              <Button size="sm" className="h-9" onClick={onNewDossier}>
                <FolderPlus className="size-4" />
                Nouveau dossier
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
