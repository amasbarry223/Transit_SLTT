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
import { DossiersService } from './dossiers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('dossiers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
    @Query('type') type?: string,
    @Query('annexeId') annexeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.dossiersService.findAll(user, { search, statut, type, annexeId, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.dossiersService.findOne(id, user);
  }

  @Post()
  @RequirePermission('dossiers.creer')
  async create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.dossiersService.create(user, body);
  }

  @Put(':id')
  @RequirePermission('dossiers.modifier')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: any,
  ) {
    return this.dossiersService.update(id, user, body);
  }

  @Patch(':id/statut')
  @RequirePermission('dossiers.modifier')
  async updateStatut(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body('statut') statut: any,
  ) {
    return this.dossiersService.updateStatut(id, user, statut);
  }

  @Post(':id/paiements')
  @RequirePermission('dossiers.modifier')
  async enregistrerPaiement(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: { montant: number; statut?: string; date?: string },
  ) {
    return this.dossiersService.enregistrerPaiement(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('dossiers.supprimer')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.dossiersService.remove(id, user);
  }
}
