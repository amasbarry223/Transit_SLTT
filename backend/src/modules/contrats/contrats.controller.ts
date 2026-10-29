import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContratsService } from './contrats.service';
import { CreateContratDto } from './dto/create-contrat.dto';
import { UpdateContratDto } from './dto/update-contrat.dto';
import { CreatePrestationDto, UpdatePrestationDto } from './dto/prestation.dto';
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('contrats')
export class ContratsController {
  constructor(private readonly contratsService: ContratsService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.contratsService.findAll(user, { search, annexeId, clientId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.contratsService.findOne(id, user);
  }

  @Post()
  @UseGuards(AnnexeGuard)
  @RequirePermission('contrats.creer')
  create(@CurrentUser() user: CurrentUserType, @Body() body: CreateContratDto) {
    return this.contratsService.create(user, body);
  }

  @Put(':id')
  @UseGuards(AnnexeGuard)
  @RequirePermission('contrats.modifier')
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: UpdateContratDto) {
    return this.contratsService.update(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('contrats.supprimer')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.contratsService.delete(id, user);
  }

  @Post(':id/prestations')
  @RequirePermission('contrats.modifier')
  addPrestation(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: CreatePrestationDto) {
    return this.contratsService.addPrestation(id, user, body);
  }

  @Patch(':id/prestations/:prestationId')
  @RequirePermission('contrats.modifier')
  updatePrestation(
    @Param('id') id: string,
    @Param('prestationId') prestationId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: UpdatePrestationDto,
  ) {
    return this.contratsService.updatePrestation(id, prestationId, user, body);
  }

  @Delete(':id/prestations/:prestationId')
  @RequirePermission('contrats.modifier')
  removePrestation(
    @Param('id') id: string,
    @Param('prestationId') prestationId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.contratsService.removePrestation(id, prestationId, user);
  }
}
