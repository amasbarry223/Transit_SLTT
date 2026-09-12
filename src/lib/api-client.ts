/**
 * Client API NestJS pour Transit SLTT
 * Remplace l'accès direct Supabase par des appels HTTP REST sécurisés et typés
 */

import type {
  RawAnnexe,
  RawBonSortie,
  RawBonSortieCaisse,
  RawCaisse,
  RawClient,
  RawClotureCaisse,
  RawContrat,
  RawDepense,
  RawDevis,
  RawDocument,
  RawDossier,
  RawFacture,
  RawFournisseur,
  RawMouvementStock,
  RawOperationComptable,
  RawPaginated,
  RawPort,
  RawRecuPaiement,
  RawSetting,
  RawStockItem,
  RawTrackingPublic,
  RawTransporteur,
  RawUser,
} from "@/lib/api-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Non secret — mis en cache seulement pour l'hydratation UI (nom/rôle
// affichés avant confirmation serveur). Les tokens, eux, vivent en cookies
// httpOnly posés par NestJS : jamais lisibles ni stockés ici.
const USER_KEY = 'transit_sltt_user';
// Doit correspondre à CSRF_COOKIE dans api/src/auth/cookie.config.ts —
// non-httpOnly par conception, lu ici pour l'écho double-submit.
const CSRF_COOKIE_NAME = 'transit_sltt_csrf';

export interface UserSession {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  annexeIds: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  /** Rafraîchissement en cours — partagé pour éviter que N requêtes 401
   *  simultanées ne déclenchent N appels /auth/refresh concurrents. */
  private refreshInFlight: Promise<boolean> | null = null;
  /** Callback app-level appelé quand un refresh échoue vraiment (session
   *  expirée/révoquée côté serveur) : sans lui, chaque requête en échec
   *  retombe silencieusement dans le flux "chargement partiel" (data-fetch-slice)
   *  et l'utilisateur voit un avertissement sur 18 ressources à la fois au lieu
   *  d'être renvoyé à l'écran de connexion. */
  private onSessionExpired: (() => void) | null = null;
  /** Évite d'appeler onSessionExpired une fois par requête en échec (jusqu'à
   *  18 en parallèle au chargement) : une seule notification par session perdue. */
  private sessionExpiredNotified = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Enregistre le callback de déconnexion forcée (voir onSessionExpired). */
  setOnSessionExpired(cb: () => void) {
    this.onSessionExpired = cb;
  }

  /** Sérialise un objet de paramètres de requête (filtre undefined/null,
   *  convertit les nombres/booléens en string) en query string préfixée
   *  d'un "?", ou "" si aucun paramètre fourni. */
  private toQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length === 0) return '';
    const search = new URLSearchParams();
    for (const [key, value] of entries) {
      search.set(key, String(value));
    }
    return '?' + search.toString();
  }

  // ---------------------------------------------------------------------------
  // Session (utilisateur en cache uniquement — les tokens sont en cookies)
  // ---------------------------------------------------------------------------
  getCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setSession(session: { user: UserSession }) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.sessionExpiredNotified = false;
  }

  clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  }

  /** Lit le cookie CSRF non-httpOnly pour l'échoter en en-tête X-CSRF-Token
   *  (double-submit — voir CsrfGuard côté NestJS). */
  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
    return match ? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1)) : null;
  }

  // ---------------------------------------------------------------------------
  // Requête HTTP générique — cookies httpOnly + double-submit CSRF + auto-refresh
  // ---------------------------------------------------------------------------
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const method = (options.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(url, { ...options, headers, credentials: 'include' });

    // Tentative de rafraîchissement si 401
    if (res.status === 401 && retry) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      } else {
        this.clearSession();
        if (!this.sessionExpiredNotified) {
          this.sessionExpiredNotified = true;
          this.onSessionExpired?.();
        }
      }
    }

    if (!res.ok) {
      let errData: { message?: string } & Record<string, unknown>;
      try {
        errData = await res.json();
      } catch {
        errData = { message: res.statusText };
      }
      throw new ApiError(
        res.status,
        errData.message || `Erreur requête HTTP ${res.status}`,
        errData,
      );
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    return res.json();
  }

  private async refreshTokens(): Promise<boolean> {
    // Un seul refresh à la fois : les autres requêtes 401 attendent son résultat.
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.doRefreshTokens().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async doRefreshTokens(): Promise<boolean> {
    try {
      const csrfToken = this.getCsrfToken();
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      // Le nouvel access token est posé directement en cookie par la
      // réponse — rien à lire ni à stocker côté client.
      return res.ok;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authentification
  // ---------------------------------------------------------------------------
  auth = {
    // Les tokens sont posés en cookies httpOnly par la réponse elle-même
    // (Set-Cookie) — seul `user` revient dans le corps JSON, pour l'UI.
    login: async (email: string, password: string) => {
      const res = await this.request<{ user: UserSession }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setSession(res);
      return res;
    },

    logout: async () => {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } catch {
        // Ignorer — on efface la session locale quoi qu'il arrive.
      }
      this.clearSession();
    },

    me: () => this.request<UserSession>('/auth/me'),
  };

  // ---------------------------------------------------------------------------
  // Dossiers de transit
  // ---------------------------------------------------------------------------
  dossiers = {
    getAll: (params?: {
      search?: string;
      statut?: string;
      type?: string;
      annexeId?: string;
      page?: number;
      limit?: number;
    }) => {
      return this.request<RawPaginated<RawDossier>>(`/dossiers${this.toQueryString(params)}`);
    },

    getById: (id: string) => this.request<RawDossier>(`/dossiers/${id}`),

    create: (data: object) =>
      this.request<RawDossier>('/dossiers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: object) =>
      this.request<RawDossier>(`/dossiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateStatut: (id: string, statut: string) =>
      this.request<RawDossier>(`/dossiers/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      }),

    enregistrerPaiement: (id: string, montant: number, statut?: string, date?: string) =>
      this.request<RawDossier>(`/dossiers/${id}/paiements`, {
        method: 'POST',
        body: JSON.stringify({ montant, statut, date }),
      }),

    delete: (id: string) =>
      this.request<RawDossier>(`/dossiers/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------
  clients = {
    getAll: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return this.request<RawClient[]>(`/clients${qs}`);
    },
    getById: (id: string) => this.request<RawClient>(`/clients/${id}`),
    create: (data: object) =>
      this.request<RawClient>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawClient>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawClient>(`/clients/${id}`, {
        method: 'DELETE',
      }),
  };


  // ---------------------------------------------------------------------------
  // Contrats
  // ---------------------------------------------------------------------------
  contrats = {
    getAll: (params?: { search?: string; annexeId?: string; clientId?: string }) =>
      this.request<RawContrat[]>(`/contrats${this.toQueryString(params)}`),
    getById: (id: string) => this.request<RawContrat>(`/contrats/${id}`),
    create: (data: object) =>
      this.request<RawContrat>('/contrats', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawContrat>(`/contrats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawContrat>(`/contrats/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Devis
  // ---------------------------------------------------------------------------
  devis = {
    getAll: (clientId?: string) => {
      const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
      return this.request<RawDevis[]>(`/devis${qs}`);
    },
    getById: (id: string) => this.request<RawDevis>(`/devis/${id}`),
    create: (data: object) =>
      this.request<RawDevis>('/devis', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawDevis>(`/devis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawDevis>(`/devis/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Factures
  // ---------------------------------------------------------------------------
  factures = {
    getAll: () => this.request<RawPaginated<RawFacture>>('/factures'),
    getById: (id: string) => this.request<RawFacture>(`/factures/${id}`),
    create: (data: object) =>
      this.request<RawFacture>('/factures', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawFacture>(`/factures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateStatut: (id: string, statut: string) =>
      this.request<RawFacture>(`/factures/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      }),
    delete: (id: string) =>
      this.request<RawFacture>(`/factures/${id}`, {
        method: 'DELETE',
      }),
    enregistrerPaiement: (id: string, data: { montant: number; caisseId: string; motif?: string }) =>
      this.request<RawFacture>(`/factures/${id}/paiements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Caisses
  // ---------------------------------------------------------------------------
  caisse = {
    getAll: (annexeId?: string) => {
      const qs = annexeId ? `?annexeId=${annexeId}` : '';
      return this.request<RawCaisse[]>(`/caisses${qs}`);
    },
    getById: (id: string) => this.request<RawCaisse>(`/caisses/${id}`),
    createTransaction: (id: string, data: { type: 'ENTREE' | 'SORTIE'; montant: number; motif: string }) =>
      this.request<RawCaisse>(`/caisses/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Dépenses & Fournisseurs
  // ---------------------------------------------------------------------------
  depenses = {
    getAll: () => this.request<RawPaginated<RawDepense>>('/depenses'),
    getById: (id: string) => this.request<RawDepense>(`/depenses/${id}`),
    create: (data: object) =>
      this.request<RawDepense>('/depenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approuver: (id: string) =>
      this.request<RawDepense>(`/depenses/${id}/approuver`, {
        method: 'PATCH',
      }),
    payer: (id: string, data: { caisseId: string; motif?: string }) =>
      this.request<RawDepense>(`/depenses/${id}/payer`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawDepense>(`/depenses/${id}`, {
        method: 'DELETE',
      }),
  };

  fournisseurs = {
    getAll: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return this.request<RawFournisseur[]>(`/fournisseurs${qs}`);
    },
    getById: (id: string) => this.request<RawFournisseur>(`/fournisseurs/${id}`),
    create: (data: object) =>
      this.request<RawFournisseur>('/fournisseurs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawFournisseur>(`/fournisseurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawFournisseur>(`/fournisseurs/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Annexes
  // ---------------------------------------------------------------------------
  annexes = {
    getAll: () => this.request<RawAnnexe[]>('/annexes'),
    getById: (id: string) => this.request<RawAnnexe>(`/annexes/${id}`),
    create: (data: object) =>
      this.request<RawAnnexe>('/annexes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawAnnexe>(`/annexes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawAnnexe>(`/annexes/${id}`, {
        method: 'DELETE',
      }),
  };

  ports = {
    getAll: () => this.request<RawPort[]>('/ports'),
    getById: (id: string) => this.request<RawPort>(`/ports/${id}`),
    create: (data: object) =>
      this.request<RawPort>('/ports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawPort>(`/ports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawPort>(`/ports/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Transporteurs
  // ---------------------------------------------------------------------------
  transporteurs = {
    getAll: (params?: { search?: string; annexeId?: string }) =>
      this.request<RawTransporteur[]>(`/transporteurs${this.toQueryString(params)}`),
    getById: (id: string) => this.request<RawTransporteur>(`/transporteurs/${id}`),
    create: (data: object) =>
      this.request<RawTransporteur>('/transporteurs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawTransporteur>(`/transporteurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawTransporteur>(`/transporteurs/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Stock & Mouvements (Entreposage / Magasin)
  // ---------------------------------------------------------------------------
  stock = {
    getItems: (params?: { search?: string; annexeId?: string; clientId?: string }) =>
      this.request<RawStockItem[]>(`/stock/items${this.toQueryString(params)}`),
    getItemById: (id: string) => this.request<RawStockItem>(`/stock/items/${id}`),
    createItem: (data: object) =>
      this.request<RawStockItem>('/stock/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (id: string, data: object) =>
      this.request<RawStockItem>(`/stock/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteItem: (id: string) =>
      this.request<RawStockItem>(`/stock/items/${id}`, {
        method: 'DELETE',
      }),
    getMouvements: (params?: { annexeId?: string; stockId?: string }) =>
      this.request<RawMouvementStock[]>(`/stock/mouvements${this.toQueryString(params)}`),
    createMouvement: (data: object) =>
      this.request<RawMouvementStock>('/stock/mouvements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Bons de sortie (Stock & Caisse)
  // ---------------------------------------------------------------------------
  bons = {
    getBonsSortie: (params?: { annexeId?: string; clientId?: string }) =>
      this.request<RawBonSortie[]>(`/bons/sortie${this.toQueryString(params)}`),
    createBonSortie: (data: object) =>
      this.request<RawBonSortie>('/bons/sortie', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    validateBonSortie: (id: string) =>
      this.request<RawBonSortie>(`/bons/sortie/${id}/valider`, {
        method: 'PUT',
      }),
    deleteBonSortie: (id: string) =>
      this.request<RawBonSortie>(`/bons/sortie/${id}`, {
        method: 'DELETE',
      }),
    getBonsCaisse: (params?: { annexeId?: string }) =>
      this.request<RawBonSortieCaisse[]>(`/bons/caisse${this.toQueryString(params)}`),
    createBonCaisse: (data: object) =>
      this.request<RawBonSortieCaisse>('/bons/caisse', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateBonCaisse: (id: string, data: object) =>
      this.request<RawBonSortieCaisse>(`/bons/caisse/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteBonCaisse: (id: string) =>
      this.request<RawBonSortieCaisse>(`/bons/caisse/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Reçus de Paiement
  // ---------------------------------------------------------------------------
  recusPaiement = {
    getAll: (params?: { search?: string; annexeId?: string }) =>
      this.request<RawRecuPaiement[]>(`/recus-paiement${this.toQueryString(params)}`),
    getById: (id: string) => this.request<RawRecuPaiement>(`/recus-paiement/${id}`),
    create: (data: object) =>
      this.request<RawRecuPaiement>('/recus-paiement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawRecuPaiement>(`/recus-paiement/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawRecuPaiement>(`/recus-paiement/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Comptabilité Générale
  // ---------------------------------------------------------------------------
  comptabilite = {
    getOperations: (params?: { annexeId?: string; clientId?: string }) =>
      this.request<RawOperationComptable[]>(`/comptabilite/operations${this.toQueryString(params)}`),
    createOperation: (data: object) =>
      this.request<RawOperationComptable>('/comptabilite/operations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteOperation: (id: string) =>
      this.request<RawOperationComptable>(`/comptabilite/operations/${id}`, {
        method: 'DELETE',
      }),
    getClotures: (params?: { annexeId?: string }) =>
      this.request<RawClotureCaisse[]>(`/comptabilite/clotures${this.toQueryString(params)}`),
    createCloture: (data: object) =>
      this.request<RawClotureCaisse>('/comptabilite/clotures', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Tracking Public & Privé
  // ---------------------------------------------------------------------------
  tracking = {
    getPublic: (code: string) => this.request<RawTrackingPublic>(`/tracking/public/${code}`),
    updatePosition: (dossierId: string, data: { dernierePosition?: string; statutAffiche?: string }) =>
      this.request<RawTrackingPublic>(`/tracking/dossier/${dossierId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Documents (Stockage local sur disque)
  // ---------------------------------------------------------------------------
  documents = {
    getByDossier: (dossierId: string) => this.request<RawDocument[]>(`/documents/dossier/${dossierId}`),
    upload: async (file: File, dossierId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      const qs = dossierId ? `?dossierId=${dossierId}` : '';
      return this.request<RawDocument>(`/documents/upload${qs}`, {
        method: 'POST',
        body: formData,
      });
    },
    delete: (id: string) =>
      this.request<RawDocument>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Paramètres dynamiques (Dashboard Settings)
  // ---------------------------------------------------------------------------
  settings = {
    getAll: () => this.request<{ list: RawSetting[]; map: Record<string, string> }>('/settings'),
    getByKey: (cle: string) => this.request<RawSetting>(`/settings/${cle}`),
    setMany: (settings: Record<string, string>) =>
      this.request<RawSetting>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    setKey: (cle: string, valeur: string, description?: string) =>
      this.request<RawSetting>(`/settings/${cle}`, {
        method: 'PUT',
        body: JSON.stringify({ valeur, description }),
      }),
  };

  // ---------------------------------------------------------------------------
  // Sauvegarde, Export & Restauration (Backup)
  // ---------------------------------------------------------------------------
  backup = {
    listTables: () => this.request<string[]>('/backup/tables'),
    export: () =>
      this.request<{
        meta: { exportedAt: string; tables: string[] };
        data: Record<string, unknown[]>;
      }>('/backup/export'),
    wipe: () =>
      this.request<Record<string, number>>('/backup/wipe', {
        method: 'POST',
      }),
    restore: (payload: Record<string, unknown[]>) =>
      this.request<{ restored: Record<string, number>; missingTables: string[] }>(
        '/backup/restore',
        {
          method: 'POST',
          body: JSON.stringify({ payload }),
        },
      ),
  };

  // ---------------------------------------------------------------------------
  // Audit Logs & Traçabilité
  // ---------------------------------------------------------------------------
  auditLogs = {
    getAll: (params?: { entite?: string; action?: string; limit?: number }) =>
      this.request<Record<string, unknown>[]>(`/audit-logs${this.toQueryString(params)}`),
    log: (data: {
      userId?: string;
      action: string;
      entite?: string;
      module?: string;
      entiteId?: string;
      detail?: string;
      userName?: string;
      ip?: string;
      donnees?: Record<string, unknown>;
    }) =>
      this.request<Record<string, unknown>>('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Utilisateurs
  // ---------------------------------------------------------------------------
  users = {
    getAll: () => this.request<RawUser[]>('/users'),
    getById: (id: string) => this.request<RawUser>(`/users/${id}`),
    create: (data: object) =>
      this.request<RawUser>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: object) =>
      this.request<RawUser>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<RawUser>(`/users/${id}`, {
        method: 'DELETE',
      }),
    resetPassword: (id: string, password: string) =>
      this.request<RawUser>(`/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      }),
  };
}

export const api = new ApiClient(API_BASE_URL);
