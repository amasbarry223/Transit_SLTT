"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
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
    'lignes_bon_sortie_caisse',
    'bons_sortie_caisse',
    'bons_sortie',
    'mouvements_stock',
    'stock_items',
    'contrats',
    'recus_paiement',
    'operations_comptables',
    'clotures_caisse',
    'fournisseurs',
    'clients',
];
let BackupService = class BackupService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTables() {
        return [...BUSINESS_TABLES];
    }
    async exportData() {
        const [clients, fournisseurs, dossiers, conteneurs, etapes, tracking, devis, lignesDevis, cotations, lignesCotation, factures, lignesFacture, caisses, transactions, depenses, documents, bonsSortie, bonsSortieCaisse, lignesBonSortieCaisse, stockItems, mouvementsStock, contrats, recusPaiement, operationsComptables, cloturesCaisse,] = await Promise.all([
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
            this.prisma.bonSortie.findMany(),
            this.prisma.bonSortieCaisse.findMany(),
            this.prisma.ligneBonSortieCaisse.findMany(),
            this.prisma.stockItem.findMany(),
            this.prisma.mouvementStock.findMany(),
            this.prisma.contrat.findMany(),
            this.prisma.recuPaiement.findMany(),
            this.prisma.operationComptable.findMany(),
            this.prisma.clotureCaisse.findMany(),
        ]);
        const data = {
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
            bons_sortie: bonsSortie,
            bons_sortie_caisse: bonsSortieCaisse,
            lignes_bon_sortie_caisse: lignesBonSortieCaisse,
            stock_items: stockItems,
            mouvements_stock: mouvementsStock,
            contrats,
            recus_paiement: recusPaiement,
            operations_comptables: operationsComptables,
            clotures_caisse: cloturesCaisse,
        };
        return {
            meta: {
                exportedAt: new Date().toISOString(),
                tables: Object.keys(data),
            },
            data,
        };
    }
    async wipeData() {
        return this.prisma.$transaction(async (tx) => {
            const report = {};
            report['transactions_caisse'] = (await tx.transactionCaisse.deleteMany()).count;
            report['lignes_facture'] = (await tx.ligneFacture.deleteMany()).count;
            report['factures'] = (await tx.facture.deleteMany()).count;
            report['lignes_devis'] = (await tx.ligneDevis.deleteMany()).count;
            report['devis'] = (await tx.devis.deleteMany()).count;
            report['lignes_cotation'] = (await tx.ligneCotation.deleteMany()).count;
            report['cotations'] = (await tx.cotation.deleteMany()).count;
            report['lignes_bon_sortie_caisse'] = (await tx.ligneBonSortieCaisse.deleteMany()).count;
            report['bons_sortie_caisse'] = (await tx.bonSortieCaisse.deleteMany()).count;
            report['bons_sortie'] = (await tx.bonSortie.deleteMany()).count;
            report['mouvements_stock'] = (await tx.mouvementStock.deleteMany()).count;
            report['stock_items'] = (await tx.stockItem.deleteMany()).count;
            report['contrats'] = (await tx.contrat.deleteMany()).count;
            report['caisses'] = (await tx.caisse.deleteMany()).count;
            report['depenses'] = (await tx.depense.deleteMany()).count;
            report['documents'] = (await tx.document.deleteMany()).count;
            report['etapes_dossier'] = (await tx.etapeDossier.deleteMany()).count;
            report['conteneurs'] = (await tx.conteneur.deleteMany()).count;
            report['tracking_public'] = (await tx.trackingPublic.deleteMany()).count;
            report['dossiers'] = (await tx.dossier.deleteMany()).count;
            report['recus_paiement'] = (await tx.recuPaiement.deleteMany()).count;
            report['operations_comptables'] = (await tx.operationComptable.deleteMany()).count;
            report['clotures_caisse'] = (await tx.clotureCaisse.deleteMany()).count;
            report['fournisseurs'] = (await tx.fournisseur.deleteMany()).count;
            report['clients'] = (await tx.client.deleteMany()).count;
            return report;
        });
    }
    async restoreData(payload) {
        const restored = {};
        const missingTables = [];
        for (const table of BUSINESS_TABLES) {
            if (!payload[table]) {
                missingTables.push(table);
            }
        }
        const steps = [
            ['clients', () => this.prisma.client.createMany({ data: payload.clients, skipDuplicates: true })],
            ['fournisseurs', () => this.prisma.fournisseur.createMany({ data: payload.fournisseurs, skipDuplicates: true })],
            ['dossiers', () => this.prisma.dossier.createMany({ data: payload.dossiers, skipDuplicates: true })],
            ['conteneurs', () => this.prisma.conteneur.createMany({ data: payload.conteneurs, skipDuplicates: true })],
            ['etapes_dossier', () => this.prisma.etapeDossier.createMany({ data: payload.etapes_dossier, skipDuplicates: true })],
            ['tracking_public', () => this.prisma.trackingPublic.createMany({ data: payload.tracking_public, skipDuplicates: true })],
            ['devis', () => this.prisma.devis.createMany({ data: payload.devis, skipDuplicates: true })],
            ['lignes_devis', () => this.prisma.ligneDevis.createMany({ data: payload.lignes_devis, skipDuplicates: true })],
            ['cotations', () => this.prisma.cotation.createMany({ data: payload.cotations, skipDuplicates: true })],
            ['lignes_cotation', () => this.prisma.ligneCotation.createMany({ data: payload.lignes_cotation, skipDuplicates: true })],
            ['factures', () => this.prisma.facture.createMany({ data: payload.factures, skipDuplicates: true })],
            ['lignes_facture', () => this.prisma.ligneFacture.createMany({ data: payload.lignes_facture, skipDuplicates: true })],
            ['caisses', () => this.prisma.caisse.createMany({ data: payload.caisses, skipDuplicates: true })],
            ['depenses', () => this.prisma.depense.createMany({ data: payload.depenses, skipDuplicates: true })],
            ['transactions_caisse', () => this.prisma.transactionCaisse.createMany({ data: payload.transactions_caisse, skipDuplicates: true })],
            ['documents', () => this.prisma.document.createMany({ data: payload.documents, skipDuplicates: true })],
            ['stock_items', () => this.prisma.stockItem.createMany({ data: payload.stock_items, skipDuplicates: true })],
            ['mouvements_stock', () => this.prisma.mouvementStock.createMany({ data: payload.mouvements_stock, skipDuplicates: true })],
            ['bons_sortie', () => this.prisma.bonSortie.createMany({ data: payload.bons_sortie, skipDuplicates: true })],
            ['bons_sortie_caisse', () => this.prisma.bonSortieCaisse.createMany({ data: payload.bons_sortie_caisse, skipDuplicates: true })],
            ['lignes_bon_sortie_caisse', () => this.prisma.ligneBonSortieCaisse.createMany({ data: payload.lignes_bon_sortie_caisse, skipDuplicates: true })],
            ['contrats', () => this.prisma.contrat.createMany({ data: payload.contrats, skipDuplicates: true })],
            ['recus_paiement', () => this.prisma.recuPaiement.createMany({ data: payload.recus_paiement, skipDuplicates: true })],
            ['operations_comptables', () => this.prisma.operationComptable.createMany({ data: payload.operations_comptables, skipDuplicates: true })],
            ['clotures_caisse', () => this.prisma.clotureCaisse.createMany({ data: payload.clotures_caisse, skipDuplicates: true })],
        ];
        for (const [table, run] of steps) {
            if (Array.isArray(payload[table]) && payload[table].length) {
                restored[table] = (await run()).count;
            }
        }
        return { restored, missingTables };
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BackupService);
//# sourceMappingURL=backup.service.js.map