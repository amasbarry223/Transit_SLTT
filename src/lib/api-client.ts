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

const TOKEN_KEY = 'transit_sltt_access_token';
const REFRESH_TOKEN_KEY = 'transit_sltt_refresh_token';
const USER_KEY = 'transit_sltt_user';

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
  // Gestion des Tokens
  // ---------------------------------------------------------------------------
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

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

  setSession(tokens: { accessToken: string; refreshToken?: string; user?: UserSession }) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    if (tokens.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    }
    this.sessionExpiredNotified = false;
  }

  clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ---------------------------------------------------------------------------
  // Requête HTTP générique avec injection Bearer et auto-refresh
  // ---------------------------------------------------------------------------
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

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
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      this.setSession({ accessToken: data.accessToken });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authentification
  // ---------------------------------------------------------------------------
  auth = {
    login: async (email: string, password: string) => {
      const res = await this.request<{
        accessToken: string;
        refreshToken: string;
        user: UserSession;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setSession(res);
      return res;
    },

    logout: async () => {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          await this.request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch {
          // Ignorer
        }
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
  };
}

export const api = new ApiClient(API_BASE_URL);
