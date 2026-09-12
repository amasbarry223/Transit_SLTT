import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AnnexesModule } from './modules/annexes/annexes.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DossiersModule } from './modules/dossiers/dossiers.module';
import { FacturesModule } from './modules/factures/factures.module';
import { FournisseursModule } from './modules/fournisseurs/fournisseurs.module';
import { DepensesModule } from './modules/depenses/depenses.module';
import { CaisseModule } from './modules/caisse/caisse.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { DevisModule } from './modules/devis/devis.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { UsersModule } from './modules/users/users.module';
import { BackupModule } from './modules/backup/backup.module';
import { ContratsModule } from './modules/contrats/contrats.module';
import { TransporteursModule } from './modules/transporteurs/transporteurs.module';
import { StockModule } from './modules/stock/stock.module';
import { BonsModule } from './modules/bons/bons.module';
import { RecusPaiementModule } from './modules/recus-paiement/recus-paiement.module';
import { ComptabiliteModule } from './modules/comptabilite/comptabilite.module';
import { PortsModule } from './modules/ports/ports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Défaut permissif (ne restreint aucune route par défaut, ThrottlerGuard
    // n'est appliqué globalement nulle part) — sert de socle DI pour les
    // limites resserrées posées route par route via @Throttle(), ex.
    // /auth/login (brute force sur mot de passe).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    AuthModule,
    AnnexesModule,
    ClientsModule,
    DossiersModule,
    FacturesModule,
    FournisseursModule,
    DepensesModule,
    CaisseModule,
    DocumentsModule,
    TrackingModule,
    DevisModule,
    SettingsModule,
    AuditLogsModule,
    UsersModule,
    BackupModule,
    ContratsModule,
    TransporteursModule,
    StockModule,
    BonsModule,
    RecusPaiementModule,
    ComptabiliteModule,
    PortsModule,
  ],
  providers: [
    // Authentification exigée par défaut sur toute route (sauf @Public()).
    // Ferme le trou où un contrôleur sans @UseGuards restait accessible sans token.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
