# SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés

## 1. Contexte du retour

Retour reçu après livraison des 2 onglets :
- **Top Doumani — Bon de paiement**
- **Gestion des clients**

Le client valide la base mais demande une évolution structurante inspirée de
son workflow Excel actuel.

## 2. Clarification métier CRITIQUE : deux sociétés, une plateforme

La plateforme est utilisée par **deux sociétés distinctes** :

| Société | Activité |
|---|---|
| **SLTT** (Société Traoré de Logistique, Transit et Transport) | Transit / logistique |
| **Top Doumani** | Bons de paiement |

Conséquences techniques :
- Chaque mouvement (paiement, dossier transit, bon, encaissement…) doit être
  **rattaché à une société** (`societe: 'SLTT' | 'TOP_DOUMANI'`).
- Les **clients sont partagés** : un même client peut avoir des opérations
  dans les deux sociétés. Référentiel client unique, pas de duplication.
- Prévoir le filtrage par société partout (listes, totaux, exports).

## 3. Fonctionnalité demandée : le Classeur Client

### 3.1 Référence Excel actuelle
Aujourd'hui : **un classeur Excel par client**. En l'ouvrant, on voit
**tous les mouvements** effectués par ce client, toutes activités
confondues (Top Doumani ou transit).

### 3.2 Équivalent à implémenter
Depuis la fiche d'un client (onglet Gestion des clients), un onglet/vue
**« Classeur »** qui affiche :

- **Journal chronologique unifié** de tous les mouvements du client :
  - bons de paiement Top Doumani
  - dossiers/opérations de transit SLTT
  - paiements, avances, restes à payer
- Colonnes minimales : date, société, type de mouvement, référence
  (n° bon / n° dossier / BL), libellé, débit, crédit, **solde cumulé**.
- **Filtres** : société (SLTT / Top Doumani / toutes), type de mouvement,
  période.
- **Totaux** : total débit, total crédit, solde net du client
  (global + par société).
- **Export** (impression / PDF) du classeur — le client est habitué au
  format Excel, la sortie doit rester lisible dans cette logique.

### 3.3 Suivi des mouvements
Le classeur doit inclure une **option de suivi des mouvements** :
- historique horodaté de chaque opération (création, modification, statut),
- statut visible par mouvement (ex. : en cours / payé / clôturé),
- tout nouveau module futur devra alimenter ce même journal
  (le classeur est la vue pivot du client).

## 4. Architecture données (orientation)

- Soit une **table `mouvements` unifiée** (recommandé), soit une **vue SQL
  UNION** agrégeant bons de paiement + opérations transit + paiements,
  normalisée en : `(client_id, societe, date, type, reference, libelle,
  debit, credit)`.
- Le solde cumulé se calcule côté requête (window function
  `SUM(...) OVER (ORDER BY date, id)`).

## 5. Contrainte technique

- **PAS DE PRISMA.** Accès PostgreSQL en SQL natif (`pg`) ou via un query
  builder léger. Ne pas introduire d'ORM.

## 6. Ordre de travail suggéré

1. Ajouter le champ `societe` sur les entités concernées + migration.
2. Créer la vue/table unifiée des mouvements.
3. Implémenter l'onglet « Classeur » dans la fiche client (journal, filtres,
   soldes).
4. Ajouter le suivi/statuts des mouvements.
5. Export imprimable du classeur.