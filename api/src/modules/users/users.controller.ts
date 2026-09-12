import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission, CurrentUser } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('utilisateurs:manage')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('utilisateurs:manage')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermission('utilisateurs:manage')
  async create(@Body() body: CreateUserDto, @CurrentUser() actor: CurrentUserType) {
    return this.usersService.create(body, actor);
  }

  @Put(':id')
  @RequirePermission('utilisateurs:manage')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto, @CurrentUser() actor: CurrentUserType) {
    return this.usersService.update(id, body, actor);
  }

  @Patch(':id/password')
  @RequirePermission('utilisateurs:manage')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: ResetPasswordDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return this.usersService.resetPassword(id, body.password ?? body.motDePasse, actor);
  }

  @Delete(':id')
  @RequirePermission('utilisateurs:manage')
  async remove(@Param('id') id: string, @CurrentUser() actor: CurrentUserType) {
    return this.usersService.delete(id, actor);
  }
}
