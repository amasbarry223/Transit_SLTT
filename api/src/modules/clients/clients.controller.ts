import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.clientsService.findAll(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermission('clients.creer')
  async create(@Body() body: CreateClientDto) {
    return this.clientsService.create(body);
  }

  @Put(':id')
  @RequirePermission('clients.modifier')
  async update(@Param('id') id: string, @Body() body: UpdateClientDto) {
    return this.clientsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('clients.supprimer')
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
