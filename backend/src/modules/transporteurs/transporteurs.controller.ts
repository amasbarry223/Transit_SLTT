import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TransporteursService } from './transporteurs.service';

@Controller('transporteurs')
export class TransporteursController {
  constructor(private readonly transporteursService: TransporteursService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
  ) {
    return this.transporteursService.findAll({ search, annexeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transporteursService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.transporteursService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.transporteursService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transporteursService.delete(id);
  }
}
