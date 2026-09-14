import { PrismaClient, RoleUtilisateur, TypeClient, TypeDossier, StatutDossier, VoieTransport } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed Transit SLTT...');

  // 1. Annexes (Mali et Côte d'Ivoire)
  const annexeMali = await prisma.annexe.upsert({
    where: { code: 'ML-SIEGE' },
    update: {
      nom: 'Mali - Siège Bamako',
      ville: 'Bamako',
      pays: 'Mali',
      estSiege: true,
      telephone: '+223 76 96 47 06',
      email: 'bamako@transit-sltt.com',
    },
    create: {
      code: 'ML-SIEGE',
      nom: 'Mali - Siège Bamako',
      ville: 'Bamako',
      pays: 'Mali',
      estSiege: true,
      telephone: '+223 76 96 47 06',
      email: 'bamako@transit-sltt.com',
    },
  });

  const annexeCI = await prisma.annexe.upsert({
    where: { code: 'CI-ABJ' },
    update: {
      nom: "Côte d'Ivoire - Agence Abidjan",
      ville: 'Abidjan',
      pays: "Côte d'Ivoire",
      estSiege: false,
      telephone: '+225 07 00 00 02',
      email: 'abidjan@transit-sltt.com',
    },
    create: {
      code: 'CI-ABJ',
      nom: "Côte d'Ivoire - Agence Abidjan",
      ville: 'Abidjan',
      pays: "Côte d'Ivoire",
      estSiege: false,
      telephone: '+225 07 00 00 02',
      email: 'abidjan@transit-sltt.com',
    },
  });

  console.log('✅ Annexes créées (Mali & Côte d\'Ivoire)');

  // 2. Utilisateurs
  const passwordAdmin = await bcrypt.hash('sltt2026', 12);
  const passwordTransit = await bcrypt.hash('transit2026', 12);
  const passwordCompta = await bcrypt.hash('compta2026', 12);

  const admin = await prisma.profile.upsert({
    where: { email: 'amadou.traore@sltt.ml' },
    update: {},
    create: {
      email: 'amadou.traore@sltt.ml',
      passwordHash: passwordAdmin,
      nom: 'Amadou Traoré',
      role: RoleUtilisateur.ADMIN,
      permissions: ['*'],
      actif: true,
      telephone: '+223 70 00 00 01',
      userAnnexes: {
        create: [
          { annexeId: annexeMali.id },
          { annexeId: annexeCI.id },
        ],
      },
    },
  });

  const transitaireMali = await prisma.profile.upsert({
    where: { email: 'ibrahim.keita@sltt.ml' },
    update: {},
    create: {
      email: 'ibrahim.keita@sltt.ml',
      passwordHash: passwordTransit,
      nom: 'Ibrahim Keïta',
      role: RoleUtilisateur.TRANSITAIRE,
      permissions: ['dossiers.creer', 'dossiers.modifier', 'documents.upload'],
      actif: true,
      telephone: '+223 70 00 00 02',
      userAnnexes: {
        create: [{ annexeId: annexeMali.id }],
      },
    },
  });

  const transitaireCI = await prisma.profile.upsert({
    where: { email: 'moussa.camara@sltt.ci' },
    update: {},
    create: {
      email: 'moussa.camara@sltt.ci',
      passwordHash: passwordTransit,
      nom: 'Moussa Camara',
      role: RoleUtilisateur.TRANSITAIRE,
      permissions: ['dossiers.creer', 'dossiers.modifier', 'documents.upload'],
      actif: true,
      telephone: '+225 07 00 00 02',
      userAnnexes: {
        create: [{ annexeId: annexeCI.id }],
      },
    },
  });

  const comptableMali = await prisma.profile.upsert({
    where: { email: 'fatoumata.diallo@sltt.ml' },
    update: {},
    create: {
      email: 'fatoumata.diallo@sltt.ml',
      passwordHash: passwordCompta,
      nom: 'Fatoumata Diallo',
      role: RoleUtilisateur.COMPTABLE,
      permissions: ['factures.creer', 'caisse.encaisser', 'caisse.decaisser', 'depenses.valider'],
      actif: true,
      telephone: '+223 70 00 00 03',
      userAnnexes: {
        create: [{ annexeId: annexeMali.id }],
      },
    },
  });

  console.log('✅ Profils créés');

  // 3. Caisse
  const caisseMali = await prisma.caisse.upsert({
    where: { code: 'CAISSE-BKO-01' },
    update: {},
    create: {
      code: 'CAISSE-BKO-01',
      nom: 'Caisse Principale Bamako',
      annexeId: annexeMali.id,
      soldeActuel: 50000000,
      devise: 'FCFA',
    },
  });

  await prisma.caisse.upsert({
    where: { code: 'CAISSE-ABJ-01' },
    update: {},
    create: {
      code: 'CAISSE-ABJ-01',
      nom: 'Caisse Agence Abidjan',
      annexeId: annexeCI.id,
      soldeActuel: 25000000,
      devise: 'FCFA',
    },
  });

  console.log('✅ Caisses créées (FCFA)');

  // 4. Clients
  const client1 = await prisma.client.upsert({
    where: { code: 'CLI-001' },
    update: {},
    create: {
      code: 'CLI-001',
      nom: 'Société des Établissements Diallo SARL',
      type: TypeClient.ENTREPRISE,
      telephone: '+223 76 11 22 33',
      email: 'contact@diallo-sa.ml',
      adresse: 'Zone Industrielle Sotuba, Bamako',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { code: 'CLI-002' },
    update: {},
    create: {
      code: 'CLI-002',
      nom: 'Ivoire & Sahel Import-Export',
      type: TypeClient.ENTREPRISE,
      telephone: '+225 07 33 44 55',
      email: 'contact@ivoiresahel.ci',
      adresse: 'Treichville, Abidjan',
    },
  });

  console.log('✅ Clients créés');

  // 5. Fournisseurs
  await prisma.fournisseur.upsert({
    where: { code: 'FOURN-001' },
    update: {},
    create: {
      code: 'FOURN-001',
      nom: 'Sahel-Transit Logistique SARL',
      telephone: '+223 79 55 22 11',
      email: 'contact@saheltransit.ml',
      contact: 'Aliou Coulibaly',
    },
  });

  console.log('✅ Fournisseurs créés');

  // 6. Dossiers de transit d'exemple
  await prisma.dossier.upsert({
    where: { numero: 'SLTT-TR-2026-0001' },
    update: {},
    create: {
      numero: 'SLTT-TR-2026-0001',
      annexeId: annexeMali.id,
      clientId: client1.id,
      creeParId: transitaireMali.id,
      type: TypeDossier.IMPORT,
      statut: StatutDossier.EN_COURS,
      voieTransport: VoieTransport.MARITIME,
      marchandise: 'Matériel informatique et télécoms',
      numeroBl: 'BL-MAR-89210',
      navireVol: 'MSC ALTAIR',
      compagnie: 'MSC',
      portProvenance: 'Anvers (Belgique)',
      portDestination: "Port Autonome d'Abidjan",
      poids: 14500,
      volume: 48,
      nombreColis: 120,
      dateArriveePrevue: new Date('2026-03-20'),
      conteneurs: {
        create: [
          {
            numero: 'MSCU7821940',
            type: '40HC',
            plomb: 'PL-99882',
            statut: 'EN_TRANSIT',
          },
        ],
      },
      trackingPublic: {
        create: {
          codeTracking: 'TRK-SLTT-0001',
          statutAffiche: 'En transit vers Bamako via Abidjan',
          dernierePosition: 'En route corridor Abidjan - Bamako',
        },
      },
    },
  });

  // 7. Paramètres dynamiques (app settings)
  const defaultSettings = [
    { cle: 'nom_societe', valeur: 'Transit SLTT', description: 'Raison sociale', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'societe_nom', valeur: 'Transit SLTT', description: 'Nom de la société', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'societe_raison_sociale', valeur: 'Société Logistique Transit Transport', description: 'Raison sociale légale', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'societe_adresse', valeur: '', description: 'Adresse du siège social', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'societe_telephone', valeur: '+223 76 96 47 06', description: 'Téléphone principal', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'support_email', valeur: 'support@transit-sltt.com', description: 'Email support technique', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'email_contact', valeur: 'contact@transit-sltt.com', description: 'Email de contact général', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'company_phone', valeur: '+223 76 96 47 06', description: 'Numéro de téléphone d\'assistance', type: 'string', isPublic: true, groupName: 'contact' },
    { cle: 'app_title', valeur: 'Transit SLTT', description: 'Titre de l\'application', type: 'string', isPublic: true, groupName: 'application' },
    { cle: 'app_subtitle', valeur: 'Société Logistique Transit Transport', description: 'Sous-titre', type: 'string', isPublic: true, groupName: 'application' },
    { cle: 'welcome_message', valeur: 'Bienvenue sur la plateforme Transit SLTT', description: 'Message de bienvenue', type: 'string', isPublic: true, groupName: 'application' },
    { cle: 'maintenance_mode', valeur: 'false', description: 'Mode maintenance applicatif', type: 'boolean', isPublic: true, groupName: 'application' },
    { cle: 'devise_principale', valeur: 'FCFA', description: 'Devise par défaut de facturation', type: 'string', isPublic: true, groupName: 'facturation' },
    { cle: 'taux_tva_defaut', valeur: '18', description: 'Taux TVA standard (%)', type: 'number', isPublic: true, groupName: 'facturation' },
    { cle: 'facturation_taux_tva', valeur: '18', description: 'Taux TVA pour factures émises (%)', type: 'number', isPublic: true, groupName: 'facturation' },
    { cle: 'delai_echeance_jours', valeur: '30', description: 'Délai d\'échéance des factures (jours)', type: 'number', isPublic: false, groupName: 'facturation' },
    { cle: 'commission_rate', valeur: '0.05', description: 'Taux de commission standard', type: 'number', isPublic: false, groupName: 'facturation' },
    { cle: 'session_timeout_min', valeur: '30', description: 'Délai d\'inactivité avant déconnexion (min)', type: 'number', isPublic: false, groupName: 'securite' },
    { cle: 'default_stock_seuil', valeur: '10', description: 'Seuil d\'alerte stock faible par défaut', type: 'number', isPublic: false, groupName: 'entrepot' },
    { cle: 'max_upload_size_mb', valeur: '10', description: 'Taille maximale des fichiers téléversés (Mo)', type: 'number', isPublic: false, groupName: 'fichiers' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { cle: s.cle },
      create: s,
      update: {
        valeur: s.valeur,
        description: s.description,
        type: s.type,
        isPublic: s.isPublic,
        groupName: s.groupName,
      },
    });
  }

  // 8. Statuts et typologies dynamiques (status_configs)
  const defaultStatusConfigs = [
    // Dossier
    { entityType: 'dossier', value: 'EN_COURS', label: 'En cours', color: 'blue', orderIndex: 1 },
    { entityType: 'dossier', value: 'DEDOUANE', label: 'Dédouané', color: 'amber', orderIndex: 2 },
    { entityType: 'dossier', value: 'LIVRE', label: 'Livré', color: 'purple', orderIndex: 3 },
    { entityType: 'dossier', value: 'SOLDE', label: 'Soldé', color: 'green', orderIndex: 4 },
    // Facture
    { entityType: 'facture', value: 'BROUILLON', label: 'Brouillon', color: 'gray', orderIndex: 1 },
    { entityType: 'facture', value: 'ENVOYEE', label: 'Envoyée', color: 'blue', orderIndex: 2 },
    { entityType: 'facture', value: 'PARTIELLEMENT_PAYEE', label: 'Partielle', color: 'amber', orderIndex: 3 },
    { entityType: 'facture', value: 'PAYEE', label: 'Soldée', color: 'green', orderIndex: 4 },
    { entityType: 'facture', value: 'ANNULEE', label: 'Annulée', color: 'red', orderIndex: 5 },
    // Devis
    { entityType: 'devis', value: 'BROUILLON', label: 'Brouillon', color: 'gray', orderIndex: 1 },
    { entityType: 'devis', value: 'ENVOYE', label: 'Envoyé', color: 'blue', orderIndex: 2 },
    { entityType: 'devis', value: 'ACCEPTE', label: 'Accepté', color: 'green', orderIndex: 3 },
    { entityType: 'devis', value: 'REFUSE', label: 'Refusé', color: 'red', orderIndex: 4 },
    { entityType: 'devis', value: 'EXPIRE', label: 'Expiré', color: 'amber', orderIndex: 5 },
    // Client Type
    { entityType: 'client_type', value: 'ENTREPRISE', label: 'Entreprise', color: 'blue', orderIndex: 1 },
    { entityType: 'client_type', value: 'PARTICULIER', label: 'Particulier', color: 'emerald', orderIndex: 2 },
    // Mode de Paiement
    { entityType: 'paiement_mode', value: 'ESPECES', label: 'Espèces', color: 'emerald', orderIndex: 1 },
    { entityType: 'paiement_mode', value: 'VIREMENT', label: 'Virement', color: 'blue', orderIndex: 2 },
    { entityType: 'paiement_mode', value: 'MOBILE_MONEY', label: 'Mobile Money', color: 'amber', orderIndex: 3 },
    { entityType: 'paiement_mode', value: 'CHEQUE', label: 'Chèque', color: 'purple', orderIndex: 4 },
    // Fournisseur Type
    { entityType: 'fournisseur_type', value: 'TRANSPORTEUR', label: 'Transporteur', color: 'blue', orderIndex: 1 },
    { entityType: 'fournisseur_type', value: 'MANUTENTIONNAIRE', label: 'Manutentionnaire', color: 'amber', orderIndex: 2 },
    { entityType: 'fournisseur_type', value: 'COMMISSIONNAIRE', label: 'Commissionnaire en douane', color: 'emerald', orderIndex: 3 },
    { entityType: 'fournisseur_type', value: 'LOUEUR', label: 'Loueur', color: 'indigo', orderIndex: 4 },
    { entityType: 'fournisseur_type', value: 'AUTRE', label: 'Autre', color: 'slate', orderIndex: 5 },
    // Contrat Statut
    { entityType: 'contrat', value: 'ACTIF', label: 'Actif', color: 'green', orderIndex: 1 },
    { entityType: 'contrat', value: 'SUSPENDU', label: 'Suspendu', color: 'amber', orderIndex: 2 },
    { entityType: 'contrat', value: 'CLOTURE', label: 'Clôturé', color: 'gray', orderIndex: 3 },
    // Véhicule Type
    { entityType: 'vehicule_type', value: 'CAMION', label: 'Camion', color: 'blue', orderIndex: 1 },
    { entityType: 'vehicule_type', value: 'REMORQUE', label: 'Remorque', color: 'cyan', orderIndex: 2 },
    { entityType: 'vehicule_type', value: 'SEMI_REMORQUE', label: 'Semi-remorque', color: 'indigo', orderIndex: 3 },
    { entityType: 'vehicule_type', value: 'BENNE', label: 'Benne', color: 'amber', orderIndex: 4 },
    { entityType: 'vehicule_type', value: 'FOURGON', label: 'Fourgon', color: 'teal', orderIndex: 5 },
    // Document Type
    { entityType: 'document_type', value: 'BL', label: 'Connaissement (BL)', color: 'blue', orderIndex: 1 },
    { entityType: 'document_type', value: 'DAU', label: 'Déclaration (DAU)', color: 'purple', orderIndex: 2 },
    { entityType: 'document_type', value: 'FACTURE', label: 'Facture commerciale', color: 'emerald', orderIndex: 3 },
    { entityType: 'document_type', value: 'RECU', label: 'Quittance / Reçu', color: 'amber', orderIndex: 4 },
    { entityType: 'document_type', value: 'SYDONIA', label: 'Sydonia / ASYCUDA', color: 'rose', orderIndex: 5 },
    { entityType: 'document_type', value: 'CONTRAT', label: 'Contrat de transport', color: 'indigo', orderIndex: 6 },
    { entityType: 'document_type', value: 'AUTRE', label: 'Autre document', color: 'slate', orderIndex: 7 },
  ];

  for (const item of defaultStatusConfigs) {
    await prisma.statusConfig.upsert({
      where: {
        entityType_value: {
          entityType: item.entityType,
          value: item.value,
        },
      },
      create: item,
      update: item,
    });
  }

  console.log('✅ Paramètres et statuts dynamiques sauvegardés');
  console.log('✨ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
