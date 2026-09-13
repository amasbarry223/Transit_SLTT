import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardController,
  DashboardAnalyticsController,
} from './dashboard.controller';

@Module({
  controllers: [DashboardController, DashboardAnalyticsController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
