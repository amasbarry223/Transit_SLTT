import { Module } from '@nestjs/common';
import { BonsLivraisonService } from './bons-livraison.service';
import { BonsLivraisonController } from './bons-livraison.controller';

@Module({
  controllers: [BonsLivraisonController],
  providers: [BonsLivraisonService],
  exports: [BonsLivraisonService],
})
export class BonsLivraisonModule {}
