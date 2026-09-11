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
import { AnnexeGuard } from '../../auth/guards/annexe.guard';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserType, @Query('search') search?: string) {
    return this.clientsService.findAll(user, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.clientsService.findOne(id, user);
  }

  @Post()
  @UseGuards(AnnexeGuard)
  @RequirePermission('clients.creer')
  async create(@CurrentUser() user: CurrentUserType, @Body() body: CreateClientDto) {
    return this.clientsService.create(user, body);
  }

  @Put(':id')
  @UseGuards(AnnexeGuard)
  @RequirePermission('clients.modifier')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: UpdateClientDto,
  ) {
    return this.clientsService.update(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('clients.supprimer')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.clientsService.remove(id, user);
  }
}
