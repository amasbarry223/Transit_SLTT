import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BonsService } from './bons.service';
import { RequirePermission } from '../../shared/decorators';

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
  @RequirePermission('bons:write')
  createBon(@Body() body: any) {
    return this.bonsService.createBon(body);
  }

  @Put('sortie/:id/valider')
  @RequirePermission('bons:write')
  validateBon(@Param('id') id: string) {
    return this.bonsService.validateBon(id);
  }

  @Delete('sortie/:id')
  @RequirePermission('bons:write')
  deleteBon(@Param('id') id: string) {
    return this.bonsService.deleteBon(id);
  }

  @Get('caisse')
  findAllBonsCaisse(@Query('annexeId') annexeId?: string) {
    return this.bonsService.findAllBonsCaisse({ annexeId });
  }

  @Post('caisse')
  @RequirePermission('bons:write-caisse')
  createBonCaisse(@Body() body: any) {
    return this.bonsService.createBonCaisse(body);
  }

  @Delete('caisse/:id')
  @RequirePermission('bons:write-caisse')
  deleteBonCaisse(@Param('id') id: string) {
    return this.bonsService.deleteBonCaisse(id);
  }
}
