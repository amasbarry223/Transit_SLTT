"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("./auth/guards/permissions.guard");
const csrf_guard_1 = require("./auth/guards/csrf.guard");
const annexes_module_1 = require("./modules/annexes/annexes.module");
const clients_module_1 = require("./modules/clients/clients.module");
const dossiers_module_1 = require("./modules/dossiers/dossiers.module");
const factures_module_1 = require("./modules/factures/factures.module");
const fournisseurs_module_1 = require("./modules/fournisseurs/fournisseurs.module");
const depenses_module_1 = require("./modules/depenses/depenses.module");
const caisse_module_1 = require("./modules/caisse/caisse.module");
const documents_module_1 = require("./modules/documents/documents.module");
const tracking_module_1 = require("./modules/tracking/tracking.module");
const devis_module_1 = require("./modules/devis/devis.module");
const settings_module_1 = require("./modules/settings/settings.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const users_module_1 = require("./modules/users/users.module");
const backup_module_1 = require("./modules/backup/backup.module");
const contrats_module_1 = require("./modules/contrats/contrats.module");
const transporteurs_module_1 = require("./modules/transporteurs/transporteurs.module");
const stock_module_1 = require("./modules/stock/stock.module");
const bons_module_1 = require("./modules/bons/bons.module");
const recus_paiement_module_1 = require("./modules/recus-paiement/recus-paiement.module");
const comptabilite_module_1 = require("./modules/comptabilite/comptabilite.module");
const ports_module_1 = require("./modules/ports/ports.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const health_module_1 = require("./modules/health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ ttl: 60_000, limit: 100 }],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            annexes_module_1.AnnexesModule,
            clients_module_1.ClientsModule,
            dossiers_module_1.DossiersModule,
            factures_module_1.FacturesModule,
            fournisseurs_module_1.FournisseursModule,
            depenses_module_1.DepensesModule,
            caisse_module_1.CaisseModule,
            documents_module_1.DocumentsModule,
            tracking_module_1.TrackingModule,
            devis_module_1.DevisModule,
            settings_module_1.SettingsModule,
            audit_logs_module_1.AuditLogsModule,
            users_module_1.UsersModule,
            backup_module_1.BackupModule,
            contrats_module_1.ContratsModule,
            transporteurs_module_1.TransporteursModule,
            stock_module_1.StockModule,
            bons_module_1.BonsModule,
            recus_paiement_module_1.RecusPaiementModule,
            comptabilite_module_1.ComptabiliteModule,
            ports_module_1.PortsModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: csrf_guard_1.CsrfGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map