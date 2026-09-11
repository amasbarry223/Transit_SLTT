import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContratsService } from './contrats.service';
import { CurrentUser } from '../../shared/decorators';
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
  create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.contratsService.create(user, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.contratsService.update(id, user, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.contratsService.delete(id, user);
  }
}
