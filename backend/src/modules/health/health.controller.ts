import { Controller, Get } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Public } from '../../shared/decorators';
import { prismaClientSync } from '../../bootstrap/ensure-prisma-client';
import { PrismaService } from '../../prisma/prisma.service';

/** Code d'erreur seul (jamais le message ni de donnée) : sûr à exposer. */
function errorCode(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) return err.code;
  if (err instanceof Prisma.PrismaClientInitializationError) return err.errorCode ?? 'INIT';
  if (err instanceof Prisma.PrismaClientValidationError) return 'VALIDATION';
  return (err as Error)?.name ?? 'UNKNOWN';
}

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Diagnostic base de données : une requête minimale par table chargée au
   *  démarrage du tableau de bord, exécutées EN PARALLÈLE comme le fait le
   *  front — reproduit un épuisement du pool de connexions s'il y en a un.
   *  Ne renvoie que "ok" ou un code d'erreur Prisma (ex. P2021 = table absente). */
  @Public()
  @Get('health/db')
  async db() {
    const checks: Record<string, () => Promise<unknown>> = {
      annexes: () => this.prisma.annexe.count(),
      clients: () => this.prisma.client.count(),
      dossiers: () => this.prisma.dossier.count(),
      factures: () => this.prisma.facture.count(),
      bonsSortie: () => this.prisma.bonSortie.count(),
      bonsLivraison: () => this.prisma.bonLivraison.count(),
      notifications: () => this.prisma.notification.count(),
      recusPaiement: () => this.prisma.recuPaiement.count(),
    };
    const started = Date.now();
    const names = Object.keys(checks);
    const results = await Promise.allSettled(names.map((n) => checks[n]()));
    return {
      durationMs: Date.now() - started,
      checks: Object.fromEntries(
        names.map((n, i) => {
          const r = results[i];
          return [n, r.status === 'fulfilled' ? 'ok' : errorCode(r.reason)];
        }),
      ),
    };
  }
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
      // déployé (cf. bootstrap/ensure-prisma-client.ts).
      prismaModels: Object.keys(Prisma.ModelName).length,
      prismaClientSync,
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
