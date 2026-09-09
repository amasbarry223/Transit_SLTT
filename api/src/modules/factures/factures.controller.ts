import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FacturesService } from './factures.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('factures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
    @Query('clientId') clientId?: string,
    @Query('dossierId') dossierId?: string,
    @Query('annexeId') annexeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.facturesService.findAll(user, { search, statut, clientId, dossierId, annexeId, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.facturesService.findOne(id, user);
  }

  @Post()
  @RequirePermission('factures.creer')
  async create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.facturesService.create(user, body);
  }

  @Put(':id')
  @RequirePermission('factures.modifier')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: any,
  ) {
    return this.facturesService.update(id, user, body);
  }

  @Patch(':id/statut')
  @RequirePermission('factures.modifier')
  async updateStatut(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body('statut') statut: string,
  ) {
    return this.facturesService.updateStatut(id, user, statut);
  }

  @Delete(':id')
  @RequirePermission('factures.supprimer')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.facturesService.remove(id, user);
  }

  @Post(':id/paiements')
  @RequirePermission('caisse.encaisser')
  async enregistrerPaiement(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: { montant: number; caisseId: string; motif?: string },
  ) {
    return this.facturesService.enregistrerPaiement(id, user, body);
  }
}
