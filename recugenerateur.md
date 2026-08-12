Je développe une application web avec Next.js et je veux intégrer un module professionnel de génération de reçus de paiement pour une société de transit/transport appelée :

TRAORE DE LOGISTIQUE
Niaréla - Rue 516 porte C/63
RCCM : Ma.Bko.2025 B.5897
Tél. : +223 76 96 47 06 / 92 92 46 48

IMPORTANT :
- Utilise Next.js, TypeScript et Tailwind CSS.
- Ne crée PAS une simple page HTML statique.
- Le composant doit être intégré proprement dans mon application Next.js existante.
- Utilise l'App Router.
- Le code doit être propre, modulaire, maintenable et réutilisable.
- Utilise des composants React.
- Prévois une architecture adaptée à une future connexion à une base de données.
- L'interface doit être responsive.
- Le reçu doit pouvoir être prévisualisé avant impression.
- Le rendu du reçu doit être très proche du modèle fourni en référence.

J'ai fourni une image de référence du reçu papier actuel.

OBJECTIF :
Créer une interface "Gestion des reçus" permettant à un utilisateur de remplir les informations du reçu et d'obtenir immédiatement un aperçu fidèle du reçu.

==================================================
1. STRUCTURE DE L'INTERFACE
==================================================

Créer une page :

/recus/nouveau

La page doit être divisée en deux zones principales sur desktop :

GAUCHE :
Formulaire de saisie du reçu.

DROITE :
Aperçu en temps réel du reçu.

Sur mobile :
- Le formulaire apparaît en premier.
- L'aperçu apparaît ensuite.
- Ajouter un bouton permettant d'afficher/masquer l'aperçu.

Utiliser une interface moderne de type dashboard professionnel.

Titre de la page :

"Créer un reçu de paiement"

Sous-titre :

"Renseignez les informations du paiement puis prévisualisez le reçu."

==================================================
2. FORMULAIRE
==================================================

Créer les champs suivants :

Nom
Prénom
La somme de
Motif
Montant payé
Reste
Date
Signature

Ajouter également, si nécessaire pour l'application :

Numéro du reçu

Le numéro du reçu doit pouvoir être généré automatiquement.

Exemple :

REC-2026-0001

Prévoir une logique permettant d'incrémenter automatiquement ce numéro dans le futur.

Pour le montant :

- accepter uniquement des valeurs numériques
- afficher FCFA
- calculer automatiquement le reste si un montant total et un montant payé sont disponibles

Exemple :

Somme : 100 000 FCFA
Montant payé : 70 000 FCFA
Reste : 30 000 FCFA

Prévoir une validation des champs.

Le bouton principal :

"Prévisualiser le reçu"

Mais comme l'aperçu doit être dynamique, les modifications du formulaire doivent idéalement être reflétées immédiatement dans l'aperçu sans devoir cliquer.

Ajouter les boutons :

"Enregistrer"
"Imprimer"
"Télécharger PDF"
"Réinitialiser"

==================================================
3. APERÇU DU REÇU
==================================================

L'aperçu doit reproduire visuellement le reçu fourni en référence.

Format :

A4 ou format proche d'un reçu administratif imprimable.

Créer une carte représentant le papier du reçu.

Le reçu doit avoir :

- fond blanc légèrement cassé
- bordure fine
- dimensions proportionnelles au modèle
- typographie professionnelle
- couleur principale bleue proche du bleu présent sur le reçu original
- lignes horizontales pour les champs
- espaces suffisamment grands pour permettre une lecture claire
- mise en page compacte mais élégante

IMPORTANT :
Le résultat ne doit PAS ressembler à une simple facture moderne.

Il doit conserver l'identité visuelle du reçu papier montré dans l'image.

==================================================
4. EN-TÊTE DU REÇU
==================================================

En haut du reçu :

À gauche :
le logo de TRAORE DE LOGISTIQUE.

Au centre :

TRAORE DE LOGISTIQUE

Niaréla - Rue 516 porte C/63

RCCM : Ma.Bko.2025 B.5897

Tél. : +223 76 96 47 06 / 92 92 46 48

Puis :

REÇU DE PAIEMENT

Le titre "TRAORE DE LOGISTIQUE" doit être très visible.

"REÇU DE PAIEMENT" doit être également bien visible sous les coordonnées.

IMPORTANT :
Utiliser le logo fourni dans l'image de référence.

Si le logo doit être utilisé dans l'application, prévoir :

/public/images/logo-traore-logistique.png

Ne pas recréer un faux logo en CSS.

Si le logo n'est pas encore disponible séparément, prévoir temporairement une zone permettant de remplacer facilement l'image par le vrai fichier.

==================================================
5. CORPS DU REÇU
==================================================

Reproduire la structure suivante :

Nom : ___________________________

Prénom : ________________________

La somme de :
_________________________________

Motif :
_________________________________

Montant payé : __________________

Reste : _________________________

Date, le : ______________________

Signature : ______________________

Les informations saisies dans le formulaire doivent apparaître automatiquement dans ces zones.

Exemple :

Nom : TRAORE
Prénom : Amadou

La somme de :
Cent mille francs CFA

Motif :
Frais de prestation de transit

Montant payé :
70 000 FCFA

Reste :
30 000 FCFA

Date, le :
12/08/2026

==================================================
6. MONTANT EN LETTRES
==================================================

Créer une fonction utilitaire permettant de convertir automatiquement un montant numérique en lettres.

Exemple :

100000

doit afficher :

"Cent mille francs CFA"

Créer cette fonction dans un fichier séparé, par exemple :

src/lib/numberToWords.ts

Elle devra être réutilisable dans toute l'application.

==================================================
7. APERÇU EN TEMPS RÉEL
==================================================

Utiliser React state ou React Hook Form pour gérer le formulaire.

Chaque modification du formulaire doit mettre à jour immédiatement le reçu.

Exemple :

L'utilisateur saisit :

Nom = "TRAORE"

L'aperçu doit immédiatement afficher :

Nom : TRAORE

Même comportement pour tous les autres champs.

Utiliser des valeurs par défaut réalistes pour faciliter les tests.

==================================================
8. IMPRESSION
==================================================

Créer une fonction :

handlePrint()

qui permet d'imprimer uniquement le reçu.

NE PAS imprimer :
- le formulaire
- les boutons
- le menu
- le dashboard
- les éléments de navigation

Uniquement le reçu.

Utiliser une stratégie propre avec CSS @media print ou une bibliothèque adaptée.

Le reçu imprimé doit conserver :

- les dimensions
- le logo
- les couleurs
- les bordures
- les espacements
- la typographie

==================================================
9. EXPORT PDF
==================================================

Ajouter un bouton :

"Télécharger PDF"

Prévoir une architecture permettant de générer un PDF propre du reçu.

Si nécessaire, utiliser une bibliothèque compatible Next.js comme :

@react-pdf/renderer

ou une autre solution fiable.

Le PDF doit contenir uniquement le reçu.

Le nom du fichier doit être automatiquement généré :

recu-REC-2026-0001.pdf

==================================================
10. SIGNATURE
==================================================

Pour le champ Signature, prévoir deux possibilités :

Option 1 :
signature manuscrite directement dans une zone de signature.

Option 2 :
importer une image de signature.

Créer si possible un composant SignaturePad.

L'utilisateur doit pouvoir :
- dessiner sa signature
- effacer la signature
- valider la signature

La signature doit apparaître dans l'aperçu du reçu.

==================================================
11. LOGO
==================================================

Utiliser le logo de la société fourni dans l'image de référence.

Créer une structure facilement modifiable :

const companyInfo = {
  name: "TRAORE DE LOGISTIQUE",
  address: "Niaréla - Rue 516 porte C/63",
  rccm: "Ma.Bko.2025 B.5897",
  phone: "+223 76 96 47 06 / 92 92 46 48",
  logo: "/images/logo-traore-logistique.png"
};

Ainsi les informations de l'entreprise pourront être modifiées facilement plus tard.

==================================================
12. ARCHITECTURE DES COMPOSANTS
==================================================

Je veux une architecture propre.

Proposer quelque chose comme :

src/
├── app/
│   └── recus/
│       └── nouveau/
│           └── page.tsx
│
├── components/
│   └── receipts/
│       ├── ReceiptForm.tsx
│       ├── ReceiptPreview.tsx
│       ├── ReceiptHeader.tsx
│       ├── ReceiptBody.tsx
│       ├── SignaturePad.tsx
│       └── ReceiptActions.tsx
│
├── lib/
│   ├── numberToWords.ts
│   ├── receiptUtils.ts
│   └── printReceipt.ts
│
├── types/
│   └── receipt.ts
│
└── public/
    └── images/
        └── logo-traore-logistique.png

Adapter cette architecture à l'architecture actuelle de mon projet si elle existe déjà.

==================================================
13. TYPE TYPESCRIPT
==================================================

Créer un type :

export interface Receipt {
  id?: string;
  numero: string;
  nom: string;
  prenom: string;
  somme: number;
  sommeEnLettres?: string;
  motif: string;
  montantPaye: number;
  reste: number;
  date: string;
  signature?: string;
}

==================================================
14. DESIGN
==================================================

Le design général de l'application doit être moderne.

Utiliser :

- Tailwind CSS
- cartes avec bordures légères
- coins légèrement arrondis pour l'interface
- boutons modernes
- champs bien espacés
- icônes Lucide React

Mais ATTENTION :

L'interface de gestion peut être moderne.

Le reçu lui-même doit rester fidèle au document papier original.

Ne pas transformer le reçu en design de facture SaaS moderne.

==================================================
15. RESPONSIVE
==================================================

Desktop :

┌───────────────────────────────┬─────────────────────────────┐
│                               │                             │
│       FORMULAIRE              │       APERÇU REÇU           │
│                               │                             │
│       Nom                     │    ┌───────────────────┐    │
│       Prénom                  │    │ LOGO              │    │
│       Somme                   │    │ TRAORE LOGISTIQUE │    │
│       Motif                   │    │                   │    │
│       Montant payé            │    │ REÇU DE PAIEMENT  │    │
│       Reste                   │    │                   │    │
│       Date                    │    │ Nom : ...         │    │
│       Signature               │    │ Prénom : ...      │    │
│                               │    │ ...               │    │
│       [Enregistrer]            │    │ Signature         │    │
│       [Imprimer]               │    └───────────────────┘    │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘

Mobile :

FORMULAIRE

↓

APERÇU

↓

ACTIONS

==================================================
16. EXPÉRIENCE UTILISATEUR
==================================================

Ajouter :

- validation des champs
- messages d'erreur propres
- toast de confirmation après sauvegarde
- confirmation avant réinitialisation
- état loading pendant la génération PDF
- désactivation des boutons pendant les opérations
- aperçu instantané
- formatage automatique des montants en FCFA

Exemple :

100000

affichage :

100 000 FCFA

==================================================
17. DONNÉES DE TEST
==================================================

Utiliser initialement :

Nom :
TRAORE

Prénom :
Amadou

Somme :
100000

Motif :
Frais de prestation de transit

Montant payé :
70000

Reste :
30000

Date :
12/08/2026

Numéro :
REC-2026-0001

==================================================
18. IMPORTANT — QUALITÉ DU CODE
==================================================

Avant de terminer :

1. Vérifier que le projet compile.
2. Vérifier les erreurs TypeScript.
3. Vérifier les imports.
4. Vérifier que le composant fonctionne avec Next.js App Router.
5. Vérifier le responsive.
6. Vérifier l'impression.
7. Vérifier que seul le reçu est imprimé.
8. Vérifier l'affichage du logo.
9. Vérifier le calcul du reste.
10. Vérifier la conversion du montant en lettres.

Ne pas créer de code inutile.

Ne pas modifier des parties existantes de mon application sans raison.

Commencer par analyser la structure actuelle du projet puis intégrer cette fonctionnalité dans l'architecture existante.

Si certaines dépendances sont nécessaires, indique-les et installe-les uniquement si elles sont réellement utiles.

==================================================
19. RÉSULTAT ATTENDU
==================================================

Je veux obtenir une véritable fonctionnalité de gestion de reçus dans mon application.

L'utilisateur doit pouvoir :

1. Ouvrir "Nouveau reçu"
2. Remplir le formulaire
3. Voir le reçu se mettre à jour en temps réel
4. Vérifier le rendu dans l'aperçu
5. Ajouter sa signature
6. Enregistrer le reçu
7. Imprimer le reçu
8. Télécharger le reçu en PDF

Le résultat visuel doit être fortement inspiré du reçu papier fourni en référence, notamment son en-tête, son logo, ses couleurs bleues, ses lignes et sa structure générale.

Commence maintenant par analyser mon projet existant, puis implémente cette fonctionnalité étape par étape.