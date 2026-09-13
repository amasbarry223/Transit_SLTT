import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('caisses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserType, @Query('annexeId') annexeId?: string) {
    return this.caisseService.findAll(user, annexeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.caisseService.findOne(id, user);
  }

  @Post(':id/transactions')
  @RequirePermission('caisse.gerer')
  async createTransaction(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: { type: 'ENTREE' | 'SORTIE'; montant: number; motif: string },
  ) {
    return this.caisseService.createTransaction(id, user, body);
  }
}
