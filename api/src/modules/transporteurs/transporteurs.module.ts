import { Module } from '@nestjs/common';
import { TransporteursService } from './transporteurs.service';
import { TransporteursController } from './transporteurs.controller';

@Module({
  controllers: [TransporteursController],
  providers: [TransporteursService],
  exports: [TransporteursService],
})
export class TransporteursModule {}
