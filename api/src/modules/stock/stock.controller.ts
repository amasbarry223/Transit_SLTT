import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { RequirePermission } from '../../shared/decorators';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('items')
  findAllItems(
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.stockService.findAllItems({ search, annexeId, clientId });
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.stockService.findOneItem(id);
  }

  @Post('items')
  @RequirePermission('stock:write')
  createItem(@Body() body: any) {
    return this.stockService.createItem(body);
  }

  @Put('items/:id')
  @RequirePermission('stock:write')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.stockService.updateItem(id, body);
  }

  @Delete('items/:id')
  @RequirePermission('stock:write')
  deleteItem(@Param('id') id: string) {
    return this.stockService.deleteItem(id);
  }

  @Get('mouvements')
  findAllMouvements(
    @Query('annexeId') annexeId?: string,
    @Query('stockId') stockId?: string,
  ) {
    return this.stockService.findAllMouvements({ annexeId, stockId });
  }

  @Post('mouvements')
  @RequirePermission('stock:write')
  createMouvement(@Body() body: any) {
    return this.stockService.createMouvement(body);
  }
}
