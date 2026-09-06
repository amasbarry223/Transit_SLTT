import { PrismaClient, RoleUtilisateur, TypeClient, TypeDossier, StatutDossier, VoieTransport } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed Transit SLTT...');

  // 1. Annexes
  const annexeSiege = await prisma.annexe.upsert({
    where: { code: 'CKY-SIEGE' },
    update: {},
    create: {
      code: 'CKY-SIEGE',
      nom: 'Conakry - Siège Central',
      ville: 'Conakry',
      pays: 'Guinée',
      estSiege: true,
      telephone: '+224 620 00 00 01',
      email: 'conakry@transit-sltt.com',
    },
  });

  const annexeKamsar = await prisma.annexe.upsert({
    where: { code: 'KMR-PORT' },
    update: {},
    create: {
      code: 'KMR-PORT',
      nom: 'Kamsar - Agence Portuaire',
      ville: 'Kamsar',
      pays: 'Guinée',
      estSiege: false,
      telephone: '+224 620 00 00 02',
      email: 'kamsar@transit-sltt.com',
    },
  });

  console.log('✅ Annexes créées');

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
          { annexeId: annexeSiege.id },
          { annexeId: annexeKamsar.id },
        ],
      },
    },
  });

  const transitaire = await prisma.profile.upsert({
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
        create: [{ annexeId: annexeSiege.id }],
      },
    },
  });

  const comptable = await prisma.profile.upsert({
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
        create: [{ annexeId: annexeSiege.id }],
      },
    },
  });

  console.log('✅ Profils créés');

  // 3. Caisse
  const caissePrincipale = await prisma.caisse.upsert({
    where: { code: 'CAISSE-CKY-01' },
    update: {},
    create: {
      code: 'CAISSE-CKY-01',
      nom: 'Caisse Principale Siège',
      annexeId: annexeSiege.id,
      soldeActuel: 50000000,
      devise: 'GNF',
    },
  });

  console.log('✅ Caisse créée');

  // 4. Clients
  const client1 = await prisma.client.upsert({
    where: { code: 'CLI-001' },
    update: {},
    create: {
      code: 'CLI-001',
      nom: 'Société des Établissements Diallo',
      type: TypeClient.ENTREPRISE,
      telephone: '+224 621 11 22 33',
      email: 'contact@diallo-sa.com',
      adresse: 'Boulevard du Commerce, Conakry',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { code: 'CLI-002' },
    update: {},
    create: {
      code: 'CLI-002',
      nom: 'Traoré & Frères Import-Export',
      type: TypeClient.ENTREPRISE,
      telephone: '+224 622 33 44 55',
      email: 'traorefreres@gmail.com',
      adresse: 'Madina, Conakry',
    },
  });

  console.log('✅ Clients créés');

  // 5. Fournisseurs
  await prisma.fournisseur.upsert({
    where: { code: 'FOURN-001' },
    update: {},
    create: {
      code: 'FOURN-001',
      nom: 'Trans-Guinée Logistique',
      telephone: '+224 623 44 55 66',
      email: 'contact@transguinee.com',
      contact: 'Moussa Camara',
    },
  });

  console.log('✅ Fournisseurs créés');

  // 6. Dossiers de transit d'exemple
  await prisma.dossier.upsert({
    where: { numero: 'SLTT-TR-2026-0001' },
    update: {},
    create: {
      numero: 'SLTT-TR-2026-0001',
      annexeId: annexeSiege.id,
      clientId: client1.id,
      creeParId: transitaire.id,
      type: TypeDossier.IMPORT,
      statut: StatutDossier.EN_COURS,
      voieTransport: VoieTransport.MARITIME,
      marchandise: 'Matériel informatique et télécoms',
      numeroBl: 'BL-MAR-89210',
      navireVol: 'MSC ALTAIR',
      compagnie: 'MSC',
      portProvenance: 'Anvers (Belgique)',
      portDestination: 'Port Autonome de Conakry',
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
          statutAffiche: 'En navigation vers Conakry',
          dernierePosition: 'Océan Atlantique - Cap-Vert',
        },
      },
    },
  });

  // 7. Paramètres dynamiques (dashboard settings)
  const defaultSettings = [
    { cle: 'nom_societe', valeur: 'Transit SLTT SARL', description: 'Raison sociale' },
    { cle: 'devise_principale', valeur: 'GNF', description: 'Devise par défaut' },
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
