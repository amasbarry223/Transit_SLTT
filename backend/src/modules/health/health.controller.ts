import { Controller, Get } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      // Nombre de modèles connus du client Prisma chargé : permet de vérifier
      // de l'extérieur que le client n'est pas en retard sur le schéma
      // déployé (cf. scripts/ensure-prisma-client.js).
      prismaModels: Object.keys(Prisma.ModelName).length,
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
