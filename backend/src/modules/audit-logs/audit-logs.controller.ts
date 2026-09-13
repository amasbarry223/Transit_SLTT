import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('entite') entite?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogsService.findAll({ entite, action, limit });
  }

  @Post()
  async create(@Body() body: any) {
    return this.auditLogsService.log({
      userId: body.userId,
      action: body.action,
      entite: body.entite || body.module || 'Utilisateurs',
      entiteId: body.entiteId,
      donnees: body.detail ? { detail: body.detail, userName: body.userName } : body.donnees,
      adresseIp: body.ip || body.adresseIp,
      userAgent: body.userAgent,
    });
  }
}
