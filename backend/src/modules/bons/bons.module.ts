import { Module } from '@nestjs/common';
import { BonsService } from './bons.service';
import { BonsController } from './bons.controller';

@Module({
  controllers: [BonsController],
  providers: [BonsService],
  exports: [BonsService],
})
export class BonsModule {}
