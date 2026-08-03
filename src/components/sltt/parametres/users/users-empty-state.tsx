"use client";

import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UsersEmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Users className="size-7" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasFilters ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "Modifiez votre recherche ou le filtre par rôle."
          : "Ajoutez le premier membre de votre équipe pour commencer."}
      </p>
      {!hasFilters && (
        <Button className="mt-5" onClick={onCreate}>
          <UserPlus className="size-4" />
          Ajouter un utilisateur
        </Button>
      )}
    </div>
  );
}
