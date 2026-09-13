import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
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
import { CotationsModule } from './modules/cotations/cotations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatsModule } from './modules/stats/stats.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { UsersModule } from './modules/users/users.module';
import { BackupModule } from './modules/backup/backup.module';
import { ContratsModule } from './modules/contrats/contrats.module';
import { TransporteursModule } from './modules/transporteurs/transporteurs.module';
import { StockModule } from './modules/stock/stock.module';
import { BonsModule } from './modules/bons/bons.module';
import { RecusPaiementModule } from './modules/recus-paiement/recus-paiement.module';
import { ComptabiliteModule } from './modules/comptabilite/comptabilite.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
    CotationsModule,
    SettingsModule,
    NotificationsModule,
    StatsModule,
    AuditLogsModule,
    UsersModule,
    BackupModule,
    ContratsModule,
    TransporteursModule,
    StockModule,
    BonsModule,
    RecusPaiementModule,
    ComptabiliteModule,
  ],
})
export class AppModule {}
