import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ComptabiliteService } from './comptabilite.service';
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('comptabilite')
export class ComptabiliteController {
  constructor(private readonly service: ComptabiliteService) {}

  @Get('operations')
  findAllOperations(
    @CurrentUser() user: CurrentUserType,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAllOperations(user, { annexeId, clientId });
  }

  @Post('operations')
  @UseGuards(AnnexeGuard)
  @RequirePermission('comptabilite:write')
  createOperation(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.service.createOperation(user, body);
  }

  @Delete('operations/:id')
  @RequirePermission('comptabilite:write')
  deleteOperation(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.service.deleteOperation(id, user);
  }

  @Get('clotures')
  findAllClotures(@CurrentUser() user: CurrentUserType, @Query('annexeId') annexeId?: string) {
    return this.service.findAllClotures(user, { annexeId });
  }

  @Post('clotures')
  @UseGuards(AnnexeGuard)
  @RequirePermission('comptabilite:write')
  createCloture(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.service.createCloture(user, body);
  }
}
