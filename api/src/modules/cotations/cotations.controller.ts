import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CotationsService } from './cotations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('cotations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CotationsController {
  constructor(private readonly cotationsService: CotationsService) {}

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    return this.cotationsService.findAll(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cotationsService.findOne(id);
  }

  @Post()
  @RequirePermission('cotations.creer')
  async create(@Body() body: any) {
    return this.cotationsService.create(body);
  }
}
