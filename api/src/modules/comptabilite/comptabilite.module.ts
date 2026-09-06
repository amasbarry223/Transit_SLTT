import { Module } from '@nestjs/common';
import { ComptabiliteService } from './comptabilite.service';
import { ComptabiliteController } from './comptabilite.controller';

@Module({
  controllers: [ComptabiliteController],
  providers: [ComptabiliteService],
  exports: [ComptabiliteService],
})
export class ComptabiliteModule {}
