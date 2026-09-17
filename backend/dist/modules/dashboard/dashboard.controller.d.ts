import { DashboardService } from './dashboard.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class DashboardAnalyticsController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardAnalytics(user: CurrentUserType): Promise<{
        data: {
            kpis: ({
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                subtitle: string;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
                unit?: undefined;
                isFinancialDebours?: undefined;
            } | {
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                unit: string;
                subtitle: string;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
                isFinancialDebours?: undefined;
            } | {
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                unit: string;
                subtitle: string;
                isFinancialDebours: boolean;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
            })[];
            transitStats: {
                totalDossiersCount: number;
                statusDistribution: {
                    name: string;
                    key: any;
                    value: number;
                    percentage: number;
                    color: string;
                }[];
                period7Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
                period30Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
                period90Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
            };
            cashFlowStats: {
                soldeDisponible: number;
                deboursARecuperer: number;
                bonsEnAttente: number;
                variationMois: number;
                monthlyHistory: {
                    month: string;
                    monthShort: string;
                    entrees: number;
                    sorties: number;
                    soldeNet: number;
                }[];
            };
            invoiceStats: {
                summary: {
                    prestationsHT: number;
                    tvaCollectee: number;
                    deboursRefactures: number;
                    totalFactureTTC: number;
                    variationPrestations: number;
                };
                monthlyHistory: {
                    month: string;
                    prestationsHT: number;
                    tvaCollectee: number;
                    deboursRefactures: number;
                    totalFactureTTC: number;
                }[];
            };
            receivableStats: {
                totalARecouvrer: number;
                montantEchu: number;
                montantNonEchu: number;
                agingBalance: {
                    bracket: string;
                    label: string;
                    montant: number;
                    count: number;
                    color: string;
                }[];
                topRiskClients: {
                    id: string;
                    clientNom: string;
                    referenceDossierOuFacture: string;
                    montant: number;
                    echeance: string;
                    statut: "En retard" | "\u00C0 risque" | "Contentieux" | "En cours";
                    joursRetard: number;
                }[];
            };
            operationalAlerts: {
                id: string;
                severity: "critical" | "warning" | "info";
                badgeText: string;
                title: string;
                description: string;
                count: number;
                targetView: string;
            }[];
            recentOperations: {
                id: string;
                date: string;
                formattedDate: string;
                type: "Dossier" | "Facture" | "D\u00E9bours" | "Caisse" | "Stock";
                reference: string;
                clientOuTiers: string;
                montant?: number;
                statut: "En douane" | "Valid\u00E9" | "En cours" | "Partiellement pay\u00E9e" | "Pay\u00E9e" | "Livr\u00E9" | "En attente";
                statutColor: "blue" | "emerald" | "amber" | "purple" | "slate";
                targetView: string;
            }[];
        };
    }>;
}
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardStats(user: CurrentUserType): Promise<{
        data: {
            kpis: ({
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                subtitle: string;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
                unit?: undefined;
                isFinancialDebours?: undefined;
            } | {
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                unit: string;
                subtitle: string;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
                isFinancialDebours?: undefined;
            } | {
                id: string;
                label: string;
                rawNumericValue: number;
                formattedValue: string;
                unit: string;
                subtitle: string;
                isFinancialDebours: boolean;
                type: string;
                category: string;
                accentColor: string;
                targetView: string;
            })[];
            transitStats: {
                totalDossiersCount: number;
                statusDistribution: {
                    name: string;
                    key: any;
                    value: number;
                    percentage: number;
                    color: string;
                }[];
                period7Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
                period30Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
                period90Days: {
                    date: string;
                    displayDate: string;
                    maritime: number;
                    terrestre: number;
                    aerien: number;
                    total: number;
                }[];
            };
            cashFlowStats: {
                soldeDisponible: number;
                deboursARecuperer: number;
                bonsEnAttente: number;
                variationMois: number;
                monthlyHistory: {
                    month: string;
                    monthShort: string;
                    entrees: number;
                    sorties: number;
                    soldeNet: number;
                }[];
            };
            invoiceStats: {
                summary: {
                    prestationsHT: number;
                    tvaCollectee: number;
                    deboursRefactures: number;
                    totalFactureTTC: number;
                    variationPrestations: number;
                };
                monthlyHistory: {
                    month: string;
                    prestationsHT: number;
                    tvaCollectee: number;
                    deboursRefactures: number;
                    totalFactureTTC: number;
                }[];
            };
            receivableStats: {
                totalARecouvrer: number;
                montantEchu: number;
                montantNonEchu: number;
                agingBalance: {
                    bracket: string;
                    label: string;
                    montant: number;
                    count: number;
                    color: string;
                }[];
                topRiskClients: {
                    id: string;
                    clientNom: string;
                    referenceDossierOuFacture: string;
                    montant: number;
                    echeance: string;
                    statut: "En retard" | "\u00C0 risque" | "Contentieux" | "En cours";
                    joursRetard: number;
                }[];
            };
            operationalAlerts: {
                id: string;
                severity: "critical" | "warning" | "info";
                badgeText: string;
                title: string;
                description: string;
                count: number;
                targetView: string;
            }[];
            recentOperations: {
                id: string;
                date: string;
                formattedDate: string;
                type: "Dossier" | "Facture" | "D\u00E9bours" | "Caisse" | "Stock";
                reference: string;
                clientOuTiers: string;
                montant?: number;
                statut: "En douane" | "Valid\u00E9" | "En cours" | "Partiellement pay\u00E9e" | "Pay\u00E9e" | "Livr\u00E9" | "En attente";
                statutColor: "blue" | "emerald" | "amber" | "purple" | "slate";
                targetView: string;
            }[];
        };
    }>;
}
