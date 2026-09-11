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

  // 7. Paramètres dynamiques (dashboard settings)
  const defaultSettings = [
    { cle: 'nom_societe', valeur: 'Transit SLTT', description: 'Raison sociale' },
    { cle: 'devise_principale', valeur: 'FCFA', description: 'Devise par défaut' },
    { cle: 'taux_tva_defaut', valeur: '18', description: 'Taux TVA standard (%)' },
    { cle: 'delai_echeance_jours', valeur: '30', description: 'Délai de paiement factures' },
    { cle: 'email_contact', valeur: 'contact@transit-sltt.com', description: 'Email support' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { cle: s.cle },
      create: s,
      update: { valeur: s.valeur },
    });
  }

  console.log('✅ Paramètres sauvegardés');
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
