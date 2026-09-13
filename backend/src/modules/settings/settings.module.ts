import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { ConfigController } from './config.controller';

@Module({
  controllers: [SettingsController, ConfigController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

