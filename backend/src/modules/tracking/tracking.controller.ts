import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser, Public, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /** Route publique accessible sans compte ni token */
  @Public()
  @Get('public/:code')
  async getPublicTracking(@Param('code') code: string) {
    return this.trackingService.getPublicTracking(code);
  }

  /** Mise à jour protégée */
  @Put('dossier/:dossierId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dossiers.modifier')
  async updatePosition(
    @Param('dossierId') dossierId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() body: { dernierePosition?: string; statutAffiche?: string },
  ) {
    return this.trackingService.updateTrackingPosition(dossierId, user, body);
  }
}
