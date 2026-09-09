import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const BUSINESS_TABLES = [
  'lignes_facture',
  'factures',
  'lignes_devis',
  'devis',
  'lignes_cotation',
  'cotations',
  'transactions_caisse',
  'caisses',
  'depenses',
  'etapes_dossier',
  'conteneurs',
  'documents',
  'tracking_public',
  'dossiers',
  'fournisseurs',
  'clients',
];

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  async listTables(): Promise<string[]> {
    return [...BUSINESS_TABLES];
  }

  async exportData() {
    const [
      clients,
      fournisseurs,
      dossiers,
      conteneurs,
      etapes,
      tracking,
      devis,
      lignesDevis,
      cotations,
      lignesCotation,
      factures,
      lignesFacture,
      caisses,
      transactions,
      depenses,
      documents,
    ] = await Promise.all([
      this.prisma.client.findMany(),
      this.prisma.fournisseur.findMany(),
      this.prisma.dossier.findMany(),
      this.prisma.conteneur.findMany(),
      this.prisma.etapeDossier.findMany(),
      this.prisma.trackingPublic.findMany(),
      this.prisma.devis.findMany(),
      this.prisma.ligneDevis.findMany(),
      this.prisma.cotation.findMany(),
      this.prisma.ligneCotation.findMany(),
      this.prisma.facture.findMany(),
      this.prisma.ligneFacture.findMany(),
      this.prisma.caisse.findMany(),
      this.prisma.transactionCaisse.findMany(),
      this.prisma.depense.findMany(),
      this.prisma.document.findMany(),
    ]);

    const data: Record<string, unknown[]> = {
      clients,
      fournisseurs,
      dossiers,
      conteneurs,
      etapes_dossier: etapes,
      tracking_public: tracking,
      devis,
      lignes_devis: lignesDevis,
      cotations,
      lignes_cotation: lignesCotation,
      factures,
      lignes_facture: lignesFacture,
      caisses,
      transactions_caisse: transactions,
      depenses,
      documents,
    };

    return {
      meta: {
        exportedAt: new Date().toISOString(),
        tables: Object.keys(data),
      },
      data,
    };
  }

  async wipeData(): Promise<Record<string, number>> {
    // Tout ou rien : un wipe interrompu à mi-course laisserait la base
    // dans un état incohérent (enfants sans parents, FK orphelines).
    return this.prisma.$transaction(async (tx: any) => {
      const report: Record<string, number> = {};
      // Ordre imposé par les contraintes d'intégrité : transactions AVANT
      // factures/caisses/dépenses (FK sans cascade).
      report['transactions_caisse'] = (await tx.transactionCaisse.deleteMany()).count;
      report['lignes_facture'] = (await tx.ligneFacture.deleteMany()).count;
      report['factures'] = (await tx.facture.deleteMany()).count;
      report['lignes_devis'] = (await tx.ligneDevis.deleteMany()).count;
      report['devis'] = (await tx.devis.deleteMany()).count;
      report['lignes_cotation'] = (await tx.ligneCotation.deleteMany()).count;
      report['cotations'] = (await tx.cotation.deleteMany()).count;
      report['caisses'] = (await tx.caisse.deleteMany()).count;
      report['depenses'] = (await tx.depense.deleteMany()).count;
      report['documents'] = (await tx.document.deleteMany()).count;
      report['etapes_dossier'] = (await tx.etapeDossier.deleteMany()).count;
      report['conteneurs'] = (await tx.conteneur.deleteMany()).count;
      report['tracking_public'] = (await tx.trackingPublic.deleteMany()).count;
      report['dossiers'] = (await tx.dossier.deleteMany()).count;
      report['fournisseurs'] = (await tx.fournisseur.deleteMany()).count;
      report['clients'] = (await tx.client.deleteMany()).count;
      return report;
    });
  }

  async restoreData(payload: Record<string, unknown[]>) {
    const restored: Record<string, number> = {};
    const missingTables: string[] = [];

    for (const table of BUSINESS_TABLES) {
      if (!payload[table]) {
        missingTables.push(table);
      }
    }

    // Réinsertion dans l'ordre hiérarchique. Symétrique de exportData() :
    // toutes les tables exportées sont restaurées (sinon perte silencieuse).
    const steps: Array<[string, () => Promise<{ count: number }>]> = [
      ['clients', () => this.prisma.client.createMany({ data: payload.clients as any, skipDuplicates: true })],
      ['fournisseurs', () => this.prisma.fournisseur.createMany({ data: payload.fournisseurs as any, skipDuplicates: true })],
      ['dossiers', () => this.prisma.dossier.createMany({ data: payload.dossiers as any, skipDuplicates: true })],
      ['conteneurs', () => this.prisma.conteneur.createMany({ data: payload.conteneurs as any, skipDuplicates: true })],
      ['etapes_dossier', () => this.prisma.etapeDossier.createMany({ data: payload.etapes_dossier as any, skipDuplicates: true })],
      ['tracking_public', () => this.prisma.trackingPublic.createMany({ data: payload.tracking_public as any, skipDuplicates: true })],
      ['devis', () => this.prisma.devis.createMany({ data: payload.devis as any, skipDuplicates: true })],
      ['lignes_devis', () => this.prisma.ligneDevis.createMany({ data: payload.lignes_devis as any, skipDuplicates: true })],
      ['cotations', () => this.prisma.cotation.createMany({ data: payload.cotations as any, skipDuplicates: true })],
      ['lignes_cotation', () => this.prisma.ligneCotation.createMany({ data: payload.lignes_cotation as any, skipDuplicates: true })],
      ['factures', () => this.prisma.facture.createMany({ data: payload.factures as any, skipDuplicates: true })],
      ['lignes_facture', () => this.prisma.ligneFacture.createMany({ data: payload.lignes_facture as any, skipDuplicates: true })],
      ['caisses', () => this.prisma.caisse.createMany({ data: payload.caisses as any, skipDuplicates: true })],
      ['transactions_caisse', () => this.prisma.transactionCaisse.createMany({ data: payload.transactions_caisse as any, skipDuplicates: true })],
      ['depenses', () => this.prisma.depense.createMany({ data: payload.depenses as any, skipDuplicates: true })],
      ['documents', () => this.prisma.document.createMany({ data: payload.documents as any, skipDuplicates: true })],
    ];

    for (const [table, run] of steps) {
      if (Array.isArray(payload[table]) && payload[table].length) {
        restored[table] = (await run()).count;
      }
    }

    return { restored, missingTables };
  }
}
