import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';

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
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
