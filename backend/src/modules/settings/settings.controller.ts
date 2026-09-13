import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../shared/decorators';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @Get(':cle')
  async getByKey(@Param('cle') cle: string) {
    return this.settingsService.getByKey(cle);
  }

  @Put()
  @RequirePermission('settings.modifier')
  async setMany(@Body() body: Record<string, string>) {
    return this.settingsService.setMany(body);
  }

  @Put(':cle')
  @RequirePermission('settings.modifier')
  async setKey(
    @Param('cle') cle: string,
    @Body('valeur') valeur: string,
    @Body('description') description?: string,
  ) {
    return this.settingsService.setKey(cle, valeur, description);
  }
}
