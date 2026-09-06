import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators';
import { RoleUtilisateur } from '@prisma/client';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('tables')
  async listTables() {
    return this.backupService.listTables();
  }

  @Get('export')
  async exportData() {
    return this.backupService.exportData();
  }

  @Post('wipe')
  async wipeData() {
    return this.backupService.wipeData();
  }

  @Post('restore')
  async restoreData(@Body('payload') payload: Record<string, unknown[]>) {
    return this.backupService.restoreData(payload || {});
  }
}
