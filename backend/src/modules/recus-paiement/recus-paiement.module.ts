import { Module } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';
import { RecusPaiementController } from './recus-paiement.controller';

@Module({
  controllers: [RecusPaiementController],
  providers: [RecusPaiementService],
  exports: [RecusPaiementService],
})
export class RecusPaiementModule {}
