import { Module } from '@nestjs/common';
import { PortsService } from './ports.service';
import { PortsController } from './ports.controller';

@Module({
  controllers: [PortsController],
  providers: [PortsService],
  exports: [PortsService],
})
export class PortsModule {}
