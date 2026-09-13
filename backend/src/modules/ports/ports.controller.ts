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
import { PortsService } from './ports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('ports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortsController {
  constructor(private readonly portsService: PortsService) {}

  @Get()
  async findAll() {
    return this.portsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.portsService.findOne(id);
  }

  @Post()
  @RequirePermission('parametres.modifier')
  async create(@Body() body: any) {
    return this.portsService.create(body);
  }

  @Put(':id')
  @RequirePermission('parametres.modifier')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.portsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('parametres.modifier')
  async remove(@Param('id') id: string) {
    return this.portsService.remove(id);
  }
}
