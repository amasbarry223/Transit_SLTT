import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';
import { RequirePermission } from '../../shared/decorators';

@Controller('recus-paiement')
export class RecusPaiementController {
  constructor(private readonly service: RecusPaiementService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
  ) {
    return this.service.findAll({ search, annexeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermission('recus-paiement:write')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @RequirePermission('recus-paiement:write')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('recus-paiement:write')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
