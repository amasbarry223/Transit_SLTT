"use client";

import Image from "next/image";
import { Building2, Eye, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { EmptyState } from "@/components/sltt/empty-state";
import { ListFilters } from "@/components/sltt/list-filters";
import { ResponsiveDataList } from "@/components/sltt/responsive-data-list";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { MetaTabsList } from "@/components/sltt/meta-tabs-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { ArchiveUploadDialog } from "@/components/sltt/archives/archive-upload-dialog";
import { ARCHIVE_COLUMNS } from "@/components/sltt/archives/archive-columns";
import { useArchivesScreen } from "@/components/sltt/archives/use-archives-screen";
import { FOLDER_ICON_SRC, TAB_META, type ArchiveTab } from "@/components/sltt/archives/shared";

export function ArchivesScreen() {
  const screen = useArchivesScreen();

  return (
    <div className="space-y-5">
      <PageHeader title="Archives" description={screen.currentMeta.description}>
        {screen.canWrite && (
          <Button size="sm" onClick={() => screen.setUploadOpen(true)}>
            <Plus className="size-4" />
            Archiver un document
          </Button>
        )}
      </PageHeader>

      <Tabs
        value={screen.activeTab}
        onValueChange={(v) => screen.setActiveTab(v as ArchiveTab)}
        className="space-y-4"
      >
        <MetaTabsList
          items={TAB_META}
          counts={screen.counts}
          gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        />
      </Tabs>

      <ListFilters
        search={screen.search}
        onSearchChange={screen.setSearch}
        searchPlaceholder="Rechercher un fichier, un dossier, une facture…"
        chips={screen.chips}
        activeCount={screen.activeCount}
        onClear={screen.clearFilters}
        advanced={
          <>
            <Select
              value={screen.societeFilter || "all"}
              onValueChange={(v) => screen.setSocieteFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-10 w-48">
                <Building2 className="mr-1.5 size-3.5 text-slate-400" />
                <SelectValue placeholder="Société" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sociétés</SelectItem>
                {screen.societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={screen.clientFilter || "all"}
              onValueChange={(v) => screen.setClientFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-10 w-48"><SelectValue placeholder="Client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {screen.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" className="h-10 w-40" value={screen.dateDebut} onChange={(e) => screen.setDateDebut(e.target.value)} />
              <span className="text-xs text-slate-400">→</span>
              <Input type="date" className="h-10 w-40" value={screen.dateFin} onChange={(e) => screen.setDateFin(e.target.value)} />
            </div>
          </>
        }
      />

      <ResponsiveDataList
        items={screen.filtered}
        columns={ARCHIVE_COLUMNS}
        getRowKey={(d) => d.key}
        emptyState={
          <EmptyState
            icon={screen.showFolderEmpty ? undefined : screen.currentMeta.icon}
            illustration={
              screen.showFolderEmpty ? (
                <div className="mb-4 flex flex-col items-center">
                  <Image
                    src={FOLDER_ICON_SRC}
                    alt=""
                    width={88}
                    height={88}
                    className="size-[88px] object-contain drop-shadow-sm"
                    unoptimized
                  />
                </div>
              ) : undefined
            }
            title={screen.currentMeta.emptyTitle}
            description={screen.currentMeta.emptyDescription}
            action={
              screen.canWrite ? (
                <Button size="sm" onClick={() => screen.setUploadOpen(true)}>
                  <Plus className="size-4" />
                  Archiver un document
                </Button>
              ) : undefined
            }
          />
        }
        renderActions={(d) => (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={`Voir ${d.nom}`}
              onClick={() => screen.handleOpen(d)}
            >
              <Eye className="size-4" />
            </Button>
            {/*
              ⚠️ Le verrou admin-only n'est un vrai verrou serveur (RLS is_admin())
              que pour source === "archive" (voir 20260717_archives_admin_delete.sql).
              Pour source === "dossier"/"contrat", ce n'est qu'une garde côté
              interface : deleteFichier/deleteContratFichier restent autorisés en
              base à quiconque a la permission dossiers:write/contrats:write, pour
              préserver la suppression déjà existante depuis les écrans Dossier/
              Contrat (RLS ne peut pas distinguer l'écran d'origine de la requête).
              Décision assumée, pas un oubli — ne pas durcir sans revoir cet écran.
            */}
            {d.canDelete && screen.isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-slate-400 hover:text-red-600"
                aria-label={`Supprimer ${d.nom}`}
                onClick={() => screen.setDeleteTarget(d)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </>
        )}
      />

      <ArchiveUploadDialog
        open={screen.uploadOpen}
        onOpenChange={screen.setUploadOpen}
        initialKind={screen.uploadKind}
      />

      <ConfirmDeleteDialog
        open={Boolean(screen.deleteTarget)}
        onOpenChange={(v) => !v && screen.setDeleteTarget(null)}
        title="Supprimer ce document ?"
        description={
          screen.deleteTarget
            ? `« ${screen.deleteTarget.nom} » sera définitivement supprimé et retiré du stockage. Cette action est irréversible.`
            : "Cette action est irréversible."
        }
        onConfirm={screen.handleDelete}
      />
    </div>
  );
}
