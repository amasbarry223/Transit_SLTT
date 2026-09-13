import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission('audit:read')
  async findAll(
    @Query('entite') entite?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogsService.findAll({ entite, action, limit });
  }

  @Post()
  async create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    // L'auteur du log est toujours l'utilisateur authentifié : impossible
    // d'écrire une entrée au nom de quelqu'un d'autre.
    return this.auditLogsService.log({
      userId: user.id,
      action: body.action,
      entite: body.entite || body.module || 'Utilisateurs',
      entiteId: body.entiteId,
      donnees: body.detail ? { detail: body.detail, userName: body.userName } : body.donnees,
      adresseIp: body.ip || body.adresseIp,
      userAgent: body.userAgent,
    });
  }
}
