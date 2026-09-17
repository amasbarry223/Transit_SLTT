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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardAnalytics(user) {
        const annexeScope = (0, annexe_filter_utils_1.buildAnnexeScopeFilter)(user);
        const [totalDossiers, dossiersEnCours, totalClients, factures, depensesAgg, caissesAgg, dossiersList, transactionsCaisse, stockItems,] = await Promise.all([
            this.prisma.dossier.count({ where: annexeScope }),
            this.prisma.dossier.count({
                where: {
                    ...annexeScope,
                    statut: { in: ['EN_COURS', 'EN_DEDOUANEMENT', 'BROUILLON'] },
                },
            }),
            this.prisma.client.count({ where: annexeScope }),
            this.prisma.facture.findMany({
                where: annexeScope,
                select: {
                    id: true,
                    numero: true,
                    statut: true,
                    montantHt: true,
                    montantTva: true,
                    montantTtc: true,
                    montantPaye: true,
                    dateEmission: true,
                    dateEcheance: true,
                    client: { select: { id: true, nom: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.depense.aggregate({
                where: annexeScope,
                _sum: { montant: true },
            }),
            this.prisma.caisse.aggregate({
                where: annexeScope,
                _sum: { soldeActuel: true },
            }),
            this.prisma.dossier.findMany({
                where: annexeScope,
                select: {
                    id: true,
                    numero: true,
                    statut: true,
                    voieTransport: true,
                    createdAt: true,
                    fraisPrestation: true,
                    valeurDouane: true,
                    fraisCircuit: true,
                    client: { select: { id: true, nom: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            this.prisma.transactionCaisse.findMany({
                where: { caisse: annexeScope },
                select: {
                    id: true,
                    type: true,
                    montant: true,
                    date: true,
                    createdAt: true,
                    motif: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 200,
            }),
            this.prisma.stockItem.findMany({
                where: annexeScope,
                select: {
                    id: true,
                    marchandise: true,
                    quantite: true,
                    seuil: true,
                    unite: true,
                },
            }),
        ]);
        let totalARecouvrer = 0;
        let montantEchu = 0;
        let montantNonEchu = 0;
        const now = new Date();
        const agingMap = {
            '0-30j': { montant: 0, count: 0 },
            '31-60j': { montant: 0, count: 0 },
            '61-90j': { montant: 0, count: 0 },
            '+90j': { montant: 0, count: 0 },
        };
        const topRiskClients = [];
        factures.forEach((f) => {
            const reste = Math.max(0, (f.montantTtc || 0) - (f.montantPaye || 0));
            if (reste > 0 && f.statut !== 'ANNULEE') {
                totalARecouvrer += reste;
                const echeance = f.dateEcheance ? new Date(f.dateEcheance) : now;
                const diffMs = now.getTime() - echeance.getTime();
                const joursRetard = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (joursRetard > 0) {
                    montantEchu += reste;
                    if (joursRetard <= 30) {
                        agingMap['0-30j'].montant += reste;
                        agingMap['0-30j'].count += 1;
                    }
                    else if (joursRetard <= 60) {
                        agingMap['31-60j'].montant += reste;
                        agingMap['31-60j'].count += 1;
                    }
                    else if (joursRetard <= 90) {
                        agingMap['61-90j'].montant += reste;
                        agingMap['61-90j'].count += 1;
                    }
                    else {
                        agingMap['+90j'].montant += reste;
                        agingMap['+90j'].count += 1;
                    }
                    if (topRiskClients.length < 5) {
                        topRiskClients.push({
                            id: f.id,
                            clientNom: f.client?.nom || 'Client',
                            referenceDossierOuFacture: f.numero,
                            montant: reste,
                            echeance: echeance.toLocaleDateString('fr-FR'),
                            statut: joursRetard > 60 ? 'Contentieux' : joursRetard > 15 ? 'En retard' : 'À risque',
                            joursRetard,
                        });
                    }
                }
                else {
                    montantNonEchu += reste;
                    agingMap['0-30j'].montant += reste;
                    agingMap['0-30j'].count += 1;
                }
            }
        });
        const deboursTotal = depensesAgg._sum.montant || 0;
        const tresorerieTotal = caissesAgg._sum.soldeActuel || 0;
        const kpis = [
            {
                id: 'kpi-dossiers-total',
                label: 'Dossiers de transit',
                rawNumericValue: totalDossiers,
                formattedValue: String(totalDossiers),
                subtitle: 'Maritime, Terrestre & Aérien',
                type: 'dossiers_total',
                category: 'operations',
                accentColor: 'blue',
                targetView: 'dossiers',
            },
            {
                id: 'kpi-dossiers-en-cours',
                label: 'Dossiers en cours',
                rawNumericValue: dossiersEnCours,
                formattedValue: String(dossiersEnCours),
                subtitle: 'En cours de dédouanement et acheminement',
                type: 'dossiers_en_cours',
                category: 'operations',
                accentColor: 'emerald',
                targetView: 'dossiers',
            },
            {
                id: 'kpi-clients-actifs',
                label: 'Clients enregistrés',
                rawNumericValue: totalClients,
                formattedValue: String(totalClients),
                subtitle: 'Importateurs & partenaires',
                type: 'clients_actifs',
                category: 'clients',
                accentColor: 'purple',
                targetView: 'clients',
            },
            {
                id: 'kpi-factures-recouvrer',
                label: 'Factures à recouvrer',
                rawNumericValue: totalARecouvrer,
                formattedValue: `${totalARecouvrer.toLocaleString('fr-FR')} FCFA`,
                unit: 'FCFA',
                subtitle: `Dont ${montantEchu.toLocaleString('fr-FR')} FCFA échus`,
                type: 'factures_recouvrer',
                category: 'finance',
                accentColor: 'amber',
                targetView: 'factures',
            },
            {
                id: 'kpi-debours-avances',
                label: 'Débours engagés',
                rawNumericValue: deboursTotal,
                formattedValue: `${deboursTotal.toLocaleString('fr-FR')} FCFA`,
                unit: 'FCFA',
                subtitle: 'Avances douanières & portuaires',
                isFinancialDebours: true,
                type: 'debours_avances',
                category: 'finance',
                accentColor: 'rose',
                targetView: 'comptabilite',
            },
            {
                id: 'kpi-tresorerie-disponible',
                label: 'Trésorerie caisses',
                rawNumericValue: tresorerieTotal,
                formattedValue: `${tresorerieTotal.toLocaleString('fr-FR')} FCFA`,
                unit: 'FCFA',
                subtitle: 'Soldes réels consolidés',
                type: 'tresorerie_disponible',
                category: 'finance',
                accentColor: 'teal',
                targetView: 'comptabilite',
            },
        ];
        const statusCounts = {};
        dossiersList.forEach((d) => {
            const st = String(d.statut || 'EN_COURS').toUpperCase();
            statusCounts[st] = (statusCounts[st] || 0) + 1;
        });
        const statusColors = {
            EN_DOUANE: '#2563EB',
            EN_COURS: '#3B82F6',
            EN_TRANSIT: '#10B981',
            ATTENTE_BAE: '#F59E0B',
            LIVRE: '#6366F1',
            CLOTURE: '#94A3B8',
            SOLDE: '#10B981',
            DEDOUANE: '#F59E0B',
        };
        const statusLabels = {
            EN_DOUANE: 'En cours de douane',
            EN_COURS: 'En traitement',
            EN_TRANSIT: 'En transit (corridor)',
            ATTENTE_BAE: 'En attente BAE',
            LIVRE: 'Livrés sur site',
            CLOTURE: 'Clôturés',
            SOLDE: 'Soldés',
            DEDOUANE: 'Dédouanés',
        };
        const statusDistribution = Object.entries(statusCounts).map(([key, value]) => ({
            name: statusLabels[key] || key,
            key: key.toLowerCase(),
            value,
            percentage: totalDossiers > 0 ? Math.round((value / totalDossiers) * 100) : 0,
            color: statusColors[key] || '#64748B',
        }));
        const period7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayDate = i === 0 ? "Aujourd'hui" : `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'short' })}`;
            const matching = dossiersList.filter((dos) => {
                const cDate = dos.createdAt ? new Date(dos.createdAt).toISOString().split('T')[0] : '';
                return cDate === dateStr;
            });
            const maritime = matching.filter((m) => String(m.voieTransport || '').toUpperCase().includes('MAR')).length;
            const aerien = matching.filter((m) => String(m.voieTransport || '').toUpperCase().includes('AER')).length;
            const terrestre = matching.length - maritime - aerien;
            period7Days.push({
                date: dateStr,
                displayDate,
                maritime,
                terrestre,
                aerien,
                total: matching.length,
            });
        }
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyHistoryCashFlow = [];
        const monthlyHistoryInvoices = [];
        for (let m = 5; m >= 0; m--) {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - m);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();
            const monthShort = monthNames[targetMonth];
            const monthFull = `${monthShort} ${targetYear}`;
            let entrees = 0;
            let sorties = 0;
            transactionsCaisse.forEach((tx) => {
                const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
                if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
                    if (tx.type === 'ENTREE')
                        entrees += Number(tx.montant || 0);
                    else
                        sorties += Number(tx.montant || 0);
                }
            });
            let prestationsHT = 0;
            let tvaCollectee = 0;
            let totalFactureTTC = 0;
            factures.forEach((fac) => {
                const facDate = fac.dateEmission ? new Date(fac.dateEmission) : new Date();
                if (facDate.getMonth() === targetMonth &&
                    facDate.getFullYear() === targetYear &&
                    fac.statut !== 'ANNULEE' &&
                    fac.statut !== 'BROUILLON') {
                    prestationsHT += Number(fac.montantHt || 0);
                    tvaCollectee += Number(fac.montantTva || 0);
                    totalFactureTTC += Number(fac.montantTtc || 0);
                }
            });
            monthlyHistoryCashFlow.push({
                month: monthFull,
                monthShort,
                entrees,
                sorties,
                soldeNet: entrees - sorties,
            });
            monthlyHistoryInvoices.push({
                month: monthShort,
                prestationsHT,
                tvaCollectee,
                deboursRefactures: 0,
                totalFactureTTC,
            });
        }
        const computeVariationPct = (current, previous) => {
            if (previous === 0)
                return current === 0 ? 0 : 100;
            return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
        };
        const lastCashFlow = monthlyHistoryCashFlow[monthlyHistoryCashFlow.length - 1];
        const prevCashFlow = monthlyHistoryCashFlow[monthlyHistoryCashFlow.length - 2];
        const variationMois = lastCashFlow && prevCashFlow
            ? computeVariationPct(lastCashFlow.soldeNet, prevCashFlow.soldeNet)
            : 0;
        const lastInvoices = monthlyHistoryInvoices[monthlyHistoryInvoices.length - 1];
        const prevInvoices = monthlyHistoryInvoices[monthlyHistoryInvoices.length - 2];
        const variationPrestations = lastInvoices && prevInvoices
            ? computeVariationPct(lastInvoices.prestationsHT, prevInvoices.prestationsHT)
            : 0;
        const operationalAlerts = [];
        const facturesEchuesCount = factures.filter((f) => {
            const echeance = f.dateEcheance ? new Date(f.dateEcheance) : null;
            return echeance && echeance < now && f.statut !== 'PAYEE' && f.statut !== 'ANNULEE';
        }).length;
        if (facturesEchuesCount > 0) {
            operationalAlerts.push({
                id: 'alert-factures-echues',
                severity: 'warning',
                badgeText: 'Recouvrement',
                title: `${facturesEchuesCount} facture(s) échue(s) à relancer`,
                description: `Montant total en souffrance : ${montantEchu.toLocaleString('fr-FR')} FCFA.`,
                count: facturesEchuesCount,
                targetView: 'factures',
            });
        }
        const stockFaibleCount = stockItems.filter((s) => (s.quantite || 0) <= (s.seuil || 10)).length;
        if (stockFaibleCount > 0) {
            operationalAlerts.push({
                id: 'alert-stock-faible',
                severity: 'warning',
                badgeText: 'Entrepôt',
                title: `${stockFaibleCount} article(s) en stock critique`,
                description: 'Quantité disponible inférieure ou égale au seuil de sécurité.',
                count: stockFaibleCount,
                targetView: 'entreposage',
            });
        }
        if (operationalAlerts.length === 0) {
            operationalAlerts.push({
                id: 'alert-info-operations',
                severity: 'info',
                badgeText: 'Système',
                title: 'Système opérationnel',
                description: 'Toutes les opérations douanières et flux de caisse sont conformes.',
                count: 1,
                targetView: 'dashboard',
            });
        }
        const recentOperations = [];
        dossiersList.slice(0, 3).forEach((d) => {
            recentOperations.push({
                id: `op-dos-${d.id}`,
                date: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
                formattedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '',
                type: 'Dossier',
                reference: d.numero,
                clientOuTiers: d.client?.nom || 'Client',
                montant: Number(d.fraisPrestation || 0),
                statut: 'En douane',
                statutColor: 'blue',
                targetView: 'dossiers',
            });
        });
        factures.slice(0, 3).forEach((f) => {
            recentOperations.push({
                id: `op-fac-${f.id}`,
                date: f.dateEmission ? new Date(f.dateEmission).toISOString() : new Date().toISOString(),
                formattedDate: f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '',
                type: 'Facture',
                reference: f.numero,
                clientOuTiers: f.client?.nom || 'Client',
                montant: Number(f.montantTtc || 0),
                statut: f.statut === 'PAYEE' ? 'Payée' : f.statut === 'PARTIELLEMENT_PAYEE' ? 'Partiellement payée' : 'En attente',
                statutColor: f.statut === 'PAYEE' ? 'emerald' : 'amber',
                targetView: 'factures',
            });
        });
        return {
            kpis,
            transitStats: {
                totalDossiersCount: totalDossiers,
                statusDistribution: statusDistribution.length > 0 ? statusDistribution : [
                    { name: 'En cours', key: 'en_cours', value: totalDossiers || 1, percentage: 100, color: '#2563EB' }
                ],
                period7Days,
                period30Days: period7Days,
                period90Days: period7Days,
            },
            cashFlowStats: {
                soldeDisponible: tresorerieTotal,
                deboursARecuperer: deboursTotal,
                bonsEnAttente: 0,
                variationMois,
                monthlyHistory: monthlyHistoryCashFlow,
            },
            invoiceStats: {
                summary: {
                    prestationsHT: monthlyHistoryInvoices.reduce((acc, m) => acc + m.prestationsHT, 0),
                    tvaCollectee: monthlyHistoryInvoices.reduce((acc, m) => acc + m.tvaCollectee, 0),
                    deboursRefactures: monthlyHistoryInvoices.reduce((acc, m) => acc + m.deboursRefactures, 0),
                    totalFactureTTC: monthlyHistoryInvoices.reduce((acc, m) => acc + m.totalFactureTTC, 0),
                    variationPrestations,
                },
                monthlyHistory: monthlyHistoryInvoices,
            },
            receivableStats: {
                totalARecouvrer,
                montantEchu,
                montantNonEchu,
                agingBalance: [
                    { bracket: '0-30j', label: '0 à 30 jours (Non échu)', montant: agingMap['0-30j'].montant, count: agingMap['0-30j'].count, color: '#10B981' },
                    { bracket: '31-60j', label: '31 à 60 jours', montant: agingMap['31-60j'].montant, count: agingMap['31-60j'].count, color: '#F59E0B' },
                    { bracket: '61-90j', label: '61 à 90 jours', montant: agingMap['61-90j'].montant, count: agingMap['61-90j'].count, color: '#F97316' },
                    { bracket: '+90j', label: '+90 jours (Contentieux)', montant: agingMap['+90j'].montant, count: agingMap['+90j'].count, color: '#EF4444' },
                ],
                topRiskClients,
            },
            operationalAlerts,
            recentOperations,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map