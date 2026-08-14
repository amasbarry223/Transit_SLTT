import { syncClientStats } from "@/lib/client-stats";
import type { ProfilePublicRow } from "@/lib/db-rows";
import type { UserRole } from "@/lib/domain-types";
import { syncSequencesFromData } from "@/lib/store/sync-sequences";
import { mapClientFromDb } from "@/lib/store/clients-slice";
import { mapDossierFromDb } from "@/lib/store/dossiers-slice";
import { mapFactureFromDb } from "@/lib/store/factures-slice";
import { mapEcritureFromDb } from "@/lib/store/ecritures-slice";
import { mapProfileFromDb } from "@/lib/store/users-slice";
import { mapSocieteFromDb } from "@/lib/store/societes-slice";
import { mapAnnexeFromDb } from "@/lib/store/annexes-slice";
import type { SLTTState } from "@/lib/store";
import type { PagedFetchResult } from "./fetch-core-entities";

export function buildAnnexeIdsByUser(
  userAnnexes: { user_id: string; annexe_id: string }[],
): Map<string, string[]> {
  const annexeIdsByUser = new Map<string, string[]>();
  for (const row of userAnnexes ?? []) {
    const list = annexeIdsByUser.get(row.user_id) ?? [];
    list.push(row.annexe_id);
    annexeIdsByUser.set(row.user_id, list);
  }
  return annexeIdsByUser;
}

export function mapCoreFetchResults(
  coreResults: PagedFetchResult[],
  profilesPublic: ProfilePublicRow[] | null,
  state: SLTTState,
): Partial<SLTTState> {
  const [
    { data: clients },
    { data: dossiers },
    { data: ecritures },
    { data: factures },
    { data: profiles },
    { data: societes },
    { data: annexes },
    { data: userAnnexes },
  ] = coreResults;

  const mappedClients = (clients as unknown[]).map((row) => mapClientFromDb(row as never));
  const mappedDossiers = (dossiers as unknown[]).map((row) => mapDossierFromDb(row as never));
  const mappedFactures = (factures as unknown[]).map((row) => mapFactureFromDb(row as never));
  const mappedEcritures = (ecritures as unknown[]).map((row) => mapEcritureFromDb(row as never));

  const annexeIdsByUser = buildAnnexeIdsByUser(
    (userAnnexes as { user_id: string; annexe_id: string }[]) ?? [],
  );

  const profileRows = profiles as unknown[];
  const nextState = {
    ...state,
    clients: syncClientStats(mappedDossiers, mappedFactures, mappedEcritures, mappedClients),
    dossiers: mappedDossiers,
    ecritures: mappedEcritures,
    factures: mappedFactures,
    users: profileRows.map((profileRow) => ({
      ...mapProfileFromDb(profileRow as never),
      annexeIds: annexeIdsByUser.get((profileRow as { id: string }).id) ?? [],
    })),
    usersPublic: (profilesPublic ?? profileRows).map((row) => {
      const profile = row as ProfilePublicRow;
      return {
        id: profile.id,
        nom: profile.nom,
        role: profile.role as UserRole,
        actif: profile.actif,
        derniereConnexion: profile.derniere_connexion || "",
      };
    }),
    societes: (societes as unknown[]).map((row) => mapSocieteFromDb(row as never)),
    annexes: (annexes as unknown[]).map((row) => mapAnnexeFromDb(row as never)),
    loadError: null,
    dataLoading: false,
  };

  return {
    ...nextState,
    ...syncSequencesFromData(nextState),
  };
}
