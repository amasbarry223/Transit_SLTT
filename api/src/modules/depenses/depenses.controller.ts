import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepensesService } from './depenses.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('depenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepensesController {
  constructor(private readonly depensesService: DepensesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
    @Query('categorie') categorie?: string,
    @Query('dossierId') dossierId?: string,
    @Query('annexeId') annexeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.depensesService.findAll(user, {
      search,
      statut,
      categorie,
      dossierId,
      annexeId,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.depensesService.findOne(id, user);
  }

  @Post()
  @RequirePermission('depenses.creer')
  async create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.depensesService.create(user, body);
  }

  @Patch(':id/approuver')
  @RequirePermission('depenses.valider')
  async approuver(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.depensesService.approuver(id, user);
  }

  @Post(':id/payer')
  @RequirePermission('caisse.decaisser')
  async payerDepuisCaisse(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: { caisseId: string; motif?: string },
  ) {
    return this.depensesService.payerDepuisCaisse(id, user, body);
  }
}
