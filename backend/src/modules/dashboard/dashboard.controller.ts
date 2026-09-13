import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

@Controller('analytics/dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardAnalyticsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardAnalytics(@CurrentUser() user: CurrentUserType) {
    const data = await this.dashboardService.getDashboardAnalytics(user);
    return { data };
  }
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@CurrentUser() user: CurrentUserType) {
    const data = await this.dashboardService.getDashboardAnalytics(user);
    return { data };
  }
}
