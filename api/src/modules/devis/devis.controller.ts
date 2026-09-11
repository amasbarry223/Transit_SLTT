import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevisService } from './devis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('devis')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserType, @Query('clientId') clientId?: string) {
    return this.devisService.findAll(user, clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.devisService.findOne(id, user);
  }

  @Post()
  @UseGuards(AnnexeGuard)
  @RequirePermission('devis.creer')
  async create(@CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.devisService.create(user, body);
  }

  @Put(':id')
  @UseGuards(AnnexeGuard)
  @RequirePermission('devis.creer')
  async update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: any) {
    return this.devisService.update(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('devis.creer')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.devisService.delete(id, user);
  }
}
