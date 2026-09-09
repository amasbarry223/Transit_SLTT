/**
 * Client API NestJS pour Transit SLTT
 * Remplace l'accès direct Supabase par des appels HTTP REST sécurisés et typés
 */

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
    public data?: any,
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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
      }
    }

    if (!res.ok) {
      let errData: any;
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
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<{ data: any[]; meta: any }>(`/dossiers${qs}`);
    },

    getById: (id: string) => this.request<any>(`/dossiers/${id}`),

    create: (data: any) =>
      this.request<any>('/dossiers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      this.request<any>(`/dossiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateStatut: (id: string, statut: string) =>
      this.request<any>(`/dossiers/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      }),

    delete: (id: string) =>
      this.request<any>(`/dossiers/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------
  clients = {
    getAll: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return this.request<any[]>(`/clients${qs}`);
    },
    getById: (id: string) => this.request<any>(`/clients/${id}`),
    create: (data: any) =>
      this.request<any>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/clients/${id}`, {
        method: 'DELETE',
      }),
  };


  // ---------------------------------------------------------------------------
  // Contrats
  // ---------------------------------------------------------------------------
  contrats = {
    getAll: (params?: { search?: string; annexeId?: string; clientId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/contrats${qs}`);
    },
    getById: (id: string) => this.request<any>(`/contrats/${id}`),
    create: (data: any) =>
      this.request<any>('/contrats', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/contrats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/contrats/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Devis
  // ---------------------------------------------------------------------------
  devis = {
    getAll: (clientId?: string) => {
      const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
      return this.request<any[]>(`/devis${qs}`);
    },
    getById: (id: string) => this.request<any>(`/devis/${id}`),
    create: (data: any) =>
      this.request<any>('/devis', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/devis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/devis/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Factures
  // ---------------------------------------------------------------------------
  factures = {
    getAll: (params?: any) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.request<{ data: any[]; meta: any }>(`/factures${qs}`);
    },
    getById: (id: string) => this.request<any>(`/factures/${id}`),
    create: (data: any) =>
      this.request<any>('/factures', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/factures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/factures/${id}`, {
        method: 'DELETE',
      }),
    enregistrerPaiement: (id: string, data: { montant: number; caisseId: string; motif?: string }) =>
      this.request<any>(`/factures/${id}/paiements`, {
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
      return this.request<any[]>(`/caisses${qs}`);
    },
    getById: (id: string) => this.request<any>(`/caisses/${id}`),
    createTransaction: (id: string, data: { type: 'ENTREE' | 'SORTIE'; montant: number; motif: string }) =>
      this.request<any>(`/caisses/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Dépenses & Fournisseurs
  // ---------------------------------------------------------------------------
  depenses = {
    getAll: (params?: any) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.request<{ data: any[]; meta: any }>(`/depenses${qs}`);
    },
    getById: (id: string) => this.request<any>(`/depenses/${id}`),
    create: (data: any) =>
      this.request<any>('/depenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approuver: (id: string) =>
      this.request<any>(`/depenses/${id}/approuver`, {
        method: 'PATCH',
      }),
    payer: (id: string, data: { caisseId: string; motif?: string }) =>
      this.request<any>(`/depenses/${id}/payer`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/depenses/${id}`, {
        method: 'DELETE',
      }),
  };

  fournisseurs = {
    getAll: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return this.request<any[]>(`/fournisseurs${qs}`);
    },
    getById: (id: string) => this.request<any>(`/fournisseurs/${id}`),
    create: (data: any) =>
      this.request<any>('/fournisseurs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/fournisseurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/fournisseurs/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Annexes
  // ---------------------------------------------------------------------------
  annexes = {
    getAll: () => this.request<any[]>('/annexes'),
    getById: (id: string) => this.request<any>(`/annexes/${id}`),
    create: (data: any) =>
      this.request<any>('/annexes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/annexes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/annexes/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Transporteurs
  // ---------------------------------------------------------------------------
  transporteurs = {
    getAll: (params?: { search?: string; annexeId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/transporteurs${qs}`);
    },
    getById: (id: string) => this.request<any>(`/transporteurs/${id}`),
    create: (data: any) =>
      this.request<any>('/transporteurs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/transporteurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/transporteurs/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Stock & Mouvements (Entreposage / Magasin)
  // ---------------------------------------------------------------------------
  stock = {
    getItems: (params?: { search?: string; annexeId?: string; clientId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/stock/items${qs}`);
    },
    getItemById: (id: string) => this.request<any>(`/stock/items/${id}`),
    createItem: (data: any) =>
      this.request<any>('/stock/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (id: string, data: any) =>
      this.request<any>(`/stock/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteItem: (id: string) =>
      this.request<any>(`/stock/items/${id}`, {
        method: 'DELETE',
      }),
    getMouvements: (params?: { annexeId?: string; stockId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/stock/mouvements${qs}`);
    },
    createMouvement: (data: any) =>
      this.request<any>('/stock/mouvements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Bons de sortie (Stock & Caisse)
  // ---------------------------------------------------------------------------
  bons = {
    getBonsSortie: (params?: { annexeId?: string; clientId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/bons/sortie${qs}`);
    },
    createBonSortie: (data: any) =>
      this.request<any>('/bons/sortie', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    validateBonSortie: (id: string) =>
      this.request<any>(`/bons/sortie/${id}/valider`, {
        method: 'PUT',
      }),
    deleteBonSortie: (id: string) =>
      this.request<any>(`/bons/sortie/${id}`, {
        method: 'DELETE',
      }),
    getBonsCaisse: (params?: { annexeId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/bons/caisse${qs}`);
    },
    createBonCaisse: (data: any) =>
      this.request<any>('/bons/caisse', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteBonCaisse: (id: string) =>
      this.request<any>(`/bons/caisse/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Reçus de Paiement
  // ---------------------------------------------------------------------------
  recusPaiement = {
    getAll: (params?: { search?: string; annexeId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/recus-paiement${qs}`);
    },
    getById: (id: string) => this.request<any>(`/recus-paiement/${id}`),
    create: (data: any) =>
      this.request<any>('/recus-paiement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/recus-paiement/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/recus-paiement/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Comptabilité Générale
  // ---------------------------------------------------------------------------
  comptabilite = {
    getOperations: (params?: { annexeId?: string; clientId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/comptabilite/operations${qs}`);
    },
    createOperation: (data: any) =>
      this.request<any>('/comptabilite/operations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteOperation: (id: string) =>
      this.request<any>(`/comptabilite/operations/${id}`, {
        method: 'DELETE',
      }),
    getClotures: (params?: { annexeId?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/comptabilite/clotures${qs}`);
    },
    createCloture: (data: any) =>
      this.request<any>('/comptabilite/clotures', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Tracking Public & Privé
  // ---------------------------------------------------------------------------
  tracking = {
    getPublic: (code: string) => this.request<any>(`/tracking/public/${code}`),
    updatePosition: (dossierId: string, data: { dernierePosition?: string; statutAffiche?: string }) =>
      this.request<any>(`/tracking/dossier/${dossierId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Documents (Stockage local sur disque)
  // ---------------------------------------------------------------------------
  documents = {
    getByDossier: (dossierId: string) => this.request<any[]>(`/documents/dossier/${dossierId}`),
    upload: async (file: File, dossierId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      const qs = dossierId ? `?dossierId=${dossierId}` : '';
      return this.request<any>(`/documents/upload${qs}`, {
        method: 'POST',
        body: formData,
      });
    },
    delete: (id: string) =>
      this.request<any>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  };

  // ---------------------------------------------------------------------------
  // Paramètres dynamiques (Dashboard Settings)
  // ---------------------------------------------------------------------------
  settings = {
    getAll: () => this.request<{ list: any[]; map: Record<string, string> }>('/settings'),
    getByKey: (cle: string) => this.request<any>(`/settings/${cle}`),
    setMany: (settings: Record<string, string>) =>
      this.request<any>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    setKey: (cle: string, valeur: string, description?: string) =>
      this.request<any>(`/settings/${cle}`, {
        method: 'PUT',
        body: JSON.stringify({ valeur, description }),
      }),
  };

  // ---------------------------------------------------------------------------
  // Statistiques & Dashboard
  // ---------------------------------------------------------------------------
  stats = {
    getDashboardKpis: (annexeId?: string) => {
      const qs = annexeId ? `?annexeId=${annexeId}` : '';
      return this.request<any>(`/stats/dashboard${qs}`);
    },
  };

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  notifications = {
    getMyNotifications: () => this.request<any[]>('/notifications'),
    markAsRead: (id: string) =>
      this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: () =>
      this.request<any>('/notifications/read-all', { method: 'PATCH' }),
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
    getAll: (params?: { entite?: string; action?: string; limit?: number }) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/audit-logs${qs}`);
    },
    log: (data: {
      userId?: string;
      action: string;
      entite?: string;
      module?: string;
      entiteId?: string;
      detail?: string;
      userName?: string;
      ip?: string;
      donnees?: any;
    }) =>
      this.request<any>('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ---------------------------------------------------------------------------
  // Utilisateurs
  // ---------------------------------------------------------------------------
  users = {
    getAll: () => this.request<any[]>('/users'),
    getById: (id: string) => this.request<any>(`/users/${id}`),
    create: (data: any) =>
      this.request<any>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<any>(`/users/${id}`, {
        method: 'DELETE',
      }),
  };
}

export const api = new ApiClient(API_BASE_URL);
