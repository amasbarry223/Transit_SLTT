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
    const report: Record<string, number> = {};

    // Suppression dans l'ordre des contraintes d'intégrité
    report['lignes_facture'] = (await this.prisma.ligneFacture.deleteMany()).count;
    report['factures'] = (await this.prisma.facture.deleteMany()).count;
    report['lignes_devis'] = (await this.prisma.ligneDevis.deleteMany()).count;
    report['devis'] = (await this.prisma.devis.deleteMany()).count;
    report['lignes_cotation'] = (await this.prisma.ligneCotation.deleteMany()).count;
    report['cotations'] = (await this.prisma.cotation.deleteMany()).count;
    report['transactions_caisse'] = (await this.prisma.transactionCaisse.deleteMany()).count;
    report['caisses'] = (await this.prisma.caisse.deleteMany()).count;
    report['depenses'] = (await this.prisma.depense.deleteMany()).count;
    report['documents'] = (await this.prisma.document.deleteMany()).count;
    report['etapes_dossier'] = (await this.prisma.etapeDossier.deleteMany()).count;
    report['conteneurs'] = (await this.prisma.conteneur.deleteMany()).count;
    report['tracking_public'] = (await this.prisma.trackingPublic.deleteMany()).count;
    report['dossiers'] = (await this.prisma.dossier.deleteMany()).count;
    report['fournisseurs'] = (await this.prisma.fournisseur.deleteMany()).count;
    report['clients'] = (await this.prisma.client.deleteMany()).count;

    return report;
  }

  async restoreData(payload: Record<string, unknown[]>) {
    const restored: Record<string, number> = {};
    const missingTables: string[] = [];

    for (const table of BUSINESS_TABLES) {
      if (!payload[table]) {
        missingTables.push(table);
      }
    }

    // Réinsertion des données dans l'ordre hiérarchique
    if (payload.clients?.length) {
      const res = await this.prisma.client.createMany({ data: payload.clients as any, skipDuplicates: true });
      restored['clients'] = res.count;
    }
    if (payload.fournisseurs?.length) {
      const res = await this.prisma.fournisseur.createMany({ data: payload.fournisseurs as any, skipDuplicates: true });
      restored['fournisseurs'] = res.count;
    }
    if (payload.dossiers?.length) {
      const res = await this.prisma.dossier.createMany({ data: payload.dossiers as any, skipDuplicates: true });
      restored['dossiers'] = res.count;
    }
    if (payload.conteneurs?.length) {
      const res = await this.prisma.conteneur.createMany({ data: payload.conteneurs as any, skipDuplicates: true });
      restored['conteneurs'] = res.count;
    }
    if (payload.etapes_dossier?.length) {
      const res = await this.prisma.etapeDossier.createMany({ data: payload.etapes_dossier as any, skipDuplicates: true });
      restored['etapes_dossier'] = res.count;
    }
    if (payload.devis?.length) {
      const res = await this.prisma.devis.createMany({ data: payload.devis as any, skipDuplicates: true });
      restored['devis'] = res.count;
    }
    if (payload.factures?.length) {
      const res = await this.prisma.facture.createMany({ data: payload.factures as any, skipDuplicates: true });
      restored['factures'] = res.count;
    }

    return { restored, missingTables };
  }
}
