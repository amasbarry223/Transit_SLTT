import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ComptabiliteService } from './comptabilite.service';

@Controller('comptabilite')
export class ComptabiliteController {
  constructor(private readonly service: ComptabiliteService) {}

  @Get('operations')
  findAllOperations(
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAllOperations({ annexeId, clientId });
  }

  @Post('operations')
  createOperation(@Body() body: any) {
    return this.service.createOperation(body);
  }

  @Delete('operations/:id')
  deleteOperation(@Param('id') id: string) {
    return this.service.deleteOperation(id);
  }

  @Get('clotures')
  findAllClotures(@Query('annexeId') annexeId?: string) {
    return this.service.findAllClotures({ annexeId });
  }

  @Post('clotures')
  createCloture(@Body() body: any) {
    return this.service.createCloture(body);
  }
}
