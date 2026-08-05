# Cahier des charges détaillé — Plateforme SLTT Transit

> Document généré à partir d'un audit exhaustif du code (`src/`, `supabase/migrations/`) le 2026-08-03.
> Niveau de détail : champ par champ, règle par règle. Objectif : servir de spécification de référence pour onboarding, audit, ou reconstruction sur un autre stack.

---

## Sommaire
1. Présentation générale
2. Architecture technique
3. Modèle de données — détail champ par champ
4. Machines à états (FSM)
5. Règles de gestion transversales
6. Matrice des permissions
7. Spécification fonctionnelle par écran
8. Module OCR — détail du pipeline
9. Multi-société / multi-annexe
10. Sécurité
11. Temps réel
12. Routes API custom
13. Glossaire
14. Références

---

## 1. Présentation générale

### 1.1 Objet
Logiciel métier B2B de gestion pour un groupe de **transit / logistique / douane** opérant au **Mali** et en **Côte d'Ivoire**. Périmètre couvert : prospection (devis) → exécution (dossiers de transit) → facturation → comptabilité → entreposage → contrats de prestation → gestion des tiers → archivage documentaire → pilotage (bilans, calendrier, tableau de bord).

### 1.2 Contexte organisationnel

| Société | `is_transit` | Rôle | Annexes |
|---|---|---|---|
| **SLTT** (Société Traoré de Logistique, Transit et Transport) | `true` | Société porteuse du transit | Mali (`ML`), Côte d'Ivoire (`CI`) |
| **Top Doumani** | `false` | Deuxième société, activité distincte | Aucune (concept non applicable) |

Chaque annexe SLTT a sa **comptabilité et ses données strictement séparées** (clients, dossiers, stock, factures, écritures, contrats, devis, fournisseurs, transporteurs, archives, documents) — cloisonnement de sécurité, pas seulement un filtre d'affichage (détail §9).

### 1.3 Rôles utilisateurs

| Rôle | Description | Permissions par défaut (voir §6 pour le détail exhaustif) |
|---|---|---|
| **Administrateur** | Accès total, seul rôle pouvant créer/modifier/promouvoir un autre Administrateur, gérer les utilisateurs sans restriction | Toutes (36 clés) |
| **Comptable** | Facturation, comptabilité, contrats, rapports | 18 clés (lecture large, écriture ciblée) |
| **Agent de transit** | Clients, devis, dossiers, fournisseurs, transporteurs | 18 clés |
| **Magasinier** | Stock, bons de sortie marchandise | 10 clés |

Chaque compte a en plus un **rattachement à une ou plusieurs annexes** (`user_annexes`), orthogonal au rôle — détermine ce qu'il peut *voir*, indépendamment de ce qu'il a le droit de *faire*.

### 1.4 Règles métier propres à l'implantation
- Devise : **FCFA** (franc CFA), montants entiers (pas de décimales métier), stockés `numeric` côté DB.
- TVA standard Mali : **18%** par défaut sur facture (modifiable par facture).
- Locale d'affichage : français (`fr-FR`), dates au format `AAAA-MM-JJ` en base.

---

## 2. Architecture technique

### 2.1 Stack (versions issues de `package.json`)

| Catégorie | Techno | Version |
|---|---|---|
| Framework | Next.js | ^16.1.1 (App Router, **webpack**, pas Turbopack) |
| UI Runtime | React / React DOM | ^19.0.0 |
| Langage | TypeScript | ^5 |
| État | Zustand | ^5.0.6 |
| Style | Tailwind CSS | ^4 (+ `@tailwindcss/postcss`, `tw-animate-css`) |
| Composants UI | Radix UI (`@radix-ui/react-*`) via shadcn/ui, `cmdk` (palette de commandes) | — |
| Icônes | lucide-react | ^0.525.0 |
| Backend/Data | `@supabase/supabase-js` | ^2.110.0 |
| Grilles | ag-grid-community / ag-grid-react | ^36.0.2 |
| Classeur Excel intégré | `@univerjs/presets`, `@univerjs/preset-sheets-core` | ^0.25.1 |
| Graphiques | recharts | ^2.15.4 |
| Rendu PDF | pdfjs-dist | ^6.1.200 |
| Export Excel | exceljs | ^4.4.0 |
| Conversion HEIC | heic2any | ^0.0.4 |
| OCR | tesseract.js | ^7.0.0 |
| Validation | zod | ^3.25.76 |
| Tests | vitest | ^3.2.7 |

### 2.2 Principe d'architecture — pas de backend REST custom
Le frontend appelle **directement** `supabase.from("table").select/insert/update/delete()` — API PostgREST auto-générée. **Aucune route `GET /api/clients`, `POST /api/dossiers`, etc. n'existe.** L'autorisation est appliquée **au niveau base** via Row Level Security, jamais par un middleware applicatif intermédiaire.

- **CRUD standard** : direct PostgREST ; RLS = seule couche d'autorisation (pas de double vérification côté serveur Next.js).
- **Logique métier atomique** (paiements, décrément de stock, soldes) : fonctions Postgres `security definer` avec verrouillage de ligne (`SELECT ... FOR UPDATE`) — §5.4.
- **Auth** : Supabase Auth (GoTrue), JWT ; aucune session serveur custom.
- **Fichiers** : Supabase Storage — buckets privés + URLs signées à la demande (sauf un bucket public pour les logos sociétés).
- **Temps réel** : Supabase Realtime, un seul canal applicatif (§11).
- **7 routes Next.js custom** (`src/app/api/**`) : uniquement pour les opérations nécessitant la clé `service_role` (admin utilisateurs) ou un traitement serveur (génération Excel binaire) — §12.

### 2.3 Organisation du code

```
src/
  app/                     routes Next.js (App Router) + 7 routes API custom
  components/sltt/
    screens/               un écran par module (13 onglets + dashboard + parametres)
    <module>/              sous-composants par module (dialogs, tabs, formulaires)
    layout/                topbar, sidebar, breadcrumb, command palette
    documents/              upload, viewer, OCR review
    ui/                    primitives shadcn/ui
  hooks/                   use-permission, use-active-annexe, use-toast, ...
  lib/
    domain-types.ts        types métier frontend (source de vérité des champs applicatifs)
    db-rows.ts              types des lignes DB brutes (nommage colonnes exact)
    store.ts                assemblage Zustand
    store/*-slice.ts        un slice par entité (mapFromDb + actions CRUD/métier)
    *-flow.ts                machines à états
    permissions.ts           modules/clés/rôles par défaut
    constants/               limites, seuils, formats
    export/                   génération PDF/Excel imprimables
    documents/ocr/            pipeline OCR (provider, mapper, rasterisation, preprocess)
  hooks/, session/           état de session, préférences UI persistées
supabase/migrations/*.sql    historique complet schéma + RLS + RPC (source de vérité DB)
```

---

## 3. Modèle de données — détail champ par champ

Conventions générales : `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at` maintenu par trigger `update_updated_at_column()`. **RLS active sur toutes les tables.**

### 3.1 profiles (extension de `auth.users`)
| Champ (app) | Champ (DB) | Type | Requis | Notes |
|---|---|---|---|---|
| id | id | uuid | oui | = `auth.users.id` |
| nom | nom | text | oui | |
| email | email | text | oui | dupliqué depuis auth.users |
| role | role | text | oui | `Administrateur \| Agent de transit \| Comptable \| Magasinier` |
| permissions | permissions | text[] | oui | clés `"module:action"` |
| actif | actif | boolean | oui, défaut true | |
| derniereConnexion | derniere_connexion | timestamptz | non | |
| annexeIds | (table `user_annexes`) | uuid[] | oui, ≥ 1 | many-to-many |

Vue restreinte `profiles_public` (lecture ouverte à tout authentifié) : `id, nom, role, actif, derniere_connexion` — **jamais** `email`/`permissions` (migrations `20260722_restrict_profiles_read.sql`, `20260816_protect_profiles_sensitive_columns.sql`).

### 3.2 annexes
| Champ (app) | Champ (DB) | Type | Requis | Valeurs actuelles |
|---|---|---|---|---|
| id | id | uuid | oui | `33333333-...` (Mali), `44444444-...` (CI) |
| nom | nom | text unique | oui | "Mali", "Côte d'Ivoire" |
| code | code | text unique | oui | `ML`, `CI` |
| villeSiege | ville_siege | text | oui | "Bamako", "Abidjan" |
| adresse | adresse | text | non | |
| telephone | telephone | text | non | |
| rccm | rccm | text | non | |
| nif | nif | text | non | |
| devise | devise | text | oui, défaut "FCFA" | |
| actif | actif | boolean | oui, défaut true | |

Pas de FK vers `societes` (table indépendante par design — voir §9.1).

### 3.3 societes
| Champ (app) | Champ (DB) | Type | Requis | Notes |
|---|---|---|---|---|
| id | id | uuid | oui | |
| nom | nom | text unique | oui | éditable |
| actif | actif | boolean | oui | |
| isTransit | is_transit | boolean | oui, défaut false | **une seule société** peut avoir `true` (index unique partiel) |
| logoUrl | logo_url | text | non | bucket public `societe-logos` |
| adresse / telephone / rccm / nif | idem | text | non | |
| afficherNomAvecLogo | afficher_nom_avec_logo | boolean | oui, défaut true | évite redondance si logo contient déjà le nom |
| signataireDg / signatairePdg | idem | text | non | signataires bon de sortie caisse |

### 3.4 clients
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| nom | nom | text | oui |
| type | type | text | oui — `Particulier \| Entreprise` |
| telephone | telephone | text | oui |
| email | email | text | oui |
| adresse | adresse | text | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| nbDossiers | *(calculé)* | — | non-persisté, `syncClientStats` |
| totalDu | *(calculé)* | — | non-persisté |
| totalPaye | *(calculé)* | — | non-persisté |

`nbDossiers`/`totalDu`/`totalPaye` ne sont **pas des colonnes** — calculés côté client à partir de dossiers/factures/écritures (`src/lib/client-stats.ts`).

### 3.5 dossiers (+ tables filles)
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| reference | reference | text | oui — voir format §5.2 |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| clientId | client_id | uuid → clients | oui |
| bl | bl | text | oui |
| camion | camion | text | oui |
| nature | nature | text | oui |
| droitDouane | droit_douane | numeric | oui |
| fraisCircuit | frais_circuit | numeric | oui |
| fraisPrestation | frais_prestation | numeric | oui |
| montantInvesti | montant_investi | numeric | oui — assiette totale à payer |
| montantPaye | montant_paye | numeric | oui, défaut 0 — **écrit uniquement par RPC** |
| statut | statut | text | oui — FSM 4 états, §4 |
| date | date | date | oui |
| dateEcheance | date_echeance | date | non |
| dateDedouanement | date_dedouanement | date | non — renseignée à la transition "Dédouané" |
| modeTransport | mode_transport | text | non — `Maritime \| Aérien \| Routier \| Ferroviaire` |
| noConteneur | no_conteneur | text | non |
| portEntree | port_entree | text | non |
| poidsTotal | poids_total | numeric | non — kg |
| notes | notes | text | non |

Tables filles (RLS via jointure `dossiers.annexe_id`, pas de colonne propre) :
- **sub_dossiers** : `id, dossier_id, nom, description, date_creation`
- **dossier_fichiers** : `id, dossier_id, sous_dossier_id, nom, taille, type, date_upload, data_url` — legacy base64, remplacé par `documents`
- **dossier_comments** : commentaires libres liés à un dossier
- **dossier_fournisseurs** : `id, dossier_id, fournisseur_id, type, description, montant_budgete, montant_reel, statut (En attente\|Payé\|Litige), date`

Champs calculés (non persistés) : `calculerEcart()` = `fraisPrestation − (droitDouane + fraisCircuit)` (marge) ; `resteAPayer()` = `max(0, montantInvesti − montantPaye)`.

### 3.6 devis
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| reference | reference | text | oui — format §5.2 |
| clientId | client_id | uuid → clients | oui |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| nature | nature | text | oui |
| droitDouane / fraisCircuit / fraisPrestation | idem | numeric | oui |
| total | total | numeric | oui |
| statut | statut | text | oui — FSM 5 états, §4 |
| dateCreation | date_creation | date | oui |
| dateValidite | date_validite | date | oui |
| notes | notes | text | non |
| dossierId | dossier_id | uuid → dossiers, nullable | non — rempli à la conversion, empêche une double conversion |

### 3.7 factures + facture_lignes
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| numero | numero | text | oui — format §5.2 |
| dossierId | dossier_id | uuid → dossiers, nullable | non |
| clientId | client_id | uuid → clients | oui |
| societeId | societe_id | uuid → societes, nullable | non |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| date | date | date | oui |
| dateEcheance | date_echeance | date | oui |
| statut | statut | text | oui — FSM 5 états, §4 |
| tauxTVA | taux_tva | numeric | oui, défaut 18 |
| montantHT / montantTVA / montantTTC | idem | numeric | oui |
| montantPaye | montant_paye | numeric | oui, défaut 0 — **écrit uniquement par RPC**, sauf cas "Soldée" |
| notes | notes | text | non |
| creePar | cree_par | text | oui — nom affiché, pas une FK |
| creeLe | cree_le | timestamptz | oui |

`facture_lignes` : `id, facture_id, description, quantite, prix_unitaire, montant_ht, compagnie? (modèle CI conteneurs), bordereau_livraison?`.

### 3.8 ecritures (comptabilité — paiements libres, hors facture)
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| date | date | date | oui |
| datePaiement | date_paiement | date | non |
| clientId | client_id | uuid → clients | oui |
| dossierId | dossier_id | uuid → dossiers, nullable | non |
| societeId | societe_id | uuid → societes, nullable | non — nullable = "transit global" |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| montantInvesti / montantPaye | idem | numeric | oui |
| modePaiement | mode_paiement | text | oui — `Espèces \| Virement \| Mobile Money \| Chèque` |
| note | note | text | non |

### 3.9 stock_items + mouvements
| Champ (app) | Champ (DB) — stock_items | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| clientId | client_id | uuid → clients, nullable | non |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| marchandise / unite / depositaire / commercial | idem | text | oui |
| quantite / seuil / sommePayee / resteAPayer | idem | numeric | oui |

| Champ (app) | Champ (DB) — mouvements | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| stockId | stock_id | uuid → stock_items, nullable | non |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| date | date | timestamptz | oui |
| type | type | text | oui — `Entrée \| Sortie` |
| marchandise / unite / responsable | idem | text | oui |
| quantite | quantite | numeric | oui |
| bonRef / motif | idem | text | non |

### 3.10 bons_sortie (marchandise) + bons_sortie_caisse
| Champ (app) | Champ (DB) — bons_sortie | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| reference | reference | text | oui — format §5.2 |
| date | date | date | oui |
| clientId | client_id | uuid → clients | oui |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | oui — **hérité du `stock_items` visé, non resélectionné** |
| stockId | stock_id | uuid → stock_items, nullable | non |
| marchandise / unite | idem | text | oui |
| quantite / montant | idem | numeric | oui |
| motif | motif | text | oui — `Vente \| Livraison \| Transfert` |
| statut | statut | text | oui — `Brouillon \| Validé` |

| Champ (app) | Champ (DB) — bons_sortie_caisse | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| reference | reference | text | oui — `"N°{n}"`, séquence indépendante des bons stock, **pas de préfixe année/annexe** |
| date | date | date | oui |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | oui |
| montantTotal | montant_total | numeric | oui |
| creePar | cree_par | text | non |

`bons_sortie_caisse_lignes` : `id, bon_id, date, beneficiaire, motif, montant`.

### 3.11 contrats + contrat_prestations + contrat_fichiers + depenses
| Champ (app) | Champ (DB) — contrats | Type | Requis |
|---|---|---|---|
| id | id | uuid | oui |
| reference | reference | text | oui — `CTR-{année}-{seq}` |
| societeId | societe_id | uuid → societes | oui |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| clientId | client_id | uuid → clients | oui |
| objet | objet | text | oui |
| dateDebut | date_debut | date | oui |
| dateFin | date_fin | date | non |
| montant | montant | numeric | oui |
| statut | statut | text | oui — FSM 3 états, §4 (trigger DB `assert_contrat_transition`) |
| notes / creePar | idem | text | non |
| nbPrestations / nbPrestationsRealisees / totalDepenses | *(calculés)* | — | non-persisté, `syncContratStats` |

`contrat_prestations` : `id, contrat_id, libelle, description?, montant?, statut (Prévue\|Réalisée\|Annulée), date_prevue?, date_realisation?, cree_par?`.
`contrat_fichiers` : `id, contrat_id, nom, taille, type, date_upload, storage_path` (bucket privé `contrat-fichiers`).
`depenses` : `id, contrat_id, societe_id, libelle, montant, date_depense, mode_paiement, justificatif_path?, note?, cree_par?` — **pas de colonne annexe_id propre**, héritée via jointure `contrat_id → contrats.annexe_id`.

### 3.12 fournisseurs + transporteurs + dossier_fournisseurs
| Champ (app) | Champ (DB) — fournisseurs | Type | Requis |
|---|---|---|---|
| id / nom | idem | uuid / text | oui |
| type | type | text | oui — `Transporteur \| Manutentionnaire \| Commissionnaire en douane \| Loueur \| Autre` |
| contact / telephone / email / adresse | idem | text | oui |
| tarifContractuel | tarif_contractuel | numeric | non |
| statut | statut | text | oui — `Actif \| Inactif` |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| nbDossiers / montantTotal | *(calculés)* | — | non-persisté |

| Champ (app) | Champ (DB) — transporteurs | Type | Requis |
|---|---|---|---|
| id / nom | idem | uuid / text | oui |
| contact / telephone | idem | text | oui / oui |
| email | email | text | non |
| vehicule | vehicule | text | oui — `Camion \| Remorque \| Semi-remorque \| Benne \| Fourgon` |
| immatriculation / trajet | idem | text | oui |
| capacite | capacite | numeric | oui |
| statut | statut | text | oui — `Actif \| Inactif` |
| dateCreation | date_creation | date | oui |
| notes | notes | text | non |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |

`dossier_fournisseurs` : `id, dossier_id, fournisseur_id, type, description, montant_budgete, montant_reel, statut (En attente\|Payé\|Litige), date`.

### 3.13 archives
| Champ (app) | Champ (DB) | Type | Requis |
|---|---|---|---|
| id / nom | idem | uuid / text | oui |
| typeDocument | type_document | text | oui — `BL\|DAU\|Facture\|Reçu\|Contrat\|Autre` |
| taille / type (mime) | idem | int / text | oui |
| storagePath | storage_path | text | oui — bucket privé `archives` |
| dossierId / factureId / depenseId / clientId | idem | uuid, nullable | non |
| societeId | societe_id | uuid, nullable | non |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| creePar | cree_par | text | non |
| createdAt | created_at | timestamptz | oui |

### 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR)
| Champ (app) — documents | Champ (DB) | Type | Requis |
|---|---|---|---|
| id / nom | idem | uuid / text | oui |
| categorie | categorie | text | oui — `BL\|DAU\|Facture\|Reçu\|SYDONIA\|Contrat\|Autre` |
| mimeType / taille | mime_type / taille | text / int | oui |
| dossierId / factureId / clientId | idem | uuid, nullable | non |
| entityType | entity_type | text, nullable | non — `dossier\|facture\|ecriture` |
| entityId | entity_id | uuid, nullable | non |
| annexeId | annexe_id | uuid → annexes | **oui (NOT NULL)** |
| currentVersion | current_version | int | oui |
| creePar | cree_par | uuid → profiles | non |

`document_versions` : `id, document_id, version, storage_path (bucket privé documents), taille, mime_type, checksum?, uploaded_by?`.
`ocr_jobs` : `id, document_id, document_version_id, status (pending\|processing\|done\|failed\|validated), provider (défaut "tesseract"), raw_text?, error_message?, target_form (dossier\|facture\|paiement), created_by?`.
`ocr_fields` : `id, ocr_job_id, field_key, field_value?, confidence? (0-1), bbox? (jsonb), validated_value?` — unique `(ocr_job_id, field_key)`.

### 3.15 excel_workbooks & audit_logs
- **excel_workbooks** : classeur Excel intégré (module Univer) — payload JSON sérialisé de la grille.
- **audit_logs** : `module, action (Connexion\|Création\|Modification\|Validation\|Paiement\|Export\|Suppression), description, client_id?, source (sourceType+sourceId)` — écriture systématique après chaque mutation métier côté frontend.

---

## 4. Machines à états (FSM)

| Entité | États | Transitions autorisées | Enforcement |
|---|---|---|---|
| **Dossier** | En cours, Dédouané, Livré, Soldé | En cours→Dédouané→Livré→Soldé (**flux linéaire strict, une seule transition à la fois, jamais en arrière**) | `src/lib/dossier-flow.ts` (`assertDossierTransition`) |
| **Devis** | Brouillon, Envoyé, Accepté, Refusé, Expiré | Brouillon→{Envoyé,Refusé} · Envoyé→{Accepté,Refusé,Expiré} · Accepté→∅ (terminal) · Refusé→{Brouillon} · Expiré→{Brouillon} | `src/lib/status-flow.ts` (`canTransitionDevis`) |
| **Facture** | Brouillon, Envoyée, Partielle, Soldée, Annulée | Brouillon→{Envoyée,Annulée} · Envoyée→{Partielle,Soldée,Annulée} · Partielle→{Soldée,Annulée} · Soldée→{Annulée} · Annulée→∅ | `src/lib/status-flow.ts` (`canTransitionFacture`) |
| **Contrat** | Actif, Suspendu, Clôturé | Actif→{Suspendu,Clôturé} · Suspendu→{Actif,Clôturé} · Clôturé→{Actif} | `src/lib/status-flow.ts` + trigger DB `assert_contrat_transition` (double enforcement) |
| **Bon de sortie (marchandise)** | Brouillon, Validé | Brouillon→Validé uniquement (irréversible, décrémente le stock via RPC) | `validate_bon_sortie` RPC |
| **Prestation de contrat** | Prévue, Réalisée, Annulée | libre (pas de FSM stricte codée) | — |
| **Job OCR** | pending, processing, done, failed, validated | pending→processing→{done,failed}→validated (validation manuelle) | `documents-slice.ts` |

Toute transition hors matrice est **rejetée** avec un message d'erreur explicite côté UI ; pour Contrat, également rejetée en base (défense en profondeur).

---

## 5. Règles de gestion transversales

### 5.1 Montants et paiements
- Un **paiement incrémental** ne peut jamais dépasser le reste à payer (`validatePaymentAmount` — lève une erreur sinon).
- `computeIncrementalPaye(currentPaye, plafond, montant)` plafonne toujours le cumul à `plafond` (jamais de dépassement même en cas de double-clic).
- Toute écriture de `montant_paye` (dossier, facture, écriture) passe **exclusivement par RPC** avec verrou de ligne (`SELECT ... FOR UPDATE`) — jamais un `UPDATE` direct côté client, pour éviter la perte de paiements concurrents.
- TVA facture : `montantTVA = round(montantHT × tauxTVA / 100)`, `montantTTC = montantHT + montantTVA`.
- Marge dossier (`calculerEcart`) = `fraisPrestation − (droitDouane + fraisCircuit)`.

### 5.2 Numérotation des documents
| Document | Format standard (Top Doumani / hors annexe) | Format SLTT annexe-scopé |
|---|---|---|
| Dossier | `{Société}-TR-{année}-{seq 4 chiffres}` | `{Société}-{ML\|CI}-TR-{année}-{seq}` |
| Facture | `FACT-{année}-{seq}` | `{ML\|CI}-FACT-{année}-{seq}` |
| Devis | `DEVIS-{année}-{seq}` | `{ML\|CI}-DEVIS-{année}-{seq}` |
| Bon de sortie (marchandise) | `BS-{année}-{seq}` | `{ML\|CI}-BS-{année}-{seq}` |
| Bon de sortie caisse | `N°{n}` — séquence indépendante, pas de segment année ni annexe | — |
| Contrat | `CTR-{année}-{seq}` — pas de segment annexe | — |

Le préfixage annexe (`ML-`/`CI-`) ne s'applique **qu'aux documents de la société marquée `is_transit`** (SLTT). Pour ces documents, la séquence est calculée **par sous-ensemble de références existantes de la même annexe** (pas un compteur global partagé) — garantit une numérotation consécutive par annexe, cohérente avec les usages comptables/douaniers locaux distincts.

### 5.3 Fichiers & uploads
| Contexte | Formats acceptés | Taille max |
|---|---|---|
| Documents/OCR | PDF, JPEG, PNG, HEIC, HEIF, WebP | **10 Mo / fichier** |
| Archives | PDF, JPEG, PNG, WebP, Word (.doc/.docx) | 50 Mo (limite bucket) |
| Logo société | PNG, JPEG, WebP, SVG | 5 Mo |
| Conversion HEIC→JPEG | automatique côté client avant upload (qualité 0.9) | — |
| Export Excel (API) | — | max 2000 lignes par export |

### 5.4 Fonctions RPC (`security definer`, verrou de ligne)
| Fonction | Permission requise | Comportement |
|---|---|---|
| `record_facture_paiement(facture_id, montant)` | `factures:write` | Rejette si `montant ≤ 0`, si statut ∈ {Brouillon, Annulée, Soldée}, ou si `montant > reste_a_payer`. `nouveau_paye = min(ttc, paye+montant)`. Statut → Soldée si atteint, sinon Partielle. |
| `record_ecriture_paiement(ecriture_id, montant, mode, date, note?)` | — | Même principe pour écriture libre. |
| `patch_facture_montant_paye(facture_id, montant_paye)` | — | Ajustement manuel (classeur), recalcule le statut cohérent. |
| `record_dossier_solde_paiement(dossier_id, montant, mode?, date?, note?)` | `dossiers:transition` ou `dossiers:write` | Verrouille dossier puis écriture liée, passe le dossier à "Soldé" atomiquement. |
| `validate_bon_sortie(bon_id, responsable?)` | `bons:write` | Verrouille bon puis stock ; rejette si stock insuffisant (double vérification anti-course concurrente) ; décrémente stock, insère mouvement, passe à "Validé". |
| `replace_ocr_job_fields(...)` | — | Remplace en bloc les champs extraits d'un job OCR. |
| `has_permission(perm)` | — | `true` si `role='Administrateur'` OU `perm ∈ profiles.permissions`, et `actif=true`. |
| `is_admin()` | — | Raccourci rôle Administrateur. |
| `has_annexe_access(annexe_id)` | — | `true` si une ligne `user_annexes(user_id=auth.uid(), annexe_id)` existe. |
| `user_annexe_ids()` | — | Toutes les annexes assignées à l'appelant. |

### 5.5 Journal d'audit
Chaque mutation métier significative (création, modification, validation, paiement, export, suppression) déclenche un `addAuditLog(module, action, description, clientId?, source?)` — persisté dans `audit_logs`, consultable via `audit:read`.

---

## 6. Matrice des permissions

18 modules, format de clé `"module:action"`. Colonne "Défaut" = rôles ayant la permission par défaut (modifiable individuellement par un Administrateur, sans changer le rôle).

| Module | Clé | Action | Admin | Comptable | Agent transit | Magasinier |
|---|---|---|:---:|:---:|:---:|:---:|
| Tableau de bord | `dashboard:read` | lecture | ✓ | ✓ | ✓ | ✓ |
| Clients | `clients:read` | lecture | ✓ | ✓ | ✓ | — |
| Clients | `clients:write` | écriture | ✓ | — | ✓ | — |
| Devis | `devis:read` | lecture | ✓ | — | ✓ | — |
| Devis | `devis:write` | écriture | ✓ | — | ✓ | — |
| Dossiers | `dossiers:read` | lecture | ✓ | ✓ | ✓ | — |
| Dossiers | `dossiers:write` | écriture | ✓ | — | ✓ | — |
| Dossiers | `dossiers:transition` | changement statut | ✓ | — | ✓ | — |
| Factures | `factures:read` | lecture | ✓ | ✓ | ✓ | — |
| Factures | `factures:write` | écriture | ✓ | ✓ | — | — |
| Entreposage | `stock:read` | lecture | ✓ | — | — | ✓ |
| Entreposage | `stock:write` | écriture | ✓ | — | — | ✓ |
| Bons | `bons:read` | lecture | ✓ | ✓ | — | ✓ |
| Bons | `bons:write` | écriture marchandise | ✓ | — | — | ✓ |
| Bons | `bons:write-caisse` | décaissement caisse | ✓ | ✓ | — | — |
| Contrats | `contrats:read` | lecture | ✓ | ✓ | ✓ | ✓ |
| Contrats | `contrats:write` | écriture | ✓ | ✓ | — | ✓ |
| Fournisseurs | `fournisseurs:read` | lecture | ✓ | ✓ | ✓ | — |
| Fournisseurs | `fournisseurs:write` | écriture | ✓ | — | ✓ | — |
| Transporteurs | `transporteurs:read` | lecture | ✓ | — | ✓ | — |
| Transporteurs | `transporteurs:write` | écriture | ✓ | — | ✓ | — |
| Calendrier | `calendrier:read` | lecture | ✓ | ✓ | ✓ | ✓ |
| Comptabilité | `comptabilite:read` | lecture | ✓ | ✓ | — | — |
| Comptabilité | `comptabilite:write` | écriture | ✓ | ✓ | — | — |
| Bilans & rapports | `rapports:read` | lecture | ✓ | ✓ | — | — |
| Paramètres | `parametres:read` | lecture | ✓ | — | — | — |
| Paramètres | `parametres:write` | écriture | ✓ | — | — | — |
| Paramètres | `audit:read` | journal d'audit | ✓ | — | — | — |
| Utilisateurs | `utilisateurs:manage` | gestion comptes (hors Admin) | ✓ | — | — | — |
| Archives | `archives:read` | lecture | ✓ | ✓ | ✓ | ✓ |
| Archives | `archives:write` | écriture | ✓ | ✓ | ✓ | — |
| Documents & OCR | `documents:read` | lecture | ✓ | ✓ | ✓ | ✓ |
| Documents & OCR | `documents:write` | écriture | ✓ | ✓ | ✓ | — |

**Règles complémentaires** (non capturées par la matrice, appliquées en code + RLS) :
- Un tableau de permissions **vide** signifie explicitement « aucun accès » — pas de repli automatique sur les permissions par défaut du rôle (côté base *et* côté frontend).
- Seul un **Administrateur** peut créer, promouvoir vers, ou modifier un compte déjà Administrateur.
- Impossible de se **désactiver soi-même**, de retirer le rôle Administrateur du **dernier admin actif**, ou de le désactiver.
- `has_permission()` (Postgres) fait autorité — c'est la même logique qui protège les policies RLS et les vérifications frontend (`usePermission`), pas deux implémentations divergentes.

---

## 7. Spécification fonctionnelle par écran

### 7.1 Dashboard
KPIs consolidés (dossiers en cours, factures impayées, bénéfice du mois, alertes stock faible), raccourcis d'accès rapide, graphique d'activité mensuelle. Filtrable par société (`SocieteFilterSelect`).

### 7.2 Clients
- **Liste** : recherche, filtre type (Particulier/Entreprise), tri (nom/totalDû/nbDossiers), pagination (8/page), filtre annexe (topbar, multi-annexe).
- **Fiche client ("Classeur")** : historique consolidé dossiers + factures + écritures, agrégats totalDû/totalPayé.
- **Formulaire** : nom, type, téléphone, email, adresse (annexe assignée automatiquement à la création = annexe active).
- **Permissions** : `clients:read` / `clients:write`.

### 7.3 Devis
- **Cycle de vie** : Brouillon → Envoyé → Accepté/Refusé/Expiré (FSM §4), expiration automatique programmée (`expireDevisObsoletes`, déclenchée à l'ouverture de l'écran).
- **Conversion en dossier** : uniquement si statut = Accepté et non déjà converti (`dossierId` déjà rempli = garde anti-doublon) ; l'annexe du dossier créé = annexe active de l'utilisateur au moment de la conversion (pas celle du devis, qui n'en a pas au moment de la création — elle est assignée dès la création du devis depuis F-ANNEXE mais la conversion peut se faire par un autre utilisateur/une autre session).
- **Permissions** : `devis:read` / `devis:write`.

### 7.4 Dossiers
- **Création** : formulaire wizard multi-étapes, ou **via OCR** (§8).
- **Suivi** : FSM 4 statuts avec stepper visuel, transition avec encaissement optionnel (mode paiement + montant + date).
- **Détail** : sous-dossiers, fichiers/commentaires liés, fournisseurs rattachés (budget vs réel), aperçu financier (droit douane, frais circuit, prestation, marge).
- **Filtres liste** : société, annexe, client, statut, non-soldé uniquement, période (mois/trimestre), année, tri multi-critères.
- **Permissions** : `dossiers:read` / `dossiers:write` / `dossiers:transition`.

### 7.5 Factures
- **Lignes détaillées** : description, quantité, prix unitaire, + champs `compagnie`/`bordereauLivraison` (modèle facture annexe CI, transport conteneurs).
- **TVA** : taux modifiable par facture, défaut 18%.
- **Paiement** : incrémental, verrouillé via RPC (`record_facture_paiement`), jamais de dépassement du TTC.
- **FSM** : §4.
- **Permissions** : `factures:read` / `factures:write`.

### 7.6 Entreposage
- **Stock** : articles avec seuil d'alerte, dépositaire, commercial, somme payée / reste à payer.
- **Mouvements** : Entrée/Sortie, historique filtrable par article.
- **Filtres** : société, annexe.
- **Permissions** : `stock:read` / `stock:write`.

### 7.7 Contrats
- **Prestations** : Prévue/Réalisée/Annulée, montant optionnel par prestation.
- **Dépenses** : liées au contrat (pas de FK directe vers annexe — héritée du contrat), justificatifs.
- **Fichiers** : bucket privé `contrat-fichiers`, URL signée à la demande.
- **FSM** : §4 (double enforcement app + trigger DB).
- **Permissions** : `contrats:read` / `contrats:write`.

### 7.8 Bons de sortie
- **Marchandise** : décrément stock atomique via RPC, statut Brouillon→Validé irréversible, double vérification anti-course concurrente en cas de validations simultanées.
- **Caisse** : décaissements libres multi-lignes (bénéficiaire, motif, montant par ligne), numérotation `N°{n}` indépendante.
- **Permissions** : `bons:read` / `bons:write` (marchandise) / `bons:write-caisse`.

### 7.9 Archives
- **Vue unifiée** : agrège `archives` + fichiers dossiers legacy (`dossier_fichiers`) + fichiers contrats (`contrat_fichiers`) en une liste unique, sans duplication de données.
- **Rattachement** : dossier, facture, dépense, ou "libre" (client/société directs).
- **Filtres** : type de document, client, société, annexe, période.
- **Permissions** : `archives:read` / `archives:write` (suppression réservée Admin).

### 7.10 Fournisseurs
- **Annuaire** : type (Transporteur/Manutentionnaire/Commissionnaire en douane/Loueur/Autre), tarif contractuel optionnel.
- **Liaison dossiers** : budget prévisionnel vs montant réel, statut (En attente/Payé/Litige).
- **Permissions** : `fournisseurs:read` / `fournisseurs:write`.

### 7.11 Transporteurs
- **Flotte** : véhicule (Camion/Remorque/Semi-remorque/Benne/Fourgon), capacité, immatriculation, trajet habituel.
- **Statut** : Actif/Inactif.
- **Permissions** : `transporteurs:read` / `transporteurs:write`.

### 7.12 Calendrier
- **Vue mensuelle** : échéances dossiers (date_echeance), bons, écritures — chaque type d'événement filtré par la permission du module d'origine (pas de fuite d'info si l'utilisateur n'a pas accès au module).
- **Permissions** : `calendrier:read` (accessible à tous les rôles).

### 7.13 Comptabilité
- **Écritures libres** : hors facture, paiement incrémental (RPC).
- **Onglets par société** : y compris "transit global" (société non affectée).
- **Export Excel** serveur (`POST /api/export/excel`).
- **Permissions** : `comptabilite:read` / `comptabilite:write`.

### 7.14 Bilans
- **Bénéfice** : consolidé + par société (`useBeneficeParSociete`), + **par annexe** pour les utilisateurs multi-annexes (recettes = écritures + factures du mois ; dépenses = sorties de caisse + dépenses de contrats).
- **Graphiques** : mensuel sur l'année sélectionnée.
- **Permissions** : `rapports:read`.

### 7.15 Paramètres
- **Sociétés** : identité légale, logo, signataires.
- **Annexes** : identité légale par annexe (ville, adresse, RCCM, NIF).
- **Utilisateurs** : création/modification/désactivation, rôle, permissions individuelles, **rattachement annexes**.
- **Préférences** : thème clair/sombre.
- **Permissions** : `parametres:read` / `parametres:write` / `audit:read` / `utilisateurs:manage`.

---

## 8. Module OCR — détail du pipeline

### 8.1 Entrée
`document-upload-zone.tsx` — glisser-déposer ou sélection ; validation format (PDF/JPG/PNG/HEIC/HEIF/WebP) et taille (10 Mo max) **avant** tout upload réseau ; conversion HEIC→JPEG côté client (qualité 0.9) ; lecture en `dataURL`.

### 8.2 Stockage
Upload vers bucket privé `documents`, chemin `<AAAA-MM>/<documentId>/v<version>-<timestamp>-<nomAssaini>`. Ligne `documents` créée en base, `annexe_id` résolu ainsi (ordre de priorité) :
1. Annexe du dossier lié, si `dossierId` fourni.
2. Annexe de la facture liée, si `factureId` fourni.
3. Annexe active de l'utilisateur connecté (repli, ex. flux "Nouveau dossier via OCR" où le document précède la création du dossier).

### 8.3 Extraction (`tesseract-provider.ts`)
- PDF → rasterisation page par page (pdfjs-dist) avant OCR, plafond de pages traité (indication si tronqué).
- Image → prétraitement (`preprocess.ts`) puis reconnaissance Tesseract **français + anglais** simultanément.
- Assets servis **localement** (`/public/ocr/{worker.min.js, *.wasm, lang/*.traineddata.gz}`) — aucune dépendance CDN, compatible avec la CSP par nonce.
- Un job `ocr_jobs` trace le cycle de vie : `pending → processing → done|failed`.

### 8.4 Mapping heuristique (`dossier-mapper.ts`)
Extraction par regex FR sur le texte brut, avec score de confiance heuristique (0–1, fonction de la longueur du match et d'un facteur de qualité OCR moyen) :

| Champ | Détection | Traitement |
|---|---|---|
| BL | motifs `N° BL`, `B/L`, `connaissement`, `bill of lading` | uppercase |
| Date | motifs `date d'émission/embarquement/arrivée`, formats JJ/MM/AAAA ou ISO | normalisation → `AAAA-MM-JJ`, validation calendaire stricte |
| Client (nom) | motifs `client/destinataire/consignee/importateur/nom` | recherche floue dans la liste clients (exact > préfixe > sous-chaîne ≥ 4 car.) |
| Montant | motifs `montant/total TTC/investi`, formats FR (`1 234 567,89`) et EN (`1,234,567.89`) | parsing FR/EN auto-détecté, rejette les valeurs ambiguës |
| Référence douanière | motifs `réf. douanière/DAU/SYDONIA/n° déclaration` | uppercase |
| Nature | motifs `nature/marchandise/description/désignation` | — |
| Camion/immatriculation | motifs `camion/immatriculation/véhicule/plaque` | uppercase |

### 8.5 Revue et validation
`ocr-review-dialog.tsx` — formulaire préempli, champs **< 75% de confiance** (`OCR_LOW_CONFIDENCE_THRESHOLD`) surlignés en ambre, texte brut OCR consultable, validation manuelle **obligatoire** (permission `documents:write` **et** `dossiers:write` requises) avant écriture en base. À la validation : dossier créé (ou mis à jour si `existingDossierId` fourni), document lié (`entity_type=dossier`), champs `ocr_fields.validated_value` renseignés.

### 8.6 Fiabilité
- Annulation propre (`AbortController`) si le dialog est fermé pendant l'extraction — job marqué `failed`, jamais de job fantôme.
- Repli manuel si l'OCR échoue (aucun texte détecté, scan illisible) — formulaire reste éditable avec message d'erreur explicite.
- Relance possible sans recréer un nouveau document (« Relancer OCR »).

---

## 9. Multi-société / multi-annexe

### 9.1 Deux dimensions orthogonales
- **Société** (`societe_id`) : niveau comptable/légal (SLTT / Top Doumani), simple **filtre UI partagé** entre écrans, jamais un mécanisme de sécurité.
- **Annexe** (`annexe_id`) : niveau opérationnel (Mali / Côte d'Ivoire), **sécurisé par RLS** (`has_annexe_access`), obligatoire (NOT NULL) sur la quasi-totalité des tables métier. Table `annexes` sans FK vers `societes` — extensible à une 3ᵉ annexe sans changement de schéma.

### 9.2 Isolation des données
Cloisonnement appliqué **au niveau base** (policies RLS), pas seulement côté interface — aucune table métier annexe-scopée n'est lisible par un utilisateur non assigné à l'annexe concernée, quelle que soit l'interface (UI, appel API direct, outil externe connecté au même projet Supabase).

### 9.3 Rattachement utilisateur
Table `user_annexes` (many-to-many). Un utilisateur doit avoir **au moins une annexe**. Géré via `Paramètres > Utilisateurs`, endpoint `PATCH /api/admin/users/:id/annexes`.

### 9.4 Sélecteur d'annexe (topbar)
`AnnexeSelector` — **masqué pour les utilisateurs mono-annexe**. Double rôle pour un utilisateur multi-annexe :
1. **Filtre de vue** partagé sur les 13 écrans (option « Toutes les annexes » = aucun filtre).
2. **Contexte de création** — annexe assignée aux nouveaux enregistrements (repli sur la première annexe assignée si « Toutes les annexes » est actif).

Choix persisté localement (pas resélectionné à chaque connexion).

### 9.5 Numérotation
Voir §5.2 — préfixage `ML-`/`CI-` et séquence indépendante par annexe, réservé à la société `is_transit`.

### 9.6 Reporting consolidé
Écran Bilans — vue « Toutes annexes » + détail par annexe (recettes/dépenses/bénéfice), incluant écritures, factures, sorties de caisse et dépenses de contrats (réservé aux comptes multi-annexes).

---

## 10. Sécurité

### 10.1 Authentification
Supabase Auth (GoTrue), JWT standard, `persistSession: true`, `autoRefreshToken: true`, stockage `localStorage`. `lockAcquireTimeout: 5000` ms pour éviter un verrou Auth bloquant entre onglets. Pas de self-signup — création exclusivement via route admin. Retry (3 tentatives, backoff 400ms×n) + timeout de secours de 4s sur la lecture du profil au démarrage. Purge des Service Workers orphelins en dev.

### 10.2 RLS
Activée sur **toutes** les tables — deux couches combinées : `has_permission('<module>:<action>')` (toujours) + `has_annexe_access(annexe_id)` (tables cloisonnées par annexe).

### 10.3 Storage
| Bucket | Visibilité | Contenu | Cloisonnement |
|---|---|---|---|
| `documents` | privé | Scans OCR (BL, DAU, factures) | permission + annexe (via jointure `document_versions → documents`) |
| `archives` | privé | Pièces archivées | permission + annexe |
| `contrat-fichiers` | privé | Justificatifs contrats/dépenses | permission + annexe (via jointure `contrats`) |
| `societe-logos` | **public** | Logos (en-têtes documents imprimés) | aucun (public par nature) |

URLs signées à la demande (3600s par défaut), jamais d'URL persistée pour les buckets privés.

### 10.4 En-têtes HTTP
CSP appliquée **par nonce** (middleware Next.js) — aucun script/style inline non nonced, aucune dépendance CDN (fonts, OCR).

---

## 11. Temps réel
Canal unique `"sltt-sync"` (Supabase Realtime), écoute `postgres_changes` (`event: "*"`) sur : `dossiers, ecritures, factures, clients, stock_items, mouvements, bons_sortie, bons_sortie_caisse, devis, profiles, societes, contrats, depenses, contrat_prestations`.

**Comportement** : pas de diff fin — tout événement (INSERT/UPDATE/DELETE, peu importe la ligne) déclenche un **refetch complet** du store, debouncé à 800 ms. Canal actif uniquement si authentifié, désinscrit au démontage/changement d'état d'auth.

**Hors temps réel** (rechargées seulement au prochain fetch manuel/navigation) : `annexes, user_annexes, facture_lignes, archives, documents, document_versions, ocr_jobs, ocr_fields, excel_workbooks, audit_logs, fournisseurs, transporteurs, dossier_fichiers, dossier_comments, dossier_fournisseurs, sub_dossiers, bons_sortie_caisse_lignes, contrat_fichiers`.

---

## 12. Routes API custom (7)
Toutes nécessitent `Authorization: Bearer <jwt>` sauf mention contraire. Middleware commun `src/lib/auth/require-admin.ts` (décode JWT, charge `profiles`, rejette si `actif=false`).

| # | Route | Méthode | Rôle requis | Body | Erreurs notables |
|---|---|---|---|---|---|
| 1 | `/api/admin/users` | POST | Admin ou `utilisateurs:manage` | `{nom, email, role, permissions?, password (≥8)}` | 403 si non-admin tente de créer un Administrateur ; rollback auto si l'écriture profil échoue après création Auth |
| 2 | `/api/admin/users/:id` | PATCH | idem | `{nom, email, role, permissions?, actif?}` | 400 auto-désactivation / dernier admin ; 403 si non-admin touche un compte Administrateur |
| 3 | `/api/admin/users/:id` | DELETE | idem | — | mêmes gardes que PATCH |
| 4 | `/api/admin/users/:id/password` | POST | idem | `{password (≥8)}` | 403 si cible Administrateur et appelant non-admin |
| 5 | `/api/admin/users/:id/annexes` | PATCH | idem | `{annexeIds: string[] (≥1)}` | 400 si tableau vide — `DELETE`+`INSERT` en masse, non transactionnel (repli côté DB à surveiller) |
| 6 | `/api/auth/password` | PATCH | tout utilisateur actif | `{currentPassword, newPassword (≥8)}` | revérifie l'ancien mot de passe via un second `signInWithPassword` serveur |
| 7 | `/api/client-ip` | GET | public | — | lit `x-forwarded-for` (dernier segment fiable) puis `x-real-ip` puis `127.0.0.1` |
| 8 | `/api/export/excel` | POST | permission de lecture métier | `{filename?, headers[], rows[][] (≤2000)}` | runtime nodejs (pas edge) |

---

## 13. Glossaire

| Terme | Définition |
|---|---|
| **Annexe** | Implantation physique de SLTT (Mali/CI) — cloisonnement RLS des données, orthogonal à la société |
| **Société** | Entité légale/comptable (SLTT/Top Doumani) — simple filtre UI |
| **Dossier (de transit)** | Unité de travail principale : un envoi/opération de transit pour un client |
| **DAU** | Déclaration en Douane Unique |
| **BL** | Bordereau/Bon de Livraison (Bill of Lading) |
| **SYDONIA** | Système douanier informatisé (référence documentaire) |
| **Classeur** | Vue consolidée des mouvements financiers d'un client (fiche client) |
| **RLS** | Row Level Security — autorisation appliquée au niveau des lignes en base Postgres |
| **RPC** | Remote Procedure Call — fonction Postgres appelée via `supabase.rpc()` |
| **FSM** | Finite State Machine — machine à états, transitions de statut contrôlées |
| **`is_transit`** | Flag booléen unique identifiant la société porteuse du transit (SLTT) |
| **PostgREST** | API REST auto-générée par Supabase à partir du schéma Postgres |

---

## 14. Références (fichiers sources)
- Spécification API frontend↔backend exhaustive : `API_REQUIREMENTS.md`
- Types frontend complets : `src/lib/domain-types.ts`
- Mapping DB→app : `src/lib/store/*-slice.ts` (fonctions `map*FromDb`)
- Schéma des lignes DB : `src/lib/db-rows.ts`
- Permissions et rôles par défaut : `src/lib/permissions.ts`
- FSM dossier : `src/lib/dossier-flow.ts` — FSM devis/facture/contrat : `src/lib/status-flow.ts`
- Règles de paiement : `src/lib/payments.ts`
- Constantes de validation (tailles, seuils) : `src/lib/constants/validation.constants.ts`
- Pipeline OCR : `src/lib/documents/ocr/{tesseract-provider,run-ocr,mappers/dossier-mapper}.ts`
- Historique complet du schéma / RLS / RPC : `supabase/migrations/*.sql` (chronologique, source de vérité DB)
- Migrations clés multi-annexe : `20260809_annexes.sql`, `20260810_annexe_id_existing_tables.sql`, `20260811_user_annexes.sql`, `20260812_rls_annexe_scoping.sql`, `20260817_rls_annexe_contrats_devis.sql`, `20260818_annexe_numbering_and_archives.sql`, `20260819_documents_ocr_annexe_scoping.sql`
