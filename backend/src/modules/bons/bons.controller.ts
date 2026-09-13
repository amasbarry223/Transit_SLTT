import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BonsService } from './bons.service';
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('bons')
export class BonsController {
  constructor(private readonly bonsService: BonsService) {}

  @Get('sortie')
  findAllBons(
    @CurrentUser() user: CurrentUserType,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.bonsService.findAllBons(user, { annexeId, clientId });
  }

  @Post('sortie')
  @UseGuards(AnnexeGuard)
  @RequirePermission('bons:write')
  createBon(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.bonsService.createBon(user, body);
  }

  @Put('sortie/:id/valider')
  @RequirePermission('bons:write')
  validateBon(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.bonsService.validateBon(id, user);
  }

  @Delete('sortie/:id')
  @RequirePermission('bons:write')
  deleteBon(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.bonsService.deleteBon(id, user);
  }

  @Get('caisse')
  findAllBonsCaisse(@CurrentUser() user: CurrentUserType, @Query('annexeId') annexeId?: string) {
    return this.bonsService.findAllBonsCaisse(user, { annexeId });
  }

  @Post('caisse')
  @UseGuards(AnnexeGuard)
  @RequirePermission('bons:write-caisse')
  createBonCaisse(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.bonsService.createBonCaisse(user, body);
  }

  @Put('caisse/:id')
  @UseGuards(AnnexeGuard)
  @RequirePermission('bons:write-caisse')
  updateBonCaisse(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.bonsService.updateBonCaisse(id, user, body);
  }

  @Delete('caisse/:id')
  @RequirePermission('bons:write-caisse')
  deleteBonCaisse(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.bonsService.deleteBonCaisse(id, user);
  }
}
