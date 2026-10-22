import { Module } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';
import { RecusPaiementController } from './recus-paiement.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RecusPaiementController],
  providers: [RecusPaiementService],
  exports: [RecusPaiementService],
})
export class RecusPaiementModule {}
