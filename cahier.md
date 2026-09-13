# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE (CDCF)
## Système Intégré de Gestion de Transit, Douane, Logistique, Entrepôt & Comptabilité SYSCOHADA
### Société SLTT (Société Logistique Transit Transport)

---

## SOMMAIRE EXÉCUTIF

| Projet | Plateforme Intégrée Transit SLTT (Web & Mobile PWA) |
| :--- | :--- |
| **Bénéficiaire** | Société Logistique Transit Transport (SLTT) |
| **Siège Social** | Bamako, Mali (Couverture régionale : Corridor Abidjan - Bamako, Dakar - Bamako) |
| **Objectif Principal** | Digitalisation complète de la chaîne de dédouanement, transit multimodal, gestion des débours, caisse opérationnelle, entreposage, facturation et comptabilité SYSCOHADA révisée. |
| **Version du Document** | 1.0 — Document Contractuel de Référence |
| **Technologies Clés** | NestJS (Backend API REST), Prisma ORM, MySQL 8.x, Next.js 15 (Frontend App Router), TypeScript, TailwindCSS |

---

```
                               ┌─────────────────────────────────────────┐
                               │       PLATEFORME TRANSIT SLTT           │
                               └────────────────────┬────────────────────┘
                                                    │
        ┌───────────────────┬───────────────────────┼───────────────────────┬───────────────────┐
        │                   │                       │                       │                   │
  ┌─────▼──────┐      ┌─────▼──────┐         ┌──────▼─────┐          ┌──────▼─────┐      ┌──────▼─────┐
  │ 1. TRANSIT │      │ 2. CAISSE  │         │ 3. FACTURE │          │ 4. STOCKS  │      │ 5. COMPTA  │
  │  & DOUANE  │      │ & DÉBOURS  │         │ & CLIENTS  │          │ & CONTRATS │      │ SYSCOHADA  │
  ├────────────┤      ├────────────┤         ├────────────┤          ├────────────┤      ├────────────┤
  │• Maritime  │      │• Bons caisse│        │• Facturation│         │• Magasin   │      │• Journaux  │
  │• Terrestre │      │• Avances BL │        │  Prestations│         │• Bons sort.│      │• Gd Livre  │
  │• Aérien    │      │• Dédouanem.│         │• Débours 0% │         │• Contrats  │      │• Balance   │
  │• Tracking  │      │• Clôtures  │         │• Reçus Paiem│         │• Tarifs m³ │      │• Rétro-act │
  └────────────┘      └────────────┘         └────────────┘          └────────────┘      └────────────┘
```

---

# 1. PRÉSENTATION GÉNÉRALE ET CONTEXTE MÉTIER

### 1.1. Présentation de la Société SLTT
La société **SLTT** (*Société Logistique Transit Transport*) est un commissionnaire agréé en douane et prestataire logistique international opérant principalement au **Mali** (siège social à Bamako) avec une présence stratégique en **Côte d'Ivoire** (antenne d'Abidjan) et sur les corridors majeurs d'approvisionnement enclavés de l'Afrique de l'Ouest.

Ses missions recouvrent :
- Les formalités de dédouanement (Import / Export / Transit international / Régimes suspensifs).
- L'acheminement multimodal (Fret maritime, fret aérien, convois routiers par camions et porte-conteneurs).
- La manutention portuaire et aéroportuaire, le magasinage sous douane (MAD) et l'entreposage sécurisé.
- La prise en charge financière des débours (avances de trésorerie pour droits de douane, taxes portuaires, surestaries et manutentions).

### 1.2. Contexte et Problématiques Rencontrées
Le secteur du transit en Afrique de l'Ouest présente des contraintes fortes et spécifiques :
1. **Pression sur les Débours de Trésorerie** : Le transitaire avance pour le compte du client d'importantes sommes liquides (droits de douane Sydonia/ASYCUDA, frais de connaissement maritimes B/L, magasinage). Sans suivi rigoureux, ces montants engendrent des retards de refacturation et des trous de trésorerie.
2. **Cloisonnement Fiscal Rigoureux** : Les prestations de service propres à SLTT (honoraires de transit, commission, manutention) sont soumises à la **TVA (18%)**, tandis que les **débours** (droits de douane, taxes d'État) sont refacturés au centime près, **sans TVA ni marge**.
3. **Multiplicité des Sites et Décentralisation** : Les opérations s'exécutent simultanément au port d'Abidjan, aux postes frontières terrestres (ex: Zégoua, Diboli) et aux bureaux des douanes de Bamako (Sénou aéroport, Faladié, Kati).
4. **Exigence de Traçabilité Client** : Les importateurs exigent de connaître en temps réel l'avancement de leurs conteneurs (date de déchargement, passage en douane, levée de B/L, Bon à Enlever - BAE, livraison sur site).
5. **Règlementation Comptable SYSCOHADA** : Obligation légale de tenir une comptabilité conforme au référentiel révisé de l'OHADA, avec distinction nette entre les comptes de tiers de débours (compte 467/411) et les produits d'exploitation (classe 7).

---

# 2. OBJECTIFS ET PÉRIMÈTRE DU PROJET

### 2.1. Objectifs Majeurs
- **Centraliser 100% des opérations** de transit, facturation, trésorerie et stockage dans un ERP web unifié et rapide.
- **Sécuriser la trésorerie** grâce au contrôle strict des caisses d'annexe, l'approbation hiérarchique des bons de décaissement et la gestion temps réel des remboursements de débours.
- **Accélérer le cycle de facturation** : Génération de factures bivalentes (Prestations assujetties à TVA + Débours exonérés), émission automatique de reçus de paiement et relance des factures échues.
- **Zéro rupture de communication** : Tracking public en ligne accessible par les clients via numéro de dossier ou B/L sans compromettre la sécurité interne.
- **Conformité SYSCOHADA native** : Chaque acte métier (facturation, encaissement, décaissement de caisse) doit pouvoir générer son écriture comptable normalisée dans les journaux auxiliaires (Achats, Ventes, Caisse, Banque, OD).

### 2.2. Périmètre Applicatif
```
[Module 1: Auth & Annexes] ────────► [Module 2: Tiers (Clients/Fourn.)]
             │                                      │
             ▼                                      ▼
[Module 3: Devis & Cotations] ──────► [Module 4: Dossiers de Transit]
                                                    │
             ┌──────────────────────────────────────┴──────────────────────────────────────┐
             ▼                                      ▼                                      ▼
[Module 5: Facturation & Débours]       [Module 6: Caisses & Bons]            [Module 7: Entrepôt & Stocks]
             │                                      │                                      │
             └──────────────────────────────────────┼──────────────────────────────────────┘
                                                    ▼
                                    [Module 8: Comptabilité SYSCOHADA]
                                                    │
                                                    ▼
                                    [Module 9: Flotte, GED & Audit]
```

---

# 3. ACTEURS, RÔLES ET MATRICE DE SÉCURITÉ (RBAC)

Le système implémente un contrôle d'accès strict basé sur les rôles (`Role` enum) avec rattachement aux annexes opérationnelles (`UserAnnexe`).

### 3.1. Profils Utilisateurs
| Code Rôle | Intitulé Métier | Responsabilités & Attributions |
| :--- | :--- | :--- |
| `ADMIN` | **Directeur Général / Administrateur Système** | Super-utilisateur. Accès illimité à toutes les annexes, configuration financière, validation des annulations, gestion des utilisateurs, audit global. |
| `TRANSITAIRE` | **Déclarant en Douane / Agent de Transit** | Création et suivi des dossiers de transit, mise à jour des étapes, renseignement des conteneurs, B/L, déclarations douane, émission de devis. |
| `COMPTABLE` | **Chef Comptable / Caissier Central** | Validation des factures, saisie et lettrage des règlements, gestion des comptes SYSCOHADA, grand livre, balance, clôtures de caisse, validation des décaissements. |
| `COMMERCIAL` | **Chargé d'Affaires / Commercial** | Prospection, gestion des fiches clients, élaboration des cotations et devis tarifaires, suivi des signatures de contrats d'entreposage. |
| `OPERATEUR` | **Magasinier / Gestionnaire de Flotte** | Enregistrement des entrées/sorties en entrepôt, bons de sortie magasin, gestion des camions, chauffeurs et réceptions physiques. |
| `CLIENT` | **Portail Client Externe** | Consultation en lecture seule de ses dossiers, suivi d'expédition (tracking), visualisation et téléchargement de ses devis et factures. |

### 3.2. Matrice des Droits par Module
| Module / Action | `ADMIN` | `TRANSITAIRE` | `COMPTABLE` | `COMMERCIAL` | `OPERATEUR` | `CLIENT` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gestion Dossiers (Création / Edit)** | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ |
| **Workflow Étapes Douane & Débours** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| **Devis & Cotations** | ✅ | ✅ | 👁️ | ✅ | ❌ | 👁️ (siens) |
| **Facturation (Création / Modification)** | ✅ | 👁️ | ✅ | ❌ | ❌ | ❌ |
| **Validation / Annulation Facture** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Paiements & Reçus d'encaissement** | ✅ | ❌ | ✅ | ❌ | ❌ | 👁️ (siens) |
| **Gestion Caisses & Bons de Décaissement** | ✅ | Demande seule | ✅ (Gestion) | ❌ | ❌ | ❌ |
| **Comptabilité Générale (SYSCOHADA)** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Stocks, Entrepôt & Bons de Sortie** | ✅ | 👁️ | 👁️ | ❌ | ✅ | ❌ |
| **Contrats d'Entreposage** | ✅ | 👁️ | 👁️ | ✅ | 👁️ | 👁️ (siens) |
| **Flotte & Transporteurs** | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ |
| **Logs d'Audit & Paramètres Système** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

# 4. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

---

## MODULE 1 — GESTION MULTI-ANNEXES & UTILISATEURS
### 1.1. Contexte & Enjeux
SLTT gère ses activités via plusieurs sites physiques (ex: Siège Bamako ACI 2000, Agence Portuaire Abidjan Treichville, Agence Frontière Zégoua). Les données doivent être étanches par annexe pour les opérations courantes, tout en permettant au siège de consolider les états financiers.

### 1.2. Fonctionnalités
- **Référentiel des Annexes** : Code unique (`code`), raison sociale, adresse, téléphone, email, indicatif téléphonique, préfixe de numérotation séquentielle des dossiers et factures.
- **Affectation Utilisateurs** : Un utilisateur a une annexe active (`activeAnnexeId`) et peut appartenir à plusieurs annexes avec un indicateur d'annexe par défaut.
- **Ségrégation des données** :
  - L'utilisateur non-ADMIN ne voit et ne traite que les dossiers, devis, factures et caisses appartenant à son annexe active.
  - L'administrateur peut basculer d'une annexe à l'autre via un sélecteur global situé dans l'entête sans se déconnecter.

---

## MODULE 2 — GESTION DES TIERS (CLIENTS & FOURNISSEURS)
### 2.1. Fichier Clients
- **Typologie** : Personne Morale (Entreprise/Importateur) ou Personne Physique (Particulier/Commerçant).
- **Champs requis** : Raison sociale / Nom complet, NIF (Numéro d'Identification Fiscale), RCCM, adresse complète, ville, pays, téléphone(s), email principal et emails de notification B/L.
- **Conditions commerciales** : Délai de règlement négocié (comptant, 15j, 30j, 45j, 60j), plafond de crédit / encours débours maximal autorisé.
- **Compte Auxiliaire SYSCOHADA** : Affectation d'un sous-compte 4111xxxx (ex: `4111001` - Client SODIPLAST).

### 2.2. Fichier Fournisseurs & Prestataires
- **Catégorisation** :
  - *Compagnies Maritimes* (Maersk, CMA CGM, MSC, Grimaldi, etc.)
  - *Services Douaniers & Entrepôts Sous Douane*
  - *Transporteurs Routiers & Sous-traitants*
  - *Manutentionnaires Portuaires* (Bolloré Ports, Terminal Côte d'Ivoire, etc.)
- **Données bancaires & RIB** pour le virement des débours et règlements.
- **Compte Auxiliaire SYSCOHADA** : Sous-compte 4011xxxx / 4012xxxx.

---

## MODULE 3 — DEVIS & COTATIONS TARIFAIRES
### 3.1. Élaboration de Devis Client
- **Référence unique** : Séquence chronologique annuelle (ex: `DEV-2026-0042`).
- **Paramètres de cotation** :
  - Type de transport : Maritime (FCL/LCL), Aérien, Terrestre.
  - Port/Lieu de départ et Port/Lieu de destination (Corridor).
  - Nature de la marchandise, poids brut, volume (m³), nombre de colis/conteneurs.
  - Régime douanier ciblé : Mise à la consommation (Import directe), Transit pur (D6), Admission temporaire (AT), Exportation.
- **Lignes de devis structurées en deux catégories** :
  1. *Lignes de Prestations SLTT* : Honoraires agréé, ouverture dossier, commission d'intervention, transport route, manutention.
  2. *Lignes de Débours Estimés* : Droits et taxes douanières estimés, redevance informatique Sydonia, B/L fees compagnie maritime, surestaries prévisionnelles, scanner, péage corridor.
- **Statuts du Devis** : `BROUILLON` ➔ `EN_ATTENTE_VALIDATION` ➔ `ENVOYE` ➔ `ACCEPTE` / `REFUSE` / `EXPIRE`.
- **Conversion en Dossier** : Un devis accepté peut être transformé en 1 clic en Dossier de Transit officiel, reprenant automatiquement toutes les données et lignes de coûts sans ressaisie.

---

## MODULE 4 — GESTION DES DOSSIERS DE TRANSIT
### 4.1. Cycle de Vie et Création du Dossier
Le dossier de transit est l'entité centrale (`Dossier`) de la société SLTT.
- **Numérotation automatique** : Préfixe Annexe + Type + Année + Chrono (ex: `BKO-MAR-2026-0089`).
- **Métadonnées Dossier** :
  - Type : `MARITIME`, `AERIEN`, `TERRESTRE`.
  - Type d'opération : `IMPORT`, `EXPORT`, `TRANSIT_REGIONAL`.
  - Numéro Connaissement Maritime (B/L) ou Lettre de Transport Aérien (LTA).
  - Numéro de Déclaration Douanière & Date d'enregistrement Sydonia.
  - Régime douanier : Code déclaration (ex: C100, D600, S100).
  - Compagnie maritime / Compagnie aérienne.
  - Navire, Voyage, Port de chargement (POL), Port de déchargement (POD).
  - Poids brut, volume total, nombre de conteneurs / colis.

### 4.2. Suivi des Conteneurs et Colis
- Liste des conteneurs associés au dossier (`Conteneur`) :
  - Numéro d'immatriculation du conteneur (ex: `MSKU1234567`).
  - Type et taille : `20_PIEDS_STANDARD`, `40_PIEDS_STANDARD`, `40_PIEDS_HIGH_CUBE`, `FRIGO_REEFER`, `OPEN_TOP`, `FLAT_RACK`.
  - Numéro de scellé / plomb douanier.
  - Statut conteneur : Au port, En cours de route corridor, Dépoté à Bamako, Restitué à vide.
  - Date de début des franchises et décompte des jours de détention / surestaries.

### 4.3. Étapes Logistiques et Workflow de Transit
Chaque dossier franchit un workflow d'étapes paramétrables avec date prévisionnelle, date effective, responsable et pièces justificatives :
```
[1. Ouverture Dossier & Collecte Docs]
                 │
                 ▼
[2. Arrivée Navire / Notification Port]
                 │
                 ▼
[3. Échange Connaissement (B/L) & Paiement Ligne]
                 │
                 ▼
[4. Saisie Déclaration Douane Sydonia / ASYCUDA]
                 │
                 ▼
[5. Liquidation Douanière & Quittance]
                 │
                 ▼
[6. Visite Douanière / Passage Scanner]
                 │
                 ▼
[7. Obtention du Bon à Enlever (BAE)]
                 │
                 ▼
[8. Chargement Camion & Convoi Corridor]
                 │
                 ▼
[9. Livraison Chez le Client & Dépotage]
                 │
                 ▼
[10. Restitution Conteneur Vide & Clôture]
```

### 4.4. Suivi Public en Ligne (Tracking Client)
- Chaque dossier dispose d'un jeton public chiffré (`TrackingPublic`).
- Le client ou ses partenaires peuvent consulter sur l'interface publique web l'état d'avancement de leur marchandise sans authentification, simplement avec leur numéro de dossier ou de B/L.

---

## MODULE 5 — FACTURATION & GESTION DES DÉBOURS
C'est le cœur névralgique de la rentabilité de SLTT.

### 5.1. Spécificité Fiscale Fondamentale (Prestations vs Débours)
La législation fiscale (UEMOA / Mali) impose une séparation nette :
1. **Prestations de Service SLTT** :
   - Honoraires de transit, commission en douane, intervention aéroport/portuaire, transport routier propre, frais de dossier.
   - Soumises à la **TVA à 18%** (calculée automatiquement ligne par ligne ou globalement).
2. **Débours (Frais payés pour le compte du client)** :
   - Droits et taxes douanières (quittances Trésor Public).
   - Frais de débarquement portuaire et manutention terre.
   - Frais de dossier de la compagnie maritime (redevance B/L, échange).
   - Surestaries et frais de stationnement magasin sous douane.
   - **Non soumis à la TVA (TVA 0% - Exonérés art. Code Général des Impôts)**.
   - Refacturés au montant exact décaissé, avec obligation de joindre les quittances d'origine.

```
┌────────────────────────────────────────────────────────────────────────┐
│ FACTURE SLTT N° FAC-2026-0158                                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PRESTATIONS DE SERVICES (Soumises à TVA 18%)                        │
│    - Honoraires de dédouanement import :               350 000 FCFA    │
│    - Commission de transit & suivi :                   150 000 FCFA    │
│    - Transport Abidjan - Bamako (par conteneur) :    1 800 000 FCFA    │
│    ────────────────────────────────────────────────────────────────    │
│    Sous-total Prestations HT :                       2 300 000 FCFA    │
│    TVA (18%) :                                         414 000 FCFA    │
│    Total Prestations TTC :                           2 714 000 FCFA    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. DÉBOURS EFFECTUÉS POUR LE COMPTE DU CLIENT (Exonérés TVA 0%)         │
│    - Droits de Douane (Quittance Sydonia N° 45892) : 5 420 000 FCFA    │
│    - Frais de Connaissement B/L Maersk Line :          280 000 FCFA    │
│    - Frais de manutention portuaire et scanner :       175 000 FCFA    │
│    ────────────────────────────────────────────────────────────────    │
│    Total Débours (Net de taxe) :                     5 875 000 FCFA    │
├────────────────────────────────────────────────────────────────────────┤
│ MONTANT TOTAL À PAYER (Prestations TTC + Débours) :  8 589 000 FCFA    │
│ Acompte déjà reçu par Caisse/Banque :                6 000 000 FCFA    │
│ NET RESTANT DÛ :                                     2 589 000 FCFA    │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Cycle de Vie de la Facture
- Statuts : `BROUILLON` ➔ `VALIDEE` ➔ `PARTIELLEMENT_PAYEE` ➔ `PAYEE` / `ANNULEE`.
- **Verrouillage comptable** : Une facture validée ne peut plus être altérée dans ses montants. En cas d'erreur avérée, une facture d'avoir rectificative doit être émise selon les règles de l'art comptable.
- **Règlements & Reçus** :
  - Saisie des encaissements (Espèces, Virement bancaire, Chèque, Effet de commerce).
  - Émission instantanée d'un **Reçu de Paiement officiel** numéroté téléchargeable en PDF.
  - Calcul dynamique en temps réel du solde restant dû et alerte des factures échues.

---

## MODULE 6 — GESTION DES CAISSES, BONS DE DÉCAISSEMENT & DÉBOURS
### 6.1. Référentiel des Caisses
- Chaque annexe possède une ou plusieurs caisses physiques (`Caisse`) :
  - *Caisse Principale Siège* (règlements clients, menues dépenses générales).
  - *Caisse Opérations Douane / Débours* (trésorerie liquide dédiée aux formalités de dédouanement express).
  - *Caisse Antenne Portuaire / Frontière*.
- Paramètres : Devise (`XOF` - Franc CFA), solde initial, solde actuel temps réel, alerte solde minimum de sécurité.

### 6.2. Workflow des Bons de Sortie de Caisse (Décaissements)
Pour éviter toute fuite financière, aucune sortie d'argent liquide ne s'effectue sans bon dématérialisé :
```
[1. Demande de Déboursement]
    Agent de transit : montant, motif, dossier de transit rattaché
                 │
                 ▼
[2. Validation Hiérarchique]
    Chef comptable ou Directeur : contrôle du plafond & pièces
                 │
                 ▼
[3. Décaissement Physique]
    Caissier : remise des espèces, signature conjointe du bon PDF
                 │
                 ▼
[4. Justification & Rapprochement]
    Agent : retour des quittances originales (Douane, Port, etc.)
    Comptabilité : lettrage du débours sur le dossier
```

### 6.3. Clôture Journalière de Caisse
- Opération quotidienne obligatoire par caisse :
  - Comptage physique des espèces (billets et pièces).
  - Comparaison automatique avec le solde théorique calculé par le système.
  - Constat des écarts éventuels (manquant / excédent) avec saisie d'un commentaire justificatif obligatoire.
  - Verrouillage de la journée et génération du Procès-Verbal de Clôture signé.

---

## MODULE 7 — COMPTABILITÉ GÉNÉRALE (SYSCOHADA RÉVISÉ)
### 7.1. Plan Comptable Normalisé OHADA
Intégration native des comptes du Plan Comptable Général OHADA pour le secteur du transit et de la logistique :

| Numéro Compte | Libellé Normalisé SYSCOHADA | Utilisation dans SLTT |
| :--- | :--- | :--- |
| **4111** | Clients nationaux | Créances sur les clients pour prestations de services |
| **4671** | Débours payés pour le compte des clients | Transit de trésorerie (droits de douane, B/L, surestaries) |
| **4011** | Fournisseurs d'exploitation | Dettes envers transitaires partenaires, compagnies maritimes |
| **4431** | État, TVA facturée sur prestations | TVA collectée (18%) sur honoraires et transports |
| **4452** | État, TVA récupérable sur achats | TVA déductible sur dépenses de fonctionnement |
| **4421** | État, impôts et taxes retenus | Acomptes BIC / Retenues fiscales éventuelles |
| **5211** | Banques locales (ex: BOA, BDM, Ecobank) | Règlements par virements et chèques |
| **5711** | Caisses physiques | Mouvements d'espèces, approvisionnements, menues dépenses |
| **7061** | Prestations de services de transit | Chiffre d'affaires hors taxes sur honoraires de transit |
| **7062** | Prestations de transport routier | Chiffre d'affaires hors taxes sur transport de conteneurs |
| **6041** | Achats d'études et prestations de services | Sous-traitance transport, manutention tierce |
| **6241** | Transports de marchandises sur achats | Frais d'acheminement |

### 7.2. Journaux Auxiliaires & Écritures Automatisées
- **Journal des Ventes (VE)** : Génération automatique lors de la validation d'une facture.
- **Journal des Règlements / Banque (BQ) & Caisse (CA)** : Écritures de lettrage client lors des encaissements.
- **Journal des Débours (OD/CA)** : Constatation de la créance de débours (débit 4671 par le crédit de la caisse ou banque).
- **Consultation des États Financiers** :
  - Grand Livre Général des comptes filtrable par période et par annexe.
  - Balance Générale à 6 colonnes (Soldes d'ouverture, Mouvements Débit/Crédit, Soldes de clôture).
  - Balance Âgée Clients (créances 0-30j, 31-60j, 61-90j, >90j).

---

## MODULE 8 — GESTION DES ENTREPÔTS, MAGASINAGE & STOCKS
### 8.1. Définition des Aires de Stockage
- Entrepôts physiques, hangars sécurisés, Magasins et Aires de Dédouanement (MAD).
- Découpage par zones, travées, allées, niveaux et emplacements au sol pour conteneurs.

### 8.2. Réception & Articles en Stock (`StockItem`)
- Référence article / numéro de lot / numéro de colis.
- Propriétaire / Dépositaire (Client rattaché).
- Description, dimensions, volume unitaire (m³), poids brut (kg).
- Valeur déclarée en douane, date d'entrée, dossier de transit d'origine.

### 8.3. Mouvements de Stock & Bons de Sortie Magasin
- Types de mouvements : Entrée initiale (`ENTREE`), Transfert interne (`TRANSFERT`), Sortie définitive (`SORTIE`), Régularisation d'inventaire.
- **Bons de Sortie Magasin (`BonSortie`)** :
  - Déclenchés uniquement après vérification de l'autorisation douanière (BAE) et du règlement financier des frais d'entreposage.
  - Mention obligatoire du transporteur, de la plaque d'immatriculation du camion de livraison et du nom du chauffeur récepteur.

---

## MODULE 9 — CONTRATS D'ENTREPOSAGE & FACTURATION RÉCURRENTE
### 9.1. Contrats d'Entreposage Dédiés (`Contrat`)
- Gestion des baux et conventions logistiques de moyenne et longue durée avec les grands importateurs (minoteries, quincailleries, cimentiers, ONGs).
- Référence contrat (ex: `CTR-2026-0012`), client rattaché, date de début, date de fin, reconduction tacite.
- Tarification dynamique :
  - Facturation au volume (m³ par jour / quinzaine / mois).
  - Facturation par palette ou conteneur stocké par jour.
  - Forfait mensuel global de mise à disposition d'espace.
- Lignes de frais annexes contractuels (sécurité gardiennage, manutention cariste forfaitaire, assurance magasin).
- **Génération automatique de factures périodiques** issues du contrat.
- Édition d'un PDF de contrat officiel conforme avec signature et cachet.

---

## MODULE 10 — FLOTTE, TRANSPORTEURS & LOGISTIQUE TERRESTRE
### 10.1. Gestion de la Flotte Interne et des Sous-Traitants
- Fiches Véhicules : Tracteurs routiers, camions bennes, plateaux porte-conteneurs (20' et 40').
- Documents de bord obligatoires : Carte grise, visite technique, assurance CEDEAO, patente de transport. Alertes de péremption des pièces du camion.
- Chauffeurs : Nom, permis de conduire (catégorie Poids Lourd), téléphone, numéro d'identité CEDEAO.

### 10.2. Lettres de Voiture & Missions de Transport
- Création des ordres de transport reliant un ou plusieurs conteneurs d'un dossier.
- Suivi du trajet corridor (étapes : départ port, frontière, pesage pèse-essieu, douane intérieure, destination finale).
- Déclarations des incidents de route et avaries éventuelles avec prises de photos.

---

## MODULE 11 — GESTION ÉLECTRONIQUE DES DOCUMENTS (GED) & OCR
### 11.1. Archivage Numérique Centralisé
- Stockage structuré de l'ensemble des pièces jointes d'un dossier :
  - Connaissements maritimes (Bill of Lading - B/L) et LTA.
  - Déclarations en douane (DUM / Déclaration Unique de Marchandises).
  - Quittances du Trésor / Douane.
  - Factures commerciales des fournisseurs étrangers et listes de colisage (Packing List).
  - Certificats d'origine, certificats phytosanitaires, attestations d'assurance.

### 11.2. Traitement OCR Intelligent
- Reconnaissance optique de caractères (OCR) appliquée aux déclarations Sydonia et aux quittances de paiement douanier.
- Extraction semi-automatique du numéro de déclaration, de la date de liquidation, des montants de droits perçus et du nom du déclarant pour pré-remplir les lignes de débours sans saisie manuelle.

---

## MODULE 12 — PISTE D'AUDIT, TRAÇABILITÉ & REPORTING DÉCISIONNEL
### 12.1. Audit Log Immuable (`AuditLog`)
- Enregistrement de chaque action sensible dans le système :
  - *Création, modification, suppression* d'entités (factures, dossiers, bons de caisse, mouvements de stock).
  - Adresse IP, identifiant de l'utilisateur, timestamp précis, état antérieur des données et nouvel état sous forme JSON.
  - Impossibilité absolue pour quiconque (y compris les administrateurs) d'éditer ou de purger les logs d'audit.

### 12.2. Tableaux de Bord & Indicateurs de Performance (KPIs)
- **Tableau de Bord Direction** :
  - Chiffre d'affaires mensuel Prestations vs Débours avancés.
  - Taux de recouvrement des créances et encours clients à risque.
  - Délais moyens de dédouanement (KPI passage en douane).
- **Tableau de Bord Transit** :
  - Nombre de dossiers ouverts, en cours de traitement, en attente de BAE, clôturés.
  - Alertes surestaries imminentes sur conteneurs au port ou en transit.
- **Tableau de Bord Caisse** :
  - Soldes instantanés des caisses par annexe.
  - Bons de décaissement en attente de validation ou de quittances justificatives.

---

# 5. ARCHITECTURE TECHNIQUE & CHOIX TECHNOLOGIQUES

### 5.1. Vue d'Ensemble de l'Architecture
L'architecture adoptée est une architecture web moderne découplée (API REST NestJS + SPA/SSR Next.js) garantissant scalabilité, maintenabilité, modularité et réactivité maximale.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NAVIGATEURS / CLIENTS                            │
│           (PC Bureau Déclarant, Tablette Magasinier, Mobile Chauffeur)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND : NEXT.JS 15 (APP ROUTER)                       │
│    • TypeScript, React 19, TailwindCSS, Lucide Icons, Zustand Stores         │
│    • Moteur d'impression haute fidélité (A4 portrait / thermique reçu)      │
│    • PWA / Service Worker (Cache offline, Optimistic UI, résilience réseau) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON) + Bearer JWT
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND : NESTJS (NODE.JS LTS)                          │
│    • Architecture Modulaire (Modules, Controllers, Services, DTOs)          │
│    • Sécurité : Passport-JWT, Guards RBAC, Helmet, Rate-limiting, CORS      │
│    • Validation : class-validator, class-transformer                        │
│    • Tâches programmées (Nest Cron) pour calcul surestaries & relances      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Requêtes typées Prisma Client
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COUCHE PERSISTANCE : PRISMA ORM                          │
│    • Schéma déclaratif unifié (schema.prisma)                               │
│    • Migrations versionnées (Prisma Migrate)                                │
│    • Relations typées, transactions ACID                                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Pool de connexions SQL
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 BASE DE DONNÉES RELATIONNELLE : MYSQL 8.X                   │
│    • Moteur InnoDB (support complet transactions ACID et clés étrangères)   │
│    • Encodage utf8mb4 (support des caractères internationaux et emojis)     │
│    • Sauvegardes automatiques quotidiennes chiffrées                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Spécifications du Backend (NestJS)
- **Langage** : TypeScript 5.x.
- **Framework** : NestJS 10.x.
- **ORM** : Prisma 5.x / 6.x avec génération de client statiquement typé.
- **Gestion de l'authentification** :
  - Access Token JWT (durée de validité courte : 15 min - 1h).
  - Refresh Token sécurisé stocké en base (`RefreshToken`) avec rotation à chaque rafraîchissement.
  - Hachage des mots de passe avec `bcrypt` (facteur de coût minimum : 10).
- **Gestion des Téléversements** : Stockage local ou compatible S3 avec validation stricte du type MIME (PDF, PNG, JPEG) et limitation de taille de fichier à 10 Mo par document.

### 5.3. Spécifications du Frontend (Next.js)
- **Framework** : Next.js 15 avec architecture App Router (`/app`).
- **Gestion d'État** : Zustand pour les états globaux (session utilisateur, annexe courante active, tiroir de navigation, notifications).
- **Composants d'Interface** :
  - TailwindCSS pour un design moderne, contrasté, sobre et professionnel adapté aux écrans logistiques.
  - Support natif du mode sombre (`dark mode`) et du mode clair (`light mode`).
  - Tableaux de données enrichis (pagination côté serveur, recherche textuelle, tri par colonne, filtres multicritères).
  - Boîtes de dialogue d'action modales avec gestion des retours d'erreur clairs et contextualisés.
- **Moteur d'Impression & Exportation** :
  - Génération de documents d'impression haute définition via styles CSS `@media print` calibrés au millimètre (format A4 pour Factures, Devis, Contrats, Grand Livre, et format rouleau thermique 80mm pour Reçus de Caisse).
  - Exports de données tabulaires au format Excel / CSV pour la direction et les commissaires aux comptes.

---

# 6. MODÈLE CONCEPTUEL DE DONNÉES (MCD & SCHÉMA PRISMA)

Le schéma ci-dessous résume les principales entités métier et leurs relations directes, modélisées fidèlement dans le `schema.prisma` du projet :

```
┌─────────────────┐       1:N       ┌─────────────────────┐
│     Annexe      ├────────────────►│       Profile       │
└────────┬────────┘                 └──────────┬──────────┘
         │ 1:N                                 │ 1:N
         ├──────────────────┐                  ├────────────────────────┐
         ▼                  ▼                  ▼                        ▼
┌─────────────────┐  ┌───────────────┐  ┌──────────────┐         ┌──────────────┐
│     Dossier     │  │    Caisse     │  │   AuditLog   │         │  Document    │
└────────┬────────┘  └───────┬───────┘  └──────────────┘         └──────────────┘
         │ 1:N               │ 1:N
         ├─────────────┐     ├────────────────────────┐
         ▼             ▼     ▼                        ▼
┌─────────────────┐ ┌─────────────────┐     ┌──────────────────┐
│   Conteneur     │ │  Facture        │     │ BonSortieCaisse  │
└─────────────────┘ └────────┬────────┘     └──────────────────┘
                             │ 1:N
                             ├────────────────────────┐
                             ▼                        ▼
                    ┌─────────────────┐     ┌──────────────────┐
                    │  LigneFacture   │     │  RecuPaiement    │
                    └─────────────────┘     └──────────────────┘
```

### 6.1. Dictionnaire Résumé des Entités Fondamentales
| Entité Prisma | Description & Rôle Métier |
| :--- | :--- |
| `Profile` | Compte utilisateur avec identifiants, rôle (`Role`), statut actif, email, téléphone et relations d'annexes. |
| `Annexe` | Succursale physique de SLTT (Siège Bamako, Abidjan Port, etc.) avec coordonnées et préfixes de numérotation. |
| `Dossier` | Dossier de transit principal : mode de transport, BL/LTA, déclaration Sydonia, client, statut logistique. |
| `Conteneur` | Unité de charge maritime/terrestre rattachée au dossier avec type, taille, numéro de plomb et statut de dépotage. |
| `EtapeDossier` | Jalons horodatés du dédouanement et du transport avec validation par l'agent responsable. |
| `Devis` / `LigneDevis` | Offre de prix commerciale découpée en prestations SLTT et débours prévisionnels. |
| `Facture` / `LigneFacture`| Document comptable final avec ventilation Prestations (TVA 18%) et Débours réels (TVA 0%). |
| `RecuPaiement` | Justificatif officiel d'encaissement rattaché à une facture avec mode de paiement et solde mis à jour. |
| `Caisse` | Coffre ou tiroir-caisse physique géré par une annexe pour les opérations au comptant. |
| `BonSortieCaisse` | Pièce justificative de décaissement d'espèces pour avances de débours douaniers ou menues charges. |
| `ClotureCaisse` | Enregistrement de fin de journée de caisse avec confrontation solde théorique / solde réel compté. |
| `StockItem` | Marchandise physique entreposée en magasin avec volume, poids, emplacement et propriétaire. |
| `BonSortie` | Autorisation de sortie physique d'entrepôt après apurement douanier et financier. |
| `Contrat` | Contrat logistique d'entreposage récurrent avec grille tarifaire et périodicité de facturation. |
| `OperationComptable` | Écriture du journal général SYSCOHADA débit/crédit avec numéro de compte et libellé. |
| `Transporteur` | Sous-traitant routier ou division flotte interne (camions, remorques, chauffeurs). |
| `Document` | Fichier numérique téléversé rattaché à un dossier, une facture ou une opération avec statut OCR. |
| `AuditLog` | Trace inaltérable d'activité utilisateur (horodatage, IP, action, ressource, payload JSON). |

---

# 7. EXIGENCES NON-FONCTIONNELLES (QoS & SÉCURITÉ)

### 7.1. Performance & Réactivité
- Temps de réponse de l'API : < **300 ms** pour 95% des requêtes standard en lecture/écriture.
- Affichage des pages du frontend : < **1,5 seconde** sur une connexion internet standard (3G/4G locale).
- Pagination serveur obligatoire pour toute liste de données dépassant 25 enregistrements afin d'économiser la bande passante.

### 7.2. Disponibilité & Sauvegarde
- Taux de disponibilité cible : **99.5%** pendant les heures ouvrables (07h00 - 20h00 GMT).
- Sauvegarde quotidienne complète de la base de données MySQL à 02h00 GMT, avec rétention des archives chiffrées sur 30 jours glissants.
- Procédure de reprise d'activité (PRA) garantissant une restauration complète en moins de **2 heures** en cas de sinistre matériel.

### 7.3. Sécurité et Intégrité Financière
- Chiffrement systématique de toutes les communications en transit via le protocole **TLS / HTTPS**.
- Protection contre les injections SQL (assurée nativement par les requêtes paramétrées de Prisma ORM).
- Protection contre les attaques XSS, CSRF et détournement de clics (Clickjacking) via des en-têtes HTTP stricts (`Helmet`).
- **Principe d'irréversibilité comptable** : Aucune facture validée ou écriture de journal SYSCOHADA ne peut être physiquement supprimée de la base de données. Seules des opérations compensatoires (Avoirs, écritures d'extourne) sont autorisées.

### 7.4. Ergonomie et Accessibilité Métier
- Adaptation responsive complète (ordinateurs portables de bureau, écrans tactiles industriels, tablettes et smartphones).
- Raccourcis clavier pour les saisies comptables rapides à gros volume.
- Impression native parfaitement calibrée : pas de débordement de page, contrastes marqués pour lisibilité sur papier carbone ou imprimantes matricielles/laser standard.

---

# 8. PLAN DE DÉPLOIEMENT, JALONS ET RECETTE

### 8.1. Découpage du Projet en Phases
Le projet est structuré en 5 phases itératives :

| Phase | Intitulé | Durée Indicative | Principaux Livrables |
| :---: | :--- | :---: | :--- |
| **Phase 1** | **Fondations & Sécurité** | 3 semaines | Modèle Prisma, Authentification JWT, Rôles RBAC, Multi-annexes, Gestion des Tiers. |
| **Phase 2** | **Opérations de Transit & Tracking** | 4 semaines | Dossiers Maritime/Aérien/Terrestre, Suivi Conteneurs, Étapes logistiques, Tracking public. |
| **Phase 3** | **Facturation, Débours & Caisses** | 4 semaines | Devis, Facturation bivalente (TVA 18% / Débours 0%), Bons de caisse, Règlements & Reçus. |
| **Phase 4** | **Entrepôt, Contrats & SYSCOHADA** | 4 semaines | Gestion magasin/stocks, Contrats d'entreposage, Journaux SYSCOHADA, Grand Livre, Balance. |
| **Phase 5** | **GED, OCR, Recette & Mise en Prod** | 3 semaines | Module GED/OCR, Audit Logs, Tests d'intégration, Formation des équipes, Déploiement live. |

### 8.2. Critères de Recette Fonctionnelle
La recette sera validée par la direction de SLTT sur la base des scénarios clés suivants :
1. **Scénario Transit & Facturation** :
   - Créer un dossier maritime import 2 conteneurs 40' avec B/L et numéro Sydonia.
   - Émettre un bon de décaissement de caisse de 4 500 000 FCFA pour paiement des droits de douane.
   - Valider la sortie de caisse, puis attacher la quittance douanière numérisée.
   - Générer la facture client : constater la séparation exacte entre les débours de 4 500 000 FCFA (TVA 0%) et les honoraires SLTT (TVA 18%).
   - Enregistrer un virement bancaire partiel et éditer le reçu officiel avec le solde restant exact.
2. **Scénario Clôture Caisse** :
   - Enregistrer des encaissements et décaissements dans la journée.
   - Effectuer la clôture journalière : vérifier le calcul automatique du solde théorique et l'impossibilité de modifier les transactions clôturées.
3. **Scénario Entrepôt & Contrat** :
   - Établir un contrat d'entreposage au m³ pour un client régulier.
   - Enregistrer l'entrée de palettes, puis tenter d'émettre un bon de sortie sans BAE (le système doit bloquer l'opération).
   - Générer la facture mensuelle d'entreposage issue du contrat.
4. **Scénario Comptabilité SYSCOHADA** :
   - Consulter le Grand Livre et la Balance : vérifier l'équilibre parfait Débit = Crédit et l'affectation correcte des comptes 411, 467, 706, 443 et 571.

---

# 9. CONCLUSION & ENGAGEMENT DE CONFORMITÉ

Ce cahier des charges constitue le document de référence fonctionnel, technique et contractuel pour le développement, la maintenance et les évolutions futures de la plateforme **Transit SLTT**. 

Toute évolution majeure ou modification de périmètre devra faire l'objet d'un avenant validé conjointement par la direction générale de la **Société SLTT** et l'équipe technique en charge du projet.
