import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AnnexesService } from './annexes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('annexes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnnexesController {
  constructor(private readonly annexesService: AnnexesService) {}

  @Get()
  async findAll() {
    return this.annexesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.annexesService.findOne(id);
  }

  @Post()
  @RequirePermission('annexes.creer')
  async create(@Body() body: any) {
    return this.annexesService.create(body);
  }

  @Put(':id')
  @RequirePermission('annexes.modifier')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.annexesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('annexes.supprimer')
  async remove(@Param('id') id: string) {
    return this.annexesService.remove(id);
  }
}
