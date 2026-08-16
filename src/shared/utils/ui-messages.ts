/** Catalogue central des textes d'interface — Transit SLTT (français). */

export const UI = {
  loading: {
    default: "Chargement en cours…",
    saving: "Enregistrement en cours…",
    verifying: "Vérification de votre session…",
    generating: "Génération en cours…",
    exporting: "Export en cours…",
    importing: "Import en cours…",
    processing: "Traitement en cours…",
  },

  errors: {
    generic:
      "Quelque chose s'est mal passé de notre côté. Réessayez dans quelques instants.",
    network:
      "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
    session:
      "Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer.",
    permission:
      "Vous n'avez pas les droits pour effectuer cette action. Contactez un administrateur si besoin.",
    notFound: "L'élément demandé est introuvable. Il a peut-être été supprimé.",
    duplicate:
      "Cette information existe déjà. Modifiez la valeur ou utilisez une autre entrée.",
    loadData:
      "Impossible de charger les données. Actualisez la page ou réessayez dans quelques instants.",
    saveFailed:
      "Impossible d'enregistrer vos modifications. Vérifiez votre connexion et réessayez.",
    exportEmpty:
      "Rien à exporter pour le moment. Modifiez les filtres ou ajoutez des données.",
    exportFailed:
      "L'export n'a pas pu être généré. Réessayez dans quelques instants.",
    printFailed:
      "L'impression n'a pas pu être lancée. Réessayez ou téléchargez le document.",
    validationRequired: "Des champs obligatoires sont manquants.",
    validationInvalid: "Certains champs contiennent des valeurs incorrectes.",
  },

  buttons: {
    cancel: "Annuler",
    cancelWithoutSave: "Revenir sans enregistrer",
    retry: "Réessayer",
    close: "Fermer",
    save: "Enregistrer les modifications",
    create: "Créer",
    delete: "Supprimer définitivement",
    confirmDelete: "Oui, supprimer",
    keep: "Non, conserver",
  },

  placeholders: {
    email: "prenom@entreprise.com",
    password: "Au moins 8 caractères",
    name: "Ex. Marie Dupont",
    company: "Ex. Société ABC Logistique",
    phone: "Ex. +223 70 00 00 00",
    amountFCFA: "Ex. 150 000 FCFA",
    amountZero: "0 FCFA",
    searchClients: "Rechercher par nom, téléphone, e-mail…",
    searchGlobal:
      "Rechercher un écran, un dossier, un client, une facture, un contrat…",
    filterClient: "Filtrer par client…",
    filterStatus: "Tous les statuts",
    selectDossier: "Choisir un dossier…",
    selectSociete: "Choisir une société…",
    selectGeneric: "Sélectionner…",
    notes: "Observations, remarques…",
    blNumber: "Ex. BL-0000",
    reference: "Ex. REF-2026-001",
  },

  empty: {
    clients: {
      zero: {
        title: "Aucun client enregistré",
        description:
          "Commencez par ajouter votre premier client à l'annuaire pour créer dossiers et factures.",
        action: "Ajouter mon premier client",
      },
      filtered: {
        title: "Aucun client ne correspond",
        description:
          "Essayez un autre terme de recherche ou modifiez les filtres actifs.",
      },
    },
    dossiers: {
      zero: {
        title: "Aucun dossier pour l'instant",
        description:
          "Créez votre premier dossier de transit pour suivre camions, BL et paiements.",
        action: "Créer mon premier dossier",
      },
      filtered: {
        title: "Aucun dossier trouvé",
        description:
          "Aucun dossier ne correspond à vos filtres. Modifiez la recherche ou les critères.",
      },
      error: {
        title: "Impossible de charger les dossiers",
        description:
          "Un problème est survenu lors du chargement. Vérifiez votre connexion et réessayez.",
        action: "Réessayer",
      },
    },
    devis: {
      zero: {
        title: "Aucun devis pour l'instant",
        description:
          "Créez votre premier devis pour proposer vos tarifs à vos clients.",
        action: "Créer mon premier devis",
      },
      filtered: {
        title: "Aucun devis trouvé",
        description:
          "Modifiez les filtres ou créez un nouveau devis pour ce client.",
      },
    },
    factures: {
      zero: {
        title: "Aucune facture créée",
        description:
          "Émettez votre première facture depuis un dossier ou directement depuis cette liste.",
        action: "Créer ma première facture",
      },
      filtered: {
        title: "Aucune facture ne correspond",
        description:
          "Essayez d'autres filtres ou créez une nouvelle facture.",
      },
    },
    bons: {
      zero: {
        title: "Aucun bon de sortie",
        description:
          "Émettez un bon de sortie pour autoriser le retrait de marchandises.",
        action: "Émettre un bon",
      },
      filtered: {
        title: "Aucun bon trouvé",
        description: "Modifiez les filtres pour afficher d'autres bons.",
      },
      caisseZero: {
        title: "Aucune sortie de caisse",
        description:
          "Enregistrez une sortie de caisse pour suivre les dépenses liées aux bons.",
        action: "Nouvelle sortie de caisse",
      },
    },
    stock: {
      zero: {
        title: "Aucun article en stock",
        description:
          "Ajoutez votre premier article pour commencer à gérer l'entreposage.",
        action: "Ajouter un article",
      },
      filtered: {
        title: "Aucun résultat",
        description:
          "Aucun article ne correspond à votre recherche. Modifiez les filtres.",
      },
    },
    mouvements: {
      filtered: {
        title: "Aucun mouvement trouvé",
        description:
          "Aucun mouvement ne correspond aux filtres sélectionnés. Élargissez la période ou les critères.",
      },
      zero: {
        title: "Aucun mouvement enregistré",
        description:
          "Enregistrez une entrée ou une sortie de stock pour voir l'historique ici.",
        action: "Enregistrer une entrée",
      },
    },
    ecritures: {
      zero: {
        title: "Aucune écriture comptable",
        description:
          "Créez votre première écriture pour suivre recettes et dépenses.",
        action: "Nouvelle écriture",
      },
      filtered: {
        title: "Aucune écriture trouvée",
        description:
          "Modifiez les filtres ou créez une nouvelle écriture.",
      },
    },
    contrats: {
      zero: {
        title: "Aucun contrat pour l'instant",
        description:
          "Créez un contrat d'entreposage pour lier dépenses, prestations et documents.",
        action: "Créer mon premier contrat",
      },
      filtered: {
        title: "Aucun contrat trouvé",
        description:
          "Modifiez les filtres ou créez un nouveau contrat.",
      },
    },
    transporteurs: {
      filtered: {
        title: "Aucun transporteur trouvé",
        description:
          "Modifiez la recherche ou ajoutez un nouveau transporteur.",
      },
    },
    search: {
      title: "Aucun résultat trouvé",
      description:
        "Essayez d'autres mots-clés ou vérifiez l'orthographe.",
    },
    documents: {
      title: "Aucun document à prévisualiser",
      description:
        "Ajoutez un document via l'onglet Documents ou importez un scan.",
    },
    loadError: {
      title: "Impossible de charger cette page",
      description:
        "Un problème est survenu lors du chargement. Vérifiez votre connexion et réessayez.",
      action: "Réessayer",
    },
    notifications: {
      title: "Aucune notification",
      description: "Vous serez informé ici des alertes importantes.",
    },
    history: {
      title: "Aucun historique",
      description: "Les actions effectuées apparaîtront ici.",
    },
  },

  success: {
    saved: "Modifications enregistrées",
    created: "C'est fait !",
    deleted: "Suppression effectuée",
    exported: "Export généré avec succès",
    sent: "Envoi effectué",
  },

  onboarding: {
    welcome: (name: string) =>
      name ? `Bienvenue ${name} !` : "Bienvenue !",
    guideTitle: "Voici par où démarrer",
    stepDone: "C'est fait !",
    continueStep: (label: string) => `Passer à l'étape suivante : ${label}`,
    stepComplete: (remaining: number) =>
      remaining > 0
        ? `Super ! Étape terminée. Plus que ${remaining} étape${remaining > 1 ? "s" : ""}.`
        : "Super ! Toutes les étapes sont terminées.",
  },
} as const;
