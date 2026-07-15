---
target: Workflows SLTT (dossiers, devis, contrats, factures, comptabilite, entreposage, archives)
total_score: 26
p0_count: 2
p1_count: 2
timestamp: 2026-07-14T18-50-10Z
slug: ontrats-factures-comptabilite-entreposage-archives
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Bon (sync, loading, dirty-form banner) ; upload de fichiers volumineux sans indicateur de progression (`dossier-detail.tsx` `FileDropZone`). |
| 2 | Match System / Real World | 3 | Vocabulaire métier correct et cohérent (BL, DAU, dédouanement) ; aucun glossaire pour un nouvel arrivant. |
| 3 | User Control and Freedom | 2 | Aucun chemin de suppression pour un dossier dans l'UI, alors que `removeDossier` existe et fonctionne côté store (jamais appelé — vérifié par grep). |
| 4 | Consistency and Standards | 2 | Deux systèmes de "statut suivant" indépendants (`TRANSITION_META` vs `NEXT_STATUT`) ; copie des dialogues de suppression incohérente sur 8+ écrans. |
| 5 | Error Prevention | 3 | Validation de formulaire solide, champs montant typés avec suffixe FCFA partout. |
| 6 | Recognition Rather Than Recall | 3 | Breadcrumbs dynamiques, command palette qui indexe dossiers/devis/factures/contrats/clients par nom. |
| 7 | Flexibility and Efficiency | 3 | Cmd+K, transitions rapides en ligne dans les tables ; aucune action groupée (bulk) nulle part. |
| 8 | Aesthetic and Minimalist Design | 3 | Dashboard dense mais scopé par rôle ; écran de login sur-décoré pour un outil produit (voir Anti-Patterns). |
| 9 | Error Recovery | 3 | Toasts title+description+variant destructive de façon cohérente sur tout le site. |
| 10 | Help and Documentation | 1 | Aucun glossaire, aucune infobulle pour BL/DAU/dédouanement, `GuideDemarrage` ne suit que le "quoi" pas le "comment". |
| **Total** | | **26/40** | **Acceptable — améliorations significatives nécessaires** |

## Anti-Patterns Verdict

**Est-ce que ça sent "fait par une IA" ?**

**Évaluation qualitative** : Non, sur 90% des écrans — les primitives shadcn, le système `ToneBadge`, et les composants partagés (`ListFilters`, `KpiCard`, `EmptyState`) donnent une vraie cohérence, le genre qu'un utilisateur habitué à Linear/Stripe reconnaîtrait comme du travail sérieux. Trois choses feraient tiquer un œil exercé : (1) le fond du login (`login.tsx` `LoginBackground`, L24-51) empile 4 dégradés radiaux + 2 grilles overlay derrière un champ mot de passe — un réflexe de landing page, pas de produit ; (2) les helpers de gestion de fichiers (`formatFileSize`, `getFileIconComponent`) copiés-collés 3 fois ont déjà divergé (voir P0) ; (3) `removeDossier` existe mais n'a aucun déclencheur UI — ça se voit comme un oubli, pas une règle métier assumée.

**Scan déterministe** : 31 findings sur `src/components/sltt` + `src/app` :
- **23× `gray-on-color`** (texte gris délavé sur fond coloré, contraste insuffisant) — concentré sur `factures.tsx` (6), `bons.tsx` (6, en partie chevauchant avec side-tab), `fournisseurs.tsx` (4), `dashboard.tsx`, `transporteurs.tsx`.
- **7× `side-tab`** (bordure gauche épaisse `border-l-4` comme accent) — LE tell le plus reconnaissable d'une UI générée par IA d'après la doc du skill. Concentré dans `dossier-detail.tsx` (4 occurrences : L945, L958, L991, L1026 — alertes échéance + carte "prochaine action"), plus `devis-detail.tsx:386`, `entreposage.tsx:822`, `facture-detail.tsx:711`.
- **1× `border-accent-on-rounded`** (`entreposage.tsx:1065`, bordure épaisse sur élément arrondi — les deux traitements se contredisent visuellement).

Ni l'IA (revue qualitative) ni moi n'avions repéré ces occurrences précises avant le scan — c'est exactement le genre de détail mécanique qu'un outil déterministe attrape mieux qu'une lecture de code. Aucun faux positif identifié dans l'échantillon vérifié.

**Overlay visuel** : non disponible — aucun outil d'automatisation navigateur dans cette session. Recommandation : relancer `/impeccable critique` depuis une session avec navigateur pour l'inspection visuelle live.

## Overall Impression

L'architecture d'information et la discipline de composants partagés (statuts, transitions, command palette, dashboard par rôle) sont du niveau d'un vrai produit SaaS interne bien pensé — nettement au-dessus de la moyenne des outils internes "vite fait". Le problème n'est pas la conception d'ensemble, c'est l'**érosion par duplication** : plusieurs patterns ont été réinventés 2-3 fois au lieu d'être partagés, et ils ont déjà commencé à diverger silencieusement (icônes de fichiers incohérentes, copie de confirmation de suppression qui varie, deux systèmes de statut "suivant"). La plus grosse opportunité : industrialiser ce qui existe déjà de bien (le pattern `TRANSITION_META`, les helpers de fichiers) au lieu d'ajouter de nouvelles fonctionnalités sur des fondations qui divergent.

## What's Working

1. **`TRANSITION_META` + `TransitionDialog`** (`dossier-transition-dialog.tsx`) — source de vérité unique pour la machine à états devis → dossier → dédouanement → livraison → solde, réutilisée à l'identique dans `dossiers-list.tsx`, `dossier-form.tsx` et `dossier-detail.tsx`. C'est exactement le niveau de factorisation que le reste de l'app devrait suivre.
2. **Centralisation des couleurs de statut** (`status-badge.tsx`) — `DOSSIER_STATUT_TONE`/`DOSSIER_STATUT_HEX` corrige explicitement (commentaire L82-83) un bug antérieur où 3 écrans n'étaient pas d'accord sur les couleurs de statut. Le donut du dashboard réutilise la même table hex que les badges : jamais de désaccord visuel.
3. **Dashboard scopé par rôle** (`AgentPanel`/`MagasinierPanel`/`ComptablePanel`/`AdminPanel`) — chacun des 4 rôles actifs a un vrai écran d'accueil pertinent, pas un dashboard générique avec des widgets masqués par permission.

## Priority Issues

**[P0] Helpers de fichiers dupliqués 3× et déjà en dérive**
**Pourquoi ça compte** : `formatFileSize`/`getFileIconComponent` existent en copies indépendantes dans `dossier-detail.tsx:124-140`, `contrat-detail.tsx:95-105` et `archives.tsx:45-58`. Ils ont divergé : la version de `contrat-detail.tsx` n'a pas de branche `application/pdf` (un PDF de contrat récupère l'icône générique, alors qu'un PDF de dossier récupère la bonne icône FileText), et son arrondi de taille en Ko diffère (0 décimale vs 1 ailleurs). `bons.tsx` a sa propre dropzone sans aucun helper icône/taille.
**Fix** : extraire vers `src/lib/file-utils.ts`, importer partout, réconcilier la couverture MIME sur la version la plus complète (celle de dossier).
**Commande suggérée** : `/impeccable distill`

**[P0] Aucun chemin de suppression pour un dossier**
**Pourquoi ça compte** : `removeDossier` est pleinement implémenté (`store.ts:1277`) mais n'est appelé nulle part dans l'UI (vérifié) — contrairement à devis, contrats, factures, fournisseurs, transporteurs, utilisateurs et bons, qui ont tous un bouton supprimer. Soit c'est une règle métier volontaire (les dossiers ne se suppriment pas, seulement s'annulent via statut) — auquel cas il faut le dire quelque part dans l'UI — soit c'est un oubli qui force les admins à garder des données erronées indéfiniment.
**Fix** : décider explicitement, puis soit câbler un bouton Supprimer (avec les mêmes garde-fous que `removeContrat`), soit documenter la règle et retirer le code mort du store.
**Commande suggérée** : `/impeccable harden`

**[P1] Copie et pattern de confirmation de suppression incohérents sur 8+ écrans**
**Pourquoi ça compte** : `AlertDialog` vs `Dialog` simple utilisés indifféremment pour la même action "supprimer" (`bons.tsx:1376` en AlertDialog vs `archives.tsx:584` en Dialog pour un flux fonctionnellement identique), et le texte varie de laconique ("Cette action est irréversible.") à détaillé avec conséquences nommées (`contrat-detail.tsx:519`, `dossier-detail.tsx:1801-1808`).
**Fix** : un composant partagé `ConfirmDeleteDialog(entityLabel, consequence)` réglerait l'incohérence visuelle et les cas où le contexte manque.
**Commande suggérée** : `/impeccable distill`

**[P1] Deux systèmes indépendants de "statut suivant"**
**Pourquoi ça compte** : `TRANSITION_META` (dossier) est bien construit et réutilisé ; `NEXT_STATUT` dans `devis.tsx:93-96` réinvente le même pattern visuel (pastille colorée qui fait avancer le statut) avec ses propres classes Tailwind ad hoc au lieu de réutiliser le vocabulaire de tons de `ToneBadge`. Si un 3e module a besoin de ce pattern, attendez-vous à une 3e version divergente.
**Fix** : généraliser `TRANSITION_META` en abstraction réutilisable (statut, cible, libellé, icône, ton) et migrer `devis.tsx` dessus.
**Commande suggérée** : `/impeccable distill`

**[P2] 23 occurrences de texte gris délavé sur fond coloré**
**Pourquoi ça compte** : contraste insuffisant sur badges/callouts colorés (`factures.tsx`, `bons.tsx`, `fournisseurs.tsx`, `dashboard.tsx`, `transporteurs.tsx`) — lisibilité dégradée, particulièrement gênant pour Sam (utilisateur dépendant de l'accessibilité) et en usage prolongé (agents qui scrutent des tableaux toute la journée).
**Fix** : remplacer le gris neutre par une teinte plus sombre de la couleur de fond elle-même, ou passer en quasi-blanc selon le fond.
**Commande suggérée** : `/impeccable audit` puis `/impeccable colorize`

**[P3] Bordures gauche épaisses (`border-l-4`) comme accent — 7 occurrences**
**Pourquoi ça compte** : pattern reconnu comme le tell IA le plus identifiable ; concentré sur les alertes d'échéance et la carte "prochaine action" de `dossier-detail.tsx`. Fonctionnellement correct (sévérité de l'alerte) mais visuellement daté.
**Fix** : remplacer par fond teinté + icône + libellé, sans bordure d'accent, ou bordure fine complète.
**Commande suggérée** : `/impeccable quieter`

## Persona Red Flags

**Alex (utilisateur expert)** : la command palette et les transitions rapides le servent bien. Manque : aucune action groupée nulle part (impossible de sélectionner plusieurs dossiers pour exporter ou transitionner en masse), pas de navigation 100% clavier dans `TransitionDialog` au-delà de l'ordre de tabulation par défaut.

**Sam (accessibilité)** : `FileDropZone` et les cartes mobiles utilisent correctement `role="button"` + `onKeyDown` (`dossier-detail.tsx:337-358`, `dashboard.tsx:1221-1226`) — mieux que la moyenne. Lacune : le pulse de la cloche de notification (`topbar.tsx:151-154`) n'a pas de garde `prefers-reduced-motion`, et plusieurs boutons icône-seule (chevron du breadcrumb, toggle sidebar) s'appuient sur `title` plutôt qu'un texte visible.

**Jordan (premier jour)** : aucun glossaire ni infobulle pour BL, DAU, dédouanement nulle part, alors que c'est le vocabulaire porteur des écrans du workflow principal. Le `GuideDemarrage` (`dashboard.tsx:375-546`) est une bonne idée mais ne suit que si une action a été faite ("Client créé"), pas ce que signifie le jargon la première fois que Jordan tombe sur un champ "N° de BL".

## Minor Observations

- `login.tsx` a "SLTT © 2026" codé en dur — deviendra faux silencieusement.
- L'infobulle KPI "Encaissé ce mois" (`dashboard.tsx:977`) est excellente et explique la logique écritures+factures sans doublon — ce niveau de transparence "pourquoi ce chiffre" devrait se généraliser.
- "Archives" est rangé dans la section sidebar **Logistique**, entre "Bons de sortie" et "Fournisseurs" — défendable puisqu'il agrège des scans de dossiers/contrats, mais c'est tout autant un outil de tenue de dossiers côté Finance (factures, dépenses) ; un module transverse comme celui-ci mériterait peut-être sa propre section plutôt que d'emprunter le namespace Logistique.
- La conversion devis → dossier redemande BL/camion sans expliquer pourquoi (le devis ne les contient pas du tout) — friction mineure mais réelle pour un nouvel agent.

## Questions to Consider

- Si `removeDossier` existe dans le store mais n'a aucun déclencheur UI, est-ce volontaire (règle métier) ou oublié pendant un refactor ?
- Pourquoi Archives a-t-il son propre module alors que 2/3 de son contenu sont des miroirs en lecture seule de `dossier_fichiers`/`contrat_fichiers` — les utilisateurs seraient-ils mieux servis par des actions "voir les scans" directement sur les pages dossier/contrat, Archives se limitant aux documents véritablement autonomes ?
- Puisque `TRANSITION_META` prouve que l'équipe sait construire un composant de machine à états bien factorisé, y a-t-il un plan pour aligner devis/contrats/factures sur la même abstraction, ou chaque entité va-t-elle continuer à diverger ?
