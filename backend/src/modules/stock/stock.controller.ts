import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('items')
  findAllItems(
    @CurrentUser() user: CurrentUserType,
    @Query('search') search?: string,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.stockService.findAllItems(user, { search, annexeId, clientId });
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.stockService.findOneItem(id, user);
  }

  @Post('items')
  @UseGuards(AnnexeGuard)
  @RequirePermission('stock:write')
  createItem(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.stockService.createItem(user, body);
  }

  @Put('items/:id')
  @UseGuards(AnnexeGuard)
  @RequirePermission('stock:write')
  updateItem(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.stockService.updateItem(id, user, body);
  }

  @Delete('items/:id')
  @RequirePermission('stock:write')
  deleteItem(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.stockService.deleteItem(id, user);
  }

  @Get('mouvements')
  findAllMouvements(
    @CurrentUser() user: CurrentUserType,
    @Query('annexeId') annexeId?: string,
    @Query('stockId') stockId?: string,
  ) {
    return this.stockService.findAllMouvements(user, { annexeId, stockId });
  }

  @Post('mouvements')
  @UseGuards(AnnexeGuard)
  @RequirePermission('stock:write')
  createMouvement(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.stockService.createMouvement(user, body);
  }
}
