import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BonsService } from './bons.service';

@Controller('bons')
export class BonsController {
  constructor(private readonly bonsService: BonsService) {}

  @Get('sortie')
  findAllBons(
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.bonsService.findAllBons({ annexeId, clientId });
  }

  @Post('sortie')
  createBon(@Body() body: any) {
    return this.bonsService.createBon(body);
  }

  @Put('sortie/:id/valider')
  validateBon(@Param('id') id: string) {
    return this.bonsService.validateBon(id);
  }

  @Delete('sortie/:id')
  deleteBon(@Param('id') id: string) {
    return this.bonsService.deleteBon(id);
  }

  @Get('caisse')
  findAllBonsCaisse(@Query('annexeId') annexeId?: string) {
    return this.bonsService.findAllBonsCaisse({ annexeId });
  }

  @Post('caisse')
  createBonCaisse(@Body() body: any) {
    return this.bonsService.createBonCaisse(body);
  }

  @Delete('caisse/:id')
  deleteBonCaisse(@Param('id') id: string) {
    return this.bonsService.deleteBonCaisse(id);
  }
}
