# API_REQUIREMENTS.md — Spécification Frontend → Backend (Transit SLTT)

> Généré à partir d'un audit exhaustif du code frontend (`src/`) le 2026-08-02.
> Périmètre : tous les appels réseau du frontend, sans exception.

---

## 0. Note d'architecture — À LIRE AVANT TOUT

Ce projet **n'a pas de backend REST custom classique**. La couche de données est
**Supabase** (Postgres + PostgREST + Auth + Storage + Realtime) :

- **CRUD standard** (clients, dossiers, factures, stock…) : le frontend appelle
  directement `supabase.from("table").select/insert/update/delete()`, qui tape
  l'API REST **auto-générée par PostgREST** — il n'y a jamais eu, et il n'y a
  pas à écrire, de route `GET /api/clients`, `POST /api/dossiers`, etc.
  L'autorisation est appliquée **au niveau base** via Row Level Security (RLS),
  pas par un middleware applicatif.
- **Logique métier atomique** (paiements, décrément de stock, soldes) : implémentée
  en fonctions Postgres `security definer` (RPC), appelées via `supabase.rpc(...)`.
  C'est l'équivalent des endpoints `POST /api/.../action` d'un backend classique —
  section 3.
- **Auth** : Supabase Auth (GoTrue), JWT. Pas de backend d'auth custom.
- **Fichiers** : Supabase Storage (buckets privés + signed URLs, un bucket public).
- **Temps réel** : Supabase Realtime (`postgres_changes` sur canal Postgres),
  pas de WebSocket applicatif custom.
- **7 routes Next.js custom existent** (`src/app/api/**`) — uniquement pour les
  opérations nécessitant la clé `service_role` (admin utilisateurs) ou un traitement
  serveur (génération Excel). Documentées intégralement en section 1.

**Si l'équipe backend doit reproduire ce système sur un stack propriétaire**
(Node/Express, etc.), il faut réimplémenter :
1. Les 7 routes de la section 1 telles quelles.
2. Un CRUD REST classique par table (section 2) reproduisant les policies RLS
   listées comme contrôle d'accès applicatif.
3. Les fonctions de la section 3 comme endpoints métier avec transaction/verrou
   de ligne (`SELECT ... FOR UPDATE` ou équivalent ORM).
4. Un système d'auth JWT + refresh token (section 4).
5. Un service de stockage de fichiers avec URLs signées à expiration (section 5).
6. Un mécanisme de push (WebSocket/SSE) invalidant le cache client sur les tables
   listées (section 6) — le frontend actuel ne fait pas de diff fin, il refait un
   fetch complet debouncé de 800 ms sur tout changement.

---

## 1. ROUTES API CUSTOM NEXT.JS

Toutes utilisent `Authorization: Bearer <supabase-jwt>` sauf mention contraire.
Middleware commun : `src/lib/auth/require-admin.ts` → décode le JWT, charge
`profiles` (id, nom, email, role, permissions, actif), rejette si `actif=false`.

### 1.1 POST /api/admin/users
```
📌 Créer un compte utilisateur
├── Méthode        : POST
├── URL            : /api/admin/users
├── Authentification: oui (Bearer <jwt>)
├── Rôle requis    : Administrateur, OU permission "utilisateurs:manage"
│                    (un non-admin ne peut pas créer un rôle "Administrateur")
├── Paramètres URL : aucun
├── Query params   : aucun
├── Body (payload) :
{
  "nom": "string, requis, min 1",
  "email": "string, requis, email valide",
  "role": "Administrateur | Agent de transit | Comptable | Magasinier",
  "permissions": ["string", "..."],           // optionnel, défaut []
  "password": "string, requis, min 8 caractères"
}
├── Réponse succès : 201
{ "user": { "id": "uuid", "nom": "...", "email": "...", "role": "...", "permissions": [...], "actif": true } }
└── Réponses erreur:
    400 { "error": "message zod | message Supabase Auth" }
    401 { "error": "Token d'authentification requis." } / "Session invalide ou expirée."
    403 { "error": "Accès réservé à la gestion des utilisateurs." }
        { "error": "Seul un administrateur peut créer un compte Administrateur." }
    500 { "error": "Erreur serveur interne." }
```
Effet de bord : crée l'utilisateur dans Supabase Auth (`admin.auth.admin.createUser`,
email confirmé d'office) PUIS met à jour la ligne `profiles` correspondante
(créée par un trigger `on_auth_user_created` côté DB). Si l'update `profiles`
échoue, l'utilisateur Auth créé est supprimé (rollback manuel).

### 1.2 PATCH /api/admin/users/:id
```
📌 Modifier un compte utilisateur
├── Méthode        : PATCH
├── URL            : /api/admin/users/:id   (id = uuid Supabase Auth)
├── Authentification: oui
├── Rôle requis    : Administrateur, OU "utilisateurs:manage"
├── Paramètres URL : id (uuid)
├── Body :
{
  "nom": "string requis",
  "email": "string email requis",
  "role": "Administrateur | Agent de transit | Comptable | Magasinier",
  "permissions": ["string"],       // optionnel
  "actif": true                     // optionnel
}
├── Réponse succès : 200 { "user": {...profil mis à jour} }
└── Erreurs :
    400 { "error": "Vous ne pouvez pas désactiver votre propre compte." }
        { "error": "Impossible de retirer les droits du dernier administrateur actif." }
    403 { "error": "Seul un administrateur peut modifier un compte Administrateur." }
        { "error": "Seul un administrateur peut promouvoir un compte en Administrateur." }
    401 / 500 : idem 1.1
```
Règles métier à reproduire : impossible de se désactiver soi-même ; impossible de
retirer le rôle Administrateur ou de désactiver le dernier admin actif restant ;
un non-admin ne peut jamais toucher un compte déjà Administrateur (ni promouvoir
quelqu'un vers ce rôle).

### 1.3 DELETE /api/admin/users/:id
```
📌 Supprimer un compte utilisateur
├── Méthode        : DELETE
├── URL            : /api/admin/users/:id
├── Authentification: oui — Rôle requis : Administrateur ou "utilisateurs:manage"
├── Réponse succès : 200 { "success": true }
└── Erreurs :
    400 { "error": "Vous ne pouvez pas supprimer votre propre compte." }
        { "error": "Impossible de retirer les droits du dernier administrateur actif." }
    403 { "error": "Seul un administrateur peut modifier un compte Administrateur." }
    401 / 500
```

### 1.4 POST /api/admin/users/:id/password
```
📌 Réinitialiser le mot de passe d'un utilisateur (admin)
├── Méthode : POST — URL : /api/admin/users/:id/password
├── Authentification : oui — Rôle : Administrateur ou "utilisateurs:manage"
├── Body : { "password": "string, min 8 caractères" }
├── Réponse succès : 200 { "success": true }
└── Erreurs :
    400 { "error": "message zod" }
    403 { "error": "Seul un administrateur peut réinitialiser le mot de passe d'un compte Administrateur." }
    401 / 500
```

### 1.5 PATCH /api/admin/users/:id/annexes
```
📌 Remplace intégralement les annexes assignées à un utilisateur
├── Méthode : PATCH — URL : /api/admin/users/:id/annexes
├── Authentification : oui — Rôle : Administrateur ou "utilisateurs:manage"
├── Body : { "annexeIds": ["uuid", "uuid", ...] }   // au moins 1 élément requis
├── Réponse succès : 200 { "annexeIds": ["uuid", ...] }
└── Erreurs :
    400 { "error": "Au moins une annexe doit être assignée à l'utilisateur." }
    401 / 403 / 500
```
Implémentation actuelle : `DELETE FROM user_annexes WHERE user_id=:id` puis
`INSERT` en masse des nouvelles lignes (pas de transaction explicite — un backend
doit idéalement le faire dans une transaction pour éviter un utilisateur
temporairement sans aucune annexe en cas d'erreur entre les deux étapes).

### 1.6 PATCH /api/auth/password
```
📌 Changer son propre mot de passe (utilisateur connecté)
├── Méthode : PATCH — URL : /api/auth/password
├── Authentification : oui (Bearer du user lui-même) — Rôle : tout utilisateur actif
├── Body :
{ "currentPassword": "string requis", "newPassword": "string requis, min 8" }
├── Réponse succès : 200 { "success": true }
└── Erreurs :
    400 { "error": "Mot de passe actuel et nouveau mot de passe requis." }
        { "error": "Le nouveau mot de passe doit contenir au moins 8 caractères." }
        { "error": "Mot de passe actuel incorrect." }
    401 / 500
```
Implémentation : revérifie `currentPassword` via un second `signInWithPassword`
côté serveur (pas de comparaison de hash directe) avant d'appeler
`admin.auth.admin.updateUserById`.

### 1.7 GET /api/client-ip
```
📌 Retourne l'IP publique du client (pour le journal d'audit)
├── Méthode : GET — URL : /api/client-ip
├── Authentification : non (endpoint public, aucune donnée sensible)
├── Réponse succès : 200 { "ip": "string" }
```
Lit `x-forwarded-for` (dernier segment = IP réelle du proxy de confiance,
les segments précédents étant falsifiables côté client) avec repli sur
`x-real-ip` puis `"127.0.0.1"`.

### 1.8 POST /api/export/excel
```
📌 Génère un fichier .xlsx à partir de lignes déjà calculées côté client
├── Méthode : POST — URL : /api/export/excel
├── runtime : nodejs (pas edge — nécessite le module xlsx)
├── Authentification : oui — Rôle : au moins une permission de lecture métier
│   (clients:read, dossiers:read, factures:read, devis:read, comptabilite:read,
│    stock:read, contrats:read) ou Administrateur
├── Body :
{
  "filename": "string, max 120, optionnel (def. 'export')",
  "headers": ["string", ...],       // min 1
  "rows": [[cellule, ...], ...]     // min 1 ligne, max 2000 lignes
}
├── Réponse succès : 200, binaire
│   Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
│   Content-Disposition: attachment; filename="<nom_assaini>.xlsx"
└── Erreurs :
    400 { "error": "message zod (En-têtes requis / Aucune ligne à exporter / max 2000 lignes)" }
    403 { "error": "Permission insuffisante pour exporter (lecture métier requise)." }
    500 { "error": "Génération du fichier Excel échouée." }
```

---

## 2. ENTITÉS / MODÈLES DE DONNÉES (tables Postgres, REST auto via PostgREST)

Convention générale sur toutes les tables : `id uuid primary key default gen_random_uuid()`,
`created_at timestamptz default now()`, et souvent `updated_at` maintenu par trigger
`update_updated_at_column()`. Tous les montants sont en FCFA (numeric, pas de décimales
métier mais stocké en `numeric` côté DB, casté `Number()` côté client). RLS active sur
**toutes** les tables listées — accès conditionné à `has_permission('<module>:<action>')`
et, pour les tables cloisonnées par annexe, à `has_annexe_access(annexe_id)` (voir §3.6).

### profiles (extension de `auth.users`)
| Champ | Type | Requis | Notes |
|---|---|---|---|
| id | uuid | oui | = `auth.users.id`, FK |
| nom | text | oui | |
| email | text | oui | dupliqué depuis auth.users pour lecture simple |
| role | text | oui | enum applicatif : Administrateur/Agent de transit/Comptable/Magasinier |
| permissions | text[] (jsonb selon impl.) | oui | liste de clés `"module:action"` |
| actif | boolean | oui | défaut true |
| derniere_connexion | timestamptz | non | |

Vue restreinte `profiles_public` (lecture ouverte à tout authentifié) : `id, nom, role, actif, derniere_connexion` — **jamais** `email`/`permissions`.

Relation : `user_annexes (user_id → profiles.id, annexe_id → annexes.id)`, PK composite,
many-to-many. Détermine le périmètre RLS annexe de l'utilisateur.

### annexes
| Champ | Type | Requis |
|---|---|---|
| id | uuid | oui |
| nom | text unique | oui (`"Mali"`, `"Côte d'Ivoire"`) |
| ville_siege | text | oui |
| adresse, telephone, rccm, nif | text | non |
| devise | text | oui, défaut `"FCFA"` |
| actif | boolean | oui, défaut true |

### societes
| Champ | Type | Requis |
|---|---|---|
| id | uuid | oui |
| nom | text unique | oui |
| actif | boolean | oui |
| is_transit | boolean | non — société porteuse du transit |
| logo_url | text | non — chemin bucket public `societe-logos` |
| adresse, telephone, rccm, nif | text | non |
| afficher_nom_avec_logo | boolean | oui, défaut true |
| signataire_dg, signataire_pdg | text | non |

### clients
| Champ | Type | Requis |
|---|---|---|
| id | uuid | oui |
| nom | text | oui |
| type | text | oui — `Particulier \| Entreprise` |
| telephone, email, adresse | text | oui |
| annexe_id | uuid → annexes | oui (NOT NULL) |

`nb_dossiers`, `total_du`, `total_paye` ne sont **pas** des colonnes : calculés côté
client (`syncClientStats`) à partir de `dossiers`/`factures`/`ecritures`. Un backend
qui veut les exposer en lecture devrait soit les recalculer en vue SQL, soit les
renvoyer déjà agrégés.

### dossiers
| Champ | Type | Requis |
|---|---|---|
| id | uuid | oui |
| reference | text | oui — généré `"<PREFIXE_SOCIETE>-TR-<année>-<séquence 4 chiffres>"` |
| societe_id | uuid → societes | oui |
| annexe_id | uuid → annexes | oui (NOT NULL) |
| client_id | uuid → clients | oui |
| bl, camion, nature | text | oui |
| droit_douane, frais_circuit, frais_prestation, montant_investi | numeric | oui |
| montant_paye | numeric | oui, défaut 0 — **ne jamais écrire hors RPC** (§3) |
| statut | text | oui — `En cours \| Dédouané \| Livré \| Soldé` (FSM, voir §2 bis) |
| date | date | oui |
| date_echeance, date_dedouanement | date | non |
| mode_transport | text | non — `Maritime \| Aérien \| Routier \| Ferroviaire` |
| no_conteneur, port_entree | text | non |
| poids_total | numeric | non |
| notes | text | non |

Tables filles (RLS scopée par jointure vers `dossiers.annexe_id`, pas de colonne
annexe propre) :
- **sub_dossiers** : `id, dossier_id, nom, description, date_creation`
- **dossier_fichiers** : `id, dossier_id, sous_dossier_id, nom, taille, type, date_upload, data_url` (fichiers legacy en base64, remplacés par `documents`/Storage pour les nouveaux uploads)
- **dossier_comments** : (utilisé, structure non détaillée ailleurs — commentaires libres liés à un dossier)
- **dossier_fournisseurs** : `id, dossier_id, fournisseur_id, type, description, montant_budgete, montant_reel, statut (En attente|Payé|Litige), date`

### factures + facture_lignes
| Champ (factures) | Type | Requis |
|---|---|---|
| id | uuid | oui |
| numero | text | oui — `"FACT-<année>-<séquence 4 chiffres>"` |
| dossier_id | uuid → dossiers, nullable | non |
| client_id | uuid → clients | oui |
| societe_id | uuid → societes, nullable | non |
| annexe_id | uuid → annexes | oui (NOT NULL) |
| date, date_echeance | date | oui |
| statut | text | oui — `Brouillon\|Envoyée\|Partielle\|Soldée\|Annulée` (FSM stricte, voir §2 bis) |
| taux_tva | numeric | oui — défaut 18 (Mali) |
| montant_ht, montant_tva, montant_ttc | numeric | oui |
| montant_paye | numeric | oui, défaut 0 — **écrit uniquement par RPC** (§3.1/3.3), sauf le cas "Soldée" |
| notes | text | non |
| cree_par | text | oui — nom affiché, pas une FK |
| cree_le | timestamptz | oui |

| Champ (facture_lignes) | Type | Requis |
|---|---|---|
| id, facture_id | uuid | oui |
| description | text | oui |
| quantite, prix_unitaire, montant_ht | numeric | oui |
| compagnie, bordereau_livraison | text | non — modèle facture annexe CI (conteneurs) |

### ecritures (comptabilité — paiements libres, hors facture)
| Champ | Type | Requis |
|---|---|---|
| id | uuid | oui |
| date | date | oui |
| date_paiement | date | non |
| client_id | uuid → clients | oui |
| dossier_id | uuid → dossiers, nullable | non |
| societe_id | uuid → societes, nullable | non |
| annexe_id | uuid → annexes | oui (NOT NULL) |
| montant_investi, montant_paye | numeric | oui |
| mode_paiement | text | oui — `Espèces\|Virement\|Mobile Money\|Chèque` |
| note | text | non |

### stock_items + mouvements
| Champ (stock_items) | Type | Requis |
|---|---|---|
| id | uuid | oui |
| client_id | uuid → clients, nullable | non |
| societe_id | uuid → societes | oui |
| annexe_id | uuid → annexes | oui (NOT NULL) |
| marchandise, unite, depositaire, commercial | text | oui |
| quantite, seuil, somme_payee, reste_a_payer | numeric | oui |

| Champ (mouvements) | Type | Requis |
|---|---|---|
| id | uuid | oui |
| stock_id | uuid → stock_items, nullable | non |
| societe_id | uuid → societes | oui |
| annexe_id | uuid → annexes | oui (NOT NULL) |
| date | timestamptz | oui |
| type | text | oui — `Entrée\|Sortie` |
| marchandise, unite, responsable | text | oui |
| quantite | numeric | oui |
| bon_ref, motif | text | non |

### bons_sortie (marchandise) + bons_sortie_caisse + bons_sortie_caisse_lignes
| Champ (bons_sortie) | Type | Requis |
|---|---|---|
| id | uuid | oui |
| reference | text | oui |
| date | date | oui |
| client_id | uuid → clients | oui |
| societe_id | uuid → societes | oui |
| annexe_id | uuid → annexes | oui — **hérité du `stock_items` visé, pas resélectionné** |
| stock_id | uuid → stock_items, nullable | non |
| marchandise, unite | text | oui |
| quantite, montant | numeric | oui |
| motif | text | oui — `Vente\|Livraison\|Transfert` |
| statut | text | oui — `Brouillon\|Validé` |

| Champ (bons_sortie_caisse) | Type | Requis |
|---|---|---|
| id | uuid | oui |
| reference | text | oui — séquence indépendante des bons stock, format `"N°{n}"` |
| date | date | oui |
| societe_id | uuid → societes | oui |
| annexe_id | uuid → annexes | oui |
| montant_total | numeric | oui |
| cree_par | text | non |

`bons_sortie_caisse_lignes` : `id, bon_id, date, beneficiaire, motif, montant`.

### contrats + contrat_prestations + contrat_fichiers + depenses
| Champ (contrats) | Type | Requis |
|---|---|---|
| id, societe_id, client_id | uuid | oui |
| reference, objet | text | oui |
| date_debut | date | oui |
| date_fin | date | non |
| montant | numeric | oui |
| statut | text | oui — `Actif\|Suspendu\|Clôturé` (FSM enforcée par trigger DB `assert_contrat_transition`) |
| notes, cree_par | text | non |

`contrat_prestations` : `id, contrat_id, libelle, description, montant, statut (Prévue|Réalisée|Annulée), date_prevue, date_realisation, cree_par`.
`contrat_fichiers` : `id, contrat_id, nom, taille, type, date_upload, storage_path` (bucket privé `contrat-fichiers`, URL signée à la demande).
`depenses` : `id, contrat_id, societe_id, libelle, montant, date_depense, mode_paiement, justificatif_path, note, cree_par`.

### archives
`id, nom, type_document (BL|DAU|Facture|Reçu|Contrat|Autre), taille, type (mime), storage_path, dossier_id?, facture_id?, depense_id?, client_id?, societe_id?, cree_par, created_at`. Bucket privé `archives`.

### documents / document_versions / ocr_jobs / ocr_fields (module OCR)
- **documents** : `id, nom, categorie (BL|DAU|Facture|Reçu|SYDONIA|Contrat|Autre), mime_type, taille, dossier_id?, facture_id?, client_id?, societe_id?, entity_type? (dossier|facture|ecriture), entity_id?, current_version, cree_par, created_at, updated_at`.
- **document_versions** : `id, document_id, version, storage_path, taille, mime_type, checksum?, uploaded_by?, created_at`. Bucket privé `documents`.
- **ocr_jobs** : `id, document_id, document_version_id, status (pending|processing|done|failed|validated), provider, raw_text?, error_message?, target_form (dossier|facture|paiement), created_by?, created_at, completed_at?`.
- **ocr_fields** : `id, ocr_job_id, field_key, field_value?, confidence?, bbox? (jsonb), validated_value?`.

### excel_workbooks
Classeur Excel (module Univer) — payload de la grille sérialisé, structure exacte
non détaillée ici (voir `src/lib/store/excel-workbooks-slice.ts` et `excel-workbook.tsx`
pour le schema JSON complet si besoin de le répliquer).

### devis
| Champ | Type | Requis |
|---|---|---|
| id, client_id, societe_id | uuid | oui |
| reference | text | oui — `"DEVIS-<année>-<séquence 4 chiffres>"` |
| nature | text | oui |
| droit_douane, frais_circuit, frais_prestation, total | numeric | oui |
| statut | text | oui — `Brouillon\|Envoyé\|Accepté\|Refusé\|Expiré` |
| date_creation, date_validite | date | oui |
| notes | text | non |
| dossier_id | uuid → dossiers, nullable | non — rempli à la conversion, empêche une double conversion |

**Pas de `annexe_id`** sur `devis` (volontaire : un devis précède l'affectation à
une annexe ; l'annexe est assignée au dossier au moment de la conversion, avec
l'annexe active de l'utilisateur qui convertit).

### fournisseurs + transporteurs
`fournisseurs` : `id, nom, type (Transporteur|Manutentionnaire|Commissionnaire en douane|Loueur|Autre), contact, telephone, email, adresse, tarif_contractuel?, statut (Actif|Inactif)`.
`transporteurs` : `id, nom, contact, telephone, email?, vehicule (Camion|Remorque|Semi-remorque|Benne|Fourgon), immatriculation, trajet, capacite, statut (Actif|Inactif), date_creation, notes?`.

### audit_logs
Journal d'audit — module, action (`Connexion|Création|Modification|Validation|
Paiement|Export|Suppression`), description, client_id?, source (`sourceType`+
`sourceId` pointant vers l'enregistrement concerné). Écriture systématique après
chaque mutation métier côté frontend (`addAuditLog`) — un backend doit reproduire
cet appel après **chaque** opération d'écriture listée dans ce document.

---

## 2 bis. MACHINES À ÉTATS (FSM) — à faire respecter côté backend, pas seulement UI

| Entité | Transitions autorisées |
|---|---|
| **Devis** | Brouillon→[Envoyé,Refusé] · Envoyé→[Accepté,Refusé,Expiré] · Accepté→[] (terminal) · Refusé→[Brouillon] · Expiré→[Brouillon] |
| **Facture** | Brouillon→[Envoyée,Annulée] · Envoyée→[Partielle,Soldée,Annulée] · Partielle→[Soldée,Annulée] · Soldée→[Annulée] · Annulée→[] (terminal) |
| **Contrat** | Actif→[Suspendu,Clôturé] · Suspendu→[Actif,Clôturé] · Clôturé→[Actif] — **enforced par trigger DB** `assert_contrat_transition` |
| **Dossier** | En cours→Dédouané→Livré→Soldé (voir `src/lib/dossier-flow.ts` pour la matrice exacte) |

Toute transition hors de cette matrice doit être rejetée avec `400`.

---

## 3. FONCTIONS RPC (logique métier atomique — endpoints POST équivalents)

Toutes en `security definer`, vérifient elles-mêmes la permission (`has_permission`)
et prennent un verrou de ligne (`SELECT ... FOR UPDATE`) avant de calculer un
cumul — **c'est le point le plus critique à reproduire fidèlement** : un simple
`UPDATE` client-side sans verrou perd des paiements concurrents (cf. bug corrigé
le 2026-08-02 sur `updateFactureStatut`).

### 3.1 record_facture_paiement(p_facture_id uuid, p_montant numeric) → factures
- Permission requise : `factures:write`.
- Rejette si `p_montant <= 0`, si statut facture ∈ {Brouillon, Annulée, Soldée},
  ou si `p_montant > reste_a_payer`.
- `nouveau_paye = min(montant_ttc, montant_paye + p_montant)`.
- `nouveau_statut = "Soldée" si nouveau_paye >= montant_ttc, sinon "Partielle"`.

### 3.2 record_ecriture_paiement(p_ecriture_id uuid, p_montant numeric, p_mode text, p_date date, p_note text?) → ecritures
Même principe pour une écriture comptable libre (paiement incrémental, verrou de ligne).

### 3.3 patch_facture_montant_paye(p_facture_id uuid, p_montant_paye numeric) → { montant_paye, statut }
Ajustement manuel du montant payé (ex. depuis le Classeur) — recalcule aussi le
`statut` cohérent, verrou de ligne.

### 3.4 record_dossier_solde_paiement(p_dossier_id uuid, p_montant numeric, p_mode text?, p_date date?, p_note text?) → table(dossier_montant_paye, ecriture_id, ecriture_montant_paye, ecriture_mode_paiement, ecriture_date_paiement, ecriture_note)
- Permission : `dossiers:transition` ou `dossiers:write`.
- Verrouille `dossiers` puis `ecritures` (crée ou met à jour la ligne liée au dossier).
- Passe le dossier en statut `"Soldé"` atomiquement avec l'écriture.

### 3.5 validate_bon_sortie(p_bon_id uuid, p_responsable text?) → bons_sortie
- Permission : `bons:write`.
- Verrouille `bons_sortie` puis `stock_items` du même article.
- Rejette si stock insuffisant (`quantite < b.quantite`), y compris en cas de
  **course concurrente** (double vérification post-verrou → `"Stock insuffisant
  (course concurrente)"`).
- Décrémente `stock_items.quantite`, insère une ligne `mouvements` (type Sortie),
  passe le bon à `"Validé"`.

### 3.6 Fonctions RLS / permissions (appelées implicitement par chaque policy, pas directement par le frontend)
- `has_permission(perm text) → boolean` : `true` si `profiles.role = 'Administrateur'`
  OU `perm = any(profiles.permissions)`, et `profiles.actif = true`.
- `is_admin() → boolean`.
- `has_annexe_access(target_annexe uuid) → boolean` : `true` si une ligne
  `user_annexes(user_id=auth.uid(), annexe_id=target_annexe)` existe.
- `user_annexe_ids() → uuid[]` : toutes les annexes assignées à l'appelant.

Un backend équivalent doit réimplémenter `has_permission`/`has_annexe_access`
comme un middleware d'autorisation appliqué à **chaque** endpoint CRUD de la
section 2, avec la même matrice permission↔module (voir `src/lib/permissions.ts`,
18 modules / ~35 clés de permission, résumé ci-dessous) — et le croisement
annexe pour les tables listées comme `annexe_id NOT NULL` en section 2.

**Modules de permission (clé = `"module:action"`)** : dashboard:read ·
clients:{read,write} · devis:{read,write} · dossiers:{read,write,transition} ·
factures:{read,write} · stock:{read,write} · bons:{read,write,write-caisse} ·
contrats:{read,write} · fournisseurs:{read,write} · transporteurs:{read,write} ·
calendrier:read · comptabilite:{read,write} · rapports:read ·
parametres:{read,write} · audit:read · utilisateurs:manage · archives:{read,write} ·
documents:{read,write}.

### 3.7 Autres RPC référencées
- `replace_ocr_job_fields(...)` — remplace en bloc les champs extraits d'un job OCR (voir `src/lib/store/documents-slice.ts`).
- `update_updated_at_column()` — trigger générique, met à jour `updated_at = now()` sur chaque UPDATE (posé sur la plupart des tables).

---

## 4. AUTHENTIFICATION

- **Système** : Supabase Auth (GoTrue) — JWT, pas de session serveur custom.
- **Structure du token** : JWT standard Supabase (`sub` = uuid utilisateur, `role:
  "authenticated"`, expiration courte + refresh token).
- **Stockage** : géré par `@supabase/supabase-js` côté client (`persistSession: true`,
  `autoRefreshToken: true`, `detectSessionInUrl: true`) — en pratique `localStorage`
  du navigateur. `lockAcquireTimeout: 5000` ms configuré pour éviter un verrou Auth
  bloquant entre onglets (cf. `src/lib/supabase.ts`).
- **Endpoints nécessitant un token** : tous les appels PostgREST/RPC (RLS exige
  `auth.uid()` non nul) + les 7 routes Next.js de la section 1, sauf
  `GET /api/client-ip` (public).
- **Refresh token** : automatique via `autoRefreshToken`, plus un `onAuthStateChange`
  écouté côté app (`app-root.tsx`) qui réagit à `INITIAL_SESSION`, `SIGNED_IN`,
  `TOKEN_REFRESHED`, `SIGNED_OUT` pour resynchroniser le store applicatif.
- **Login / logout** : pas de route custom — appel direct
  `supabase.auth.signInWithPassword({ email, password })` /
  `supabase.auth.signOut()` côté client (voir `login.tsx`).
- **Register** : pas de self-signup exposé — création exclusivement via
  `POST /api/admin/users` (section 1.1, réservé aux admins/gestionnaires).
- **Changement de mot de passe** : `PATCH /api/auth/password` (soi-même, section
  1.6) ou `POST /api/admin/users/:id/password` (par un admin, section 1.4).
- **Fiabilité session (à reproduire)** : retry (3 tentatives, backoff 400ms×n)
  sur la lecture du profil en cas d'erreur réseau transitoire ; timeout de secours
  de 4s qui débloque l'UI même si `getSession()`/le réseau reste bloqué ; purge des
  Service Workers orphelins pouvant intercepter les requêtes Supabase en dev.

---

## 5. UPLOADS & FICHIERS (Supabase Storage)

| Bucket | Visibilité | Contenu | Accès |
|---|---|---|---|
| `documents` | privé | Documents/OCR (BL, DAU, factures scannées…) | URL signée à la demande, 3600s par défaut |
| `archives` | privé | Pièces archivées (module Archives) | URL signée à la demande |
| `contrat-fichiers` | privé | Justificatifs de contrats/dépenses | URL signée à la demande |
| `societe-logos` | **public** | Logos sociétés (en-têtes documents imprimés) | URL publique directe |

- **Types acceptés** (logo société, `parametres.tsx`) : PNG, JPEG, WebP, SVG.
- **Taille max** (logo société) : 5 Mo (`LOGO_MAX_SIZE_BYTES`). Pas de limite
  explicite trouvée côté client pour les buckets `documents`/`archives`/
  `contrat-fichiers` — à définir côté backend (recommandé : aligner sur 5–20 Mo
  selon le type de scan).
- **Chemin de stockage** (`documents`) : `<AAAA-MM>/<documentId>/v<version>-<timestamp>-<nomFichierAssaini>`.
- **Réponse après upload** : le frontend ne récupère pas d'URL immédiate pour les
  buckets privés — il persiste uniquement `storage_path` en base, et résout une
  URL signée à la demande via `createSignedUrl`. Pour `societe-logos` (public),
  `getPublicUrl` renvoie l'URL directement après upload.
- **Endpoint d'upload attendu** : pas de route Next.js dédiée — upload direct
  `supabase.storage.from(bucket).upload(path, blob, { contentType, upsert })`
  depuis le navigateur (le token Auth du user autorise ou non selon les policies
  Storage RLS du bucket).
- **Legacy** : un pont existe pour d'anciens fichiers stockés en base64 directement
  dans `dossier_fichiers.data_url` (`storagePath` préfixé `legacy/dossier_fichiers/`)
  — à ne reproduire que si des données historiques doivent être migrées.

---

## 6. TEMPS RÉEL

- **Mécanisme** : Supabase Realtime, un seul canal nommé `"sltt-sync"`, écoute
  `postgres_changes` avec `{ event: "*", schema: "public", table: <table> }` pour
  chacune des tables suivantes :
  `dossiers, ecritures, factures, clients, stock_items, mouvements, bons_sortie,
  bons_sortie_caisse, devis, profiles, societes, contrats, depenses,
  contrat_prestations`.
- **Pas de diff fin** : sur **tout** événement (INSERT/UPDATE/DELETE, peu importe
  la ligne), le client déclenche un **refetch complet** du store (`refetchData()`),
  **debouncé à 800 ms** pour absorber les rafales. Un backend qui remplacerait ceci
  par du WebSocket/SSE applicatif doit a minima notifier "quelque chose a changé
  sur telle table", sans forcément pousser la donnée elle-même — c'est le pattern
  attendu par le frontend actuel.
- **Canal actif uniquement si authentifié** (`isAuthenticated`), désinscrit au
  démontage / changement d'état d'authentification.
- **Tables notablement absentes du temps réel** (changements non poussés en live,
  seulement rechargés au prochain fetch manuel/navigation) : `annexes,
  user_annexes, facture_lignes, stock_items` liés indirectement via `mouvements`,
  `archives, documents, document_versions, ocr_jobs, ocr_fields, excel_workbooks,
  audit_logs, fournisseurs, transporteurs, dossier_fichiers, dossier_comments,
  dossier_fournisseurs, sub_dossiers, bons_sortie_caisse_lignes, contrat_fichiers`.

---

## Annexe — fichiers sources de référence pour aller plus loin

- Types frontend complets : `src/lib/domain-types.ts`
- Mapping DB→app (noms de colonnes exacts) : `src/lib/store/*-slice.ts` (fonctions `map*FromDb`)
- Schéma des lignes DB (types TS des tables) : `src/lib/db-rows.ts`
- Policies RLS : `supabase/migrations/20260710_rls_permissions.sql`,
  `20260812_rls_annexe_scoping.sql`, et les correctifs `20260721_fix_rls_permission_drift.sql`,
  `20260722_restrict_profiles_read.sql`
- FSM dossier : `src/lib/dossier-flow.ts` — FSM devis/facture/contrat : `src/lib/status-flow.ts`
- Permissions et rôles par défaut : `src/lib/permissions.ts`
