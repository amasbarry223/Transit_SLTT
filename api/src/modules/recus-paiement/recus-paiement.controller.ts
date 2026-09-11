import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('recus-paiement')
export class RecusPaiementController {
  constructor(private readonly service: RecusPaiementService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
  ) {
    return this.service.findAll(user, { search, annexeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermission('recus-paiement:write')
  create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.service.create(user, body);
  }

  @Put(':id')
  @RequirePermission('recus-paiement:write')
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.service.update(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('recus-paiement:write')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.service.delete(id, user);
  }
}
