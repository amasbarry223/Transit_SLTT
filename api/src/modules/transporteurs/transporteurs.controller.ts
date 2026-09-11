import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TransporteursService } from './transporteurs.service';
import { CurrentUser } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('transporteurs')
export class TransporteursController {
  constructor(private readonly transporteursService: TransporteursService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
  ) {
    return this.transporteursService.findAll(user, { search, annexeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.transporteursService.findOne(id, user);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.transporteursService.create(user, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.transporteursService.update(id, user, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.transporteursService.delete(id, user);
  }
}
