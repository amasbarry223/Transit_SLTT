import { Controller, Get } from '@nestjs/common';
import { Public } from '../../shared/decorators';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'Transit SLTT API',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

  @Public()
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'Transit SLTT API',
      version: '1.0.0',
    };
  }
}
