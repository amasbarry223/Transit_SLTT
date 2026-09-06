import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FournisseursService } from './fournisseurs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('fournisseurs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.fournisseursService.findAll(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fournisseursService.findOne(id);
  }

  @Post()
  @RequirePermission('fournisseurs.creer')
  async create(@Body() body: any) {
    return this.fournisseursService.create(body);
  }

  @Put(':id')
  @RequirePermission('fournisseurs.modifier')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.fournisseursService.update(id, body);
  }
}
