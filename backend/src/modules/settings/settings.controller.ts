import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Public, RequirePermission } from '../../shared/decorators';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Endpoint public accessible sans authentification pour le shell et le branding.
   */
  @Public()
  @Get('public')
  async getPublic() {
    return this.settingsService.getPublicSettings();
  }

  /**
   * Statuts dynamiques par entité (dossier, facture, devis, etc.)
   */
  @Get('statuses')
  async getStatuses(@Query('type') type?: string) {
    return this.settingsService.getStatusOptions(type);
  }

  /**
   * Options diverses (modes de paiement, catégories...)
   */
  @Get('options')
  async getOptions(@Query('type') type?: string) {
    return this.settingsService.getStatusOptions(type);
  }

  @Post('statuses')
  @RequirePermission('settings.modifier')
  async setStatusOption(
    @Body()
    body: {
      entityType: string;
      value: string;
      label: string;
      color?: string;
      icon?: string;
      orderIndex?: number;
      isActive?: boolean;
    },
  ) {
    return this.settingsService.setStatusOption(body);
  }

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
  async setMany(@Body() body: Record<string, string | { valeur: string; description?: string; type?: string; isPublic?: boolean; groupName?: string }>) {
    return this.settingsService.setMany(body);
  }

  @Put(':cle')
  @RequirePermission('settings.modifier')
  async setKey(
    @Param('cle') cle: string,
    @Body('valeur') valeur: string,
    @Body('description') description?: string,
    @Body('type') type?: string,
    @Body('isPublic') isPublic?: boolean,
    @Body('groupName') groupName?: string,
  ) {
    return this.settingsService.setKey(cle, valeur, description, type, isPublic, groupName);
  }
}

