import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContratsService } from './contrats.service';

@Controller('contrats')
export class ContratsController {
  constructor(private readonly contratsService: ContratsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.contratsService.findAll({ search, annexeId, clientId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contratsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.contratsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.contratsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contratsService.delete(id);
  }
}
