import { Module } from '@nestjs/common';
import { CotationsService } from './cotations.service';
import { CotationsController } from './cotations.controller';

@Module({
  controllers: [CotationsController],
  providers: [CotationsService],
  exports: [CotationsService],
})
export class CotationsModule {}
