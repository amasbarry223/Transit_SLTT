import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, RolesGuard],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
