import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Public, RequirePermission } from '../../shared/decorators';

@Controller('config')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConfigController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /api/config : Configurations publiques
   */
  @Public()
  @Get()
  async getPublicConfig() {
    const data = await this.settingsService.getPublicSettings();
    return { data };
  }

  /**
   * GET /api/config/statuses : Statuts configurés
   */
  @Public()
  @Get('statuses')
  async getStatuses(@Query('type') type?: string) {
    const data = await this.settingsService.getStatusOptions(type);
    return { data };
  }

  /**
   * GET /api/config/options : Typologies et options diverses
   */
  @Public()
  @Get('options')
  async getOptions(@Query('type') type?: string) {
    const data = await this.settingsService.getStatusOptions(type);
    return { data };
  }

  /**
   * PUT /api/config : Mise à jour par admin
   */
  @Put()
  @RequirePermission('settings.modifier')
  async updateConfig(
    @Body()
    body: {
      key: string;
      value: string;
      description?: string;
      type?: string;
      isPublic?: boolean;
      groupName?: string;
    },
  ) {
    await this.settingsService.setKey(
      body.key,
      body.value,
      body.description,
      body.type,
      body.isPublic,
      body.groupName,
    );
    return { success: true };
  }
}
