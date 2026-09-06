import { Module } from '@nestjs/common';
import { AnnexesService } from './annexes.service';
import { AnnexesController } from './annexes.controller';

@Module({
  controllers: [AnnexesController],
  providers: [AnnexesService],
  exports: [AnnexesService],
})
export class AnnexesModule {}
