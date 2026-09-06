import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevisService } from './devis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('devis')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    return this.devisService.findAll(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.devisService.findOne(id);
  }

  @Post()
  @RequirePermission('devis.creer')
  async create(@Body() body: any) {
    return this.devisService.create(body);
  }
}
