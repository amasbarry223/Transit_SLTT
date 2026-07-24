# SLTT — Demande d'évolution v0.3 : Multi-société, Contrats, Bénéfice, TVA optionnelle

> **Prompt de spécification pour Cursor.** À lire en complément du code existant (`C:\Users\cisse\Bureau\Transit_SLTT`) et du document de spécifications dérivé du code (Next.js 16 / React 19 / Supabase / Zustand / Tailwind 4). UI en français, montants en FCFA, conventions du repo à respecter.

---

## 0. Contexte

La plateforme SLTT gère déjà : clients, devis, dossiers de transit, factures (TVA 18 % par défaut), comptabilité (table `ecritures`), entreposage (`stock_items`, `mouvements`), bons de sortie, fournisseurs, transporteurs, permissions granulaires + RLS Supabase.

**Nouveauté métier :** deux sociétés distinctes vont désormais travailler sur la même plateforme, principalement sur l'activité **entreposage** :

1. **Top Doumani**
2. **Traoré Transit Logistique**

Le client demande de pouvoir séparer leur activité et leur comptabilité (chacune doit voir son résultat), tout en gardant **une seule application, simple d'utilisation**.

---

## 1. Principes directeurs (non négociables)

1. **Zéro duplication.** Ne PAS dupliquer d'écrans, de tables ni de composants par société. Introduire une seule dimension `societe` filtrable, et réutiliser les composants existants (tables TanStack, dialogs, `export.ts`, pattern `dossier_fichiers` + bucket Storage pour les scans).
2. **Simplicité d'utilisation.** L'utilisateur choisit la société via un simple sélecteur (filtre en tête de module et/ou sélecteur global dans la topbar). Aucune configuration complexe, aucun nouvel écran superflu.
3. **Respect de l'existant.** Suivre les conventions du repo : types dans `src/lib/domain-types.ts`, store `src/lib/store.ts`, permissions `permissions.ts` + `has_permission()` en RLS, audit `audit.ts`, realtime `use-supabase-realtime.ts`, exports Excel/print `export.ts`.
4. **Toute nouvelle table** = migration SQL datée dans `supabase/migrations/`, RLS activée, ajout à l'audit, et à la publication realtime si affichée au dashboard.

---

## 2. Fonctionnalités demandées

### F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique)

**Demande client :** « Entreposage divisé en 2 sociétés » ; « ces deux sociétés vont bosser sur la plateforme ».

**À implémenter :**
- Table `societes` (id uuid, nom text, actif bool, created_at) seedée avec **Top Doumani** et **Traoré Transit Logistique**. (Table plutôt qu'enum : permet d'en ajouter plus tard sans migration de type.)
- Colonne `societe_id` (FK `societes`, NOT NULL avec valeur par défaut lors de la migration des données existantes) sur : `stock_items`, `mouvements`, `bons_sortie`, ainsi que sur les nouvelles tables `contrats`, `depenses`, `interventions` (voir F3–F5).
- Colonne `societe_id` **nullable** sur `ecritures` et `factures` : une écriture/facture peut être rattachée à une société (activité entreposage) ou rester au niveau global transit (comportement actuel inchangé).
- **UI :** filtre « Société : Toutes / Top Doumani / Traoré Transit Logistique » en tête des écrans Entreposage, Bons, Comptabilité, Bilans (et sur les nouveaux écrans Contrats). Le choix est mémorisé dans le store de navigation (Zustand persist) pour ne pas le re-sélectionner à chaque écran.
- Badge société sur les lignes des tables et sur les fiches détail concernées.

**Critères d'acceptation :**
- Un article de stock, un mouvement, un bon, un contrat, une dépense appartiennent toujours à une société.
- Le filtre société s'applique de façon cohérente sur listes, KPI, graphiques et exports (Excel/PDF).
- Aucune donnée existante n'est perdue : migration avec société par défaut à confirmer avec le client (voir §4).

---

### F2 — TVA 18 % optionnelle sur les factures

**Demande client :** « Facture → Ajoute Facture. Le 18 % optionnel. »

**À implémenter :**
- Sur le formulaire de création/édition de facture (`factures.tsx` / `facture-detail.tsx`) : un interrupteur **« Appliquer la TVA (18 %) »**, activé par défaut (comportement actuel conservé).
- Champ `taux_tva` sur `factures` (numeric, défaut 18) ; si TVA désactivée → `taux_tva = 0`. Adapter les triggers SQL de recalcul HT/TVA/TTC pour utiliser `taux_tva` au lieu du 18 % codé en dur.
- PDF facture (`printFactureModule` dans `export.ts`) : masquer la ligne TVA quand `taux_tva = 0` (afficher seulement Total).
- Bouton **« Ajouter une facture »** clairement visible : en tête de la liste Factures, et en action rapide depuis la fiche client (onglet Factures) et le détail dossier — la facture peut être liée à un dossier ou autonome (déjà supporté par `dossierId?`), et rattachable à une société (F1).

**Critères d'acceptation :**
- Facture sans TVA : TTC = HT, aucun montant TVA affiché ni imprimé.
- Facture avec TVA : comportement identique à aujourd'hui (18 %).
- Les factures existantes restent inchangées (migration : `taux_tva = 18`).

---

### F3 — Contrats (entreposage) avec archivage par scan

**Demande client :** « Les dépenses liées au contrat » ; « Archivage par scan » ; « intentions facultatives liées au contrat ». → Le « contrat » est une entité pivot qui n'existe pas encore dans le schéma.

**À implémenter :**
- Nouvelle table `contrats` : `id`, `reference` (auto, ex. CTR-2026-001), `societe_id` (FK, NOT NULL), `client_id` (FK `clients`), `objet` text, `date_debut`, `date_fin?`, `montant` numeric, `statut` (`Actif | Clôturé | Suspendu`), `notes`, timestamps.
- **Archivage par scan :** réutiliser le pattern `dossier_fichiers` → table `contrat_fichiers` (métadonnées) + Storage. Upload de scans PDF/images du contrat signé et des justificatifs. ⚠️ Le bucket existant `dossier-fichiers` est **public** : créer un bucket dédié `contrat-fichiers` **privé** (SELECT réservé aux authentifiés) pour les documents contractuels sensibles, et le documenter.
- **Écran Contrats** (nouvelle entrée sidebar, section Logistique) : liste avec filtres (société, client, statut, période) + fiche détail avec onglets **Infos / Dépenses / Prestations optionnelles / Documents (scans)**. Réutiliser les composants de liste/détail existants (même patron que dossiers).
- Nouveau module de permission `contrats` (`contrats:read`, `contrats:write`) dans `permissions.ts` + `PERMISSION_MODULES` + défauts par rôle (proposition : Admin tout ; Magasinier et Comptable R/W ; Commercial R ; Agent de transit R) + politiques RLS correspondantes + module d'audit « Contrats ».

**Critères d'acceptation :**
- Un contrat appartient à une société et un client ; ses scans sont consultables/téléchargeables depuis sa fiche.
- Suppression d'un contrat impossible s'il porte des dépenses ou prestations (ou suppression en cascade explicitement confirmée — à trancher, voir §4).

---

### F4 — Dépenses liées au contrat

**Demande client :** « Les dépenses liées au contrat » ; « La comptabilité = Bénéfice ».

**À implémenter :**
- Nouvelle table `depenses` : `id`, `contrat_id` (FK, NOT NULL), `societe_id` (dénormalisé depuis le contrat pour les agrégations), `libelle`, `montant` numeric, `date_depense`, `mode_paiement` (mêmes valeurs que `ecritures` : Espèces / Virement / Mobile Money / Chèque), `justificatif` (scan, même mécanisme que F3), `note`, `cree_par`.
- Saisie depuis l'onglet **Dépenses** de la fiche contrat (dialog simple : libellé, montant, date, mode, scan optionnel).
- Total des dépenses affiché sur la fiche contrat et remonté dans la comptabilité par société (F5).

**Critères d'acceptation :**
- Chaque dépense est rattachée à un contrat (donc à une société et un client).
- Les dépenses entrent dans le calcul du bénéfice (F5) et sont exportables (Excel/PDF via `export.ts`).

---

### F5 — Comptabilité orientée « Bénéfice », par société

**Demande client :** « La comptabilité = Bénéfice » ; « Voir la comptabilité de chacune des sociétés ».

**À implémenter :**
- Dans **Comptabilité** (`comptabilite.tsx`) et **Bilans** (`bilans.tsx`) : ajouter le filtre société (F1) et un bloc de synthèse :
  - **Recettes** = encaissements de la période (écritures + paiements factures, selon les 3 canaux déjà documentés), filtrés par société quand `societe_id` est renseigné ;
  - **Dépenses** = somme des `depenses` de la période (par société) ;
  - **Bénéfice = Recettes − Dépenses**, mis en avant (KPI + graphique Recharts d'évolution mensuelle).
- Vue « Toutes sociétés » = consolidé + décomposition par société (deux cartes côte à côte : Top Doumani / Traoré Transit Logistique).
- Dashboard : ajouter une section `kpi_benefice` dans `dashboard-config.ts` (visible avec `comptabilite:read`), avec sélecteur société.
- Ne pas créer de plan comptable : conserver le principe existant « livre = table `ecritures` » ; les dépenses contrats sont une source d'agrégation supplémentaire, pas un nouveau canal de paiement client.

**Critères d'acceptation :**
- Un comptable peut répondre en un écran à : « Quel est le bénéfice de Top Doumani ce mois-ci ? » et « Et celui de Traoré Transit Logistique ? ».
- Les chiffres du consolidé = somme exacte des deux sociétés + activité non affectée (transit).

---

### F6 — Prestations optionnelles du contrat (« intentions facultatives ») + compteur

**Demande client :** « Les intentions facultatives liées au contrat » ; « Connaître le nombre des intentions ».

> ⚠️ **Terme ambigu.** « Intentions » est très probablement « **interventions** » ou « **prestations optionnelles** » (services facultatifs prévus/réalisés dans le cadre du contrat). Implémenter sous le nom générique **« Prestations optionnelles »** et confirmer le vocabulaire exact avec le client (§4). Garder le libellé dans un seul endroit (constante) pour pouvoir le renommer facilement.

**À implémenter :**
- Nouvelle table `contrat_prestations` : `id`, `contrat_id` (FK), `libelle`, `description?`, `montant?` numeric (facultatif), `statut` (`Prévue | Réalisée | Annulée`), `date_prevue?`, `date_realisation?`, `cree_par`, timestamps.
- Gestion depuis l'onglet **Prestations optionnelles** de la fiche contrat (ajout/édition/changement de statut).
- **Compteurs** : nombre de prestations (total / réalisées) affiché sur la fiche contrat, en colonne dans la liste des contrats, et en KPI agrégé par société.
- Si `montant` renseigné et statut « Réalisée » : possibilité de générer une ligne de facture correspondante (bouton « Facturer » → pré-remplit une facture F2) — sans automatisme caché.

**Critères d'acceptation :**
- On sait en un coup d'œil combien de prestations optionnelles porte un contrat et combien ont été réalisées.

---

## 3. Récapitulatif des changements techniques

| Zone | Changements |
|---|---|
| Migrations SQL | `societes` (+ seed 2 sociétés), `societe_id` sur `stock_items`/`mouvements`/`bons_sortie` (NOT NULL, défaut à confirmer) et `ecritures`/`factures` (nullable), `contrats`, `contrat_fichiers`, `depenses`, `contrat_prestations`, `factures.taux_tva`, triggers TVA, RLS + realtime + modules audit pour les nouvelles tables, bucket Storage privé `contrat-fichiers` |
| `domain-types.ts` | Types `Societe`, `Contrat`, `Depense`, `ContratPrestation`, `Facture.tauxTva`, `societeId?` sur les entités concernées |
| `permissions.ts` | Module `contrats` (read/write) + défauts par rôle + mapping RLS |
| `store.ts` | CRUD contrats / dépenses / prestations, filtres société, agrégats bénéfice |
| Écrans | Nouveaux : `contrats.tsx`, `contrat-detail.tsx` (+ route `/contrats/[id]`). Modifiés : `entreposage.tsx`, `bons.tsx`, `comptabilite.tsx`, `bilans.tsx`, `factures.tsx`, `facture-detail.tsx`, `dashboard.tsx` + `dashboard-config.ts`, `nav-items.ts`, `command-palette.tsx`, `breadcrumb-nav.tsx` |
| `export.ts` | Colonne société dans exports existants ; export contrats/dépenses ; PDF facture sans TVA |
| Realtime / audit | Ajouter `contrats`, `depenses`, `contrat_prestations`, `societes` à la publication et à `audit.ts` |

**Ordre d'implémentation suggéré :** (1) migrations + types + RLS → (2) F1 filtre société sur l'existant → (3) F2 TVA → (4) F3 contrats + scans → (5) F4 dépenses → (6) F6 prestations → (7) F5 bénéfice + dashboard → (8) exports, audit, tests Vitest sur les calculs (bénéfice, TVA 0/18).

---

## 4. Points à confirmer avec le client avant / pendant l'implémentation

1. **« Intentions »** : confirmer qu'il s'agit bien de prestations/interventions optionnelles du contrat, et le libellé exact souhaité dans l'UI.
2. **Rattachement des données existantes** : à quelle société affecter le stock, les mouvements et les bons déjà saisis (tout à l'une des deux ? répartition manuelle ?).
3. **Périmètre société** : la séparation concerne-t-elle uniquement entreposage + comptabilité associée, ou aussi les dossiers de transit et toutes les factures ?
4. **Utilisateurs** : un utilisateur peut-il voir les deux sociétés (simple filtre, comportement retenu par défaut ici) ou faut-il restreindre certains comptes à une seule société (nécessiterait `societe_id` sur `profiles` + RLS supplémentaire) ?
5. **« Facture → Ajoute Facture »** : confirmer qu'il s'agit de rendre la création de facture plus directe/accessible (interprétation retenue en F2) et non d'un autre besoin.
6. **Suppression de contrat** : blocage si dépenses/prestations existantes, ou cascade ?

---

## 5. Hors périmètre (pour éviter la dérive)

- Pas de plan comptable ni de table `comptes` : on reste sur le modèle `ecritures` existant.
- Impression PDF via `window.print` ; exports tabulaires en `.xlsx` via `POST /api/export/excel` (ExcelJS côté serveur Node.js).
- Pas de refonte des 3 canaux de paiement existants : le bénéfice est un agrégat, pas un rapprochement bancaire.
- Pas de gestion multi-devise ni multi-langue (préférences restent « Bientôt disponible »).
